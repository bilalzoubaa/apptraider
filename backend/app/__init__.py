from flask import Flask, request, jsonify
from flask_cors import CORS
from .db import db
from .blueprints.auth import auth_bp
from .blueprints.challenges import challenges_bp
from .blueprints.trades import trades_bp
from .blueprints.market import market_bp
from .blueprints.payment import payment_bp
from .blueprints.leaderboard import leaderboard_bp
from .blueprints.settings import settings_bp
from .blueprints.admin import admin_bp
from config import Config
import yfinance as yf
from .models import UserChallenge, Trade, Position, ChallengePlan
from .services.challenge_engine import evaluate_rules

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    print(f" * Using Database: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
    
    CORS(app, origins=app.config.get("CORS_ORIGINS", "*"))
    db.init_app(app)
    with app.app_context():
        db.create_all()
        from .blueprints.challenges import seed_default_plans
        seed_default_plans()
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(challenges_bp, url_prefix="/api/challenges")
    app.register_blueprint(trades_bp, url_prefix="/api/trades")
    app.register_blueprint(market_bp, url_prefix="/api/market")
    app.register_blueprint(payment_bp, url_prefix="/api/payment")
    app.register_blueprint(leaderboard_bp, url_prefix="/api/leaderboard")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    @app.get("/api/price/<ticker>")
    def price_ticker(ticker):
        data = yf.Ticker(ticker).history(period="1d")
        last = float(data["Close"].iloc[-1]) if not data.empty else 0.0
        return jsonify({"ticker": ticker, "price": last, "timestamp": data.index[-1].isoformat() if not data.empty else ""})
    @app.post("/api/trade")
    def trade_create():
        data = request.get_json()
        uc_id = data.get("user_challenge_id")
        asset = data.get("asset")
        side = data.get("side")
        quantity = float(data.get("quantity", 0))
        uc = db.session.get(UserChallenge, uc_id)
        if not uc or uc.status != "active":
            return jsonify({"error": "invalid"}), 400
        hist = yf.Ticker(asset).history(period="1d")
        price = float(hist["Close"].iloc[-1]) if not hist.empty else 0.0
        pnl = 0.0
        pos = db.session.query(Position).filter_by(user_challenge_id=uc_id, symbol=asset).first()
        if side == "buy":
            if pos and pos.side == "short":
                close_qty = min(quantity, pos.quantity)
                pnl = (pos.avg_price - price) * close_qty
                pos.quantity -= close_qty
                if pos.quantity == 0:
                    db.session.delete(pos)
            else:
                if pos:
                    new_qty = pos.quantity + quantity
                    pos.avg_price = (pos.avg_price * pos.quantity + price * quantity) / new_qty
                    pos.quantity = new_qty
                    pos.side = "long"
                else:
                    pos = Position(user_challenge_id=uc_id, symbol=asset, quantity=quantity, avg_price=price, side="long")
                    db.session.add(pos)
        elif side == "sell":
            if pos and pos.side == "long":
                close_qty = min(quantity, pos.quantity)
                pnl = (price - pos.avg_price) * close_qty
                pos.quantity -= close_qty
                if pos.quantity == 0:
                    db.session.delete(pos)
            else:
                if pos:
                    new_qty = pos.quantity + quantity
                    pos.avg_price = (pos.avg_price * pos.quantity + price * quantity) / new_qty
                    pos.quantity = new_qty
                    pos.side = "short"
                else:
                    pos = Position(user_challenge_id=uc_id, symbol=asset, quantity=quantity, avg_price=price, side="short")
                    db.session.add(pos)
        t = Trade(user_challenge_id=uc_id, symbol=asset, side=side, quantity=quantity, price=price, pnl=pnl)
        db.session.add(t)
        db.session.commit()
        evaluate_rules(uc_id)
        return jsonify({"trade_id": t.id, "status": "ok"})
    return app

from flask import Blueprint, request, jsonify
from ..db import db
from ..models import Trade, UserChallenge, ChallengePlan, Position
from ..services.challenge_engine import evaluate_rules
from ..services.price_service import PriceService
import yfinance as yf
import random

trades_bp = Blueprint("trades", __name__)

@trades_bp.post("/execute")
def execute():
    data = request.get_json()
    user_challenge_id = data.get("user_challenge_id")
    symbol = data.get("symbol")
    side = data.get("side")
    quantity_raw = data.get("quantity", 0)
    price_raw = data.get("price", None)
    try:
        quantity = float(quantity_raw)
    except Exception:
        return jsonify({"error": "invalid_quantity"}), 400
    if price_raw is None:
        price_raw = PriceService.get_price(symbol)
    try:
        price = float(price_raw)
    except Exception:
        price = PriceService.get_price(symbol)
    uc = db.session.get(UserChallenge, user_challenge_id)
    if not uc or uc.status != "active":
        return jsonify({"error": "invalid"}), 400
    pnl = 0.0
    pos = db.session.query(Position).filter_by(user_challenge_id=user_challenge_id, symbol=symbol).first()
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
                pos = Position(user_challenge_id=user_challenge_id, symbol=symbol, quantity=quantity, avg_price=price, side="long")
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
                pos = Position(user_challenge_id=user_challenge_id, symbol=symbol, quantity=quantity, avg_price=price, side="short")
                db.session.add(pos)
    t = Trade(user_challenge_id=user_challenge_id, symbol=symbol, side=side, quantity=quantity, price=price, pnl=pnl)
    db.session.add(t)
    db.session.commit()
    evaluate_rules(user_challenge_id)
    return jsonify({"trade_id": t.id, "status": "ok"})

@trades_bp.get("/summary")
def summary():
    user_challenge_id = request.args.get("user_challenge_id")
    uc = db.session.get(UserChallenge, int(user_challenge_id)) if user_challenge_id else None
    if not uc:
        return jsonify({"error": "invalid"}), 400
    plan = db.session.get(ChallengePlan, uc.challenge_id)
    trades = db.session.query(Trade).filter_by(user_challenge_id=uc.id).order_by(Trade.timestamp.desc()).all()
    positions = db.session.query(Position).filter_by(user_challenge_id=uc.id).all()
    symbols = list({p.symbol for p in positions})
    prices = {}
    # Batch fetch prices for all positions
    prices = PriceService.get_prices(symbols)
    realized_pnl = sum((t.pnl or 0.0) for t in trades)
    unrealized_pnl = 0.0
    cash_effect = 0.0
    for p in positions:
        current = prices.get(p.symbol, p.avg_price)
        if p.side == "long":
            unrealized_pnl += (current - p.avg_price) * p.quantity
            cash_effect -= p.avg_price * p.quantity
        else:
            unrealized_pnl += (p.avg_price - current) * p.quantity
            cash_effect += p.avg_price * p.quantity
    cash_balance = (plan.starting_balance + realized_pnl + cash_effect)
    equity = cash_balance + unrealized_pnl
    uc.equity = equity
    db.session.commit()
    evaluate_rules(uc.id)
    return jsonify({
        "status": uc.status,
        "equity": round(equity, 2),
        "cash_balance": round(cash_balance, 2),
        "unrealized_pnl": round(unrealized_pnl, 2),
        "realized_pnl": round(realized_pnl, 2),
        "starting_balance": plan.starting_balance,
        "profit_target_pct": plan.profit_target_pct,
        "max_daily_loss_pct": plan.max_daily_loss_pct,
        "max_total_loss_pct": plan.max_total_loss_pct,
        "positions": [{"symbol": p.symbol, "side": p.side, "quantity": p.quantity, "avg_price": p.avg_price, "current_price": prices.get(p.symbol, p.avg_price)} for p in positions],
        "trades": [{"id": t.id, "symbol": t.symbol, "side": t.side, "quantity": t.quantity, "price": t.price, "timestamp": t.timestamp.isoformat(), "pnl": t.pnl} for t in trades]
    })

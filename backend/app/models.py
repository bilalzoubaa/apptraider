from datetime import datetime
from .db import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChallengePlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price_dh = db.Column(db.Integer, nullable=False)
    starting_balance = db.Column(db.Float, nullable=False)
    profit_target_pct = db.Column(db.Float, default=10.0)
    max_daily_loss_pct = db.Column(db.Float, default=5.0)
    max_total_loss_pct = db.Column(db.Float, default=10.0)

class UserChallenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey("challenge_plan.id"), nullable=False)
    status = db.Column(db.String(20), default="active")
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    equity = db.Column(db.Float, nullable=False)
    daily_start_equity = db.Column(db.Float, nullable=False)
    highest_equity = db.Column(db.Float, nullable=False)
    lowest_equity = db.Column(db.Float, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

class Trade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_challenge_id = db.Column(db.Integer, db.ForeignKey("user_challenge.id"), nullable=False)
    symbol = db.Column(db.String(50), nullable=False)
    side = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    pnl = db.Column(db.Float, default=0.0)

class Position(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_challenge_id = db.Column(db.Integer, db.ForeignKey("user_challenge.id"), nullable=False)
    symbol = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    avg_price = db.Column(db.Float, nullable=False)
    side = db.Column(db.String(10), nullable=False)  # long or short
    opened_at = db.Column(db.DateTime, default=datetime.utcnow)

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    method = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    meta = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Settings(db.Model):
    """
    Settings model to store application configuration.
    Example: PayPal credentials.
    """
    id = db.Column(db.Integer, primary_key=True)
    paypal_client_id = db.Column(db.String(255))
    paypal_secret = db.Column(db.String(255))

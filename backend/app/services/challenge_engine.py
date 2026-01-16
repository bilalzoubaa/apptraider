from datetime import datetime
from sqlalchemy import func
from ..db import db
from ..models import UserChallenge, ChallengePlan, Trade

def evaluate_rules(user_challenge_id):
    uc = db.session.get(UserChallenge, user_challenge_id)
    if not uc:
        return
    plan = db.session.get(ChallengePlan, uc.challenge_id)
    today = datetime.utcnow().date()
    daily_pnl = db.session.query(func.sum(Trade.pnl)).filter(Trade.user_challenge_id == user_challenge_id, func.date(Trade.timestamp) == today).scalar() or 0.0
    total_pnl = db.session.query(func.sum(Trade.pnl)).filter(Trade.user_challenge_id == user_challenge_id).scalar() or 0.0
    daily_loss_pct = abs(daily_pnl) / plan.starting_balance * 100.0 if daily_pnl < 0 else 0.0
    profit_pct = (uc.equity - plan.starting_balance) / plan.starting_balance * 100.0 if plan.starting_balance else 0.0
    total_loss_pct = abs(uc.equity - plan.starting_balance) / plan.starting_balance * 100.0 if uc.equity < plan.starting_balance and plan.starting_balance else 0.0
    if daily_loss_pct >= plan.max_daily_loss_pct:
        uc.status = "failed"
        uc.end_date = datetime.utcnow()
    elif total_loss_pct >= plan.max_total_loss_pct:
        uc.status = "failed"
        uc.end_date = datetime.utcnow()
    elif profit_pct >= plan.profit_target_pct:
        uc.status = "passed"
        uc.end_date = datetime.utcnow()
    db.session.commit()

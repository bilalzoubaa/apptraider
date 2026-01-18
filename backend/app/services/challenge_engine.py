from datetime import datetime
from sqlalchemy import func
from ..db import db
from ..models import UserChallenge, ChallengePlan, Trade

def evaluate_rules(user_challenge_id):
    uc = db.session.get(UserChallenge, user_challenge_id)
    if not uc:
        return None
    plan = db.session.get(ChallengePlan, uc.challenge_id)
    
    now = datetime.utcnow()
    # If it's a new day, update daily_start_equity
    if uc.last_updated.date() < now.date():
        uc.daily_start_equity = uc.equity
    
    uc.last_updated = now
    
    # Formula 1: Daily Loss (%)
    # (Equity Actuelle - Equity au début du jour) / Equity Initiale * 100
    # Note: user said "equity_initiale" which usually means the plan's starting balance
    daily_loss_amount = uc.equity - uc.daily_start_equity
    daily_loss_pct = abs(daily_loss_amount) / plan.starting_balance * 100.0 if daily_loss_amount < 0 else 0.0
    
    # Formula 2: Total Loss (%)
    # (Equity Actuelle - Solde Initial) / Solde Initial * 100
    total_loss_amount = uc.equity - plan.starting_balance
    total_loss_pct = abs(total_loss_amount) / plan.starting_balance * 100.0 if total_loss_amount < 0 else 0.0
    
    profit_pct = (uc.equity - plan.starting_balance) / plan.starting_balance * 100.0 if plan.starting_balance else 0.0
    
    if daily_loss_pct >= plan.max_daily_loss_pct:
        uc.status = "failed"
        uc.end_date = now
    elif total_loss_pct >= plan.max_total_loss_pct:
        uc.status = "failed"
        uc.end_date = now
    elif profit_pct >= plan.profit_target_pct:
        uc.status = "passed"
        uc.end_date = now
        
    db.session.commit()
    return {
        "daily_loss_pct": round(daily_loss_pct, 2),
        "total_loss_pct": round(total_loss_pct, 2),
        "profit_pct": round(profit_pct, 2)
    }

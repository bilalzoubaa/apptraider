from app import create_app
from app.db import db
from app.models import User, UserChallenge, Trade, ChallengePlan
from sqlalchemy import func
import datetime

app = create_app()

with app.app_context():
    print("--- Debugging Leaderboard Query ---")
    month_str = datetime.datetime.utcnow().strftime('%Y-%m')
    print(f"Target Month: {month_str}")

    # Inspect Trades
    trade_count = Trade.query.count()
    print(f"Total Trades in DB: {trade_count}")
    
    trades_this_month = Trade.query.filter(func.strftime('%Y-%m', Trade.timestamp) == month_str).all()
    print(f"Trades this month: {len(trades_this_month)}")
    
    # Try the problematic query structure to see what it outputs
    try:
        results = db.session.query(
            User.email,
            UserChallenge.id,
            ChallengePlan.starting_balance,
            func.sum(Trade.pnl).label('monthly_pnl'),
            func.count(Trade.id).label('trade_count')
        ).select_from(Trade)\
         .join(UserChallenge, Trade.user_challenge_id == UserChallenge.id)\
         .join(User, UserChallenge.user_id == User.id)\
         .join(ChallengePlan, UserChallenge.challenge_id == ChallengePlan.id)\
         .filter(func.strftime('%Y-%m', Trade.timestamp) == month_str)\
         .group_by(UserChallenge.id).all()
        
        print(f"Query Results Count: {len(results)}")
        for r in results:
            print(f"Row: {r}")
            
    except Exception as e:
        print(f"Query Failed: {e}")


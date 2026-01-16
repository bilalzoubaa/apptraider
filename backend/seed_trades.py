from app import create_app
from app.db import db
from app.models import User, UserChallenge, Trade, ChallengePlan
import random
from datetime import datetime, timedelta

app = create_app()

def seed():
    with app.app_context():
        print("Seeding trades...")
        users = User.query.all()
        if not users:
            print("No users found")
            return

        # Ensure we have active challenges
        challenges = UserChallenge.query.filter_by(status='active').all()
        if not challenges:
            print("No active challenges found. Creating one.")
            plan = ChallengePlan.query.first()
            if not plan:
                plan = ChallengePlan(name="Test Plan", price_dh=100, starting_balance=10000, profit_target_pct=10, max_daily_loss_pct=5, max_total_loss_pct=10)
                db.session.add(plan)
                db.session.commit()
            
            uc = UserChallenge(user_id=users[0].id, challenge_id=plan.id, equity=10000, highest_equity=10000, lowest_equity=10000)
            db.session.add(uc)
            db.session.commit()
            challenges = [uc]

        tickers = ["AAPL", "TSLA", "MSFT", "NVDA", "BTC-USD"]
        
        # Generate random trades for this month
        count = 0
        for uc in challenges:
            # Add 5 to 10 trades per user
            for _ in range(random.randint(5, 10)):
                side = random.choice(["buy", "sell"])
                pnl = random.uniform(-100, 300) # Mostly positive for leaderboard fun
                trade = Trade(
                    user_challenge_id=uc.id,
                    symbol=random.choice(tickers),
                    side=side,
                    quantity=random.randint(1, 10),
                    price=random.uniform(100, 1000),
                    timestamp=datetime.utcnow(),
                    pnl=pnl
                )
                db.session.add(trade)
                
                # Update equity roughly
                uc.equity += pnl
                count += 1
        
        db.session.commit()
        print(f"Added {count} trades.")

if __name__ == "__main__":
    seed()

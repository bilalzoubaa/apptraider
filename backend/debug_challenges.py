from app import create_app
from app.models import User, UserChallenge

app = create_app()

with app.app_context():
    users = User.query.all()
    print("--- USERS ---")
    for u in users:
        print(f"User: {u.id} - {u.email}")
        challenges = UserChallenge.query.filter_by(user_id=u.id).all()
        for c in challenges:
             print(f"  -> Challenge {c.id}: Status='{c.status}', Equity={c.equity}")

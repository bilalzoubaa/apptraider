from app import create_app
from app.models import User

app = create_app()

with app.app_context():
    users = User.query.all()
    print(f"Total Users: {len(users)}")
    for user in users:
        print(f"ID: {user.id}, Email: {user.email}, Created At: {user.created_at}")

from app import create_app
from app.blueprints.challenges import seed_default_plans
from dotenv import load_dotenv
import os

load_dotenv()

app = create_app()

with app.app_context():
    seed_default_plans()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

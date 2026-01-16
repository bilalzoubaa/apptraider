from flask import Blueprint, jsonify, request
from ..db import db
from ..models import ChallengePlan, UserChallenge, User

challenges_bp = Blueprint("challenges", __name__)

@challenges_bp.get("/")
def list_plans():
    plans = db.session.query(ChallengePlan).all()
    return jsonify([{"id": p.id, "name": p.name, "price_dh": p.price_dh, "starting_balance": p.starting_balance, "profit_target_pct": p.profit_target_pct, "max_daily_loss_pct": p.max_daily_loss_pct, "max_total_loss_pct": p.max_total_loss_pct} for p in plans])

def seed_default_plans():
    if db.session.query(ChallengePlan).count() == 0:
        db.session.add_all([
            ChallengePlan(name="Starter", price_dh=200, starting_balance=5000.0),
            ChallengePlan(name="Pro", price_dh=500, starting_balance=10000.0),
            ChallengePlan(name="Elite", price_dh=1000, starting_balance=20000.0),
        ])
        db.session.commit()

@challenges_bp.get("/user_challenges")
def list_user_challenges():
    rows = db.session.query(UserChallenge, User, ChallengePlan).join(User, User.id == UserChallenge.user_id).join(ChallengePlan, ChallengePlan.id == UserChallenge.challenge_id).all()
    data = []
    for uc, u, p in rows:
        data.append({
            "id": uc.id,
            "user_id": uc.user_id,
            "email": u.email,
            "plan": p.name,
            "status": uc.status,
            "equity": uc.equity,
            "starting_balance": p.starting_balance
        })
    return jsonify(data)

@challenges_bp.post("/update_status")
def update_status():
    data = request.get_json()
    uc_id = data.get("user_challenge_id")
    status = data.get("status")
    uc = db.session.get(UserChallenge, uc_id)
    if not uc or status not in ("active", "failed", "passed"):
        return jsonify({"error": "invalid"}), 400
    uc.status = status
    db.session.commit()
    return jsonify({"id": uc.id, "status": uc.status})

@challenges_bp.get("/active")
def get_active_challenge():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "missing_user_id"}), 400
    
    uc = db.session.query(UserChallenge).filter_by(user_id=user_id, status="active").first()
    if uc:
        return jsonify({"active_challenge_id": uc.id})
    else:
        return jsonify({"active_challenge_id": None})

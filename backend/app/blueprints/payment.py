from flask import Blueprint, request, jsonify
from ..db import db
from ..models import Payment, UserChallenge, ChallengePlan, Settings

payment_bp = Blueprint("payment", __name__)

@payment_bp.post("/checkout")
def checkout():
    data = request.get_json()
    user_id = data.get("user_id")
    challenge_id = data.get("challenge_id")
    method = data.get("method", "cmi")
    plan = db.session.get(ChallengePlan, challenge_id)
    if not plan:
        return jsonify({"error": "invalid"}), 400
    pay = Payment(user_id=user_id, amount=float(plan.price_dh), method=method, status="success", meta={"gateway": method})
    db.session.add(pay)
    uc = UserChallenge(user_id=user_id, challenge_id=challenge_id, status="active", equity=plan.starting_balance, highest_equity=plan.starting_balance, lowest_equity=plan.starting_balance)
    db.session.add(uc)
    db.session.commit()
    return jsonify({"payment_id": pay.id, "user_challenge_id": uc.id, "status": "success"})

@payment_bp.get("/paypal-config")
def paypal_config():
    s = db.session.query(Settings).first()
    return jsonify({"client_id": s.paypal_client_id if s else "", "secret": s.paypal_secret if s else ""})

@payment_bp.post("/paypal-config")
def update_paypal_config():
    data = request.get_json()
    client_id = data.get("client_id", "")
    secret = data.get("secret", "")
    s = db.session.query(Settings).first()
    if not s:
        s = Settings(paypal_client_id=client_id, paypal_secret=secret)
        db.session.add(s)
    else:
        s.paypal_client_id = client_id
        s.paypal_secret = secret
    db.session.commit()
    return jsonify({"client_id": s.paypal_client_id, "secret": s.paypal_secret})

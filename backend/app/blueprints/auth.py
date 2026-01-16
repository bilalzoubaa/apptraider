from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from ..db import db
from ..models import User, UserChallenge

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "invalid"}), 400
    if db.session.query(User).filter_by(email=email).first():
        return jsonify({"error": "exists"}), 400
    user = User(email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    
    # Check if there's somehow an active challenge (unlikely for new user but good practice)
    # or just return null
    return jsonify({"id": user.id, "email": user.email, "active_challenge_id": None})

@auth_bp.post("/login")
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    user = db.session.query(User).filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "unauthorized"}), 401
    
    # Find active challenge
    active_challenge = db.session.query(UserChallenge).filter_by(user_id=user.id, status='active').first()
    challenge_id = active_challenge.id if active_challenge else None
    
    return jsonify({
        "id": user.id, 
        "email": user.email,
        "active_challenge_id": challenge_id
    })

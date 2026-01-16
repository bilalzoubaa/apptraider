from flask import Blueprint, request, jsonify, current_app
from ..models import User, UserChallenge, ChallengePlan
from ..db import db

admin_bp = Blueprint('admin', __name__)

def check_admin_auth():
    admin_key = request.headers.get('X-ADMIN-KEY')
    if not admin_key or admin_key != current_app.config.get('ADMIN_KEY'):
        return False
    return True

@admin_bp.get('/challenges')
def list_challenges():
    if not check_admin_auth():
        return jsonify({"error": "Unauthorized"}), 401
    
    # Debug Logging
    print(f"--- ADMIN ACCESS: Listing Challenges ---")
    print(f"Database URI: {current_app.config.get('SQLALCHEMY_DATABASE_URI')}")
    
    try:
        total_raw = UserChallenge.query.count()
        print(f"Total raw UserChallenges: {total_raw}")
        
        results = db.session.query(
            UserChallenge.id,
            User.email,
            UserChallenge.equity,
            UserChallenge.status,
            ChallengePlan.name.label('plan_name')
        ).join(User, UserChallenge.user_id == User.id)\
         .join(ChallengePlan, UserChallenge.challenge_id == ChallengePlan.id).all()

        print(f"Found {len(results)} joined challenges in DB.")
        
        if total_raw > 0 and len(results) == 0:
            print("WARNING: Challenges exist but join failed. Checking for orphan records...")
            # Check for invalid user_id or challenge_id
            for uc in UserChallenge.query.all():
                u_exists = db.session.get(User, uc.user_id) is not None
                p_exists = db.session.get(ChallengePlan, uc.challenge_id) is not None
                print(f" - UC {uc.id}: User({uc.user_id}) exists: {u_exists}, Plan({uc.challenge_id}) exists: {p_exists}")

        challenges = []
        for row in results:
            challenges.append({
                "id": row.id,
                "user": row.email,
                "balance": round(row.equity, 2),
                "status": row.status,
                "plan": row.plan_name
            })
        
        return jsonify({
            "items": challenges,
            "count": len(challenges),
            "message": "Success" if challenges else "No challenges found"
        })
    except Exception as e:
        print(f"Error in admin/challenges: {e}")
        return jsonify({"error": str(e)}), 500

@admin_bp.get('/debug/counts')
def debug_counts():
    # Simple debug endpoint without complex auth for troubleshooting
    try:
        from ..models import User, UserChallenge, Trade
        counts = {
            "users": User.query.count(),
            "challenges": UserChallenge.query.count(),
            "trades": Trade.query.count(),
            "db_uri": current_app.config.get('SQLALCHEMY_DATABASE_URI')
        }
        return jsonify(counts)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.post('/challenge/<int:challenge_id>/status')
def update_challenge_status(challenge_id):
    if not check_admin_auth():
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['active', 'passed', 'failed']:
        return jsonify({"error": "Invalid status"}), 400
    
    uc = db.session.get(UserChallenge, challenge_id)
    if not uc:
        return jsonify({"error": "Challenge not found"}), 404
    
    uc.status = new_status
    db.session.commit()
    
    return jsonify({"message": f"Status updated to {new_status}"})

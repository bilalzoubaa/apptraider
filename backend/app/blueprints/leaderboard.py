from flask import Blueprint, request, jsonify
from sqlalchemy import func
from datetime import datetime
from ..models import User, UserChallenge, Trade, ChallengePlan
from ..db import db

leaderboard_bp = Blueprint('leaderboard', __name__)

@leaderboard_bp.get('/top10')
def get_top10():
    try:
        month_str = request.args.get('month') # Format YYYY-MM
        
        # Determine the filter pattern
        if not month_str:
            month_str = datetime.utcnow().strftime('%Y-%m')
        
        # Query: Get stats per UserChallenge (aggregating trades for the month)
        # Structure: Trade -> UserChallenge -> ChallengePlan & User
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

        # Step 2: Aggregate by User (in case a user has multiple challenges active this month)
        user_map = {}
        
        for email, challenge_id, start_bal, pnl, count in results:
            if not email: continue
            
            if email not in user_map:
                user_map[email] = {
                    'email': email,
                    'total_pnl': 0.0,
                    'total_balance': 0.0,
                    'trades_count': 0
                }
            
            # Add stats
            current_pnl = float(pnl) if pnl is not None else 0.0
            current_bal = float(start_bal) if start_bal is not None else 0.0
            
            user_map[email]['total_pnl'] += current_pnl
            user_map[email]['total_balance'] += current_bal
            user_map[email]['trades_count'] += count

        # Step 3: Calculate Percentage and Format
        leaderboard = []
        for email, data in user_map.items():
            balance = data['total_balance']
            if balance > 0:
                profit_pct = (data['total_pnl'] / balance) * 100
            else:
                profit_pct = 0.0
            
            # Mask email for privacy (bilal***@gmail.com)
            name_parts = email.split('@')
            if len(name_parts[0]) > 3:
                display_name = name_parts[0][:3] + "***@" + name_parts[1]
            else:
                display_name = email
                
            leaderboard.append({
                'user_name': display_name,
                'profit_percent': round(profit_pct, 2),
                'total_pnl': round(data['total_pnl'], 2),
                'trades_count': data['trades_count']
            })

        # Step 4: Sort by Profit % Descending and Top 10
        leaderboard.sort(key=lambda x: x['profit_percent'], reverse=True)
        top10 = leaderboard[:10]
        
        # Add rank
        for idx, item in enumerate(top10):
            item['rank'] = idx + 1

        return jsonify(top10)

    except Exception as e:
        print(f"Error generating leaderboard: {e}")
        return jsonify({"error": "Failed to generate leaderboard"}), 500

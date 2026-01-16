from flask import Blueprint, jsonify
from ..models import Settings

# Create a Blueprint for settings routes
settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/', methods=['GET'])
def get_settings():
    """
    Get the application settings.
    Reads from the 'settings' table and returns JSON.
    """
    settings = Settings.query.first()
    
    if settings:
        return jsonify({
            "id": settings.id,
            "paypal_client_id": settings.paypal_client_id,
            "paypal_secret": settings.paypal_secret
        })
    else:
        # Return generic empty settings or 404
        return jsonify({"message": "No settings found", "data": {}}), 200

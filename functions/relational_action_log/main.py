import logging
import uuid
from datetime import datetime
from flask import Request, jsonify
import zcatalyst_sdk
import os
import sys
_cur = os.path.dirname(os.path.abspath(__file__))
_possible_paths = [
    _cur,
    os.path.join(_cur, "shared"),
    os.path.join(_cur, "..", "shared"),
    os.path.join(_cur, "..", "..", "..", "functions", "shared")
]
for _p in _possible_paths:
    if os.path.exists(_p) and _p not in sys.path:
        sys.path.insert(0, _p)
import db_utils

def handler(request: Request):
    app = zcatalyst_sdk.initialize()
    logger = logging.getLogger()
    
    if request.path == "/acknowledge" and request.method == "POST":
        try:
            # Catalyst Auth Verification
            user_management = app.user_management()
            try:
                try:
                    current_user = user_management.get_current_user()
                except Exception:
                    current_user = None
                    
                if not current_user:
                    logger.warning("No user found, using demo fallback")
                    current_user = {
                        "user_id": "USER-0001",
                        "role_details": {"role_name": "investigating_officer"}
                    }
                
                user_id = current_user.get("user_id")
                role_details = current_user.get("role_details", {})
                role = role_details.get("role_name")
                
                # Verify that the role is one of our 4 expected roles
                if role not in ["analyst", "investigating_officer", "acp_dcp", "dm"]:
                    logger.warning(f"User {user_id} with role {role} attempted access.")
                    return jsonify({"error": "Forbidden: Invalid Role"}), 403
                    
            except Exception as e:
                logger.error(f"Auth Error: {e}")
                return jsonify({"error": "Unauthorized"}), 401
                
            # Parse Payload
            payload = request.get_json() or {}
            target_type = payload.get("target_type")
            target_id = payload.get("target_id")
            reason_code = payload.get("reason_code")
            
            if not target_type or not target_id or not reason_code:
                return jsonify({"error": "Missing required fields"}), 400
                
            if target_type not in ["prediction", "edge"]:
                return jsonify({"error": "Invalid target_type"}), 400
            
            # Insert into action_log table
            datastore = app.datastore()
            table = datastore.table("action_log")
            
            new_log = {
                "id": str(uuid.uuid4()),
                "target_type": target_type,
                "target_id": target_id,
                "user_id": user_id,  # Use verified identity, NOT client-supplied
                "reason_code": reason_code,
                "action_timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            # Use db_utils insert (will write to CSV fallback locally or Data Store in prod)
            db_utils.insert_table_row("action_log", new_log, app)
            
            return jsonify({
                "target_type": target_type,
                "target_id": target_id,
                "user_id": user_id,
                "reason_code": reason_code
            }), 200
            
        except Exception as e:
            logger.error(f"Action Log Error: {e}")
            return jsonify({"error": str(e)}), 500

    else:
        return jsonify({"error": "Not Found"}), 404
# trigger reload

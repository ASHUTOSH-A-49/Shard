from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/verify", methods=["POST", "OPTIONS"])
def verify_user():
    if request.method == "OPTIONS":
        return "", 200  # 👈 allow preflight

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]

    # 🔥 For now, just accept the token
    return jsonify({"status": "ok"}), 200

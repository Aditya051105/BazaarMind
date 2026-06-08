from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
import random

from models import db
from models.user import User

auth_bp = Blueprint("auth", __name__)

# Temporary OTP store (in production use Redis)
otp_store = {}

# ── REGISTER ──────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Check if mobile already exists
    if User.query.filter_by(mobile=data["mobile"]).first():
        return jsonify({"error": "Mobile number already registered"}), 400

    # Hash password
    hashed = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

    user = User(
        owner_name = data["owner_name"],
        mobile     = data["mobile"],
        email      = data.get("email", ""),
        password   = hashed.decode("utf-8"),
        shop_name  = data["shop_name"],
        shop_type  = data["shop_type"],
        address    = data["address"],
        city       = data["city"],
        state      = data["state"],
        pincode    = data["pincode"],
        gstin      = data.get("gstin", ""),
    )

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "message": "Registration successful!",
        "token":   token,
        "user":    user.to_dict()
    }), 201


# ── SEND OTP ──────────────────────────────────────
@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    data   = request.get_json()
    mobile = data.get("mobile")

    if not mobile:
        return jsonify({"error": "Mobile number required"}), 400

    # Generate 4-digit OTP
    otp = str(random.randint(1000, 9999))
    otp_store[mobile] = otp

    # In production: send via Twilio/SMS
    print(f"OTP for {mobile}: {otp}")

    return jsonify({
        "message": "OTP sent successfully",
        "otp":     otp  # Remove this in production!
    }), 200


# ── VERIFY OTP ────────────────────────────────────
@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data   = request.get_json()
    mobile = data.get("mobile")
    otp    = data.get("otp")

    if otp_store.get(mobile) == otp:
        otp_store.pop(mobile)
        return jsonify({"message": "OTP verified!", "verified": True}), 200

    return jsonify({"error": "Invalid OTP", "verified": False}), 400


# ── LOGIN ─────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(mobile=data["mobile"]).first()

    if not user:
        return jsonify({"error": "Mobile number not registered"}), 404

    if not bcrypt.checkpw(data["password"].encode("utf-8"), user.password.encode("utf-8")):
        return jsonify({"error": "Incorrect password"}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "message": "Login successful!",
        "token":   token,
        "user":    user.to_dict()
    }), 200


# ── GET PROFILE ───────────────────────────────────
@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import random
import string

from models import db
from models.order import Order, OrderItem
from models.user import User

orders_bp = Blueprint("orders", __name__)

def generate_order_code():
    return "ORD-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=7))


# ── PLACE ORDER ───────────────────────────────────
@orders_bp.route("/", methods=["POST"])
@jwt_required()
def place_order():
    user_id = get_jwt_identity()
    data    = request.get_json()

    order = Order(
        order_code        = generate_order_code(),
        user_id           = user_id,
        retailer_name     = data["retailer_name"],
        retailer_area     = data["retailer_area"],
        total_amount      = data["total_amount"],
        notes             = data.get("notes", ""),
        status            = "Pending",
        expected_delivery = datetime.utcnow() + timedelta(days=2),
    )

    db.session.add(order)
    db.session.flush()  # Get order.id before commit

    # Add order items
    for item in data["items"]:
        order_item = OrderItem(
            order_id     = order.id,
            product_name = item["name"],
            category     = item["category"],
            quantity     = item["qty"],
            unit         = item["unit"],
            price        = item["price"],
            total        = item["price"] * item["qty"],
        )
        db.session.add(order_item)

    db.session.commit()

    return jsonify({
        "message": "Order placed successfully!",
        "order":   order.to_dict()
    }), 201


# ── GET ALL ORDERS ────────────────────────────────
@orders_bp.route("/", methods=["GET"])
@jwt_required()
def get_orders():
    user_id = get_jwt_identity()
    orders  = Order.query.filter_by(user_id=user_id).order_by(Order.placed_at.desc()).all()
    return jsonify({"orders": [o.to_dict() for o in orders]}), 200


# ── GET SINGLE ORDER ──────────────────────────────
@orders_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):
    user_id = get_jwt_identity()
    order   = Order.query.filter_by(id=order_id, user_id=user_id).first()

    if not order:
        return jsonify({"error": "Order not found"}), 404

    return jsonify({"order": order.to_dict()}), 200


# ── UPDATE ORDER STATUS ───────────────────────────
@orders_bp.route("/<int:order_id>/status", methods=["PATCH"])
@jwt_required()
def update_status(order_id):
    user_id = get_jwt_identity()
    order   = Order.query.filter_by(id=order_id, user_id=user_id).first()

    if not order:
        return jsonify({"error": "Order not found"}), 404

    data         = request.get_json()
    order.status = data.get("status", order.status)

    db.session.commit()

    return jsonify({
        "message": "Status updated!",
        "order":   order.to_dict()
    }), 200
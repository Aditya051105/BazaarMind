from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db
from models.order import Product

inventory_bp = Blueprint("inventory", __name__)


# ── GET ALL PRODUCTS ──────────────────────────────
@inventory_bp.route("/", methods=["GET"])
@jwt_required()
def get_products():
    user_id  = get_jwt_identity()
    products = Product.query.filter_by(user_id=user_id).all()
    return jsonify({"products": [p.to_dict() for p in products]}), 200


# ── ADD PRODUCT ───────────────────────────────────
@inventory_bp.route("/", methods=["POST"])
@jwt_required()
def add_product():
    user_id = get_jwt_identity()
    data    = request.get_json()

    product = Product(
        user_id   = user_id,
        name      = data["name"],
        sku       = data["sku"],
        category  = data["category"],
        quantity  = data.get("quantity", 0),
        min_stock = data.get("min_stock", 10),
        price     = data["price"],
        unit      = data.get("unit", "kg"),
        supplier  = data.get("supplier", ""),
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({
        "message": "Product added!",
        "product": product.to_dict()
    }), 201


# ── UPDATE PRODUCT ────────────────────────────────
@inventory_bp.route("/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    user_id = get_jwt_identity()
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()

    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json()

    product.name      = data.get("name",      product.name)
    product.sku       = data.get("sku",       product.sku)
    product.category  = data.get("category",  product.category)
    product.quantity  = data.get("quantity",  product.quantity)
    product.min_stock = data.get("min_stock", product.min_stock)
    product.price     = data.get("price",     product.price)
    product.unit      = data.get("unit",      product.unit)
    product.supplier  = data.get("supplier",  product.supplier)

    db.session.commit()

    return jsonify({
        "message": "Product updated!",
        "product": product.to_dict()
    }), 200


# ── UPDATE QUANTITY ONLY ──────────────────────────
@inventory_bp.route("/<int:product_id>/quantity", methods=["PATCH"])
@jwt_required()
def update_quantity(product_id):
    user_id = get_jwt_identity()
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()

    if not product:
        return jsonify({"error": "Product not found"}), 404

    data     = request.get_json()
    delta    = data.get("delta", 0)  # +1 or -1
    product.quantity = max(0, product.quantity + delta)

    db.session.commit()

    return jsonify({
        "message":  "Quantity updated!",
        "quantity": product.quantity
    }), 200


# ── DELETE PRODUCT ────────────────────────────────
@inventory_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    user_id = get_jwt_identity()
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()

    if not product:
        return jsonify({"error": "Product not found"}), 404

    db.session.delete(product)
    db.session.commit()

    return jsonify({"message": "Product deleted!"}), 200
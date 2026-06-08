from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db

# Import all models so SQLAlchemy knows about them
from models.user import User
from models.order import Product, Order, OrderItem

# Import route blueprints
from routes.auth import auth_bp
from routes.inventory import inventory_bp
from routes.orders import orders_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    CORS(app)
    JWTManager(app)

    # Register blueprints
    app.register_blueprint(auth_bp,      url_prefix="/api/auth")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(orders_bp,    url_prefix="/api/orders")

    # Create all tables on startup
    with app.app_context():
        db.create_all()
        print("✅ Database tables created!")

    return app

app = create_app()
# ── HOME ROUTE ────────────────────────────────────
@app.route("/")
def home():
    return jsonify({
        "message": "🏪 StoreIQ API is running!",
        "version": "1.0",
        "endpoints": {
            "auth":      "/api/auth",
            "inventory": "/api/inventory",
            "orders":    "/api/orders"
        }
    })
if __name__ == "__main__":
    app.run(debug=True, port=5000)
from models import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = "products"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name        = db.Column(db.String(150), nullable=False)
    sku         = db.Column(db.String(50), nullable=False)
    category    = db.Column(db.String(100), nullable=False)
    quantity    = db.Column(db.Float, default=0)
    min_stock   = db.Column(db.Float, default=10)
    price       = db.Column(db.Float, nullable=False)
    unit        = db.Column(db.String(20), default="kg")
    supplier    = db.Column(db.String(150), nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Sales history stored as comma-separated string
    sales_history = db.Column(db.String(500), default="0,0,0,0,0,0,0,0,0,0,0,0")

    def to_dict(self):
        return {
            "id":            self.id,
            "user_id":       self.user_id,
            "name":          self.name,
            "sku":           self.sku,
            "category":      self.category,
            "quantity":      self.quantity,
            "min_stock":     self.min_stock,
            "price":         self.price,
            "unit":          self.unit,
            "supplier":      self.supplier,
            "sales_history": [int(x) for x in self.sales_history.split(",")],
            "created_at":    self.created_at.isoformat(),
        }


class Order(db.Model):
    __tablename__ = "orders"

    id                = db.Column(db.Integer, primary_key=True)
    order_code        = db.Column(db.String(20), unique=True, nullable=False)
    user_id           = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    retailer_name     = db.Column(db.String(150), nullable=False)
    retailer_area     = db.Column(db.String(150), nullable=False)
    total_amount      = db.Column(db.Float, nullable=False)
    status            = db.Column(db.String(50), default="Pending")
    notes             = db.Column(db.String(500), nullable=True)
    placed_at         = db.Column(db.DateTime, default=datetime.utcnow)
    expected_delivery = db.Column(db.DateTime, nullable=True)

    # Relationship to items
    items = db.relationship("OrderItem", backref="order", lazy=True)

    def to_dict(self):
        return {
            "id":                self.id,
            "order_code":        self.order_code,
            "user_id":           self.user_id,
            "retailer_name":     self.retailer_name,
            "retailer_area":     self.retailer_area,
            "total_amount":      self.total_amount,
            "status":            self.status,
            "notes":             self.notes,
            "placed_at":         self.placed_at.isoformat(),
            "expected_delivery": self.expected_delivery.isoformat() if self.expected_delivery else None,
            "items":             [i.to_dict() for i in self.items],
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id           = db.Column(db.Integer, primary_key=True)
    order_id     = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_name = db.Column(db.String(150), nullable=False)
    category     = db.Column(db.String(100), nullable=False)
    quantity     = db.Column(db.Float, nullable=False)
    unit         = db.Column(db.String(20), nullable=False)
    price        = db.Column(db.Float, nullable=False)
    total        = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id":           self.id,
            "order_id":     self.order_id,
            "product_name": self.product_name,
            "category":     self.category,
            "quantity":     self.quantity,
            "unit":         self.unit,
            "price":        self.price,
            "total":        self.total,
        }
    
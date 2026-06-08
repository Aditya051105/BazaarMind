from models import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"

    id          = db.Column(db.Integer, primary_key=True)
    owner_name  = db.Column(db.String(100), nullable=False)
    mobile      = db.Column(db.String(15), unique=True, nullable=False)
    email       = db.Column(db.String(120), nullable=True)
    password    = db.Column(db.String(200), nullable=False)
    shop_name   = db.Column(db.String(150), nullable=False)
    shop_type   = db.Column(db.String(50), nullable=False)
    address     = db.Column(db.String(300), nullable=False)
    city        = db.Column(db.String(100), nullable=False)
    state       = db.Column(db.String(100), nullable=False)
    pincode     = db.Column(db.String(10), nullable=False)
    gstin       = db.Column(db.String(20), nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    products    = db.relationship("Product", backref="owner", lazy=True)
    orders      = db.relationship("Order", backref="shopkeeper", lazy=True)

    def to_dict(self):
        return {
            "id":         self.id,
            "owner_name": self.owner_name,
            "mobile":     self.mobile,
            "email":      self.email,
            "shop_name":  self.shop_name,
            "shop_type":  self.shop_type,
            "address":    self.address,
            "city":       self.city,
            "state":      self.state,
            "pincode":    self.pincode,
            "gstin":      self.gstin,
            "created_at": self.created_at.isoformat(),
        }
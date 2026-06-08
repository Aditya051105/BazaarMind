from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
from collections import defaultdict

app = Flask(__name__)

# Dummy Data Store (In-memory, user-specific)
# Keyed by user mobile number
users_db = {
    "9999999999": {
        "name": "Ramesh Kumar",
        "shop_name": "Ramesh Kirana & General Store",
        "city": "Mumbai",
        "type": "Kirana",
        "pin": "1234",
        "mobile": "9999999999"
    }
}

inventories_db = {
    "9999999999": [
        {"id": 1, "name": "Aashirvaad Atta", "category": "Grocery", "quantity": 15, "unit": "kg", "price": 45, "reorder_level": 20},
        {"id": 2, "name": "India Gate Basmati Rice", "category": "Grocery", "quantity": 30, "unit": "kg", "price": 95, "reorder_level": 10},
        {"id": 3, "name": "Tata Salt", "category": "Grocery", "quantity": 50, "unit": "kg", "price": 24, "reorder_level": 15},
        {"id": 4, "name": "Fortune Sunflower Oil", "category": "Grocery", "quantity": 8, "unit": "ltr", "price": 140, "reorder_level": 10},
        {"id": 5, "name": "Madhur Sugar", "category": "Grocery", "quantity": 25, "unit": "kg", "price": 42, "reorder_level": 20},
        {"id": 6, "name": "Lifebuoy Soap", "category": "General", "quantity": 40, "unit": "pcs", "price": 25, "reorder_level": 15},
        {"id": 7, "name": "Parle-G Biscuit", "category": "General", "quantity": 60, "unit": "pcs", "price": 10, "reorder_level": 20},
        {"id": 8, "name": "Clay Diyas (Pack of 12)", "category": "Festival", "quantity": 5, "unit": "pcs", "price": 50, "reorder_level": 10},
        {"id": 9, "name": "Cycle Agarbatti", "category": "Festival", "quantity": 20, "unit": "pcs", "price": 30, "reorder_level": 10},
    ]
}

# Sales transaction log: {mobile: [sale1, sale2, ...]}
sales_db = {
    "9999999999": [
        {"product_id": 1, "product_name": "Aashirvaad Atta", "category": "Grocery", "quantity": 2, "price": 45.0, "total": 90.0, "timestamp": datetime.now().strftime("%Y-%m-%dT10:30:00")},
        {"product_id": 6, "product_name": "Lifebuoy Soap", "category": "General", "quantity": 5, "price": 25.0, "total": 125.0, "timestamp": datetime.now().strftime("%Y-%m-%dT11:15:00")},
        {"product_id": 7, "product_name": "Parle-G Biscuit", "category": "General", "quantity": 10, "price": 10.0, "total": 100.0, "timestamp": datetime.now().strftime("%Y-%m-%dT12:00:00")}
    ]
}

# Product addition log: {mobile: [add1, add2, ...]}
product_adds_db = {
    "9999999999": [
        {"product_id": 1, "product_name": "Aashirvaad Atta", "category": "Grocery", "quantity": 10, "unit": "kg", "timestamp": datetime.now().strftime("%Y-%m-%dT09:00:00")}
    ]
}

current_product_ids = {
    "9999999999": 10
}

festivals = [
    {"name": "Diwali", "message": "Diwali aane wali hai! Mithai, Diyas, Pooja items ki demand badhegi.", "upcoming": True}
]

def get_user_mobile():
    mobile = request.headers.get('X-User-Mobile')
    if not mobile or mobile == 'null' or mobile == 'undefined':
        return "9999999999"
    return mobile

@app.route('/')
def index():
    return render_template('index.html')

# --- AUTH API ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    mobile = data.get('mobile')
    if mobile in users_db:
        return jsonify({"success": False, "message": "Mobile number already registered"}), 400
    
    shop_type = data.get('shop_type')
    users_db[mobile] = {
        "name": data.get('name'),
        "shop_name": data.get('shop_name'),
        "city": data.get('city'),
        "type": shop_type,
        "pin": data.get('pin'),
        "mobile": mobile
    }
    
    # Initialize entries
    sales_db[mobile] = []
    product_adds_db[mobile] = []
    
    # Seed default inventories based on shop type
    if shop_type == "Grocery":
        inventories_db[mobile] = [
            {"id": 1, "name": "Aashirvaad Atta", "category": "Grocery", "quantity": 15, "unit": "kg", "price": 45.0, "reorder_level": 20},
            {"id": 2, "name": "India Gate Basmati Rice", "category": "Grocery", "quantity": 30, "unit": "kg", "price": 95.0, "reorder_level": 10},
            {"id": 3, "name": "Tata Salt", "category": "Grocery", "quantity": 50, "unit": "kg", "price": 24.0, "reorder_level": 15},
            {"id": 4, "name": "Fortune Sunflower Oil", "category": "Grocery", "quantity": 8, "unit": "ltr", "price": 140.0, "reorder_level": 10},
            {"id": 5, "name": "Madhur Sugar", "category": "Grocery", "quantity": 25, "unit": "kg", "price": 42.0, "reorder_level": 20},
        ]
        current_product_ids[mobile] = 6
    elif shop_type == "General":
        inventories_db[mobile] = [
            {"id": 1, "name": "Lifebuoy Soap", "category": "General", "quantity": 40, "unit": "pcs", "price": 25.0, "reorder_level": 15},
            {"id": 2, "name": "Parle-G Biscuit", "category": "General", "quantity": 60, "unit": "pcs", "price": 10.0, "reorder_level": 20},
            {"id": 3, "name": "Dettol Liquid", "category": "General", "quantity": 12, "unit": "pcs", "price": 80.0, "reorder_level": 5},
            {"id": 4, "name": "Colgate Toothpaste", "category": "General", "quantity": 25, "unit": "pcs", "price": 55.0, "reorder_level": 10},
        ]
        current_product_ids[mobile] = 5
    else:  # Kirana or Other
        inventories_db[mobile] = [
            {"id": 1, "name": "Aashirvaad Atta", "category": "Grocery", "quantity": 15, "unit": "kg", "price": 45.0, "reorder_level": 20},
            {"id": 2, "name": "India Gate Basmati Rice", "category": "Grocery", "quantity": 30, "unit": "kg", "price": 95.0, "reorder_level": 10},
            {"id": 3, "name": "Tata Salt", "category": "Grocery", "quantity": 50, "unit": "kg", "price": 24.0, "reorder_level": 15},
            {"id": 4, "name": "Lifebuoy Soap", "category": "General", "quantity": 40, "unit": "pcs", "price": 25.0, "reorder_level": 15},
            {"id": 5, "name": "Parle-G Biscuit", "category": "General", "quantity": 60, "unit": "pcs", "price": 10.0, "reorder_level": 20},
        ]
        current_product_ids[mobile] = 6
        
    return jsonify({"success": True, "user": users_db[mobile]})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    mobile = data.get('mobile')
    pin = data.get('pin')
    
    user = users_db.get(mobile)
    if user and user['pin'] == pin:
        return jsonify({"success": True, "user": user})
    return jsonify({"success": False, "message": "Invalid mobile or PIN"}), 401

# --- INVENTORY API ---
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    mobile = get_user_mobile()
    if mobile not in inventories_db:
        inventories_db[mobile] = []
    return jsonify({"success": True, "inventory": inventories_db[mobile]})

@app.route('/api/inventory', methods=['POST'])
def add_product():
    mobile = get_user_mobile()
    if mobile not in inventories_db:
        inventories_db[mobile] = []
        current_product_ids[mobile] = 1
        product_adds_db[mobile] = []
        sales_db[mobile] = []
        
    data = request.json
    prod_id = current_product_ids.get(mobile, 1)
    
    new_product = {
        "id": prod_id,
        "name": data.get('name'),
        "category": data.get('category'),
        "quantity": int(data.get('quantity', 0)),
        "unit": data.get('unit'),
        "price": float(data.get('price', 0)),
        "reorder_level": int(data.get('reorder_level', 0))
    }
    
    inventories_db[mobile].append(new_product)
    current_product_ids[mobile] = prod_id + 1
    
    # Record product addition history
    add_record = {
        "product_id": new_product["id"],
        "product_name": new_product["name"],
        "category": new_product["category"],
        "quantity": new_product["quantity"],
        "unit": new_product["unit"],
        "timestamp": datetime.now().isoformat()
    }
    product_adds_db.setdefault(mobile, []).append(add_record)
    
    return jsonify({"success": True, "product": new_product})

@app.route('/api/inventory/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    mobile = get_user_mobile()
    if mobile in inventories_db:
        inventories_db[mobile] = [p for p in inventories_db[mobile] if p['id'] != product_id]
    return jsonify({"success": True})

# --- POS SALES BILLING API ---
@app.route('/api/sell', methods=['POST'])
def sell_products():
    mobile = get_user_mobile()
    if mobile not in inventories_db:
        return jsonify({"success": False, "message": "Inventory not found for user"}), 404
        
    data = request.json
    items_to_sell = data.get('items', [])
    if not items_to_sell:
        return jsonify({"success": False, "message": "No items to sell"}), 400
        
    # Verify stock levels first to prevent partial sales
    for item in items_to_sell:
        prod_id = int(item['id'])
        qty = int(item['quantity'])
        
        product = next((p for p in inventories_db[mobile] if p['id'] == prod_id), None)
        if not product:
            return jsonify({"success": False, "message": f"Product ID {prod_id} not found"}), 404
        if product['quantity'] < qty:
            return jsonify({"success": False, "message": f"Insufficient stock for {product['name']}. Available: {product['quantity']} {product['unit']}"}), 400
            
    # Process sales
    timestamp = datetime.now().isoformat()
    receipt_items = []
    
    for item in items_to_sell:
        prod_id = int(item['id'])
        qty = int(item['quantity'])
        
        product = next((p for p in inventories_db[mobile] if p['id'] == prod_id), None)
        product['quantity'] -= qty
        
        sale_record = {
            "product_id": prod_id,
            "product_name": product['name'],
            "category": product['category'],
            "quantity": qty,
            "price": product['price'],
            "total": float(product['price'] * qty),
            "timestamp": timestamp
        }
        sales_db.setdefault(mobile, []).append(sale_record)
        receipt_items.append(sale_record)
        
    return jsonify({"success": True, "sold_items": receipt_items, "inventory": inventories_db[mobile]})

# --- SALES ANALYSIS & ALERTS API ---
@app.route('/api/sales-summary', methods=['GET'])
def get_sales_summary():
    mobile = get_user_mobile()
    
    user_sales = sales_db.get(mobile, [])
    user_adds = product_adds_db.get(mobile, [])
    user_inventory = inventories_db.get(mobile, [])
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    today_sales = [s for s in user_sales if s['timestamp'].startswith(today_str)]
    today_adds = [a for a in user_adds if a['timestamp'].startswith(today_str)]
    
    total_revenue_today = sum(s['total'] for s in today_sales)
    total_items_sold_today = sum(s['quantity'] for s in today_sales)
    total_items_added_today = sum(a['quantity'] for a in today_adds)
    
    # Generate Smart alerts
    alerts = []
    
    # 1. Low stock alerts
    low_stock_items = [p for p in user_inventory if p['quantity'] <= p['reorder_level']]
    for item in low_stock_items:
        alerts.append({
            "type": "low_stock",
            "level": "danger",
            "product_name": item['name'],
            "message": f"Low Stock: {item['name']} is below reorder level. Only {item['quantity']} {item['unit']} left."
        })
        
    # 2. Demand alerts based on sales velocity today
    sales_volume = defaultdict(int)
    for sale in today_sales:
        sales_volume[sale['product_name']] += sale['quantity']
        
    for prod_name, qty_sold in sales_volume.items():
        product = next((p for p in user_inventory if p['name'] == prod_name), None)
        if product:
            is_grocery = product['category'].lower() == 'grocery'
            # trigger if sold more than 3 units (for grocery) or 5 units (general)
            threshold = 3 if is_grocery else 5
            if qty_sold >= threshold:
                alerts.append({
                    "type": "high_demand",
                    "level": "warning",
                    "product_name": prod_name,
                    "message": f"🔥 High Demand: {prod_name} is selling fast today ({qty_sold} {product['unit']} sold). Restock soon!"
                })
                
    return jsonify({
        "success": True,
        "summary": {
            "revenue_today": float(total_revenue_today),
            "items_sold_today": total_items_sold_today,
            "items_added_today": total_items_added_today,
            "total_transactions": len(today_sales)
        },
        "transactions": today_sales[::-1],  # Show latest sales first
        "alerts": alerts
    })

# --- DASHBOARD / STATS API ---
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    mobile = get_user_mobile()
    
    user_inventory = inventories_db.get(mobile, [])
    user_sales = sales_db.get(mobile, [])
    
    total_products = len(user_inventory)
    low_stock_items = sum(1 for p in user_inventory if p['quantity'] <= p['reorder_level'])
    
    # Calculate today's sales
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_sales = sum(s['total'] for s in user_sales if s['timestamp'].startswith(today_str))
    
    # Dynamic Weekly Sales Chart
    weekly_sales = []
    now = datetime.now()
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_str = day_date.strftime("%Y-%m-%d")
        day_name = day_date.strftime("%a")
        
        day_revenue = sum(s['total'] for s in user_sales if s['timestamp'].startswith(day_str))
        
        # If no sales recorded and it is a historical day, provide nice dummy baseline data
        if day_revenue == 0 and day_str != today_str:
            dummy_map = {"Mon": 3200, "Tue": 4100, "Wed": 2900, "Thu": 5000, "Fri": 6200, "Sat": 7500, "Sun": 4500}
            day_revenue = dummy_map.get(day_name, 3000)
            
        weekly_sales.append({"day": day_name, "sales": float(day_revenue)})
        
    # Compute Top Selling items
    product_totals = defaultdict(float)
    for sale in user_sales:
        product_totals[sale['product_name']] += sale['total']
        
    sorted_products = sorted(product_totals.items(), key=lambda x: x[1], reverse=True)
    top_selling = [name for name, total in sorted_products[:3]]
    if not top_selling:
        top_selling = [p['name'] for p in user_inventory[:3]]
        
    low_stock_alerts = [p for p in user_inventory if p['quantity'] <= p['reorder_level']]
    
    return jsonify({
        "success": True,
        "stats": {
            "total_products": total_products,
            "low_stock_items": low_stock_items,
            "today_sales": float(today_sales)
        },
        "weekly_sales": weekly_sales,
        "top_selling": top_selling,
        "festivals": festivals,
        "low_stock_alerts": low_stock_alerts
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)

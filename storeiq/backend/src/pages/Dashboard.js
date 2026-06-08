import { useState, useEffect } from "react";
import { getProducts, getOrders } from "../api";

export default function Dashboard({ shopkeeper, onLogout }) {
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [tab,      setTab]      = useState("home");

  useEffect(() => {
    getProducts().then(r => setProducts(r.data.products)).catch(console.error);
    getOrders().then(r => setOrders(r.data.orders)).catch(console.error);
  }, []);

  const lowStock  = products.filter(p => p.quantity < p.min_stock).length;
  const totalVal  = products.reduce((a, p) => a + p.quantity * p.price, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "sans-serif" }}>
      {/* HEADER */}
      <div style={{ background: "#0f172a", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>🏪 {shopkeeper.shop_name}</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>+91 {shopkeeper.mobile} · {shopkeeper.city}</div>
        </div>
        <button onClick={onLogout} style={{ background: "#ffffff15", color: "#fff", border: "1px solid #ffffff30", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}>
          Sign Out
        </button>
      </div>

      {/* TABS */}
      <div style={{ background: "#fff", display: "flex", borderBottom: "1px solid #e2e8f0" }}>
        {[["home","🏠 Home"], ["inventory","📦 Inventory"], ["orders","📋 Orders"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "12px 24px", border: "none", background: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13, fontFamily: "inherit",
            color: tab === id ? "#f97316" : "#64748b",
            borderBottom: tab === id ? "3px solid #f97316" : "3px solid transparent"
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>

        {/* HOME TAB */}
        {tab === "home" && (
          <div>
            <h2 style={{ marginBottom: 20 }}>Welcome, {shopkeeper.owner_name}! 👋</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { icon: "📦", label: "Total Products", value: products.length,  color: "#3b82f6" },
                { icon: "⚠️", label: "Low Stock",      value: lowStock,          color: "#f97316" },
                { icon: "📋", label: "Total Orders",   value: orders.length,     color: "#8b5cf6" },
                { icon: "💰", label: "Inventory Value",value: `₹${totalVal.toLocaleString()}`, color: "#10b981" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0", borderLeft: `4px solid ${s.color}` }}>
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {lowStock > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 10 }}>🚨 Low Stock Alert</div>
                {products.filter(p => p.quantity < p.min_stock).map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #fee2e2", fontSize: 14 }}>
                    <span>{p.name}</span>
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>{p.quantity} {p.unit} left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVENTORY TAB */}
        {tab === "inventory" && (
          <div>
            <h2 style={{ marginBottom: 20 }}>📦 Inventory ({products.length} products)</h2>
            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 14, color: "#64748b" }}>
                No products yet. Add products via API.
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Product", "Category", "Stock", "Min Stock", "Price", "Status"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{p.category}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: p.quantity < p.min_stock ? "#ef4444" : "#10b981" }}>{p.quantity} {p.unit}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>{p.min_stock}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>₹{p.price}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            background: p.quantity < p.min_stock ? "#fef2f2" : "#f0fdf4",
                            color:      p.quantity < p.min_stock ? "#ef4444" : "#10b981",
                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700
                          }}>
                            {p.quantity < p.min_stock ? "Low Stock" : "OK"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <div>
            <h2 style={{ marginBottom: 20 }}>📋 Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 14, color: "#64748b" }}>
                No orders placed yet.
              </div>
            ) : orders.map(o => (
              <div key={o.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", marginBottom: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, color: "#f97316" }}>{o.order_code}</div>
                  <span style={{ background: "#f0fdf4", color: "#10b981", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{o.status}</span>
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{o.retailer_name} · {o.items.length} items</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>₹{o.total_amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
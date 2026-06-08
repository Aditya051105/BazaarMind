import { useState } from "react";
import { loginUser } from "../api";

export default function Login({ onLogin, onGoRegister }) {
  const [mobile,   setMobile]   = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!mobile || !password) { setError("Please fill all fields"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await loginUser({ mobile, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user",  JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🏪</div>
        <h2 style={styles.title}>StoreIQ</h2>
        <p style={styles.subtitle}>Sign in to your shop</p>

        <div style={styles.field}>
          <label style={styles.label}>Mobile Number</label>
          <input
            style={styles.input}
            placeholder="9876543210"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            maxLength={10}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.btn} onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        <p style={styles.link}>
          New shopkeeper?{" "}
          <span style={styles.linkText} onClick={onGoRegister}>
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card:      { background: "#fff", borderRadius: 20, padding: 36, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px #00000050" },
  logo:      { fontSize: 48, textAlign: "center", marginBottom: 8 },
  title:     { textAlign: "center", fontSize: 26, fontWeight: 800, margin: 0, color: "#0f172a" },
  subtitle:  { textAlign: "center", color: "#64748b", marginBottom: 28, fontSize: 14 },
  field:     { marginBottom: 16 },
  label:     { display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 },
  input:     { width: "100%", padding: "12px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15, boxSizing: "border-box", fontFamily: "inherit" },
  error:     { background: "#fef2f2", color: "#ef4444", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12 },
  btn:       { width: "100%", padding: 14, background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 16 },
  link:      { textAlign: "center", fontSize: 13, color: "#64748b", margin: 0 },
  linkText:  { color: "#f97316", fontWeight: 700, cursor: "pointer" },
};
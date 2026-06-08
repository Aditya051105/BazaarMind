import { useState } from "react";
import { registerUser, sendOtp, verifyOtp } from "../api";

export default function Register({ onRegistered, onGoLogin }) {
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [sentOtp, setSentOtp] = useState("");

  const [form, setForm] = useState({
    owner_name: "", mobile: "", email: "",
    shop_name: "", shop_type: "Grocery",
    address: "", city: "", state: "Maharashtra", pincode: "",
    gstin: "", password: "", confirmPassword: "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // STEP 1 → send OTP
  const handleStep1 = async () => {
    if (!form.owner_name || !form.mobile) { setError("Name and mobile required"); return; }
    if (!/^[6-9]\d{9}$/.test(form.mobile)) { setError("Enter valid 10-digit mobile"); return; }
    setLoading(true); setError("");
    try {
      const res = await sendOtp(form.mobile);
      setSentOtp(res.data.otp); // shown for demo only
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    }
    setLoading(false);
  };

  // STEP 2 → verify OTP
  const handleStep2 = async () => {
    if (!otp) { setError("Enter OTP"); return; }
    setLoading(true); setError("");
    try {
      await verifyOtp(form.mobile, otp);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP");
    }
    setLoading(false);
  };

  // STEP 3 → register
  const handleStep3 = async () => {
    if (!form.shop_name || !form.address || !form.city || !form.pincode) { setError("Fill all shop details"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      const res = await registerUser(form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user",  JSON.stringify(res.data.user));
      onRegistered(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🏪</div>
        <h2 style={styles.title}>Register Shop</h2>
        <p style={styles.subtitle}>Step {step} of 3</p>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <Field label="Owner Name"    value={form.owner_name} onChange={v => set("owner_name", v)} placeholder="Ramesh Kumar" />
            <Field label="Mobile"        value={form.mobile}     onChange={v => set("mobile", v)}     placeholder="9876543210" maxLength={10} />
            <Field label="Email"         value={form.email}      onChange={v => set("email", v)}      placeholder="optional" />
            {error && <div style={styles.error}>{error}</div>}
            <button style={styles.btn} onClick={handleStep1} disabled={loading}>{loading ? "Sending OTP..." : "Send OTP →"}</button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>
              OTP sent to <strong>+91 {form.mobile}</strong>
            </p>
            {sentOtp && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 13, color: "#166534" }}>
                Demo OTP: <strong>{sentOtp}</strong>
              </div>
            )}
            <Field label="Enter OTP" value={otp} onChange={setOtp} placeholder="4-digit OTP" maxLength={4} />
            {error && <div style={styles.error}>{error}</div>}
            <button style={styles.btn} onClick={handleStep2} disabled={loading}>{loading ? "Verifying..." : "Verify OTP →"}</button>
            <p style={styles.link}><span style={styles.linkText} onClick={() => setStep(1)}>← Change mobile</span></p>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <Field label="Shop Name"    value={form.shop_name} onChange={v => set("shop_name", v)} placeholder="Ramesh General Store" />
            <Field label="Address"      value={form.address}   onChange={v => set("address", v)}   placeholder="Shop No, Street" />
            <Field label="City"         value={form.city}      onChange={v => set("city", v)}       placeholder="Nagpur" />
            <Field label="Pincode"      value={form.pincode}   onChange={v => set("pincode", v)}    placeholder="440001" maxLength={6} />
            <Field label="Password"     value={form.password}  onChange={v => set("password", v)}   placeholder="Min 6 chars" type="password" />
            <Field label="Confirm Password" value={form.confirmPassword} onChange={v => set("confirmPassword", v)} placeholder="Repeat password" type="password" />
            {error && <div style={styles.error}>{error}</div>}
            <button style={styles.btn} onClick={handleStep3} disabled={loading}>{loading ? "Registering..." : "🎉 Register Now"}</button>
          </>
        )}

        <p style={styles.link}>
          Already registered?{" "}
          <span style={styles.linkText} onClick={onGoLogin}>Sign In</span>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", maxLength }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>{label}</label>
      <input
        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" }}
        type={type} value={value} placeholder={placeholder} maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card:      { background: "#fff", borderRadius: 20, padding: 36, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px #00000050" },
  logo:      { fontSize: 48, textAlign: "center", marginBottom: 8 },
  title:     { textAlign: "center", fontSize: 24, fontWeight: 800, margin: 0, color: "#0f172a" },
  subtitle:  { textAlign: "center", color: "#64748b", marginBottom: 24, fontSize: 14 },
  error:     { background: "#fef2f2", color: "#ef4444", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12 },
  btn:       { width: "100%", padding: 14, background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12, fontFamily: "inherit" },
  link:      { textAlign: "center", fontSize: 13, color: "#64748b", margin: 0 },
  linkText:  { color: "#f97316", fontWeight: 700, cursor: "pointer" },
};
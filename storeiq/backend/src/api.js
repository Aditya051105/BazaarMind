import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── AUTH ──────────────────────────────────────────
export const registerUser  = (data) => API.post("/auth/register", data);
export const loginUser     = (data) => API.post("/auth/login", data);
export const getProfile    = ()     => API.get("/auth/profile");
export const sendOtp       = (mobile) => API.post("/auth/send-otp", { mobile });
export const verifyOtp     = (mobile, otp) => API.post("/auth/verify-otp", { mobile, otp });

// ── INVENTORY ─────────────────────────────────────
export const getProducts    = ()           => API.get("/inventory/");
export const addProduct     = (data)       => API.post("/inventory/", data);
export const updateProduct  = (id, data)   => API.put(`/inventory/${id}`, data);
export const updateQuantity = (id, delta)  => API.patch(`/inventory/${id}/quantity`, { delta });
export const deleteProduct  = (id)         => API.delete(`/inventory/${id}`);

// ── ORDERS ────────────────────────────────────────
export const placeOrder  = (data) => API.post("/orders/", data);
export const getOrders   = ()     => API.get("/orders/");
export const getOrder    = (id)   => API.get(`/orders/${id}`);
export const updateOrder = (id, status) => API.patch(`/orders/${id}/status`, { status });
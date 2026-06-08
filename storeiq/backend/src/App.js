import { useState, useEffect } from "react";
import Login    from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [screen, setScreen]       = useState("login");
  const [shopkeeper, setShopkeeper] = useState(null);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");
    if (token && user) {
      setShopkeeper(JSON.parse(user));
      setScreen("dashboard");
    }
  }, []);

  const handleLogin = (user) => {
    setShopkeeper(user);
    setScreen("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShopkeeper(null);
    setScreen("login");
  };

  return (
    <div>
      {screen === "login"     && <Login     onLogin={handleLogin} onGoRegister={() => setScreen("register")} />}
      {screen === "register"  && <Register  onRegistered={handleLogin} onGoLogin={() => setScreen("login")} />}
      {screen === "dashboard" && <Dashboard shopkeeper={shopkeeper} onLogout={handleLogout} />}
    </div>
  );
}
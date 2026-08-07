import React, { useState } from "react";
import { useAuction } from "../context/AuctionContext";
import "../styles/AdminLogin.css";

function AdminLogin({ onLogin }) {
  const { setIsAdmin } = useAuction();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_USERNAME = "mari274";
  const ADMIN_PASSWORD = "ipl2026";

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        setIsAdmin(true);
        onLogin("admin");
      } else {
        setError("Invalid admin credentials!");
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <span className="login-icon">👨‍💼</span>
          </div>
          <h1>Admin Login</h1>
          <p>IPL Auction 2026 - Auctioneer Only</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="login-field">
            <label>Username</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="login-field">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "⏳ Logging in..." : "🔓 Login as Admin"}
          </button>
        </form>

        <div className="login-footer">
          <p>🏏 IPL Auction 2026</p>
          <small>Captains: Use YOUR link from registration!</small>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
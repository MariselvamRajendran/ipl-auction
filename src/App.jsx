import React, { useState, useEffect } from "react";
import { useAuction } from "./context/AuctionContext";
import { getAllPlayers } from "./firebase";
import PlayerRegistration from "./components/PlayerRegistration";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminPanel from "./components/AdminPanel";
import "./App.css";

function AppContent() {
  const {
    auctionReady,
    loadPlayersForAuction,
    isAdmin,
    loggedInCaptain,
    logout,
    setLoggedInCaptain,
    setIsAdmin,
    syncFromServer,
  } = useAuction();

  const [page, setPage] = useState(getInitialPage());
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [captainPassword, setCaptainPassword] = useState("");
  const [captainError, setCaptainError] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainLoading, setCaptainLoading] = useState(false);

  function getInitialPage() {
    const path = window.location.pathname;
    if (path === "/register") return "register";
    if (path === "/admin") return "admin";
    if (path === "/captain") return "captain";
    if (path === "/watch") return "watch";
    return "home";
  }

  useEffect(() => {
    if (page === "captain") {
      const params = new URLSearchParams(window.location.search);
      const name = params.get("name");
      if (name) setCaptainName(decodeURIComponent(name));
    }
  }, [page]);

  useEffect(() => {
    if (isAdmin || loggedInCaptain) setUserLoggedIn(true);
  }, [isAdmin, loggedInCaptain]);

  useEffect(() => {
    if (page === "watch") {
      syncFromServer();
      const interval = setInterval(syncFromServer, 1000);
      return () => clearInterval(interval);
    }
  }, [page, syncFromServer]);

  const handleLogout = () => {
    logout();
    setUserLoggedIn(false);
    window.history.pushState({}, "", "/");
    setPage("home");
  };

  const handleCaptainLogin = async (e) => {
    e.preventDefault();
    setCaptainError("");

    if (!captainName.trim()) {
      setCaptainError("Please enter your name");
      return;
    }
    if (captainPassword !== "captain2026") {
      setCaptainError("Wrong password!");
      return;
    }

    setCaptainLoading(true);

    try {
      const players = await getAllPlayers();
      const captain = players.find(
        (p) => p.isCaptain && p.name.toLowerCase().trim() === captainName.toLowerCase().trim()
      );

      if (!captain) {
        setCaptainError("Captain not found! Please register first as captain.");
        setCaptainLoading(false);
        return;
      }

      setLoggedInCaptain(captain);
      setIsAdmin(false);
      setUserLoggedIn(true);
    } catch (err) {
      setCaptainError("Error loading data. Try again.");
    }

    setCaptainLoading(false);
  };

  // ==================== HOME PAGE ====================
  if (page === "home") {
    return (
      <div className="home-page">
        <div className="home-container">
          <h1>🏏 IPL AUCTION 2026</h1>
          <p>Area Cricket League - Auction System</p>

          <div className="home-cards">
            {/* Player Registration */}
            <div className="home-card" onClick={() => {
              window.history.pushState({}, "", "/register");
              setPage("register");
            }}>
              <span className="home-card-icon">📝</span>
              <h2>Player Registration</h2>
              <p>Register for the auction</p>
              <button className="home-card-btn register-btn">Register Now</button>
            </div>

            {/* Admin Login */}
            <div className="home-card" onClick={() => {
              window.history.pushState({}, "", "/admin");
              setPage("admin");
            }}>
              <span className="home-card-icon">👨‍💼</span>
              <h2>Admin Login</h2>
              <p>Auctioneer only</p>
              <button className="home-card-btn admin-btn-home">Admin Login</button>
            </div>

            {/* Captain Login - NEW */}
            <div className="home-card" onClick={() => {
              window.history.pushState({}, "", "/captain");
              setPage("captain");
            }}>
              <span className="home-card-icon">👑</span>
              <h2>Captain Login</h2>
              <p>Team captains only</p>
              <button className="home-card-btn" style={{
                background: "linear-gradient(135deg, #f1c40f, #e67e22)",
                color: "#000"
              }}>
                Captain Login
              </button>
            </div>

            {/* Watch Auction */}
            <div className="home-card" onClick={() => {
              window.history.pushState({}, "", "/watch");
              setPage("watch");
            }}>
              <span className="home-card-icon">👀</span>
              <h2>Watch Auction</h2>
              <p>Live auction viewer</p>
              <button className="home-card-btn" style={{
                background: "linear-gradient(135deg, #3498db, #2980b9)"
              }}>
                Watch Live
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== REGISTER ====================
  if (page === "register") {
    return (
      <div>
        <div className="top-nav">
          <button onClick={() => { window.history.pushState({}, "", "/"); setPage("home"); }}>
            ← Home
          </button>
        </div>
        <PlayerRegistration />
      </div>
    );
  }

  // ==================== CAPTAIN ====================
  if (page === "captain") {
    if (!userLoggedIn) {
      return (
        <div>
          <div className="top-nav">
            <button onClick={() => { window.history.pushState({}, "", "/"); setPage("home"); }}>
              ← Home
            </button>
          </div>
          <div className="login-page">
            <div className="login-card">
              <div className="login-header">
                <div className="login-icon-wrapper">
                  <span className="login-icon">👑</span>
                </div>
                <h1>Captain Login</h1>
                <p>{captainName ? `Welcome ${captainName}` : "IPL Auction 2026"}</p>
              </div>

              <form onSubmit={handleCaptainLogin} className="login-form">
                {captainError && (
                  <div className="login-error"><span>⚠️</span> {captainError}</div>
                )}

                <div className="login-field">
                  <label>Your Registered Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      value={captainName}
                      onChange={(e) => setCaptainName(e.target.value)}
                      placeholder="Enter your registered name"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type="password"
                      value={captainPassword}
                      onChange={(e) => setCaptainPassword(e.target.value)}
                      placeholder="Enter password"
                    />
                  </div>
                </div>

                <button type="submit" className="login-btn" disabled={captainLoading}>
                  {captainLoading ? "⏳ Checking..." : "👑 Login as Captain"}
                </button>
              </form>

              <div className="login-footer">
                <p>🏏 IPL Auction 2026</p>
                <small style={{ color: "#f1c40f" }}>Password: captain2026</small>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!auctionReady) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", background: "#0a0a1a", color: "white",
          padding: "20px", textAlign: "center"
        }}>
          <div>
            <h1 style={{ fontSize: "64px", marginBottom: "20px" }}>⏳</h1>
            <h2 style={{ color: "#f1c40f" }}>Waiting for Admin</h2>
            <p style={{ color: "#888", marginTop: "10px" }}>
              Admin has not started the auction yet.<br />
              This page will auto-update...
            </p>
            <button onClick={handleLogout} style={{
              marginTop: "20px", padding: "10px 25px", background: "#e74c3c",
              color: "white", border: "none", borderRadius: "8px",
              cursor: "pointer", fontSize: "14px"
            }}>
              🚪 Logout
            </button>
          </div>
        </div>
      );
    }

    return <AdminPanel onLogout={handleLogout} />;
  }

  // ==================== WATCH ====================
  if (page === "watch") {
    if (!auctionReady) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", background: "#0a0a1a", color: "white",
          padding: "20px", textAlign: "center"
        }}>
          <div>
            <h1 style={{ fontSize: "64px", marginBottom: "20px" }}>⏳</h1>
            <h2 style={{ color: "#f1c40f" }}>Auction Not Started</h2>
            <p style={{ color: "#888", marginBottom: "20px" }}>
              Please wait for admin to start.
            </p>
            <button onClick={() => { window.history.pushState({}, "", "/"); setPage("home"); }} style={{
              padding: "12px 30px", background: "#3498db", color: "white",
              border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "15px"
            }}>
              ← Back to Home
            </button>
          </div>
        </div>
      );
    }
    return <AdminPanel isWatchMode={true} onLogout={() => { window.history.pushState({}, "", "/"); setPage("home"); }} />;
  }

  // ==================== ADMIN ====================
  if (page === "admin") {
    if (!userLoggedIn) {
      return (
        <div>
          <div className="top-nav">
            <button onClick={() => { window.history.pushState({}, "", "/"); setPage("home"); }}>
              ← Home
            </button>
          </div>
          <AdminLogin onLogin={() => setUserLoggedIn(true)} />
        </div>
      );
    }

    if (isAdmin) {
      if (auctionReady) {
        return <AdminPanel onLogout={handleLogout} />;
      }
      return (
        <AdminDashboard
          onStartAuction={async () => { await loadPlayersForAuction(); }}
          onLogout={handleLogout}
        />
      );
    }
  }

  return null;
}

function App() {
  return <AppContent />;
}

export default App;
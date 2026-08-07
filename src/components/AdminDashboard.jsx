import React, { useState, useEffect } from "react";
import {
  getAllPlayers,
  deletePlayer,
  deleteAllPlayers,
  exportPlayersJSON,
  importPlayersJSON,
} from "../firebase";
import "../styles/AdminDashboard.css";

function AdminDashboard({ onStartAuction, onLogout }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0, batsman: 0, bowler: 0, allRounder: 0, keeper: 0, captains: 0,
  });

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const list = await getAllPlayers();
      list.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
      setPlayers(list);

      setStats({
        total: list.length,
        batsman: list.filter((p) => p.role === "Batsman").length,
        bowler: list.filter((p) => p.role === "Bowler").length,
        allRounder: list.filter((p) => p.role === "All Rounder").length,
        keeper: list.filter((p) => p.role === "Wicket Keeper").length,
        captains: list.filter((p) => p.isCaptain === true).length,
      });
    } catch (err) {
      console.error("Error loading players:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleDelete = async (playerId, playerName) => {
    if (window.confirm(`Delete ${playerName}?`)) {
      await deletePlayer(playerId);
      loadPlayers();
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm(`Delete ALL ${players.length} players? This cannot be undone!`)) {
      await deleteAllPlayers();
      loadPlayers();
    }
  };

  const handleExport = async () => {
    if (players.length === 0) {
      alert("No players to export!");
      return;
    }
    await exportPlayersJSON();
    alert("File downloaded! Save it as backup.");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = await importPlayersJSON(event.target.result);
      if (result.success) {
        alert(`✅ Imported ${result.count} players!`);
        loadPlayers();
      } else {
        alert("❌ " + result.error);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filteredPlayers = players.filter((p) => {
    const matchFilter = filter === "all" || p.role === filter;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getRoleEmoji = (role) => {
    switch (role) {
      case "Batsman": return "🏏";
      case "Bowler": return "🎯";
      case "All Rounder": return "⭐";
      case "Wicket Keeper": return "🧤";
      default: return "🏏";
    }
  };

  const nonCaptainCount = players.filter(p => !p.isCaptain).length;

  return (
    <div className="dashboard-page">
      <div className="dash-header">
        <div>
          <h1>👨‍💼 Admin Dashboard</h1>
          <p>IPL Auction 2026 - Total {players.length} Registered</p>
        </div>
        <div className="dash-header-btns">
          <button className="dash-btn refresh" onClick={loadPlayers}>
            🔄 Refresh
          </button>
          <button
            className="dash-btn auction"
            onClick={onStartAuction}
            disabled={nonCaptainCount === 0}
            style={{ opacity: nonCaptainCount === 0 ? 0.5 : 1 }}
          >
            🏏 Start Auction ({nonCaptainCount} Players)
          </button>
          <button className="dash-btn logout" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div style={{
        background: "#1e1e2f", margin: "20px 30px", padding: "15px 20px",
        borderRadius: "12px", display: "flex", gap: "10px", flexWrap: "wrap",
        alignItems: "center", border: "1px solid #333"
      }}>
        <strong style={{ color: "#f39c12" }}>💾 Backup / Restore:</strong>
        <button onClick={handleExport} style={{
          background: "#3498db", color: "white", border: "none",
          padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontSize: "13px"
        }}>
          📥 Export All (JSON)
        </button>
        <label style={{
          background: "#2ecc71", color: "white",
          padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontSize: "13px"
        }}>
          📤 Import Players (JSON)
          <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
        </label>
        {players.length > 0 && (
          <button onClick={handleDeleteAll} style={{
            background: "#e74c3c", color: "white", border: "none",
            padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
            marginLeft: "auto"
          }}>
            🗑️ Delete All
          </button>
        )}
      </div>

      <div className="stats-row">
        <div className="stat-card total">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">Total Players</span>
        </div>
        <div className="stat-card" style={{ borderColor: "#f1c40f" }}>
          <span className="stat-num" style={{ color: "#f1c40f" }}>{stats.captains}</span>
          <span className="stat-label">👑 Captains</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.batsman}</span>
          <span className="stat-label">🏏 Batsmen</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.bowler}</span>
          <span className="stat-label">🎯 Bowlers</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.allRounder}</span>
          <span className="stat-label">⭐ All Rounders</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.keeper}</span>
          <span className="stat-label">🧤 Keepers</span>
        </div>
      </div>

      <div className="dash-controls">
        <input
          type="text"
          placeholder="🔍 Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="dash-search"
        />
        <div className="dash-filters">
          {["all", "Batsman", "Bowler", "All Rounder", "Wicket Keeper"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="dash-loading">⏳ Loading players from cloud...</div>
      ) : filteredPlayers.length === 0 ? (
        <div className="dash-empty">
          <h2>No players registered yet</h2>
          <p>Share the registration link with players</p>
          <p style={{ marginTop: "15px", color: "#f39c12" }}>
            💡 Or import a JSON backup file above
          </p>
        </div>
      ) : (
        <div className="dash-table-container">
          <table className="dash-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Captain</th>
                <th>Team</th>
                <th>Role</th>
                <th>Batting</th>
                <th>Bowling</th>
                <th>Base Price</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td className="player-name-cell">
                    <div className="player-name-with-photo">
                      {player.photo ? (
                        <img src={player.photo} alt={player.name} className="table-player-photo" />
                      ) : (
                        <div className="table-player-placeholder">
                          {player.name.charAt(0)}
                        </div>
                      )}
                      <strong>{player.name}</strong>
                    </div>
                  </td>
                  <td>
                    {player.isCaptain ? (
                      <span style={{
                        background: "linear-gradient(135deg, #f1c40f, #e67e22)",
                        color: "#000", padding: "4px 10px", borderRadius: "10px",
                        fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap"
                      }}>
                        👑 Captain
                      </span>
                    ) : (
                      <span style={{ color: "#555" }}>-</span>
                    )}
                  </td>
                  <td>
                    {player.captainTeam ? (
                      <span style={{
                        background: "rgba(52, 152, 219, 0.2)",
                        color: "#3498db", padding: "4px 10px", borderRadius: "10px",
                        fontSize: "12px", fontWeight: "bold"
                      }}>
                        {player.captainTeam}
                      </span>
                    ) : (
                      <span style={{ color: "#555" }}>-</span>
                    )}
                  </td>
                  <td>
                    <span className="role-tag">
                      {getRoleEmoji(player.role)} {player.role}
                    </span>
                  </td>
                  <td className="small-text">{player.battingStyle}</td>
                  <td className="small-text">{player.bowlingStyle}</td>
                  <td className="price-cell">₹{player.basePrice} Cr</td>
                  <td className="small-text">
                    {new Date(player.registeredAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDelete(player.id, player.name)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="link-info">
        <h3>📎 Registration Link</h3>
        <div className="link-box">
          <code>{window.location.origin}/register</code>
          <button
            className="copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin + "/register");
              alert("Link copied!");
            }}
          >
            📋 Copy
          </button>
        </div>
        <p style={{ color: "#888", fontSize: "13px", marginTop: "10px" }}>
          ✅ Cloud storage - Works across all devices!
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
import React from "react";
import { useAuction } from "../context/AuctionContext";
import "../styles/RoleSelection.css";

function RoleSelection() {
  const { setRole, teams } = useAuction();

  return (
    <div className="role-page">
      <div className="role-header">
        <h1>🏏 IPL AUCTION 2026</h1>
        <p>College Mini Project - React JS</p>
      </div>

      <div className="role-container">
        {/* Admin Card */}
        <div className="role-card admin-card" onClick={() => setRole("admin")}>
          <div className="role-icon">👨‍💼</div>
          <h2>AUCTIONEER</h2>
          <p>Control the auction</p>
          <ul>
            <li>Set players for auction</li>
            <li>Start bidding timer</li>
            <li>Mark SOLD / UNSOLD</li>
            <li>View all team budgets</li>
            <li>See final results</li>
          </ul>
          <button className="role-btn admin-btn">Enter as Admin</button>
        </div>

        {/* Team Cards */}
        <div className="teams-grid">
          <h2 className="teams-grid-title">SELECT YOUR TEAM</h2>
          <div className="teams-role-grid">
            {teams.map((team) => (
              <div
                key={team.id}
                className="team-role-card"
                style={{ borderColor: team.color }}
                onClick={() => setRole(team.id)}
              >
                <img
                  src={team.logo}
                  alt={team.short}
                  className="team-role-logo"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <h3 style={{ color: team.color }}>{team.short}</h3>
                <p>{team.name}</p>
                <button
                  className="role-btn team-btn"
                  style={{ background: team.color }}
                >
                  Join as {team.short}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;
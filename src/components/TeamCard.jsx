import React, { useState } from "react";
import "../styles/TeamCard.css";

function TeamCard({ team, isSelected, onSelect }) {
  const [showSquad, setShowSquad] = useState(false);

  return (
    <div
      className={`team-card ${isSelected ? "selected" : ""}`}
      style={{ borderColor: isSelected ? team.color : "#333" }}
    >
      <div className="team-card-header" style={{ background: team.color + "22" }}>
        <img
          src={team.logo}
          alt={team.short}
          className="team-logo"
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <h3 style={{ color: team.color }}>{team.short}</h3>
      </div>

      <div className="team-card-body">
        <p className="team-budget">
          💰 Budget: <strong>₹{team.budget.toFixed(1)} Cr</strong>
        </p>
        <p className="team-player-count">
          👥 Players: <strong>{team.players.length}</strong>
        </p>

        <div className="team-card-buttons">
          <button
            className="select-btn"
            style={{ background: team.color }}
            onClick={() => onSelect(team)}
          >
            {isSelected ? "✅ Selected" : "Select Team"}
          </button>

          {team.players.length > 0 && (
            <button
              className="squad-toggle-btn"
              onClick={() => setShowSquad(!showSquad)}
            >
              {showSquad ? "Hide Squad" : "View Squad"}
            </button>
          )}
        </div>

        {showSquad && team.players.length > 0 && (
          <div className="squad-list">
            {team.players.map((p, i) => (
              <div key={i} className="squad-item">
                <span>{p.name}</span>
                <span className="squad-price">₹{p.soldPrice || p.price} Cr</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamCard;
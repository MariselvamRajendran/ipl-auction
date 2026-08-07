import React from "react";
import "../styles/PlayerCard.css";

function PlayerCard({ player, currentBid, selectedTeam, timer }) {
  if (!player) {
    return (
      <div className="player-card">
        <h2>Auction Completed ✅</h2>
      </div>
    );
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case "Batsman": return "🏏";
      case "Bowler": return "🎯";
      case "All Rounder": return "⭐";
      case "Wicket Keeper": return "🧤";
      default: return "🏏";
    }
  };

  return (
    <div className="player-card">
      <div className="player-card-inner">
        <div className="player-image-section">
          {player.image ? (
            <img src={player.image} alt={player.name} className="player-image" />
          ) : (
            <div className="player-placeholder">{player.name.charAt(0)}</div>
          )}
        </div>

        <div className="player-info-section">
          <div className="player-number">#{player.id}</div>
          <h2 className="player-name">{player.name}</h2>
          <span className="role-badge">
            {getRoleBadge(player.role)} {player.role}
          </span>

          <div className="price-section">
            <div className="price-box">
              <span className="price-label">Base Price</span>
              <span className="price-value">₹ {player.price} Cr</span>
            </div>
            <div className="price-box current">
              <span className="price-label">Current Bid</span>
              <span className="price-value bid">₹ {currentBid} Cr</span>
            </div>
          </div>

          <div className="selected-team-display">
            {selectedTeam ? (
              <span className="team-selected">
                🎯 Bidding: <strong>{selectedTeam.short}</strong>
              </span>
            ) : (
              <span className="no-team">⬇️ Select a team below</span>
            )}
          </div>

          <div className="timer-display">
            <div className={`timer-circle ${timer <= 10 ? "timer-danger" : ""}`}>
              <span className="timer-number">{timer}</span>
              <span className="timer-text">SEC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerCard;
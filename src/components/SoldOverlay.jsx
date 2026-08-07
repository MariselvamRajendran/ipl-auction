import React, { useEffect } from "react";
import "../styles/SoldOverlay.css";

function SoldOverlay({ player, team, bid, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="sold-overlay">
      <div className="sold-card">
        <div className="sold-hammer">🔨</div>
        <h1 className="sold-text">SOLD!</h1>
        <h2 className="sold-player">{player.name}</h2>
        <div className="sold-to">
          <img
            src={team.logo}
            alt={team.short}
            className="sold-team-logo"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <span style={{ color: team.color, fontSize: "32px", fontWeight: "bold" }}>
            {team.name}
          </span>
        </div>
        <h3 className="sold-price">₹ {bid} Crore</h3>
        <div className="sold-confetti">🎉🎊🎉🎊🎉</div>
      </div>
    </div>
  );
}

export default SoldOverlay;
import React from "react";
import "../styles/AuctionResult.css";

function AuctionResult({ teams, unsoldPlayers, onBack }) {
  const sortedTeams = [...teams].sort((a, b) => b.players.length - a.players.length);
  const winner = sortedTeams[0];

  const totalSpent = (team) => {
    return team.players.reduce((sum, p) => sum + (p.soldPrice || p.basePrice), 0).toFixed(1);
  };

  return (
    <div className="result-container">
      <button className="back-btn" onClick={onBack}>← Back to Auction</button>

      <h1 className="result-title">📊 IPL Auction 2026 - Final Results</h1>

      {/* Winner */}
      {winner && winner.players.length > 0 && (
        <div className="winner-section" style={{ borderColor: winner.color }}>
          <h2>🏆 Best Squad</h2>
          <div className="winner-info">
            <img
              src={winner.logo}
              alt={winner.short}
              className="winner-logo"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div>
              <h3 style={{ color: winner.color }}>{winner.name}</h3>
              <p>{winner.players.length} Players | Spent: ₹{totalSpent(winner)} Cr | Remaining: ₹{winner.budget.toFixed(1)} Cr</p>
            </div>
          </div>
        </div>
      )}

      {/* All Teams */}
      <div className="result-grid">
        {sortedTeams.map((team) => (
          <div key={team.id} className="result-team-card" style={{ borderTopColor: team.color }}>
            <div className="result-team-header">
              <img
                src={team.logo}
                alt={team.short}
                className="result-team-logo"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div>
                <h3 style={{ color: team.color }}>{team.short}</h3>
                <p>Remaining: ₹{team.budget.toFixed(1)} Cr | Spent: ₹{totalSpent(team)} Cr</p>
              </div>
            </div>
            <div className="result-squad">
              {team.players.length === 0 ? (
                <p className="no-players">No players bought</p>
              ) : (
                team.players.map((p, i) => (
                  <div key={i} className="result-player-row">
                    <span>{i + 1}. {p.name}</span>
                    <span className="result-player-role">{p.role}</span>
                    <span className="result-player-price">₹{p.soldPrice} Cr</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Unsold */}
      {unsoldPlayers.length > 0 && (
        <div className="unsold-section">
          <h2>❌ Unsold Players ({unsoldPlayers.length})</h2>
          <div className="unsold-grid">
            {unsoldPlayers.map((p, i) => (
              <div key={i} className="unsold-card">
                <span>{p.name}</span>
                <span>{p.role}</span>
                <span>₹{p.basePrice} Cr</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuctionResult;
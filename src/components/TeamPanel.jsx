import React, { useState } from "react";
import { useAuction } from "../context/AuctionContext";
import SoldOverlay from "./SoldOverlay";
import "../styles/TeamPanel.css";

function TeamPanel() {
  const {
    role,
    setRole,
    teams,
    currentPlayer,
    currentPlayerIndex,
    currentBid,
    highestBidder,
    timer,
    isTimerRunning,
    auctionComplete,
    auctionStarted,
    showSold,
    soldInfo,
    closeSoldOverlay,
    totalPlayers,
    placeBid,
  } = useAuction();

  const [error, setError] = useState("");

  const myTeam = teams.find((t) => t.id === role);

  if (!myTeam) return null;

  const isMyBid = highestBidder && highestBidder.id === myTeam.id;

  const handleBid = () => {
    setError("");
    const result = placeBid(myTeam.id);
    if (result && result.error) {
      setError(result.error);
      setTimeout(() => setError(""), 3000);
    }
  };

  const getRoleEmoji = (r) => {
    switch (r) {
      case "Batsman": return "🏏";
      case "Bowler": return "🎯";
      case "All Rounder": return "⭐";
      case "Wicket Keeper": return "🧤";
      default: return "🏏";
    }
  };

  return (
    <div className="team-page">
      {/* Team Header */}
      <div className="team-header" style={{ borderBottomColor: myTeam.color }}>
        <div className="team-header-left">
          <img
            src={myTeam.logo}
            alt={myTeam.short}
            className="team-header-logo"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div>
            <h1 style={{ color: myTeam.color }}>{myTeam.name}</h1>
            <p>💰 Budget: ₹{myTeam.budget.toFixed(1)} Cr | 👥 Players: {myTeam.players.length}</p>
          </div>
        </div>
        <button className="team-exit-btn" onClick={() => setRole(null)}>
          🚪 Exit
        </button>
      </div>

      {/* Progress */}
      <div className="team-progress">
        Player {Math.min(currentPlayerIndex + 1, totalPlayers)} / {totalPlayers}
      </div>

      <div className="team-main">
        {/* Current Auction */}
        <div className="team-auction-section">
          {auctionComplete ? (
            <div className="team-auction-card">
              <h2>🏆 Auction Completed!</h2>
              <p>Check with the Auctioneer for final results.</p>
            </div>
          ) : !currentPlayer ? (
            <div className="team-auction-card">
              <h2>Waiting...</h2>
            </div>
          ) : !auctionStarted ? (
            <div className="team-auction-card">
              <div className="team-player-display">
                {currentPlayer.image ? (
                  <img src={currentPlayer.image} alt={currentPlayer.name} className="team-player-img" />
                ) : (
                  <div className="team-player-placeholder">{currentPlayer.name.charAt(0)}</div>
                )}
                <div>
                  <h2>{currentPlayer.name}</h2>
                  <span className="team-role-badge">{getRoleEmoji(currentPlayer.role)} {currentPlayer.role}</span>
                  <p className="team-base-price">Base Price: ₹{currentPlayer.basePrice} Cr</p>
                </div>
              </div>
              <div className="waiting-message">
                ⏳ Waiting for Auctioneer to start bidding...
              </div>
            </div>
          ) : (
            <div className="team-auction-card live">
              <div className="live-badge">🔴 LIVE AUCTION</div>

              <div className="team-player-display">
                {currentPlayer.image ? (
                  <img src={currentPlayer.image} alt={currentPlayer.name} className="team-player-img" />
                ) : (
                  <div className="team-player-placeholder">{currentPlayer.name.charAt(0)}</div>
                )}
                <div>
                  <h2>{currentPlayer.name}</h2>
                  <span className="team-role-badge">{getRoleEmoji(currentPlayer.role)} {currentPlayer.role}</span>
                </div>
              </div>

              <div className="team-bid-info">
                <div className="team-bid-box">
                  <span className="bid-label">Current Bid</span>
                  <span className="bid-value">₹ {currentBid} Cr</span>
                </div>

                <div className={`team-timer ${timer <= 10 ? "danger" : ""}`}>
                  <span className="t-num">{timer}</span>
                  <span className="t-sec">SEC</span>
                </div>

                <div className="team-bid-box">
                  <span className="bid-label">Highest Bidder</span>
                  <span className="bid-value" style={{ color: highestBidder ? highestBidder.color : "#666" }}>
                    {highestBidder ? highestBidder.short : "None"}
                  </span>
                </div>
              </div>

              {/* My Bid Status */}
              {isMyBid && (
                <div className="my-bid-status winning">
                  ✅ You are the HIGHEST BIDDER at ₹{currentBid} Cr
                </div>
              )}

              {highestBidder && !isMyBid && (
                <div className="my-bid-status losing">
                  ⚠️ {highestBidder.short} is leading. Your next bid: ₹{(currentBid + 0.5).toFixed(1)} Cr
                </div>
              )}

              {/* Error */}
              {error && <div className="bid-error">{error}</div>}

              {/* Bid Button */}
              <button
                className={`team-bid-btn ${isMyBid ? "already-bidding" : ""}`}
                onClick={handleBid}
                disabled={isMyBid}
                style={{ background: isMyBid ? "#555" : myTeam.color }}
              >
                {isMyBid
                  ? "✅ You are leading"
                  : highestBidder
                    ? `🏏 BID ₹${(currentBid + 0.5).toFixed(1)} Cr`
                    : `🏏 BID ₹${currentBid} Cr (Base Price)`
                }
              </button>

              <p className="bid-note">
                Your Budget: ₹{myTeam.budget.toFixed(1)} Cr
              </p>
            </div>
          )}
        </div>

        {/* My Squad */}
        <div className="team-squad-section">
          <h3>📋 My Squad ({myTeam.players.length} players)</h3>
          {myTeam.players.length === 0 ? (
            <p className="no-squad">No players bought yet</p>
          ) : (
            <div className="squad-cards">
              {myTeam.players.map((p, i) => (
                <div key={i} className="squad-card">
                  <div className="squad-card-left">
                    <span className="squad-num">{i + 1}</span>
                    <div>
                      <h4>{p.name}</h4>
                      <span className="squad-role">{p.role}</span>
                    </div>
                  </div>
                  <span className="squad-cost">₹{p.soldPrice} Cr</span>
                </div>
              ))}
            </div>
          )}

          <div className="budget-summary">
            <div className="budget-item">
              <span>Total Budget</span>
              <span>₹100 Cr</span>
            </div>
            <div className="budget-item">
              <span>Spent</span>
              <span>₹{(100 - myTeam.budget).toFixed(1)} Cr</span>
            </div>
            <div className="budget-item remaining">
              <span>Remaining</span>
              <span>₹{myTeam.budget.toFixed(1)} Cr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sold Overlay */}
      {showSold && soldInfo && (
        <SoldOverlay
          player={soldInfo.player}
          team={soldInfo.team}
          bid={soldInfo.bid}
          onClose={closeSoldOverlay}
        />
      )}
    </div>
  );
}

export default TeamPanel;
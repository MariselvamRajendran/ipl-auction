import React, { useState, useEffect } from "react";
import { useAuction } from "../context/AuctionContext";
import SoldOverlay from "./SoldOverlay";
import AuctionResult from "./AuctionResult";
import "../styles/AdminPanel.css";

function AdminPanel({ onLogout, isWatchMode = false }) {
  const {
    loggedInCaptain,
    isAdmin,
    teams,
    currentPlayer,
    currentPlayerIndex,
    currentBid,
    highestBidder,
    timer,
    unsoldPlayers,
    auctionComplete,
    showSold,
    soldInfo,
    bidHistory,
    auctionStarted,
    totalPlayers,
    showResults,
    timerEnded,
    LIMITS,
    checkTeamLimit,
    startPlayerAuction,
    handleSold,
    handleUnsold,
    closeSoldOverlay,
    resetAuction,
    captainBid,
    closeResults,
    getRemainingByCategory,
  } = useAuction();

  const [manualResultView, setManualResultView] = useState(false);

  useEffect(() => {
    if (auctionComplete && showResults) {
      setManualResultView(true);
    }
  }, [auctionComplete, showResults]);

  if (manualResultView || showResults) {
    return (
      <div className="admin-page">
        <AuctionResult
          teams={teams}
          unsoldPlayers={unsoldPlayers}
          onBack={() => {
            setManualResultView(false);
            closeResults();
          }}
        />
      </div>
    );
  }

  const getRoleEmoji = (role) => {
    switch (role) {
      case "Batsman": return "🏏";
      case "Bowler": return "🎯";
      case "All Rounder": return "⭐";
      case "Wicket Keeper": return "🧤";
      default: return "🏏";
    }
  };

  const nextBidAmount = highestBidder
    ? Number((currentBid + 0.5).toFixed(1))
    : currentBid;

  const myTeam = loggedInCaptain
    ? teams.find((t) => t.short === loggedInCaptain.captainTeam)
    : null;

  const isMyTeamHighest = myTeam && highestBidder && highestBidder.id === myTeam.id;

  const liveBudget = myTeam && isMyTeamHighest
    ? Number((myTeam.budget - currentBid).toFixed(1))
    : myTeam ? myTeam.budget : 0;

  // Count players by role for captain team
  const getTeamCounts = (team) => {
    if (!team) return { batsmen: 0, bowlers: 0, allRounders: 0, keepers: 0, foreign: 0 };
    return {
      batsmen: team.players.filter(p => p.role === "Batsman").length,
      bowlers: team.players.filter(p => p.role === "Bowler").length,
      allRounders: team.players.filter(p => p.role === "All Rounder").length,
      keepers: team.players.filter(p => p.role === "Wicket Keeper").length,
      foreign: team.players.filter(p => p.isForeign).length,
    };
  };

  const myCounts = getTeamCounts(myTeam);

  // Check if captain can bid for current player
  const canBidCheck = (myTeam && currentPlayer) 
    ? checkTeamLimit(myTeam, currentPlayer.role, currentPlayer.isForeign)
    : { canBid: true, reason: "" };

  const getHeading = () => {
    if (isAdmin) return "👨‍💼 ADMIN PANEL";
    if (loggedInCaptain) return `👑 ${loggedInCaptain.captainTeam} CAPTAIN`;
    return "👀 LIVE AUCTION";
  };

  const getSubHeading = () => {
    if (isAdmin) return `LIVE AUCTION - ${totalPlayers} Players`;
    if (loggedInCaptain) return `Welcome ${loggedInCaptain.name} | ${loggedInCaptain.captainTeam}`;
    return "Watch Mode - View Only";
  };

  const remaining = getRemainingByCategory();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>{getHeading()}</h1>
          <p>{getSubHeading()}</p>
        </div>
        <div className="admin-header-right">
          <button className="admin-small-btn" onClick={() => setManualResultView(true)}>
            📊 Results
          </button>
          {isAdmin && (
            <button className="admin-small-btn reset" onClick={resetAuction}>
              🔄 Reset
            </button>
          )}
          <button className="admin-small-btn back" onClick={onLogout}>
            🚪 {isWatchMode ? "Home" : "Logout"}
          </button>
        </div>
      </div>

      {/* CAPTAIN TEAM INFO */}
      {loggedInCaptain && myTeam && (
        <div style={{
          background: `linear-gradient(90deg, ${myTeam.color}33, transparent)`,
          borderLeft: `5px solid ${myTeam.color}`,
          padding: "20px 30px",
          margin: "15px 30px 0",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap"
        }}>
          <img
            src={myTeam.logo}
            alt={myTeam.short}
            style={{ width: "70px", height: "70px", objectFit: "contain" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h2 style={{ color: myTeam.color, margin: 0, fontSize: "24px" }}>
              {myTeam.name}
            </h2>
            <p style={{ color: "#888", margin: "5px 0 0 0", fontSize: "13px" }}>
              👑 <strong style={{ color: "#f1c40f" }}>{loggedInCaptain.name}</strong>
              {" | "}
              👥 <strong>{myTeam.players.length}/{LIMITS.TOTAL}</strong>
            </p>
            <div style={{
              display: "flex",
              gap: "8px",
              marginTop: "10px",
              flexWrap: "wrap"
            }}>
              <span style={{
                background: myCounts.batsmen >= LIMITS.BATSMAN ? "rgba(231,76,60,0.3)" : "rgba(52,152,219,0.2)",
                color: myCounts.batsmen >= LIMITS.BATSMAN ? "#e74c3c" : "#3498db",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                🏏 {myCounts.batsmen}/{LIMITS.BATSMAN}
              </span>
              <span style={{
                background: myCounts.bowlers >= LIMITS.BOWLER ? "rgba(231,76,60,0.3)" : "rgba(231,76,60,0.15)",
                color: "#e74c3c",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                🎯 {myCounts.bowlers}/{LIMITS.BOWLER}
              </span>
              <span style={{
                background: myCounts.allRounders >= LIMITS.ALL_ROUNDER ? "rgba(231,76,60,0.3)" : "rgba(241,196,15,0.15)",
                color: "#f1c40f",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                ⭐ {myCounts.allRounders}/{LIMITS.ALL_ROUNDER}
              </span>
              <span style={{
                background: myCounts.keepers >= LIMITS.WICKET_KEEPER ? "rgba(231,76,60,0.3)" : "rgba(155,89,182,0.15)",
                color: "#9b59b6",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                🧤 {myCounts.keepers}/{LIMITS.WICKET_KEEPER}
              </span>
              <span style={{
                background: myCounts.foreign >= LIMITS.FOREIGN ? "rgba(231,76,60,0.3)" : "rgba(52,152,219,0.15)",
                color: "#3498db",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                ✈️ {myCounts.foreign}/{LIMITS.FOREIGN}
              </span>
            </div>
          </div>

          <div style={{
            background: isMyTeamHighest ? "rgba(231, 76, 60, 0.15)" : "rgba(46, 204, 113, 0.15)",
            border: `2px solid ${isMyTeamHighest ? "#e74c3c" : "#2ecc71"}`,
            padding: "15px 25px",
            borderRadius: "12px",
            textAlign: "center",
            minWidth: "180px"
          }}>
            <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>
              {isMyTeamHighest ? "After This Bid" : "Available Budget"}
            </div>
            <div style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: isMyTeamHighest ? "#e74c3c" : "#2ecc71",
              marginTop: "3px"
            }}>
              ₹{liveBudget.toFixed(1)} Cr
            </div>
          </div>
        </div>
      )}

      {/* REMAINING PLAYERS */}
      {!auctionComplete && auctionStarted && (
        <div style={{
          margin: "15px 30px 0",
          padding: "15px 20px",
          background: "linear-gradient(135deg, #1e1e2f, #16162a)",
          borderRadius: "12px",
          border: "1px solid #333"
        }}>
          <h3 style={{
            color: "#f1c40f",
            fontSize: "14px",
            marginBottom: "12px",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            📊 Remaining Players ({remaining.total})
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "10px"
          }}>
            <div style={{ background: "rgba(52, 152, 219, 0.15)", border: "1px solid #3498db", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "20px" }}>🏏</div>
              <div style={{ color: "#3498db", fontSize: "18px", fontWeight: "bold" }}>{remaining.batsmen}</div>
              <div style={{ color: "#888", fontSize: "11px" }}>Batsmen</div>
            </div>
            <div style={{ background: "rgba(231, 76, 60, 0.15)", border: "1px solid #e74c3c", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "20px" }}>🎯</div>
              <div style={{ color: "#e74c3c", fontSize: "18px", fontWeight: "bold" }}>{remaining.bowlers}</div>
              <div style={{ color: "#888", fontSize: "11px" }}>Bowlers</div>
            </div>
            <div style={{ background: "rgba(241, 196, 15, 0.15)", border: "1px solid #f1c40f", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "20px" }}>⭐</div>
              <div style={{ color: "#f1c40f", fontSize: "18px", fontWeight: "bold" }}>{remaining.allRounders}</div>
              <div style={{ color: "#888", fontSize: "11px" }}>All Rounders</div>
            </div>
            <div style={{ background: "rgba(155, 89, 182, 0.15)", border: "1px solid #9b59b6", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "20px" }}>🧤</div>
              <div style={{ color: "#9b59b6", fontSize: "18px", fontWeight: "bold" }}>{remaining.wicketKeepers}</div>
              <div style={{ color: "#888", fontSize: "11px" }}>Keepers</div>
            </div>
            <div style={{ background: "rgba(46, 204, 113, 0.15)", border: "1px solid #2ecc71", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "20px" }}>🇮🇳</div>
              <div style={{ color: "#2ecc71", fontSize: "18px", fontWeight: "bold" }}>{remaining.indian}</div>
              <div style={{ color: "#888", fontSize: "11px" }}>Indian</div>
            </div>
            <div style={{ background: "rgba(52, 152, 219, 0.15)", border: "1px solid #3498db", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "20px" }}>✈️</div>
              <div style={{ color: "#3498db", fontSize: "18px", fontWeight: "bold" }}>{remaining.foreign}</div>
              <div style={{ color: "#888", fontSize: "11px" }}>Foreign</div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-progress">
        <span>Player {Math.min(currentPlayerIndex + 1, totalPlayers)} / {totalPlayers}</span>
        <div className="admin-progress-bar">
          <div
            className="admin-progress-fill"
            style={{ width: `${((currentPlayerIndex + (auctionComplete ? 1 : 0)) / totalPlayers) * 100}%` }}
          ></div>
        </div>
        <span>Unsold: {unsoldPlayers.length}</span>
      </div>

      <div className="admin-main">
        <div className="admin-left" style={{ maxWidth: loggedInCaptain ? "100%" : "650px" }}>
          {currentPlayer && !auctionComplete ? (
            <div className="admin-player-card">
              <div className="admin-player-img-section">
                {currentPlayer.image ? (
                  <img src={currentPlayer.image} alt={currentPlayer.name} className="admin-player-img" />
                ) : (
                  <div className="admin-player-placeholder">
                    {currentPlayer.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="admin-player-info">
                <span className="admin-player-number">#{currentPlayer.id}</span>
                <h2>
                  {currentPlayer.name}
                  {currentPlayer.isForeign && (
                    <span style={{
                      marginLeft: "10px", fontSize: "16px",
                      background: "rgba(52, 152, 219, 0.2)", color: "#3498db",
                      padding: "3px 10px", borderRadius: "8px", border: "1px solid #3498db"
                    }}>
                      ✈️ Foreign
                    </span>
                  )}
                </h2>
                <span className="admin-role-badge">
                  {getRoleEmoji(currentPlayer.role)} {currentPlayer.role}
                </span>

                <div className="player-extra-info">
                  {currentPlayer.battingStyle && currentPlayer.battingStyle !== "N/A" && (
                    <span>🏏 {currentPlayer.battingStyle}</span>
                  )}
                  {currentPlayer.bowlingStyle && currentPlayer.bowlingStyle !== "N/A" && (
                    <span>🎯 {currentPlayer.bowlingStyle}</span>
                  )}
                </div>

                <div className="admin-price-row">
                  <div className="admin-price-box">
                    <span className="label">Base Price</span>
                    <span className="value">₹ {currentPlayer.basePrice} Cr</span>
                  </div>
                  <div className="admin-price-box highlight">
                    <span className="label">Current Bid</span>
                    <span className="value">₹ {currentBid} Cr</span>
                  </div>
                </div>

                <div className="admin-bidder-info">
                  {highestBidder ? (
                    <div className="bidder-display">
                      <img src={highestBidder.logo} alt={highestBidder.short}
                        className="bidder-logo"
                        onError={(e) => { e.target.style.display = "none"; }} />
                      <span style={{ color: highestBidder.color, fontSize: "18px", fontWeight: "bold" }}>
                        {highestBidder.short} - ₹{currentBid} Cr
                      </span>
                    </div>
                  ) : (
                    <span className="no-bidder">Waiting for bids...</span>
                  )}
                </div>

                <div className={`admin-timer ${timer <= 10 ? "danger" : ""} ${timerEnded ? "ended" : ""}`}>
                  <span className="timer-num">{timer}</span>
                  <span className="timer-label">SEC</span>
                </div>
              </div>
            </div>
          ) : auctionComplete ? (
            <div className="admin-player-card" style={{ flexDirection: "column", padding: "50px" }}>
              <div style={{ fontSize: "80px", marginBottom: "20px" }}>🏆</div>
              <h2 style={{ color: "#2ecc71", marginBottom: "10px" }}>Auction Completed!</h2>
              <p style={{ color: "#888", marginBottom: "20px" }}>
                All {totalPlayers} players have been auctioned.
              </p>
              <button
                onClick={() => setManualResultView(true)}
                style={{
                  background: "linear-gradient(135deg, #2ecc71, #27ae60)",
                  color: "white", border: "none", padding: "15px 40px",
                  borderRadius: "10px", fontSize: "18px", fontWeight: "bold", cursor: "pointer"
                }}
              >
                📊 VIEW FINAL RESULTS
              </button>
            </div>
          ) : (
            <div className="admin-player-card">
              <h2 style={{ textAlign: "center", padding: "50px", width: "100%" }}>Loading...</h2>
            </div>
          )}

          {/* ADMIN CONTROLS */}
          {currentPlayer && isAdmin && !auctionComplete && (
            <div className="admin-controls">
              {!auctionStarted && !timerEnded ? (
                <button className="ctrl-btn start" onClick={startPlayerAuction}>
                  ▶️ START BIDDING
                </button>
              ) : highestBidder ? (
                <button className="ctrl-btn sold" onClick={handleSold}
                  style={{ flex: 1, fontSize: "18px", padding: "18px" }}>
                  🔨 SOLD to {highestBidder.short} - ₹{currentBid} Cr
                </button>
              ) : (
                <button className="ctrl-btn unsold" onClick={handleUnsold}
                  style={{ flex: 1, fontSize: "18px", padding: "18px" }}>
                  ❌ UNSOLD (No bidders)
                </button>
              )}
            </div>
          )}

          {isAdmin && timerEnded && highestBidder && (
            <div style={{
              padding: "15px", background: "rgba(241, 196, 15, 0.15)",
              border: "2px solid #f1c40f", borderRadius: "10px",
              textAlign: "center", marginTop: "15px", color: "#f1c40f",
              fontSize: "16px", fontWeight: "bold"
            }}>
              ⏰ Time's Up! Highest bidder: {highestBidder.short} at ₹{currentBid} Cr
            </div>
          )}

          {isAdmin && auctionStarted && !timerEnded && (
            <div style={{
              padding: "15px", background: "rgba(52, 152, 219, 0.1)",
              border: "1px solid #3498db", borderRadius: "10px",
              textAlign: "center", marginTop: "15px", color: "#3498db", fontSize: "14px"
            }}>
              🎯 Auction is LIVE! Timer running.
            </div>
          )}

          {/* CAPTAIN BID BUTTON */}
          {currentPlayer && loggedInCaptain && auctionStarted && myTeam && !auctionComplete && !timerEnded && (
            <div className="admin-controls" style={{ marginTop: "20px" }}>
              {!canBidCheck.canBid ? (
                // Show disabled button with reason
                <div style={{
                  flex: 1,
                  padding: "25px",
                  background: "rgba(231, 76, 60, 0.15)",
                  border: "2px solid #e74c3c",
                  borderRadius: "12px",
                  textAlign: "center",
                  color: "#e74c3c",
                  fontSize: "18px",
                  fontWeight: "bold"
                }}>
                  🚫 CANNOT BID
                  <div style={{ fontSize: "14px", marginTop: "8px", color: "#c0392b" }}>
                    {canBidCheck.reason}
                  </div>
                  <div style={{ fontSize: "12px", marginTop: "5px", color: "#888" }}>
                    You can still watch the auction
                  </div>
                </div>
              ) : (
                <button
                  onClick={captainBid}
                  disabled={isMyTeamHighest || myTeam.budget < nextBidAmount}
                  style={{
                    flex: 1,
                    padding: "25px",
                    fontSize: "22px",
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: "12px",
                    cursor: (isMyTeamHighest || myTeam.budget < nextBidAmount) ? "not-allowed" : "pointer",
                    color: "white",
                    background: isMyTeamHighest
                      ? "linear-gradient(135deg, #2ecc71, #27ae60)"
                      : myTeam.budget < nextBidAmount
                        ? "#555"
                        : `linear-gradient(135deg, ${myTeam.color}, #c0392b)`,
                    transition: "0.3s",
                    boxShadow: "0 5px 25px rgba(0,0,0,0.4)"
                  }}
                >
                  {isMyTeamHighest
                    ? `✅ You are HIGHEST BIDDER at ₹${currentBid} Cr`
                    : myTeam.budget < nextBidAmount
                      ? `❌ Low Budget (₹${myTeam.budget.toFixed(1)} Cr)`
                      : `👑 BID ₹${nextBidAmount} Cr`
                  }
                </button>
              )}
            </div>
          )}

          {currentPlayer && loggedInCaptain && !auctionStarted && !auctionComplete && !timerEnded && (
            <div style={{
              padding: "20px", background: "rgba(241, 196, 15, 0.1)",
              border: "1px solid #f1c40f", borderRadius: "10px",
              textAlign: "center", marginTop: "20px", color: "#f1c40f", fontSize: "16px"
            }}>
              ⏳ Waiting for Admin to start bidding...
            </div>
          )}

          {currentPlayer && loggedInCaptain && timerEnded && (
            <div style={{
              padding: "20px", background: "rgba(231, 76, 60, 0.15)",
              border: "1px solid #e74c3c", borderRadius: "10px",
              textAlign: "center", marginTop: "20px", color: "#e74c3c", fontSize: "16px"
            }}>
              ⏰ Bidding time ended! Waiting for admin decision...
              {isMyTeamHighest && <div style={{ color: "#2ecc71", marginTop: "10px" }}>
                🎉 You are the highest bidder!
              </div>}
            </div>
          )}

          {isWatchMode && !isAdmin && !loggedInCaptain && !auctionComplete && (
            <div style={{
              padding: "15px", background: "rgba(52, 152, 219, 0.1)",
              border: "1px solid #3498db", borderRadius: "10px",
              textAlign: "center", marginTop: "15px", color: "#3498db", fontSize: "14px"
            }}>
              👀 You are watching the LIVE auction.
            </div>
          )}

          {/* CAPTAIN Squad */}
          {loggedInCaptain && myTeam && myTeam.players.length > 0 && (
            <div style={{
              background: "#1e1e2f", borderRadius: "12px",
              padding: "20px", marginTop: "20px",
              border: `2px solid ${myTeam.color}44`
            }}>
              <h3 style={{ color: myTeam.color, marginBottom: "15px", fontSize: "18px" }}>
                🏏 My Squad ({myTeam.players.length}/{LIMITS.TOTAL})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {myTeam.players.map((p, i) => (
                  <div key={i} style={{
                    background: "#16162a", padding: "12px 15px", borderRadius: "10px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderLeft: `3px solid ${myTeam.color}`
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{
                        background: myTeam.color, color: "white", width: "28px", height: "28px",
                        borderRadius: "50%", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "13px", fontWeight: "bold"
                      }}>
                        {i + 1}
                      </span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: "bold" }}>
                          {p.name}
                          {p.isForeign && <span style={{ marginLeft: "6px", color: "#3498db" }}>✈️</span>}
                          {p.isCaptainPlayer && <span style={{ marginLeft: "6px", color: "#f1c40f" }}>👑</span>}
                        </div>
                        <div style={{ color: "#888", fontSize: "12px" }}>
                          {getRoleEmoji(p.role)} {p.role}
                        </div>
                      </div>
                    </div>
                    <div style={{ color: "#2ecc71", fontWeight: "bold", fontSize: "16px" }}>
                      {p.isCaptainPlayer ? "FREE (Captain)" : `₹${p.soldPrice} Cr`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bidHistory.length > 0 && (
            <div className="bid-history">
              <h3>📋 Bid History</h3>
              {bidHistory.map((b, i) => (
                <div key={i} className="bid-history-item">
                  <span><strong>{b.team}</strong></span>
                  <span>₹{b.bid} Cr</span>
                  <span className="bid-time">{b.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loggedInCaptain && (
          <div className="admin-right">
            <h3 className="admin-section-title">
              🎯 Teams Status
              {auctionStarted && !timerEnded && (
                <span className="next-bid-label"> Next: ₹{nextBidAmount} Cr</span>
              )}
            </h3>
            <div className="admin-teams-list">
              {teams.map((team) => {
                const isBidding = highestBidder && highestBidder.id === team.id;
                const counts = getTeamCounts(team);

                return (
                  <div
                    key={team.id}
                    className={`admin-team-row ${isBidding ? "is-bidding" : ""}`}
                    style={{ borderLeftColor: team.color, cursor: "default" }}
                  >
                    <div className="admin-team-row-header">
                      <img src={team.logo} alt={team.short} className="admin-team-logo"
                        onError={(e) => { e.target.style.display = "none"; }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: team.color }}>{team.short}</h4>
                        <span className="admin-team-budget">
                          💰 ₹{team.budget.toFixed(1)} Cr | 👥 {team.players.length}/{LIMITS.TOTAL}
                          {team.captain && (
                            <span style={{ color: "#f1c40f", marginLeft: "8px" }}>
                              | 👑 {team.captain.name}
                            </span>
                          )}
                        </span>
                        <div style={{ marginTop: "5px", fontSize: "11px", color: "#888" }}>
                          🏏 {counts.batsmen}/{LIMITS.BATSMAN} | 
                          🎯 {counts.bowlers}/{LIMITS.BOWLER} | 
                          ⭐ {counts.allRounders}/{LIMITS.ALL_ROUNDER} | 
                          🧤 {counts.keepers}/{LIMITS.WICKET_KEEPER} | 
                          ✈️ {counts.foreign}/{LIMITS.FOREIGN}
                        </div>
                      </div>
                      {isBidding && <span className="bidding-badge">HIGHEST</span>}
                    </div>
                    {team.players.length > 0 && (
                      <div className="admin-team-players">
                        {team.players.map((p, i) => (
                          <span key={i} className="admin-player-tag">
                            {p.name} {p.isForeign && "✈️"} {p.isCaptainPlayer && "👑"} {!p.isCaptainPlayer && `(₹${p.soldPrice})`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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

export default AdminPanel;
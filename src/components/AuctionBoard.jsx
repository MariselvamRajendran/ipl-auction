import React, { useState, useEffect, useCallback } from "react";
import teamsData from "../data/teams";
import playersData from "../data/players";
import PlayerCard from "./PlayerCard";
import BidControls from "./BidControls";
import TeamList from "./TeamList";
import SoldOverlay from "./SoldOverlay";
import AuctionResult from "./AuctionResult";
import Header from "./Header";
import "../styles/Auction.css";

function AuctionBoard() {
  const [teams, setTeams] = useState(teamsData);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [currentBid, setCurrentBid] = useState(playersData[0].price);
  const [timer, setTimer] = useState(30);
  const [showSold, setShowSold] = useState(false);
  const [soldInfo, setSoldInfo] = useState(null);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [auctionComplete, setAuctionComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentPlayer = currentPlayerIndex < playersData.length
    ? playersData[currentPlayerIndex]
    : null;

  // Timer countdown
  useEffect(() => {
    if (auctionComplete || showSold || isPaused || !currentPlayer) return;

    if (timer <= 0) {
      handleUnsold();
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, auctionComplete, showSold, isPaused, currentPlayer]);

  const goToNextPlayer = useCallback(() => {
    if (currentPlayerIndex < playersData.length - 1) {
      const nextIndex = currentPlayerIndex + 1;
      setCurrentPlayerIndex(nextIndex);
      setCurrentBid(playersData[nextIndex].price);
      setSelectedTeam(null);
      setTimer(30);
      setIsPaused(false);
    } else {
      setAuctionComplete(true);
    }
  }, [currentPlayerIndex]);

  // Increase Bid
  const handleIncreaseBid = () => {
    setCurrentBid((prev) => Number((prev + 0.5).toFixed(1)));
    setTimer(30); // Reset timer on bid
  };

  // Buy Player (SOLD)
  const handleBuy = () => {
    if (!selectedTeam) {
      alert("Please select a team first!");
      return;
    }

    if (selectedTeam.budget < currentBid) {
      alert(`${selectedTeam.short} doesn't have enough budget! (₹${selectedTeam.budget.toFixed(1)} Cr remaining)`);
      return;
    }

    const soldPlayer = { ...currentPlayer, soldPrice: currentBid };

    const updatedTeams = teams.map((team) => {
      if (team.id === selectedTeam.id) {
        return {
          ...team,
          budget: Number((team.budget - currentBid).toFixed(1)),
          players: [...team.players, soldPlayer],
        };
      }
      return team;
    });

    setTeams(updatedTeams);
    setIsPaused(true);

    setSoldInfo({
      player: currentPlayer,
      team: selectedTeam,
      bid: currentBid,
    });
    setShowSold(true);
  };

  // Handle Unsold
  const handleUnsold = () => {
    if (currentPlayer) {
      setUnsoldPlayers((prev) => [...prev, currentPlayer]);
    }
    goToNextPlayer();
  };

  // Close Sold Overlay & go to next
  const handleCloseSold = useCallback(() => {
    setShowSold(false);
    setSoldInfo(null);
    goToNextPlayer();
  }, [goToNextPlayer]);

  // Show Result Page
  if (showResult) {
    return (
      <div className="app-container">
        <Header
          onShowResult={() => setShowResult(true)}
          auctionComplete={auctionComplete}
        />
        <AuctionResult
          teams={teams}
          unsoldPlayers={unsoldPlayers}
          onBack={() => setShowResult(false)}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header
        onShowResult={() => setShowResult(true)}
        auctionComplete={auctionComplete}
      />

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-info">
          <span>Player {Math.min(currentPlayerIndex + 1, playersData.length)} of {playersData.length}</span>
          <span>Unsold: {unsoldPlayers.length}</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((currentPlayerIndex + (auctionComplete ? 1 : 0)) / playersData.length) * 100}%`
            }}
          ></div>
        </div>
      </div>

      {/* Player Card */}
      <PlayerCard
        player={currentPlayer}
        currentBid={currentBid}
        selectedTeam={selectedTeam}
        timer={timer}
      />

      {/* Bid Controls */}
      <BidControls
        onIncreaseBid={handleIncreaseBid}
        onBuy={handleBuy}
        onUnsold={handleUnsold}
        selectedTeam={selectedTeam}
        auctionDone={auctionComplete}
      />

      {/* Auction Complete Message */}
      {auctionComplete && (
        <div className="auction-complete-msg">
          <h2>🏆 Auction Completed!</h2>
          <p>All {playersData.length} players have been auctioned.</p>
          <button className="view-result-btn" onClick={() => setShowResult(true)}>
            📊 View Final Results
          </button>
        </div>
      )}

      {/* Select Team */}
      <h2 className="section-title">Select Team</h2>
      <TeamList
        teams={teams}
        selectedTeam={selectedTeam}
        onSelect={setSelectedTeam}
      />

      {/* Sold Overlay */}
      {showSold && soldInfo && (
        <SoldOverlay
          player={soldInfo.player}
          team={soldInfo.team}
          bid={soldInfo.bid}
          onClose={handleCloseSold}
        />
      )}
    </div>
  );
}

export default AuctionBoard;
import React from "react";
import "../styles/BidControls.css";

function BidControls({ onIncreaseBid, onBuy, onUnsold, selectedTeam, auctionDone }) {
  if (auctionDone) return null;

  return (
    <div className="bid-controls">
      <button className="bid-btn increase" onClick={onIncreaseBid}>
        📈 Increase Bid (+0.5 Cr)
      </button>
      <button
        className={`bid-btn buy ${!selectedTeam ? "disabled" : ""}`}
        onClick={onBuy}
        disabled={!selectedTeam}
      >
        🔨 SOLD
      </button>
      <button className="bid-btn unsold" onClick={onUnsold}>
        ❌ UNSOLD
      </button>
    </div>
  );
}

export default BidControls;
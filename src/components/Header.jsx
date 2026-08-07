import React from "react";
import "../styles/Header.css";

function Header({ onShowResult, auctionComplete }) {
  return (
    <div className="header">
      <div className="header-left">
        <span className="header-icon">🏏</span>
        <div>
          <h1>IPL AUCTION 2026</h1>
          <p>College Mini Project - React JS</p>
        </div>
      </div>
      {auctionComplete && (
        <button className="result-btn" onClick={onShowResult}>
          📊 View Results
        </button>
      )}
    </div>
  );
}

export default Header;
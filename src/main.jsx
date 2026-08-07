import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuctionProvider } from "./context/AuctionContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuctionProvider>
      <App />
    </AuctionProvider>
  </React.StrictMode>
);
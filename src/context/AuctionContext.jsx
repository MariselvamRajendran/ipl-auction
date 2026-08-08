import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import teamsData from "../data/teams";
import { getAllPlayers, saveAuctionState, getAuctionState, clearAuctionState } from "../firebase";

const AuctionContext = createContext();

export function useAuction() {
  return useContext(AuctionContext);
}

const FOREIGN_LIMIT = 5;
const WICKET_KEEPER_LIMIT = 3;

export function AuctionProvider({ children }) {
  const [loggedInCaptain, setLoggedInCaptain] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teams, setTeams] = useState(teamsData);
  const [auctionPlayers, setAuctionPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [auctionComplete, setAuctionComplete] = useState(false);
  const [showSold, setShowSold] = useState(false);
  const [soldInfo, setSoldInfo] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [auctionReady, setAuctionReady] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timerEnded, setTimerEnded] = useState(false);

  const stateRef = useRef({});
  const isProcessingRef = useRef(false);
  const lastShownSoldIdRef = useRef(null);
  const lastProcessedIndexRef = useRef(-1);

  useEffect(() => {
    stateRef.current = {
      teams, auctionPlayers, currentPlayerIndex, currentBid, highestBidder,
      unsoldPlayers, auctionComplete, auctionStarted, auctionReady,
      bidHistory, timer, isTimerRunning, showSold, soldInfo, isAdmin,
    };
  });

  const currentPlayer = currentPlayerIndex < auctionPlayers.length
    ? auctionPlayers[currentPlayerIndex]
    : null;

  // ============ GO TO NEXT PLAYER ============
  const goToNextPlayer = useCallback(async (updatedTeams, updatedUnsold, fromIndex) => {
    const teamsToUse = updatedTeams || stateRef.current.teams;
    const unsoldToUse = updatedUnsold || stateRef.current.unsoldPlayers;
    const players = stateRef.current.auctionPlayers;
    const idx = fromIndex !== undefined ? fromIndex : stateRef.current.currentPlayerIndex;

    // Prevent duplicate processing of same index
    if (lastProcessedIndexRef.current === idx) {
      console.log(`⚠️ Index ${idx} already processed, skipping duplicate call`);
      return;
    }
    lastProcessedIndexRef.current = idx;

    console.log(`📌 Moving from player index: ${idx}, Total: ${players.length}`);

    if (idx < players.length - 1) {
      const nextIndex = idx + 1;
      const nextBid = players[nextIndex].basePrice;

      console.log(`✅ Next player: ${nextIndex + 1} - ${players[nextIndex].name}`);

      setCurrentPlayerIndex(nextIndex);
      setCurrentBid(nextBid);
      setHighestBidder(null);
      setTimer(30);
      setIsTimerRunning(false);
      setAuctionStarted(false);
      setBidHistory([]);
      setTimerEnded(false);

      await saveAuctionState({
        teams: teamsToUse,
        auctionPlayers: players,
        currentPlayerIndex: nextIndex,
        currentBid: nextBid,
        highestBidder: null,
        unsoldPlayers: unsoldToUse,
        auctionComplete: false,
        auctionStarted: false,
        auctionReady: true,
        bidHistory: [],
        timer: 30,
        isTimerRunning: false,
        showSold: false,
        soldInfo: null,
        soldPlayerId: null,
        timerEnded: false,
        lastUpdate: Date.now(),
      });
    } else {
      console.log("🏆 Auction complete!");
      setAuctionComplete(true);
      setAuctionStarted(false);
      setShowResults(true);
      setIsTimerRunning(false);
      setTimerEnded(false);

      await saveAuctionState({
        teams: teamsToUse,
        auctionPlayers: players,
        currentPlayerIndex: idx,
        currentBid: 0,
        highestBidder: null,
        unsoldPlayers: unsoldToUse,
        auctionComplete: true,
        auctionStarted: false,
        auctionReady: true,
        bidHistory: [],
        timer: 0,
        isTimerRunning: false,
        showSold: false,
        soldInfo: null,
        soldPlayerId: null,
        timerEnded: false,
        lastUpdate: Date.now(),
      });
    }
  }, []);

  // ============ HANDLE SOLD ============
  const handleSold = useCallback(async () => {
    if (isProcessingRef.current) {
      console.log("⚠️ Already processing, skipping...");
      return;
    }
    isProcessingRef.current = true;
    console.log("🔨 SOLD started");

    try {
      const latest = await getAuctionState();
      const latestHighest = latest?.highestBidder;
      const latestBid = latest?.currentBid || stateRef.current.currentBid;
      const latestTeams = latest?.teams || stateRef.current.teams;
      const currentIdx = stateRef.current.currentPlayerIndex;
      const player = stateRef.current.auctionPlayers[currentIdx];

      if (!latestHighest || !player) {
        isProcessingRef.current = false;
        alert("No bidder yet!");
        return;
      }

      console.log(`🎯 Selling ${player.name} at index ${currentIdx}`);

      const soldPlayer = {
        ...player,
        soldPrice: latestBid,
        soldTo: latestHighest.short,
      };

      const updatedTeams = latestTeams.map((team) => {
        if (team.id === latestHighest.id) {
          return {
            ...team,
            budget: Number((team.budget - latestBid).toFixed(1)),
            players: [...team.players, soldPlayer],
          };
        }
        return team;
      });

      const sInfo = { player, team: latestHighest, bid: latestBid };
      const soldPlayerId = `${currentIdx}-${player.id}-${Date.now()}`;

      setTeams(updatedTeams);
      setIsTimerRunning(false);
      setSoldInfo(sInfo);
      setShowSold(true);
      setTimerEnded(false);

      await saveAuctionState({
        ...latest,
        teams: updatedTeams,
        auctionStarted: false,
        timer: 0,
        isTimerRunning: false,
        showSold: true,
        soldInfo: sInfo,
        soldPlayerId: soldPlayerId,
        timerEnded: false,
        lastUpdate: Date.now(),
      });

      // Wait 4 seconds
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      console.log("⏭️ Moving to next after overlay");
      setShowSold(false);
      setSoldInfo(null);
      
      await goToNextPlayer(updatedTeams, stateRef.current.unsoldPlayers, currentIdx);
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      isProcessingRef.current = false;
      console.log("✅ SOLD complete");
    }
  }, [goToNextPlayer]);

  // ============ HANDLE UNSOLD ============
  const handleUnsold = useCallback(async () => {
    if (isProcessingRef.current) {
      console.log("⚠️ Already processing, skipping...");
      return;
    }
    isProcessingRef.current = true;
    console.log("❌ UNSOLD started");

    try {
      const currentIdx = stateRef.current.currentPlayerIndex;
      const player = stateRef.current.auctionPlayers[currentIdx];
      const newUnsold = player ? [...stateRef.current.unsoldPlayers, player] : stateRef.current.unsoldPlayers;

      setUnsoldPlayers(newUnsold);
      setIsTimerRunning(false);
      setTimerEnded(false);

      await goToNextPlayer(stateRef.current.teams, newUnsold, currentIdx);
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      isProcessingRef.current = false;
      console.log("✅ UNSOLD complete");
    }
  }, [goToNextPlayer]);

  // ============ SYNC FROM SERVER ============
  const syncFromServer = useCallback(async () => {
    const saved = await getAuctionState();
    if (!saved) {
      setAuctionReady(false);
      return;
    }

    setAuctionReady(saved.auctionReady || false);

    if (!stateRef.current.isAdmin) {
      setTeams(saved.teams || teamsData);
      setAuctionPlayers(saved.auctionPlayers || []);
      setCurrentPlayerIndex(saved.currentPlayerIndex || 0);
      setCurrentBid(saved.currentBid || 0);
      setHighestBidder(saved.highestBidder || null);
      setUnsoldPlayers(saved.unsoldPlayers || []);
      setAuctionComplete(saved.auctionComplete || false);
      setAuctionStarted(saved.auctionStarted || false);
      setBidHistory(saved.bidHistory || []);
      setTimer(saved.timer !== undefined ? saved.timer : 30);
      setIsTimerRunning(saved.isTimerRunning || false);
      setTimerEnded(saved.timerEnded || false);

      if (saved.auctionComplete && !showResults) {
        setShowResults(true);
      }

      // Show sold overlay only ONCE per unique soldPlayerId
      if (saved.showSold && saved.soldInfo && saved.soldPlayerId && lastShownSoldIdRef.current !== saved.soldPlayerId) {
        lastShownSoldIdRef.current = saved.soldPlayerId;
        setSoldInfo(saved.soldInfo);
        setShowSold(true);
        setTimeout(() => {
          setShowSold(false);
          setSoldInfo(null);
        }, 4000);
      }
    } else {
      // Admin: only sync bidder info
      if (saved.highestBidder && JSON.stringify(saved.highestBidder) !== JSON.stringify(stateRef.current.highestBidder)) {
        setHighestBidder(saved.highestBidder);
      }
      if (saved.currentBid !== undefined && saved.currentBid !== stateRef.current.currentBid) {
        setCurrentBid(saved.currentBid);
      }
      if (saved.bidHistory && JSON.stringify(saved.bidHistory) !== JSON.stringify(stateRef.current.bidHistory)) {
        setBidHistory(saved.bidHistory);
      }
      if (saved.isTimerRunning && saved.timer === 15 && stateRef.current.timer !== 15 && !stateRef.current.timerEnded) {
        setTimer(15);
        setIsTimerRunning(true);
      }
    }
  }, [showResults]);

  useEffect(() => {
    syncFromServer();
    const interval = setInterval(syncFromServer, 1000);
    return () => clearInterval(interval);
  }, [syncFromServer]);

  // ============ ADMIN TIMER ============
  useEffect(() => {
    if (!isAdmin) return;
    if (!isTimerRunning) return;
    if (auctionComplete) return;
    if (showSold) return;
    if (timerEnded) return;
    if (isProcessingRef.current) return;

    if (timer <= 0) {
      setIsTimerRunning(false);
      if (highestBidder) {
        setTimerEnded(true);
        getAuctionState().then((latest) => {
          if (latest) {
            saveAuctionState({
              ...latest,
              timer: 0,
              isTimerRunning: false,
              timerEnded: true,
              lastUpdate: Date.now(),
            });
          }
        });
      } else {
        if (!isProcessingRef.current) {
          handleUnsold();
        }
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      const newTimer = timer - 1;
      setTimer(newTimer);

      getAuctionState().then((latest) => {
        if (latest) {
          saveAuctionState({
            ...latest,
            timer: newTimer,
            isTimerRunning: true,
            lastUpdate: Date.now(),
          });
        }
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [timer, isTimerRunning, isAdmin, auctionComplete, showSold, highestBidder, timerEnded, handleUnsold]);

  // ============ LOAD PLAYERS ============
  const loadPlayersForAuction = async () => {
    const allPlayers = await getAllPlayers();
    const nonCaptains = allPlayers.filter((p) => !p.isCaptain);

    if (nonCaptains.length === 0) {
      alert("No non-captain players registered!");
      return false;
    }

    const formatted = nonCaptains.map((p, index) => ({
      id: index + 1,
      firebaseId: p.id,
      name: p.name,
      role: p.role,
      basePrice: p.basePrice,
      image: "",
      battingStyle: p.battingStyle,
      bowlingStyle: p.bowlingStyle,
      country: p.country || "Indian",
      isForeign: p.isForeign || false,
    }));

    const allCaptains = allPlayers.filter((p) => p.isCaptain && p.captainTeam);
    const updatedTeams = teamsData.map((team) => {
      const captain = allCaptains.find((c) => c.captainTeam === team.short);
      
      const cleanCaptain = captain ? {
        id: captain.id,
        name: captain.name,
        captainTeam: captain.captainTeam,
        role: captain.role,
        country: captain.country,
        isForeign: captain.isForeign || false,
      } : null;

      const initialPlayers = [];
      if (cleanCaptain && cleanCaptain.role === "Wicket Keeper") {
        initialPlayers.push({
          ...cleanCaptain,
          soldPrice: 0,
          soldTo: team.short,
          isCaptainPlayer: true,
        });
      }

      return {
        ...team,
        budget: 100,
        players: initialPlayers,
        captain: cleanCaptain,
      };
    });

    // Reset all tracking
    lastShownSoldIdRef.current = null;
    lastProcessedIndexRef.current = -1;
    isProcessingRef.current = false;

    setAuctionPlayers(formatted);
    setCurrentBid(formatted[0].basePrice);
    setCurrentPlayerIndex(0);
    setUnsoldPlayers([]);
    setAuctionComplete(false);
    setTeams(updatedTeams);
    setAuctionReady(true);
    setShowResults(false);
    setHighestBidder(null);
    setBidHistory([]);
    setAuctionStarted(false);
    setTimer(30);
    setIsTimerRunning(false);
    setTimerEnded(false);

    await saveAuctionState({
      teams: updatedTeams,
      auctionPlayers: formatted,
      currentPlayerIndex: 0,
      currentBid: formatted[0].basePrice,
      highestBidder: null,
      unsoldPlayers: [],
      auctionComplete: false,
      auctionStarted: false,
      auctionReady: true,
      bidHistory: [],
      timer: 30,
      isTimerRunning: false,
      showSold: false,
      soldInfo: null,
      soldPlayerId: null,
      timerEnded: false,
      lastUpdate: Date.now(),
    });

    return true;
  };

  // ============ CAPTAIN BID ============
  const captainBid = async () => {
    if (!loggedInCaptain) return;

    const latest = await getAuctionState();
    if (!latest || !latest.auctionStarted) {
      alert("Auction not started yet!");
      return;
    }

    if (latest.timerEnded) {
      alert("Bidding time is over!");
      return;
    }

    const latestTeams = latest.teams;
    const latestBid = latest.currentBid;
    const latestHighest = latest.highestBidder;
    const currentPlayerData = latest.auctionPlayers[latest.currentPlayerIndex];

    const team = latestTeams.find((t) => t.short === loggedInCaptain.captainTeam);
    if (!team) return;

    if (currentPlayerData && currentPlayerData.isForeign) {
      const foreignCount = team.players.filter(p => p.isForeign).length;
      if (foreignCount >= FOREIGN_LIMIT) {
        alert(`❌ ${team.short} already has ${FOREIGN_LIMIT} foreign players!`);
        return;
      }
    }

    if (currentPlayerData && currentPlayerData.role === "Wicket Keeper") {
      const keeperCount = team.players.filter(p => p.role === "Wicket Keeper").length;
      if (keeperCount >= WICKET_KEEPER_LIMIT) {
        alert(`❌ ${team.short} already has ${WICKET_KEEPER_LIMIT} wicket keepers!`);
        return;
      }
    }

    const newBid = latestHighest
      ? Number((latestBid + 0.5).toFixed(1))
      : latestBid;

    if (team.budget < newBid) {
      alert(`Not enough budget! Only ₹${team.budget.toFixed(1)} Cr left.`);
      return;
    }

    if (latestHighest && latestHighest.id === team.id) {
      alert("You are already the highest bidder!");
      return;
    }

    const newHistory = [
      { team: team.short, bid: newBid, time: new Date().toLocaleTimeString() },
      ...(latest.bidHistory || []),
    ];

    setCurrentBid(newBid);
    setHighestBidder(team);
    setTimer(15);
    setBidHistory(newHistory);
    setIsTimerRunning(true);
    setTimerEnded(false);

    await saveAuctionState({
      ...latest,
      currentBid: newBid,
      highestBidder: team,
      timer: 15,
      isTimerRunning: true,
      bidHistory: newHistory,
      timerEnded: false,
      lastUpdate: Date.now(),
    });
  };

  // ============ START AUCTION ============
  const startPlayerAuction = async () => {
    if (!currentPlayer) return;

    // Reset processing flags for new player
    isProcessingRef.current = false;

    setTimer(30);
    setIsTimerRunning(true);
    setAuctionStarted(true);
    setHighestBidder(null);
    setCurrentBid(currentPlayer.basePrice);
    setBidHistory([]);
    setTimerEnded(false);

    await saveAuctionState({
      teams,
      auctionPlayers,
      currentPlayerIndex,
      currentBid: currentPlayer.basePrice,
      highestBidder: null,
      unsoldPlayers,
      auctionComplete,
      auctionStarted: true,
      auctionReady: true,
      bidHistory: [],
      timer: 30,
      isTimerRunning: true,
      showSold: false,
      soldInfo: null,
      timerEnded: false,
      lastUpdate: Date.now(),
    });
  };

  // ============ CLOSE SOLD OVERLAY ============
  // IMPORTANT: This should ONLY hide the overlay, NOT advance to next player
  const closeSoldOverlay = useCallback(() => {
    setShowSold(false);
    setSoldInfo(null);
  }, []);

  const resetAuction = async () => {
    if (window.confirm("Reset entire auction? All progress will be lost!")) {
      await clearAuctionState();
      lastShownSoldIdRef.current = null;
      lastProcessedIndexRef.current = -1;
      isProcessingRef.current = false;
      setTeams(teamsData.map((t) => ({ ...t, players: [], budget: 100 })));
      setCurrentPlayerIndex(0);
      setCurrentBid(0);
      setHighestBidder(null);
      setTimer(30);
      setIsTimerRunning(false);
      setUnsoldPlayers([]);
      setAuctionComplete(false);
      setShowSold(false);
      setSoldInfo(null);
      setBidHistory([]);
      setAuctionStarted(false);
      setAuctionReady(false);
      setAuctionPlayers([]);
      setShowResults(false);
      setTimerEnded(false);
    }
  };

  const logout = () => {
    setLoggedInCaptain(null);
    setIsAdmin(false);
    setShowResults(false);
  };

  const closeResults = () => {
    setShowResults(false);
  };

  const getRemainingByCategory = () => {
    const remaining = auctionPlayers.slice(currentPlayerIndex);
    return {
      total: remaining.length,
      batsmen: remaining.filter(p => p.role === "Batsman").length,
      bowlers: remaining.filter(p => p.role === "Bowler").length,
      allRounders: remaining.filter(p => p.role === "All Rounder").length,
      wicketKeepers: remaining.filter(p => p.role === "Wicket Keeper").length,
      foreign: remaining.filter(p => p.isForeign).length,
      indian: remaining.filter(p => !p.isForeign).length,
    };
  };

  const value = {
    loggedInCaptain,
    setLoggedInCaptain,
    isAdmin,
    setIsAdmin,
    teams,
    currentPlayer,
    currentPlayerIndex,
    currentBid,
    highestBidder,
    timer,
    isTimerRunning,
    unsoldPlayers,
    auctionComplete,
    showSold,
    soldInfo,
    bidHistory,
    auctionStarted,
    auctionReady,
    auctionPlayers,
    showResults,
    timerEnded,
    totalPlayers: auctionPlayers.length,
    FOREIGN_LIMIT,
    WICKET_KEEPER_LIMIT,
    captainBid,
    startPlayerAuction,
    handleSold,
    handleUnsold,
    closeSoldOverlay,
    resetAuction,
    loadPlayersForAuction,
    logout,
    syncFromServer,
    closeResults,
    getRemainingByCategory,
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
}
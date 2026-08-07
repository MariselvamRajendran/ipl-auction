// Local Storage - Simple Version

const PLAYERS_KEY = "ipl_auction_players";
const AUCTION_STATE_KEY = "ipl_auction_state";

export const getAllPlayers = async () => {
  const data = localStorage.getItem(PLAYERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addPlayer = async (player) => {
  const players = await getAllPlayers();

  // Check duplicate name
  const nameExists = players.find(
    (p) => p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
  );
  if (nameExists) {
    return { success: false, error: "This name is already registered!" };
  }

  // Check duplicate captain for same team
  if (player.isCaptain && player.captainTeam) {
    const teamCaptainExists = players.find(
      (p) => p.isCaptain === true && p.captainTeam === player.captainTeam
    );
    if (teamCaptainExists) {
      return {
        success: false,
        error: `${player.captainTeam} already has a captain: ${teamCaptainExists.name}! Only one captain per team allowed.`
      };
    }
  }

  const newPlayer = {
    id: Date.now().toString(),
    ...player,
    registeredAt: new Date().toISOString(),
  };

  players.push(newPlayer);
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  return { success: true, player: newPlayer };
};

export const deletePlayer = async (playerId) => {
  const players = await getAllPlayers();
  const filtered = players.filter((p) => p.id !== playerId);
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(filtered));
  return true;
};

export const deleteAllPlayers = async () => {
  localStorage.removeItem(PLAYERS_KEY);
  localStorage.removeItem(AUCTION_STATE_KEY);
  return true;
};

export const exportPlayersJSON = async () => {
  const players = await getAllPlayers();
  const dataStr = JSON.stringify(players, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ipl_players_${new Date().getTime()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const importPlayersJSON = async (jsonData) => {
  try {
    const players = JSON.parse(jsonData);
    if (!Array.isArray(players)) return { success: false, error: "Invalid file format" };
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    return { success: true, count: players.length };
  } catch (err) {
    return { success: false, error: "Invalid JSON file" };
  }
};

// ==================== AUCTION STATE ====================

export const saveAuctionState = async (state) => {
  localStorage.setItem(AUCTION_STATE_KEY, JSON.stringify(state));
};

export const getAuctionState = async () => {
  const data = localStorage.getItem(AUCTION_STATE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearAuctionState = async () => {
  localStorage.removeItem(AUCTION_STATE_KEY);
};
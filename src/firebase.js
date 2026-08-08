import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  getDoc
} from "firebase/firestore";

// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDhUMeLdyUs8nIk7eIAxCTLwgwnnaYM3Zo",
  authDomain: "ipl-auction-2027.firebaseapp.com",
  projectId: "ipl-auction-2027",
  storageBucket: "ipl-auction-2027.firebasestorage.app",
  messagingSenderId: "818922806903",
  appId: "1:818922806903:web:f47885cc763745bfcef072",
  measurementId: "G-7Y47RVDEWF"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const PLAYERS_COLLECTION = "players";
const AUCTION_DOC = "auction_state";
const STATE_COLLECTION = "state";

// ==================== PLAYERS ====================

export const getAllPlayers = async () => {
  try {
    const snapshot = await getDocs(collection(db, PLAYERS_COLLECTION));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error getting players:", err);
    return [];
  }
};

export const addPlayer = async (player) => {
  try {
    const players = await getAllPlayers();

    const nameExists = players.find(
      (p) => p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
    );
    if (nameExists) {
      return { success: false, error: "This name is already registered!" };
    }

    if (player.isCaptain && player.captainTeam) {
      const teamCaptainExists = players.find(
        (p) => p.isCaptain === true && p.captainTeam === player.captainTeam
      );
      if (teamCaptainExists) {
        return {
          success: false,
          error: `${player.captainTeam} already has a captain: ${teamCaptainExists.name}!`
        };
      }
    }

    const id = Date.now().toString();
    const newPlayer = {
      ...player,
      registeredAt: new Date().toISOString(),
    };

    await setDoc(doc(db, PLAYERS_COLLECTION, id), newPlayer);
    return { success: true, player: { id, ...newPlayer } };
  } catch (err) {
    console.error("Error adding player:", err);
    return { success: false, error: err.message };
  }
};

export const deletePlayer = async (playerId) => {
  try {
    await deleteDoc(doc(db, PLAYERS_COLLECTION, playerId));
    return true;
  } catch (err) {
    console.error("Error deleting player:", err);
    return false;
  }
};

export const deleteAllPlayers = async () => {
  try {
    const snapshot = await getDocs(collection(db, PLAYERS_COLLECTION));
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, PLAYERS_COLLECTION, d.id)));
    await Promise.all(deletePromises);
    await clearAuctionState();
    return true;
  } catch (err) {
    console.error("Error deleting all:", err);
    return false;
  }
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
    if (!Array.isArray(players)) return { success: false, error: "Invalid format" };
    
    for (const player of players) {
      const id = player.id || (Date.now().toString() + Math.random());
      const { id: _, ...playerData } = player;
      await setDoc(doc(db, PLAYERS_COLLECTION, id.toString()), playerData);
    }
    return { success: true, count: players.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ==================== AUCTION STATE ====================

export const saveAuctionState = async (state) => {
  try {
    // Deep clean - remove undefined values (Firestore rejects undefined)
    const cleanState = JSON.parse(JSON.stringify(state, (key, value) => {
      return value === undefined ? null : value;
    }));
    
    await setDoc(doc(db, STATE_COLLECTION, AUCTION_DOC), cleanState);
    console.log("✅ State saved to Firebase");
  } catch (err) {
    console.error("❌ Error saving state:", err);
    alert("Firebase Save Error: " + err.message);
  }
};

export const getAuctionState = async () => {
  try {
    const docSnap = await getDoc(doc(db, STATE_COLLECTION, AUCTION_DOC));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (err) {
    console.error("Error getting state:", err);
    return null;
  }
};

export const clearAuctionState = async () => {
  try {
    await deleteDoc(doc(db, STATE_COLLECTION, AUCTION_DOC));
  } catch (err) {
    console.error("Error clearing state:", err);
  }
};

// ==================== CAPTAIN LOGIN ====================

export const captainLogin = async (username, password) => {
  try {
    const players = await getAllPlayers();
    const captain = players.find(
      p => p.isCaptain === true &&
           p.username === username &&
           p.password === password
    );
    
    if (captain) {
      return { success: true, captain };
    }
    return { success: false, error: "Invalid username or password!" };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ==================== ADMIN LOGIN ====================

export const adminLogin = (username, password) => {
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123";
  
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return { success: true };
  }
  return { success: false, error: "Invalid admin credentials!" };
};
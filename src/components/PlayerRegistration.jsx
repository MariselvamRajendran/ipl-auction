import React, { useState, useEffect } from "react";
import { addPlayer, getAllPlayers } from "../firebase";
import teamsData from "../data/teams";
import "../styles/Registration.css";

function PlayerRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    battingStyle: "",
    bowlingStyle: "",
    basePrice: "1",
    isCaptain: false,
    captainTeam: "",
    country: "Indian",
  });

  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [registeredName, setRegisteredName] = useState("");
  const [wasCaptain, setWasCaptain] = useState(false);
  const [captainTeamName, setCaptainTeamName] = useState("");
  const [wasForeign, setWasForeign] = useState(false);
  const [takenTeams, setTakenTeams] = useState([]);
  const [pasteMessage, setPasteMessage] = useState("");

  const roleOptions = ["Batsman", "Bowler", "All Rounder", "Wicket Keeper"];
  const battingOptions = ["Right Hand Bat", "Left Hand Bat"];
  const bowlingOptions = [
    "Right Arm Fast", "Right Arm Medium", "Left Arm Fast", "Left Arm Medium",
    "Right Arm Off Spin", "Right Arm Leg Spin", "Left Arm Spin"
  ];
  const basePriceOptions = [
    { label: "₹1 Crore", value: "1" },
    { label: "₹1.5 Crore", value: "1.5" },
    { label: "₹2 Crore", value: "2" },
    { label: "₹2.5 Crore", value: "2.5" },
    { label: "₹3 Crore", value: "3" },
  ];

  useEffect(() => {
    loadTakenTeams();
  }, []);

  // ============ PASTE FROM CLIPBOARD ============
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          
          if (file.size > 2 * 1024 * 1024) {
            setError("Photo size must be less than 2MB");
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            setPhotoPreview(reader.result);
            setError("");
            setPasteMessage("✅ Image pasted successfully!");
            setTimeout(() => setPasteMessage(""), 3000);
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const loadTakenTeams = async () => {
    const players = await getAllPlayers();
    const captains = players.filter((p) => p.isCaptain && p.captainTeam);
    const teams = captains.map((c) => ({ team: c.captainTeam, captain: c.name }));
    setTakenTeams(teams);
  };

  const showBatting =
    formData.role === "Batsman" ||
    formData.role === "All Rounder" ||
    formData.role === "Wicket Keeper";

  const showBowling =
    formData.role === "Bowler" || formData.role === "All Rounder";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "role") {
      setFormData({ ...formData, role: value, battingStyle: "", bowlingStyle: "" });
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked, captainTeam: checked ? formData.captainTeam : "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTeamSelect = (teamShort) => {
    const taken = takenTeams.find((t) => t.team === teamShort);
    if (taken) {
      alert(`${teamShort} already has a captain: ${taken.captain}. Please select another team!`);
      return;
    }
    setFormData({ ...formData, captainTeam: teamShort });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Photo size must be less than 2MB"); return; }
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setError("");
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ============ PASTE BUTTON HANDLER ============
  const handlePasteButton = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            const blob = await clipboardItem.getType(type);
            
            if (blob.size > 2 * 1024 * 1024) {
              setError("Photo size must be less than 2MB");
              return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
              setPhotoPreview(reader.result);
              setError("");
              setPasteMessage("✅ Image pasted successfully!");
              setTimeout(() => setPasteMessage(""), 3000);
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      
      setError("No image found in clipboard. Copy an image first!");
    } catch (err) {
      setError("Cannot access clipboard. Please use Ctrl+V or file upload.");
    }
  };

  const removePhoto = () => {
    setPhotoPreview("");
    const input = document.getElementById("photo-input");
    if (input) input.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) { setError("Enter your name"); return; }
    if (!formData.role) { setError("Select playing role"); return; }
    if (!formData.country) { setError("Select country"); return; }
    if (showBatting && !formData.battingStyle) { setError("Select batting style"); return; }
    if (showBowling && !formData.bowlingStyle) { setError("Select bowling style"); return; }
    if (formData.isCaptain && !formData.captainTeam) { setError("Please select your team"); return; }

    setLoading(true);

    const newPlayer = {
      name: formData.name.trim(),
      role: formData.role,
      battingStyle: showBatting ? formData.battingStyle : "N/A",
      bowlingStyle: showBowling ? formData.bowlingStyle : "N/A",
      basePrice: Number(formData.basePrice),
      isCaptain: formData.isCaptain,
      captainTeam: formData.isCaptain ? formData.captainTeam : "",
      country: formData.country,
      isForeign: formData.country === "Foreign",
      photo: photoPreview || "",
      status: "registered",
    };

    const result = await addPlayer(newPlayer);

    if (result.success) {
      setRegisteredName(formData.name);
      setWasCaptain(formData.isCaptain);
      setCaptainTeamName(formData.captainTeam);
      setWasForeign(formData.country === "Foreign");
      setSuccess(true);
      loadTakenTeams();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setSuccess(false);
    setFormData({
      name: "", role: "", battingStyle: "", bowlingStyle: "",
      basePrice: "1", isCaptain: false, captainTeam: "", country: "Indian",
    });
    setPhotoPreview("");
    setRegisteredName("");
    setWasCaptain(false);
    setCaptainTeamName("");
    setWasForeign(false);
    loadTakenTeams();
  };

  const baseUrl = window.location.origin;
  const auctionUrl = wasCaptain
    ? `${baseUrl}/captain?name=${encodeURIComponent(registeredName)}`
    : `${baseUrl}/watch`;

  const copyUrl = () => {
    navigator.clipboard.writeText(auctionUrl);
    alert("URL copied!");
  };

  if (success) {
    return (
      <div className="reg-page">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h1>Registration Successful!</h1>
          <h2>
            {registeredName}
            {wasForeign && <span style={{ marginLeft: "8px", fontSize: "22px" }}>✈️</span>}
            {wasCaptain && <span className="captain-tag"> 👑 Captain</span>}
          </h2>
          {photoPreview && (
            <img src={photoPreview} alt="Player" className="success-photo" />
          )}
          <div className="success-details">
            <p>🌍 Country: <strong>{formData.country} {wasForeign && "✈️"}</strong></p>
            <p>🏏 Role: <strong>{formData.role}</strong></p>
            <p>💰 Base Price: <strong>₹{formData.basePrice} Crore</strong></p>
            {wasCaptain && (
              <p>👑 Captain of: <strong>{captainTeamName}</strong></p>
            )}
          </div>

          <div style={{
            background: wasCaptain ? "rgba(241, 196, 15, 0.15)" : "rgba(52, 152, 219, 0.15)",
            border: `2px solid ${wasCaptain ? "#f1c40f" : "#3498db"}`,
            padding: "20px",
            borderRadius: "15px",
            marginTop: "20px",
            marginBottom: "20px"
          }}>
            <h3 style={{
              color: wasCaptain ? "#f1c40f" : "#3498db",
              marginBottom: "10px",
              fontSize: "16px"
            }}>
              🔗 Your {wasCaptain ? "Captain" : "Watch"} Link
            </h3>
            <div style={{
              background: "#0a0a1a", padding: "12px", borderRadius: "8px",
              wordBreak: "break-all", fontFamily: "monospace", fontSize: "13px",
              color: "#3498db", marginBottom: "10px"
            }}>
              {auctionUrl}
            </div>
            <button onClick={copyUrl} style={{
              background: wasCaptain ? "#f1c40f" : "#3498db",
              color: wasCaptain ? "#000" : "#fff",
              border: "none", padding: "10px 20px", borderRadius: "8px",
              cursor: "pointer", fontWeight: "bold", fontSize: "14px", width: "100%"
            }}>
              📋 Copy Link
            </button>
          </div>

          <p className="success-msg">
            You are registered for IPL Auction 2026! 🎉
          </p>
          <button className="reg-btn" onClick={resetForm}>
            Register Another Player
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reg-page">
      <div className="reg-container">
        <div className="reg-header">
          <h1>🏏 IPL AUCTION 2026</h1>
          <h2>Player Registration</h2>
          <p>Fill the form to register for the auction</p>
        </div>

        <form className="reg-form" onSubmit={handleSubmit}>
          {error && <div className="reg-error">{error}</div>}
          {pasteMessage && (
            <div style={{
              background: "rgba(46, 204, 113, 0.15)",
              border: "2px solid #2ecc71",
              color: "#2ecc71",
              padding: "12px",
              borderRadius: "10px",
              textAlign: "center",
              marginBottom: "15px",
              fontWeight: "bold"
            }}>
              {pasteMessage}
            </div>
          )}

          <div className="form-group">
            <label>Player Photo</label>
            
            {photoPreview ? (
              <div className="photo-upload-section">
                <div className="photo-preview-container">
                  <img src={photoPreview} alt="Preview" className="photo-preview" />
                  <button type="button" className="remove-photo-btn" onClick={removePhoto}>
                    ❌ Remove
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* OPTION 1: File Upload */}
                <label htmlFor="photo-input" style={{
                  border: "2px dashed #3498db",
                  borderRadius: "12px",
                  padding: "25px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "rgba(52, 152, 219, 0.05)",
                  transition: "0.3s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{ fontSize: "40px" }}>📸</span>
                  <span style={{ color: "#3498db", fontWeight: "bold", fontSize: "16px" }}>
                    Click to Upload Photo
                  </span>
                  <span style={{ color: "#888", fontSize: "12px" }}>
                    Max 2MB | JPG, PNG
                  </span>
                </label>
                <input 
                  type="file" 
                  id="photo-input" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                  style={{ display: "none" }} 
                />

                {/* OR DIVIDER */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: "5px 0"
                }}>
                  <div style={{ flex: 1, height: "1px", background: "#333" }}></div>
                  <span style={{ color: "#888", fontSize: "12px", fontWeight: "bold" }}>OR</span>
                  <div style={{ flex: 1, height: "1px", background: "#333" }}></div>
                </div>

                {/* OPTION 2: Paste from Clipboard */}
                <button
                  type="button"
                  onClick={handlePasteButton}
                  style={{
                    border: "2px dashed #f1c40f",
                    borderRadius: "12px",
                    padding: "25px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(241, 196, 15, 0.05)",
                    color: "#f1c40f",
                    transition: "0.3s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <span style={{ fontSize: "40px" }}>📋</span>
                  <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                    Paste from Clipboard
                  </span>
                  <span style={{ color: "#888", fontSize: "12px" }}>
                    Copy image (Ctrl+C) then click here
                  </span>
                  <span style={{ color: "#888", fontSize: "11px" }}>
                    Or press Ctrl+V anywhere
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" />
          </div>

          <div className="form-group">
            <label>Country *</label>
            <div className="country-group">
              <label className={`country-card ${formData.country === "Indian" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="country"
                  value="Indian"
                  checked={formData.country === "Indian"}
                  onChange={handleChange}
                />
                <span className="country-flag">🇮🇳</span>
                <div className="country-info">
                  <strong>Indian Player</strong>
                  <small>No limit per team</small>
                </div>
              </label>

              <label className={`country-card foreign ${formData.country === "Foreign" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="country"
                  value="Foreign"
                  checked={formData.country === "Foreign"}
                  onChange={handleChange}
                />
                <span className="country-flag">✈️</span>
                <div className="country-info">
                  <strong>Foreign Player</strong>
                  <small>Max 4 per team</small>
                </div>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Playing Role *</label>
            <div className="radio-group">
              {roleOptions.map((r) => (
                <label key={r} className={`radio-card ${formData.role === r ? "selected" : ""}`}>
                  <input type="radio" name="role" value={r} checked={formData.role === r} onChange={handleChange} />
                  <span className="radio-emoji">
                    {r === "Batsman" ? "🏏" : r === "Bowler" ? "🎯" : r === "All Rounder" ? "⭐" : "🧤"}
                  </span>
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {showBatting && (
            <div className="form-group">
              <label>Batting Style *</label>
              <select name="battingStyle" value={formData.battingStyle} onChange={handleChange}>
                <option value="">Select Batting Style</option>
                {battingOptions.map((b) => (<option key={b} value={b}>{b}</option>))}
              </select>
            </div>
          )}

          {showBowling && (
            <div className="form-group">
              <label>Bowling Style *</label>
              <select name="bowlingStyle" value={formData.bowlingStyle} onChange={handleChange}>
                <option value="">Select Bowling Style</option>
                {bowlingOptions.map((b) => (<option key={b} value={b}>{b}</option>))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Base Price *</label>
            <div className="price-group">
              {basePriceOptions.map((p) => (
                <label key={p.value} className={`price-card ${formData.basePrice === p.value ? "selected" : ""}`}>
                  <input type="radio" name="basePrice" value={p.value} checked={formData.basePrice === p.value} onChange={handleChange} />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className={`captain-checkbox ${formData.isCaptain ? "selected" : ""}`}>
              <input type="checkbox" name="isCaptain" checked={formData.isCaptain} onChange={handleChange} />
              <span className="captain-icon">👑</span>
              <div className="captain-text">
                <strong>Are you a Captain?</strong>
                <small>Tick only if you are a team captain</small>
              </div>
            </label>
          </div>

          {formData.isCaptain && (
            <div className="form-group captain-team-section">
              <label>👑 Select Your Team *</label>
              <p className="captain-team-hint">Which team are you captain of?</p>
              {teamsData.filter(t => !takenTeams.find(tk => tk.team === t.short)).length === 0 ? (
                <div style={{
                  padding: "20px", background: "rgba(231, 76, 60, 0.15)",
                  border: "2px solid #e74c3c", borderRadius: "10px",
                  textAlign: "center", color: "#e74c3c"
                }}>
                  ⚠️ All 10 teams already have captains!
                </div>
              ) : (
                <div className="teams-grid-reg">
                  {teamsData.map((team) => {
                    const taken = takenTeams.find(t => t.team === team.short);
                    const isSelected = formData.captainTeam === team.short;

                    return (
                      <div
                        key={team.id}
                        className={`team-select-card ${isSelected ? "selected" : ""}`}
                        style={{
                          borderColor: isSelected ? team.color : taken ? "#e74c3c" : "#333",
                          opacity: taken ? 0.4 : 1,
                          cursor: taken ? "not-allowed" : "pointer",
                          position: "relative"
                        }}
                        onClick={() => !taken && handleTeamSelect(team.short)}
                      >
                        <img src={team.logo} alt={team.short} className="team-select-logo"
                          onError={(e) => { e.target.style.display = "none"; }} />
                        <div className="team-select-info">
                          <strong style={{ color: team.color }}>{team.short}</strong>
                          <small>{taken ? `Taken by ${taken.captain}` : team.name}</small>
                        </div>
                        {isSelected && (<span className="team-check">✅</span>)}
                        {taken && (<span style={{ position: "absolute", top: "5px", right: "5px", fontSize: "16px" }}>🔒</span>)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button type="submit" className="reg-btn" disabled={loading}>
            {loading ? "⏳ Registering..." : "🏏 Register for Auction"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PlayerRegistration;
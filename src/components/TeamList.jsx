import React from "react";
import TeamCard from "./TeamCard";

function TeamList({ teams, selectedTeam, onSelect }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: "20px",
      padding: "0 30px 40px 30px",
      maxWidth: "1400px",
      margin: "0 auto"
    }}>
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          isSelected={selectedTeam && selectedTeam.id === team.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default TeamList;
function generateTeams(players, teamSize = 2, balanceSkills = false) {
  const teams = [];
  const teamNames = ['Dragones', 'Elfos', 'Enanos', 'Magos', 'Caballeros', 'Arqueros', 'Hechiceros', 'Paladines'];
  
  let teamIndex = 0;
  let currentTeam = [];

  for (let i = 0; i < players.length; i++) {
    currentTeam.push(players[i]);

    if (currentTeam.length === teamSize || i === players.length - 1) {
      teams.push({
        name: teamNames[teamIndex % teamNames.length],
        members: currentTeam,
      });
      currentTeam = [];
      teamIndex++;
    }
  }

  return teams;
}

module.exports = { generateTeams };

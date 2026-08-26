// lib/teams.ts
import { prisma } from './prisma';

const TEAM_NAMES = [
  'Dragones de Obsidiana',
  'Fénix Dorado',
  'Lobos del Eclipse',
  'Guardianes del Alba',
  'Magos del Reino Antiguo',
  'Caballeros del Eclipse',
  'Arqueros de Cristal',
  'Enanos de la Forja',
  'Elfos Lunares',
  'Centinelas del Abismo',
  'Titanes de Piedra',
  'Sombras Nocturnas',
  'Guardianes de Fuego',
  'Cazadores de Estrellas',
  'Reyes del Calabozo',
  'Héroes Legendarios',
  'Buscadores de Tesoros',
  'Guardianes del Trono',
  'Invasores de las Sombras',
  'Conquistadores del Mal',
];

interface PlayerForTeaming {
  id: string;
  displayName: string;
  avatarKey: string;
  roleClass: string;
}

/**
 * Generate teams from a list of ready players
 * @param players List of players ready to play
 * @param teamSize Desired team size (default 5)
 * @param allowIncomplete Whether to allow incomplete teams (default true)
 * @returns Array of team configurations
 */
export function generateTeams(
  players: PlayerForTeaming[],
  teamSize: number = 5,
  allowIncomplete: boolean = true
): Array<{ name: string; members: PlayerForTeaming[] }> {
  // Shuffle players
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  const teams: Array<{ name: string; members: PlayerForTeaming[] }> = [];
  let playerIndex = 0;

  // Create full teams
  while (playerIndex + teamSize <= shuffled.length) {
    const teamMembers = shuffled.slice(playerIndex, playerIndex + teamSize);
    const teamName = TEAM_NAMES[teams.length % TEAM_NAMES.length];
    teams.push({ name: teamName, members: teamMembers });
    playerIndex += teamSize;
  }

  // Handle remaining players
  const remaining = shuffled.length - playerIndex;

  if (remaining === 0) {
    // All players distributed perfectly
    return teams;
  }

  if (remaining === teamSize - 1 && allowIncomplete) {
    // Last team has teamSize - 1 members (e.g., 4 members in a 5-person team)
    const teamMembers = shuffled.slice(playerIndex);
    const teamName = TEAM_NAMES[teams.length % TEAM_NAMES.length];
    teams.push({ name: teamName, members: teamMembers });
    return teams;
  }

  // Distribute remaining players into existing teams (if any)
  if (teams.length > 0) {
    for (let i = 0; i < remaining; i++) {
      teams[i % teams.length].members.push(shuffled[playerIndex + i]);
    }
    return teams;
  }

  // If we can't form even one full team, but allowIncomplete is true
  if (allowIncomplete && remaining > 0) {
    const teamMembers = shuffled.slice(playerIndex);
    const teamName = TEAM_NAMES[0];
    teams.push({ name: teamName, members: teamMembers });
  }

  return teams;
}

/**
 * Get a random team name that hasn't been used yet
 */
export function getRandomTeamName(usedNames: Set<string> = new Set()): string {
  const availableNames = TEAM_NAMES.filter(name => !usedNames.has(name));
  if (availableNames.length === 0) {
    return TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)];
  }
  return availableNames[Math.floor(Math.random() * availableNames.length)];
}

import {
  MAX_PLAYERS,
  MAX_TEAMS,
  MIN_PLAYERS_TO_START,
  PLAYERS_PER_TEAM,
  TEAM_NAMES as PACK_TEAM_NAMES,
} from './pack';

export const TEAM_NAMES: string[] = PACK_TEAM_NAMES;

export { PLAYERS_PER_TEAM, MAX_PLAYERS, MAX_TEAMS, MIN_PLAYERS_TO_START };

export interface PlayerForTeaming {
  id: string;
  displayName: string;
  avatarKey: string;
  roleClass?: string;
}

export interface TeamDraft {
  name: string;
  members: PlayerForTeaming[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = copy[i];
    copy[i] = copy[j];
    copy[j] = current;
  }
  return copy;
}

export function generateTeams(
  players: PlayerForTeaming[],
  teamSize: number = PLAYERS_PER_TEAM
): TeamDraft[] {
  const eligible = players.slice(0, MAX_PLAYERS);
  const shuffled = shuffle(eligible);
  const teams: TeamDraft[] = [];
  let index = 0;

  while (index < shuffled.length && teams.length < MAX_TEAMS) {
    const remainingPlayers = shuffled.length - index;
    const remainingTeamSlots = MAX_TEAMS - teams.length;
    const isLastAllowedTeam = remainingTeamSlots === 1;
    const takeCount = isLastAllowedTeam
      ? remainingPlayers
      : Math.min(teamSize, remainingPlayers);

    teams.push({
      name: TEAM_NAMES[teams.length] || `Team ${teams.length + 1}`,
      members: shuffled.slice(index, index + takeCount),
    });
    index += takeCount;
  }

  return teams;
}

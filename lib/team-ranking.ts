import { TOTAL_QUESTIONS } from '@/data/pack';

export function isActivePlayer(player: {
  answeredCount?: number;
  correctCount?: number;
  totalTimeSeconds?: number;
}) {
  return (
    (player.answeredCount || 0) > 0 ||
    (player.correctCount || 0) > 0 ||
    (player.totalTimeSeconds || 0) > 0
  );
}

export function countActivePlayers(
  players: Array<{
    answeredCount?: number;
    correctCount?: number;
    totalTimeSeconds?: number;
  }>
) {
  return players.filter(isActivePlayer).length;
}

export function activePlayerDenominator(activePlayerCount: number) {
  return Math.max(1, activePlayerCount || 0);
}

export function participatingMemberCount(team: {
  members?: unknown[] | string[];
  memberCount?: number;
}) {
  if (Array.isArray(team.members) && team.members.length > 0) {
    return team.members.length;
  }
  return Math.max(0, team.memberCount || 0);
}

export function normalizedTeamScore(totalCorrect: number, activePlayerCount: number) {
  return totalCorrect / (activePlayerDenominator(activePlayerCount) * TOTAL_QUESTIONS);
}

export function teamAccuracyPercent(totalCorrect: number, activePlayerCount: number) {
  return Math.round(normalizedTeamScore(totalCorrect, activePlayerCount) * 100);
}

export function formatAccuracyPercent(percent: number) {
  return `${percent}%`;
}

export function formatAccuracyLabel(percent: number) {
  return `${percent}% Accuracy`;
}

export function formatActivePlayers(count: number) {
  return `${count} active player${count === 1 ? '' : 's'}`;
}

export function formatPlayersRoster(activePlayerCount: number, registeredCount: number) {
  return `Players: ${activePlayerCount} active / ${registeredCount} registered`;
}

export function resolveActivePlayerCount(team: {
  members?: Array<{
    answeredCount?: number;
    correctCount?: number;
    totalTimeSeconds?: number;
  }>;
  activePlayerCount?: number;
}) {
  if (Array.isArray(team.members) && team.members.length > 0) {
    return countActivePlayers(team.members);
  }
  return team.activePlayerCount || 0;
}

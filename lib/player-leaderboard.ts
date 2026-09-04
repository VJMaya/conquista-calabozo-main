export interface PlayerLeaderboardRow {
  id?: string;
  userId?: string;
  displayName: string;
  answeredCount?: number;
  correctCount?: number;
  totalTimeSeconds?: number;
  points?: number;
}

export function averageResponseTime(player: PlayerLeaderboardRow) {
  const answered = player.answeredCount || 0;
  if (answered <= 0) return Number.POSITIVE_INFINITY;
  return (player.totalTimeSeconds || 0) / answered;
}

export function formatAverageTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '—';
  return `${seconds.toFixed(1)}s`;
}

export function comparePlayerLeaderboardRows(a: PlayerLeaderboardRow, b: PlayerLeaderboardRow) {
  const correctDelta = (b.correctCount || 0) - (a.correctCount || 0);
  if (correctDelta !== 0) return correctDelta;
  const timeDelta = averageResponseTime(a) - averageResponseTime(b);
  if (timeDelta !== 0) return timeDelta;
  return (b.points || 0) - (a.points || 0);
}

export function top10PlayersFrom(players: PlayerLeaderboardRow[]) {
  return [...players].sort(comparePlayerLeaderboardRows).slice(0, 10);
}

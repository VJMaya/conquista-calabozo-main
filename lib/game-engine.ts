import {
  getQuestionAtIndex,
  QUESTIONS,
  QUESTIONS_PER_STAGE,
  TOTAL_QUESTIONS,
  toPublicQuestion,
} from '@/data/questions';
import { getStageByNumber, getStageNumberForQuestionIndex, TOTAL_STAGES } from '@/data/stages';
import {
  generateTeams,
  MAX_PLAYERS,
  MAX_TEAMS,
  MIN_PLAYERS_TO_START,
  PLAYERS_PER_TEAM,
  type PlayerForTeaming,
} from '@/data/teams';

export const GAME_CONSTANTS = {
  PLAYERS_PER_TEAM,
  MAX_PLAYERS,
  MAX_TEAMS,
  MIN_PLAYERS_TO_START,
  TOTAL_STAGES,
  TOTAL_QUESTIONS,
  QUESTIONS_PER_STAGE,
};

export interface PlayerAnswerRecord {
  answer: string;
  timeUsedSeconds: number;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface RuntimePlayer {
  id: string;
  displayName: string;
  avatarKey: string;
  roleClass?: string;
  socketId?: string;
  isConnected: boolean;
  isReady?: boolean;
  teamId?: string;
  answeredCount: number;
  correctCount: number;
  totalTimeSeconds: number;
  points: number;
}

export interface RuntimeTeam {
  id: string;
  name: string;
  members: string[];
  currentQuestionIndex: number;
  currentStage: number;
  totalCorrect: number;
  totalTimeSeconds: number;
  finalScore: number;
  completed: boolean;
  finishedAt: number | null;
  questionStartedAt: number | null;
  answersThisQuestion: Record<string, PlayerAnswerRecord>;
  activePlayerCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  totalCorrect: number;
  totalTimeSeconds: number;
  finalScore: number;
  currentStage: number;
  completed: boolean;
  memberCount: number;
  activePlayerCount: number;
  normalizedScore: number;
  accuracyPercent: number;
}

export interface PlayerStanding {
  userId: string;
  displayName: string;
  avatarKey: string;
  teamId: string;
  teamName: string;
  answeredCount: number;
  correctCount: number;
  totalTimeSeconds: number;
  points: number;
}

export interface ScoreResult {
  isCorrect: boolean;
  pointsAwarded: number;
  correctAnswer: string;
  timeUsedSeconds: number;
}

export function createId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function canStartGame(playerCount: number): { ok: boolean; message?: string } {
  if (playerCount < MIN_PLAYERS_TO_START) {
    return { ok: false, message: `At least ${MIN_PLAYERS_TO_START} players are required` };
  }
  if (playerCount > MAX_PLAYERS) {
    return { ok: false, message: `Maximum of ${MAX_PLAYERS} players exceeded` };
  }
  return { ok: true };
}

export function createTeamAssignments(players: PlayerForTeaming[]) {
  return generateTeams(players, PLAYERS_PER_TEAM);
}

export function createRuntimeTeam(id: string, name: string, memberIds: string[]): RuntimeTeam {
  return {
    id,
    name,
    members: memberIds,
    currentQuestionIndex: 0,
    currentStage: 1,
    totalCorrect: 0,
    totalTimeSeconds: 0,
    finalScore: 0,
    completed: false,
    finishedAt: null,
    questionStartedAt: null,
    answersThisQuestion: {},
    activePlayerCount: 0,
  };
}

export function createRuntimePlayer(
  player: PlayerForTeaming & { socketId?: string; isConnected?: boolean }
): RuntimePlayer {
  return {
    id: player.id,
    displayName: player.displayName,
    avatarKey: player.avatarKey,
    roleClass: player.roleClass,
    socketId: player.socketId,
    isConnected: player.isConnected ?? true,
    isReady: false,
    answeredCount: 0,
    correctCount: 0,
    totalTimeSeconds: 0,
    points: 0,
  };
}

export function scoreAnswer(
  questionIndex: number,
  submittedAnswer: string,
  timeUsedSeconds: number
): ScoreResult {
  const question = getQuestionAtIndex(questionIndex);
  if (!question) {
    return { isCorrect: false, pointsAwarded: 0, correctAnswer: '', timeUsedSeconds: 0 };
  }

  const isCorrect =
    submittedAnswer.trim().toUpperCase() === String(question.correctAnswer).trim().toUpperCase();
  const cappedTime = Math.max(0, Math.min(timeUsedSeconds, question.timeLimitSeconds));
  const timeBonus = isCorrect ? Math.max(0, question.timeLimitSeconds - cappedTime) : 0;

  return {
    isCorrect,
    pointsAwarded: isCorrect ? question.pointsBase + timeBonus : 0,
    correctAnswer: question.correctAnswer,
    timeUsedSeconds: cappedTime,
  };
}

export function calculateScores(players: RuntimePlayer[]): number {
  return players.reduce((sum, player) => sum + (player.points || 0), 0);
}

export function calculateCorrectAnswers(team: RuntimeTeam): number {
  return team.totalCorrect;
}

export function calculateTotalCompletionTime(team: RuntimeTeam): number {
  return team.totalTimeSeconds;
}

/**
 * Team totals are derived from member aggregates, never incremented in place,
 * so repeated calls stay idempotent.
 */
export function recalculateTeamTotals(
  team: RuntimeTeam,
  playersById: Map<string, RuntimePlayer>
): RuntimeTeam {
  let totalCorrect = 0;
  let totalTimeSeconds = 0;
  let finalScore = 0;
  let activePlayerCount = 0;

  team.members.forEach((memberId) => {
    const player = playersById.get(memberId);
    if (!player) return;
    totalCorrect += player.correctCount || 0;
    totalTimeSeconds += player.totalTimeSeconds || 0;
    finalScore += player.points || 0;
    if (
      (player.answeredCount || 0) > 0 ||
      (player.correctCount || 0) > 0 ||
      (player.totalTimeSeconds || 0) > 0
    ) {
      activePlayerCount += 1;
    }
  });

  team.totalCorrect = totalCorrect;
  team.totalTimeSeconds = totalTimeSeconds;
  team.finalScore = finalScore;
  team.activePlayerCount = activePlayerCount;
  return team;
}

export function publicQuestionPayload(questionIndex: number) {
  const question = getQuestionAtIndex(questionIndex);
  if (!question) return null;

  const stage = getStageByNumber(question.stageNumber);
  return {
    ...toPublicQuestion(question, questionIndex),
    stageTitle: stage?.title || `Stage ${question.stageNumber}`,
    stageDescription: stage?.description || '',
    visualTheme: stage?.visualTheme || '',
  };
}

export function elapsedQuestionSeconds(team: RuntimeTeam, now: number = Date.now()): number {
  const question = getQuestionAtIndex(team.currentQuestionIndex);
  const limit = question?.timeLimitSeconds ?? 0;
  if (!team.questionStartedAt) return limit;
  return Math.max(0, Math.min(limit, Math.round((now - team.questionStartedAt) / 1000)));
}

export function isQuestionTimedOut(team: RuntimeTeam, now: number = Date.now()): boolean {
  const question = getQuestionAtIndex(team.currentQuestionIndex);
  if (!question || !team.questionStartedAt || team.completed) return false;
  return now - team.questionStartedAt >= question.timeLimitSeconds * 1000;
}

export function allConnectedMembersAnswered(
  team: RuntimeTeam,
  connectedMemberIds: string[]
): boolean {
  if (connectedMemberIds.length === 0) return false;
  return connectedMemberIds.every((memberId) => Boolean(team.answersThisQuestion[memberId]));
}

export function shouldAutoAdvanceTeam(team: RuntimeTeam, connectedMemberIds: string[]): boolean {
  if (team.completed) return false;
  return allConnectedMembersAnswered(team, connectedMemberIds) || isQuestionTimedOut(team);
}

export function recordPlayerAnswer(
  team: RuntimeTeam,
  player: RuntimePlayer,
  submittedAnswer: string,
  now: number = Date.now()
): { team: RuntimeTeam; player: RuntimePlayer; result: ScoreResult; alreadyAnswered: boolean } {
  if (team.answersThisQuestion[player.id]) {
    return {
      team,
      player,
      alreadyAnswered: true,
      result: {
        isCorrect: team.answersThisQuestion[player.id].isCorrect,
        pointsAwarded: team.answersThisQuestion[player.id].pointsAwarded,
        correctAnswer: getQuestionAtIndex(team.currentQuestionIndex)?.correctAnswer || '',
        timeUsedSeconds: team.answersThisQuestion[player.id].timeUsedSeconds,
      },
    };
  }

  const result = scoreAnswer(team.currentQuestionIndex, submittedAnswer, elapsedQuestionSeconds(team, now));
  const wasActive =
    (player.answeredCount || 0) > 0 ||
    (player.correctCount || 0) > 0 ||
    (player.totalTimeSeconds || 0) > 0;
  team.answersThisQuestion[player.id] = {
    answer: submittedAnswer,
    timeUsedSeconds: result.timeUsedSeconds,
    isCorrect: result.isCorrect,
    pointsAwarded: result.pointsAwarded,
  };

  player.answeredCount = (player.answeredCount || 0) + 1;
  if (result.isCorrect) player.correctCount += 1;
  player.totalTimeSeconds += result.timeUsedSeconds;
  player.points += result.pointsAwarded;
  if (!wasActive) {
    team.activePlayerCount = (team.activePlayerCount || 0) + 1;
  }

  return { team, player, result, alreadyAnswered: false };
}

export function applyTimeoutMisses(
  team: RuntimeTeam,
  playersById: Map<string, RuntimePlayer>,
  connectedMemberIds: string[]
): RuntimePlayer[] {
  const question = getQuestionAtIndex(team.currentQuestionIndex);
  const timeUsed = question?.timeLimitSeconds ?? 0;
  const missedPlayers: RuntimePlayer[] = [];

  connectedMemberIds.forEach((memberId) => {
    if (team.answersThisQuestion[memberId]) return;
    const miss = scoreAnswer(team.currentQuestionIndex, '', timeUsed);
    team.answersThisQuestion[memberId] = {
      answer: '',
      timeUsedSeconds: miss.timeUsedSeconds,
      isCorrect: false,
      pointsAwarded: 0,
    };
    const player = playersById.get(memberId);
    if (player) {
      player.answeredCount = (player.answeredCount || 0) + 1;
      player.totalTimeSeconds += miss.timeUsedSeconds;
      missedPlayers.push(player);
    }
  });

  return missedPlayers;
}

export function beginTeamQuestion(team: RuntimeTeam, now: number = Date.now()): RuntimeTeam {
  const payload = publicQuestionPayload(team.currentQuestionIndex);
  team.answersThisQuestion = {};
  team.questionStartedAt = now;
  team.currentStage = payload?.stageNumber || getStageNumberForQuestionIndex(team.currentQuestionIndex);
  team.completed = false;
  team.finishedAt = null;
  return team;
}

export function completeTeamQuestionAndAdvance(
  team: RuntimeTeam,
  playersById: Map<string, RuntimePlayer>,
  connectedMemberIds: string[],
  timedOut: boolean,
  now: number = Date.now()
): {
  team: RuntimeTeam;
  finished: boolean;
  nextQuestion: ReturnType<typeof publicQuestionPayload>;
  timeoutMisses: RuntimePlayer[];
} {
  const timeoutMisses = timedOut
    ? applyTimeoutMisses(team, playersById, connectedMemberIds)
    : [];

  recalculateTeamTotals(team, playersById);
  team.currentQuestionIndex += 1;

  if (team.currentQuestionIndex >= TOTAL_QUESTIONS) {
    team.completed = true;
    team.finishedAt = now;
    team.currentStage = TOTAL_STAGES;
    team.questionStartedAt = null;
    team.answersThisQuestion = {};
    return { team, finished: true, nextQuestion: null, timeoutMisses };
  }

  beginTeamQuestion(team, now);
  return {
    team,
    finished: false,
    nextQuestion: publicQuestionPayload(team.currentQuestionIndex),
    timeoutMisses,
  };
}

export function participatingMemberCount(team: RuntimeTeam): number {
  return Array.isArray(team.members) ? team.members.length : 0;
}

export function activePlayerCountForTeam(team: RuntimeTeam): number {
  return Math.max(1, team.activePlayerCount || 0);
}

export function normalizedScoreForTeam(team: RuntimeTeam): number {
  const possible = activePlayerCountForTeam(team) * TOTAL_QUESTIONS;
  return team.totalCorrect / possible;
}

export function compareTeams(a: RuntimeTeam, b: RuntimeTeam): number {
  const scoreA = normalizedScoreForTeam(a);
  const scoreB = normalizedScoreForTeam(b);
  if (scoreA !== scoreB) {
    return scoreB - scoreA;
  }
  if (a.totalTimeSeconds !== b.totalTimeSeconds) {
    return a.totalTimeSeconds - b.totalTimeSeconds;
  }
  return b.totalCorrect - a.totalCorrect;
}

export function buildLeaderboard(teams: RuntimeTeam[]): LeaderboardEntry[] {
  return [...teams]
    .sort(compareTeams)
    .map((team, index) => {
      const memberCount = participatingMemberCount(team);
      const activePlayerCount = team.activePlayerCount || 0;
      const normalizedScore = normalizedScoreForTeam(team);
      return {
        rank: index + 1,
        teamId: team.id,
        teamName: team.name,
        totalCorrect: team.totalCorrect,
        totalTimeSeconds: team.totalTimeSeconds,
        finalScore: team.finalScore,
        currentStage: team.currentStage,
        completed: team.completed,
        memberCount,
        activePlayerCount,
        normalizedScore,
        accuracyPercent: Math.round(normalizedScore * 100),
      };
    });
}

export function determineWinningTeam(teams: RuntimeTeam[]): LeaderboardEntry | null {
  return buildLeaderboard(teams)[0] || null;
}

export function buildPlayerStandings(
  players: RuntimePlayer[],
  teams: Map<string, RuntimeTeam>
): PlayerStanding[] {
  return players
    .map((player) => {
      const team = player.teamId ? teams.get(player.teamId) : undefined;
      return {
        userId: player.id,
        displayName: player.displayName,
        avatarKey: player.avatarKey,
        teamId: player.teamId || '',
        teamName: team?.name || 'Unassigned',
        answeredCount: player.answeredCount || 0,
        correctCount: player.correctCount,
        totalTimeSeconds: player.totalTimeSeconds,
        points: player.points,
      };
    })
    .sort((a, b) => {
      if (a.correctCount !== b.correctCount) return b.correctCount - a.correctCount;
      if (a.totalTimeSeconds !== b.totalTimeSeconds) return a.totalTimeSeconds - b.totalTimeSeconds;
      return b.points - a.points;
    });
}

export function computeMvp(standings: PlayerStanding[]): PlayerStanding | null {
  return standings[0] || null;
}

export function determineMvpPlayer(
  players: RuntimePlayer[],
  teams: RuntimeTeam[]
): PlayerStanding | null {
  return computeMvp(buildPlayerStandings(players, new Map(teams.map((team) => [team.id, team]))));
}

export function allTeamsCompleted(teams: RuntimeTeam[]): boolean {
  return teams.length > 0 && teams.every((team) => team.completed);
}

export function createFinalResults(teams: RuntimeTeam[], players: RuntimePlayer[]) {
  const playersById = new Map(players.map((player) => [player.id, player]));
  teams.forEach((team) => recalculateTeamTotals(team, playersById));
  const leaderboard = buildLeaderboard(teams);
  const standings = buildPlayerStandings(players, new Map(teams.map((team) => [team.id, team])));
  const totalCorrectAnswers = players.reduce((sum, player) => sum + player.correctCount, 0);
  const totalPossibleAnswers = players.length * TOTAL_QUESTIONS;

  return {
    champion: determineWinningTeam(teams),
    top3: leaderboard.slice(0, 3),
    mvp: computeMvp(standings),
    leaderboard,
    standings,
    stats: {
      totalPlayers: players.length,
      totalTeams: teams.length,
      totalQuestions: TOTAL_QUESTIONS,
      totalStages: TOTAL_STAGES,
      totalCorrectAnswers,
      totalPossibleAnswers,
      accuracyPercent:
        totalPossibleAnswers === 0
          ? 0
          : Math.round((totalCorrectAnswers / totalPossibleAnswers) * 100),
    },
  };
}

export { QUESTIONS, TOTAL_QUESTIONS, TOTAL_STAGES, generateTeams, getQuestionAtIndex };

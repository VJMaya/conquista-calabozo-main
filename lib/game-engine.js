const pack = require('../data/pack.json');

const QUESTIONS = pack.questions;
const STAGES = pack.stages;
const TEAM_NAMES = pack.teamNames;
const PACK_CONSTANTS = pack.constants || {};

const PLAYERS_PER_TEAM = PACK_CONSTANTS.PLAYERS_PER_TEAM;
const MAX_PLAYERS = PACK_CONSTANTS.MAX_PLAYERS;
const MAX_TEAMS = PACK_CONSTANTS.MAX_TEAMS;
const MIN_PLAYERS_TO_START = PACK_CONSTANTS.MIN_PLAYERS_TO_START;
const QUESTIONS_PER_STAGE = PACK_CONSTANTS.QUESTIONS_PER_STAGE;
const TOTAL_QUESTIONS = QUESTIONS.length;
const TOTAL_STAGES = STAGES.length;

const GAME_CONSTANTS = {
  PLAYERS_PER_TEAM,
  MAX_PLAYERS,
  MAX_TEAMS,
  MIN_PLAYERS_TO_START,
  TOTAL_STAGES,
  TOTAL_QUESTIONS,
  QUESTIONS_PER_STAGE,
};

function createId() {
  return Math.random().toString(36).slice(2, 11);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = copy[i];
    copy[i] = copy[j];
    copy[j] = current;
  }
  return copy;
}

function generateTeams(players, teamSize = PLAYERS_PER_TEAM) {
  const eligible = players.slice(0, MAX_PLAYERS);
  const shuffled = shuffle(eligible);
  const teams = [];
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

function canStartGame(playerCount) {
  if (playerCount < MIN_PLAYERS_TO_START) {
    return { ok: false, message: `At least ${MIN_PLAYERS_TO_START} players are required` };
  }
  if (playerCount > MAX_PLAYERS) {
    return { ok: false, message: `Maximum of ${MAX_PLAYERS} players exceeded` };
  }
  return { ok: true };
}

function createTeamAssignments(players) {
  return generateTeams(players, PLAYERS_PER_TEAM);
}

function createRuntimeTeam(id, name, memberIds) {
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
  };
}

function createRuntimePlayer(player) {
  return {
    id: player.id,
    displayName: player.displayName,
    avatarKey: player.avatarKey,
    roleClass: player.roleClass,
    socketId: player.socketId,
    isConnected: player.isConnected !== false,
    isReady: false,
    answeredCount: 0,
    correctCount: 0,
    totalTimeSeconds: 0,
    points: 0,
  };
}

function getQuestionAtIndex(index) {
  return QUESTIONS[index];
}

function getStageByNumber(stageNumber) {
  return STAGES.find((stage) => stage.stageNumber === stageNumber);
}

function getStageNumberForQuestionIndex(questionIndex) {
  return Math.floor(questionIndex / QUESTIONS_PER_STAGE) + 1;
}

function toPublicQuestion(question, questionIndex) {
  return {
    id: question.id,
    stageNumber: question.stageNumber,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    pointsBase: question.pointsBase,
    timeLimitSeconds: question.timeLimitSeconds,
    difficulty: question.difficulty,
    questionType: 'multiple_choice',
    questionNumber: questionIndex + 1,
    totalQuestions: TOTAL_QUESTIONS,
  };
}

function publicQuestionPayload(questionIndex) {
  const question = getQuestionAtIndex(questionIndex);
  if (!question) return null;
  const stage = getStageByNumber(question.stageNumber);
  return {
    ...toPublicQuestion(question, questionIndex),
    stageTitle: stage ? stage.title : `Stage ${question.stageNumber}`,
    stageDescription: stage ? stage.description : '',
    visualTheme: stage ? stage.visualTheme : '',
  };
}

function scoreAnswer(questionIndex, submittedAnswer, timeUsedSeconds) {
  const question = getQuestionAtIndex(questionIndex);
  if (!question) {
    return { isCorrect: false, pointsAwarded: 0, correctAnswer: '', timeUsedSeconds: 0 };
  }

  const isCorrect =
    String(submittedAnswer || '').trim().toUpperCase() ===
    String(question.correctAnswer).trim().toUpperCase();
  const cappedTime = Math.max(0, Math.min(Number(timeUsedSeconds) || 0, question.timeLimitSeconds));
  const timeBonus = isCorrect ? Math.max(0, question.timeLimitSeconds - cappedTime) : 0;

  return {
    isCorrect,
    pointsAwarded: isCorrect ? question.pointsBase + timeBonus : 0,
    correctAnswer: question.correctAnswer,
    timeUsedSeconds: cappedTime,
  };
}

function calculateScores(players) {
  return players.reduce((sum, player) => sum + (player.points || 0), 0);
}

function calculateCorrectAnswers(team) {
  return team.totalCorrect;
}

function calculateTotalCompletionTime(team) {
  return team.totalTimeSeconds;
}

/**
 * Team totals are derived from member aggregates, never incremented in place,
 * so repeated calls stay idempotent.
 */
function recalculateTeamTotals(team, playersById) {
  let totalCorrect = 0;
  let totalTimeSeconds = 0;
  let finalScore = 0;

  team.members.forEach((memberId) => {
    const player = playersById.get(memberId);
    if (!player) return;
    totalCorrect += player.correctCount || 0;
    totalTimeSeconds += player.totalTimeSeconds || 0;
    finalScore += player.points || 0;
  });

  team.totalCorrect = totalCorrect;
  team.totalTimeSeconds = totalTimeSeconds;
  team.finalScore = finalScore;
  return team;
}

function elapsedQuestionSeconds(team, now) {
  const current = now || Date.now();
  const question = getQuestionAtIndex(team.currentQuestionIndex);
  const limit = question ? question.timeLimitSeconds : 0;
  if (!team.questionStartedAt) return limit;
  return Math.max(0, Math.min(limit, Math.round((current - team.questionStartedAt) / 1000)));
}

function isQuestionTimedOut(team, now) {
  const current = now || Date.now();
  const question = getQuestionAtIndex(team.currentQuestionIndex);
  if (!question || !team.questionStartedAt || team.completed) return false;
  return current - team.questionStartedAt >= question.timeLimitSeconds * 1000;
}

function allConnectedMembersAnswered(team, connectedMemberIds) {
  if (!connectedMemberIds || connectedMemberIds.length === 0) return false;
  return connectedMemberIds.every((memberId) => Boolean(team.answersThisQuestion[memberId]));
}

function shouldAutoAdvanceTeam(team, connectedMemberIds) {
  if (team.completed) return false;
  return allConnectedMembersAnswered(team, connectedMemberIds) || isQuestionTimedOut(team);
}

function recordPlayerAnswer(team, player, submittedAnswer, now) {
  if (team.answersThisQuestion[player.id]) {
    return {
      team,
      player,
      alreadyAnswered: true,
      result: {
        isCorrect: team.answersThisQuestion[player.id].isCorrect,
        pointsAwarded: team.answersThisQuestion[player.id].pointsAwarded,
        correctAnswer: (getQuestionAtIndex(team.currentQuestionIndex) || {}).correctAnswer || '',
        timeUsedSeconds: team.answersThisQuestion[player.id].timeUsedSeconds,
      },
    };
  }

  const result = scoreAnswer(
    team.currentQuestionIndex,
    submittedAnswer,
    elapsedQuestionSeconds(team, now || Date.now())
  );
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

  return { team, player, result, alreadyAnswered: false };
}

function applyTimeoutMisses(team, playersById, connectedMemberIds) {
  const question = getQuestionAtIndex(team.currentQuestionIndex);
  const timeUsed = question ? question.timeLimitSeconds : 0;
  const missedPlayers = [];

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

function beginTeamQuestion(team, now) {
  const payload = publicQuestionPayload(team.currentQuestionIndex);
  team.answersThisQuestion = {};
  team.questionStartedAt = now || Date.now();
  team.currentStage = payload
    ? payload.stageNumber
    : getStageNumberForQuestionIndex(team.currentQuestionIndex);
  team.completed = false;
  team.finishedAt = null;
  return team;
}

function completeTeamQuestionAndAdvance(team, playersById, connectedMemberIds, timedOut, now) {
  const current = now || Date.now();
  const timeoutMisses = timedOut
    ? applyTimeoutMisses(team, playersById, connectedMemberIds)
    : [];

  recalculateTeamTotals(team, playersById);
  team.currentQuestionIndex += 1;

  if (team.currentQuestionIndex >= TOTAL_QUESTIONS) {
    team.completed = true;
    team.finishedAt = current;
    team.currentStage = TOTAL_STAGES;
    team.questionStartedAt = null;
    team.answersThisQuestion = {};
    return { team, finished: true, nextQuestion: null, timeoutMisses };
  }

  beginTeamQuestion(team, current);
  return {
    team,
    finished: false,
    nextQuestion: publicQuestionPayload(team.currentQuestionIndex),
    timeoutMisses,
  };
}

function compareTeams(a, b) {
  if (a.totalCorrect !== b.totalCorrect) {
    return b.totalCorrect - a.totalCorrect;
  }
  return a.totalTimeSeconds - b.totalTimeSeconds;
}

function buildLeaderboard(teams) {
  return [...teams]
    .sort(compareTeams)
    .map((team, index) => ({
      rank: index + 1,
      teamId: team.id,
      teamName: team.name,
      totalCorrect: team.totalCorrect,
      totalTimeSeconds: team.totalTimeSeconds,
      finalScore: team.finalScore,
      currentStage: team.currentStage,
      completed: team.completed,
      memberCount: team.members.length,
    }));
}

function determineWinningTeam(teams) {
  return buildLeaderboard(teams)[0] || null;
}

function buildPlayerStandings(players, teamsById) {
  return players
    .map((player) => {
      const team = player.teamId ? teamsById.get(player.teamId) : undefined;
      return {
        userId: player.id,
        displayName: player.displayName,
        avatarKey: player.avatarKey,
        teamId: player.teamId || '',
        teamName: team ? team.name : 'Unassigned',
        answeredCount: player.answeredCount || 0,
        correctCount: player.correctCount || 0,
        totalTimeSeconds: player.totalTimeSeconds || 0,
        points: player.points || 0,
      };
    })
    .sort((a, b) => {
      if (a.correctCount !== b.correctCount) return b.correctCount - a.correctCount;
      if (a.totalTimeSeconds !== b.totalTimeSeconds) return a.totalTimeSeconds - b.totalTimeSeconds;
      return b.points - a.points;
    });
}

function computeMvp(standings) {
  return standings[0] || null;
}

function determineMvpPlayer(players, teams) {
  return computeMvp(buildPlayerStandings(players, new Map(teams.map((team) => [team.id, team]))));
}

function allTeamsCompleted(teams) {
  return teams.length > 0 && teams.every((team) => team.completed);
}

function createFinalResults(teams, players) {
  const leaderboard = buildLeaderboard(teams);
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const standings = buildPlayerStandings(players, teamsById);
  const totalCorrectAnswers = players.reduce((sum, player) => sum + (player.correctCount || 0), 0);
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

module.exports = {
  QUESTIONS,
  STAGES,
  TEAM_NAMES,
  PLAYERS_PER_TEAM,
  MAX_PLAYERS,
  MAX_TEAMS,
  MIN_PLAYERS_TO_START,
  QUESTIONS_PER_STAGE,
  TOTAL_QUESTIONS,
  TOTAL_STAGES,
  GAME_CONSTANTS,
  createId,
  generateTeams,
  canStartGame,
  createTeamAssignments,
  createRuntimeTeam,
  createRuntimePlayer,
  getQuestionAtIndex,
  getStageByNumber,
  getStageNumberForQuestionIndex,
  publicQuestionPayload,
  scoreAnswer,
  calculateScores,
  calculateCorrectAnswers,
  calculateTotalCompletionTime,
  recalculateTeamTotals,
  elapsedQuestionSeconds,
  isQuestionTimedOut,
  allConnectedMembersAnswered,
  shouldAutoAdvanceTeam,
  recordPlayerAnswer,
  applyTimeoutMisses,
  beginTeamQuestion,
  completeTeamQuestionAndAdvance,
  compareTeams,
  buildLeaderboard,
  determineWinningTeam,
  buildPlayerStandings,
  computeMvp,
  determineMvpPlayer,
  allTeamsCompleted,
  createFinalResults,
};

const pack = require('../data/pack.json');

const QUESTIONS = pack.questions;
const STAGES = pack.stages;
const TEAM_NAMES = pack.teamNames;

const PLAYERS_PER_TEAM = 5;
const MAX_PLAYERS = 250;
const MAX_TEAMS = 50;
const MIN_PLAYERS_TO_START = 2;
const QUESTIONS_PER_STAGE = 5;
const TOTAL_QUESTIONS = QUESTIONS.length;
const TOTAL_STAGES = STAGES.length;

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

function getQuestionAtIndex(index) {
  return QUESTIONS[index];
}

function getStageByNumber(stageNumber) {
  return STAGES.find((stage) => stage.stageNumber === stageNumber);
}

function getStageNumberForQuestionIndex(questionIndex) {
  return Math.floor(questionIndex / QUESTIONS_PER_STAGE) + 1;
}

function getFirstQuestionIndexForStage(stageNumber) {
  return (stageNumber - 1) * QUESTIONS_PER_STAGE;
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

function nextQuestionIndexAfterStageSkip(currentQuestionIndex) {
  const stageNumber = getStageNumberForQuestionIndex(currentQuestionIndex);
  if (stageNumber >= TOTAL_STAGES) {
    return TOTAL_QUESTIONS;
  }
  return getFirstQuestionIndexForStage(stageNumber + 1);
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

function createFinalResults(teams, players) {
  const leaderboard = buildLeaderboard(teams);
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const standings = buildPlayerStandings(players, teamsById);
  const totalCorrectAnswers = players.reduce((sum, player) => sum + (player.correctCount || 0), 0);
  const totalPossibleAnswers = players.length * TOTAL_QUESTIONS;

  return {
    champion: leaderboard[0] || null,
    top3: leaderboard.slice(0, 3),
    mvp: standings[0] || null,
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

function allTeamsCompleted(teams) {
  return teams.length > 0 && teams.every((team) => team.completed);
}

function createId() {
  return Math.random().toString(36).slice(2, 11);
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
  generateTeams,
  getQuestionAtIndex,
  getStageByNumber,
  getStageNumberForQuestionIndex,
  publicQuestionPayload,
  scoreAnswer,
  nextQuestionIndexAfterStageSkip,
  buildLeaderboard,
  createFinalResults,
  allTeamsCompleted,
  createId,
};

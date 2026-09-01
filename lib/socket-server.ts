// Runtime Socket.IO server used by server.js is lib/socket-server.js.
// This TypeScript module documents the V5 contract for app code.

export const GAME_LIMITS = {
  maxPlayers: 250,
  playersPerTeam: 5,
  maxTeams: 50,
  minPlayersToStart: 2,
  totalStages: 3,
  questionsPerStage: 10,
  totalQuestions: 30,
};

export const SOCKET_EVENTS = {
  playerJoinLobby: 'player:join_lobby',
  playerReady: 'player:ready',
  playerSubmitAnswer: 'player:submit_answer',
  adminJoin: 'admin:join',
  adminStartGame: 'admin:start_game',
  adminNextQuestion: 'admin:next_question',
  adminNextStage: 'admin:next_stage',
  adminShowLeaderboard: 'admin:show_leaderboard',
  adminEndGame: 'admin:end_game',
  lobbyUpdate: 'lobby:update',
  gameStarted: 'game:started',
  questionShow: 'question:show',
  answerResult: 'answer:result',
  leaderboardUpdate: 'leaderboard:update',
  leaderboardShow: 'leaderboard:show',
  gameEnded: 'game:ended',
} as const;

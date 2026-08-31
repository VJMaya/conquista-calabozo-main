const { Server } = require('socket.io');
const engine = require('./game-engine');

const gameState = {
  sessionId: '',
  currentStage: 1,
  status: 'lobby',
  connectedPlayers: new Map(),
  startedAt: null,
  endedAt: null,
  finalResults: null,
  leaderboardVisible: false,
};

const socketToUser = new Map();
const users = new Map();
const teams = new Map();
const teamTimers = new Map();
let ioRef = null;

function emitLobbyUpdate(io) {
  const allUsers = Array.from(users.values());
  io.emit('lobby:update', {
    connectedPlayers: allUsers.length,
    maxPlayers: engine.MAX_PLAYERS,
    minPlayers: engine.MIN_PLAYERS_TO_START,
    players: allUsers.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      avatarKey: user.avatarKey,
      isConnected: user.isConnected !== false,
      isReady: Boolean(user.isReady),
    })),
    status: gameState.status,
  });
}

function getTeamMembers(team) {
  return team.members.map((userId) => users.get(userId)).filter(Boolean);
}

function connectedTeamMembers(team) {
  return getTeamMembers(team).filter((member) => member.isConnected !== false);
}

function serializeTeam(team) {
  return {
    id: team.id,
    name: team.name,
    members: getTeamMembers(team).map((member) => ({
      id: member.id,
      displayName: member.displayName,
      avatarKey: member.avatarKey,
      isConnected: member.isConnected !== false,
    })),
    currentStage: team.currentStage,
    currentQuestionIndex: team.currentQuestionIndex,
    totalCorrect: team.totalCorrect,
    totalTimeSeconds: team.totalTimeSeconds,
    finalScore: team.finalScore,
    completed: team.completed,
  };
}

function emitLeaderboard(io) {
  const entries = engine.buildLeaderboard(Array.from(teams.values()));
  io.emit('leaderboard:update', { entries });
  return entries;
}

function emitAdminState(io) {
  io.emit('admin:live_update', {
    status: gameState.status,
    connectedPlayers: users.size,
    teams: Array.from(teams.values()).map(serializeTeam),
    leaderboard: engine.buildLeaderboard(Array.from(teams.values())),
    leaderboardVisible: gameState.leaderboardVisible,
    startedAt: gameState.startedAt,
    completedTeams: Array.from(teams.values()).filter((team) => team.completed).length,
    totalTeams: teams.size,
    totalQuestions: engine.TOTAL_QUESTIONS,
    totalStages: engine.TOTAL_STAGES,
  });
}

function clearTeamTimer(teamId) {
  const timer = teamTimers.get(teamId);
  if (timer) {
    clearTimeout(timer);
    teamTimers.delete(teamId);
  }
}

function emitToTeam(team, event, payload) {
  getTeamMembers(team).forEach((member) => {
    if (member.socketId && ioRef) {
      ioRef.to(member.socketId).emit(event, payload);
    }
  });
}

function scheduleTeamTimeout(team, timeLimitSeconds) {
  clearTeamTimer(team.id);
  teamTimers.set(
    team.id,
    setTimeout(() => {
      autoAdvanceTeam(team, true);
    }, timeLimitSeconds * 1000)
  );
}

function sendQuestionToTeam(team) {
  if (!ioRef || team.completed) return;

  const payload = engine.publicQuestionPayload(team.currentQuestionIndex);
  if (!payload) {
    finishTeam(team);
    return;
  }

  team.settling = false;
  team.currentStage = payload.stageNumber;
  team.questionStartedAt = Date.now();
  team.answersThisQuestion = {};

  emitToTeam(team, 'question:show', payload);
  emitToTeam(team, 'stage:started', {
    stageNumber: payload.stageNumber,
    title: payload.stageTitle,
    visualTheme: payload.visualTheme,
    timeLimitSeconds: payload.timeLimitSeconds,
    question: payload,
  });

  scheduleTeamTimeout(team, payload.timeLimitSeconds);
}

function finishTeam(team) {
  if (team.completed) return;

  clearTeamTimer(team.id);
  team.settling = false;
  team.completed = true;
  team.finishedAt = Date.now();
  team.currentQuestionIndex = engine.TOTAL_QUESTIONS;
  team.currentStage = engine.TOTAL_STAGES;
  team.finalScore = team.totalCorrect;
  team.questionStartedAt = null;
  team.answersThisQuestion = {};

  emitToTeam(team, 'team:finished', {
    teamId: team.id,
    teamName: team.name,
    totalCorrect: team.totalCorrect,
    totalTimeSeconds: team.totalTimeSeconds,
  });

  if (ioRef) {
    emitLeaderboard(ioRef);
    emitAdminState(ioRef);
    maybeEndGame();
  }
}

function maybeEndGame() {
  if (gameState.status !== 'live') return;
  if (!engine.allTeamsCompleted(Array.from(teams.values()))) return;
  endGame('all_teams_completed');
}

function endGame(reason) {
  if (gameState.status === 'finished') return;

  Array.from(teams.values()).forEach((team) => {
    clearTeamTimer(team.id);
    if (!team.completed) {
      team.completed = true;
      team.finishedAt = Date.now();
      team.finalScore = team.totalCorrect;
    }
  });

  gameState.status = 'finished';
  gameState.endedAt = Date.now();
  gameState.finalResults = engine.createFinalResults(
    Array.from(teams.values()),
    Array.from(users.values())
  );

  if (!ioRef) return;

  const champion = gameState.finalResults.champion;
  ioRef.emit('game:ended', {
    reason,
    winnerTeamId: champion ? champion.teamId : '',
    winnerTeamName: champion ? champion.teamName : '',
    finalLeaderboard: gameState.finalResults.leaderboard,
    results: gameState.finalResults,
  });
  emitAdminState(ioRef);
}

function autoAdvanceTeam(team, timedOut) {
  if (!team || team.completed || team.settling || gameState.status !== 'live') return;

  const question = engine.getQuestionAtIndex(team.currentQuestionIndex);
  if (!question) {
    finishTeam(team);
    return;
  }

  team.settling = true;
  clearTeamTimer(team.id);

  if (timedOut) {
    connectedTeamMembers(team).forEach((member) => {
      if (team.answersThisQuestion[member.id]) return;
      const miss = engine.scoreAnswer(team.currentQuestionIndex, '', question.timeLimitSeconds);
      team.answersThisQuestion[member.id] = {
        answer: '',
        timeUsedSeconds: miss.timeUsedSeconds,
        isCorrect: false,
        pointsAwarded: 0,
      };
      member.totalTimeSeconds += miss.timeUsedSeconds;
    });
  }

  const answers = Object.values(team.answersThisQuestion);
  const correctThisQuestion = answers.filter((answer) => answer.isCorrect).length;
  const teamTime = answers.reduce((sum, answer) => sum + answer.timeUsedSeconds, 0);

  team.totalCorrect += correctThisQuestion;
  team.totalTimeSeconds += teamTime;
  team.finalScore = team.totalCorrect;

  emitToTeam(team, 'question:completed', {
    questionId: question.id,
    timedOut: Boolean(timedOut),
    teamCorrect: correctThisQuestion > 0,
    correctThisQuestion,
    correctAnswer: question.correctAnswer,
    totalCorrect: team.totalCorrect,
  });

  team.currentQuestionIndex += 1;

  if (team.currentQuestionIndex >= engine.TOTAL_QUESTIONS) {
    finishTeam(team);
    return;
  }

  sendQuestionToTeam(team);
  if (ioRef) {
    emitLeaderboard(ioRef);
    emitAdminState(ioRef);
  }
}

function tryAutoAdvance(team) {
  const connected = connectedTeamMembers(team);
  const everyoneAnswered =
    connected.length > 0 && connected.every((member) => team.answersThisQuestion[member.id]);
  if (everyoneAnswered) {
    autoAdvanceTeam(team, false);
  }
}

function assignTeamsAndStart(io) {
  const allUsers = Array.from(users.values());
  if (allUsers.length < engine.MIN_PLAYERS_TO_START) {
    return { ok: false, message: `At least ${engine.MIN_PLAYERS_TO_START} players are required` };
  }
  if (allUsers.length > engine.MAX_PLAYERS) {
    return { ok: false, message: `Maximum of ${engine.MAX_PLAYERS} players exceeded` };
  }

  teams.clear();
  Array.from(teamTimers.keys()).forEach(clearTeamTimer);

  const drafts = engine.generateTeams(allUsers);
  drafts.forEach((draft) => {
    const teamId = engine.createId();
    const team = {
      id: teamId,
      name: draft.name,
      members: draft.members.map((member) => member.id),
      currentQuestionIndex: 0,
      currentStage: 1,
      totalCorrect: 0,
      totalTimeSeconds: 0,
      finalScore: 0,
      completed: false,
      finishedAt: null,
      questionStartedAt: null,
      answersThisQuestion: {},
      settling: false,
    };
    teams.set(teamId, team);

    draft.members.forEach((member) => {
      const user = users.get(member.id);
      if (!user) return;
      user.teamId = teamId;
      user.correctCount = 0;
      user.totalTimeSeconds = 0;
      user.points = 0;
      if (user.socketId) {
        const socket = io.sockets.sockets.get(user.socketId);
        if (socket) socket.join(`team:${teamId}`);
        io.to(user.socketId).emit('team:assigned', serializeTeam(team));
      }
    });
  });

  gameState.status = 'live';
  gameState.currentStage = 1;
  gameState.startedAt = Date.now();
  gameState.endedAt = null;
  gameState.finalResults = null;
  gameState.leaderboardVisible = false;
  gameState.sessionId = engine.createId();

  io.emit('game:started', {
    gameSessionId: gameState.sessionId,
    teams: Array.from(teams.values()).map((team) => ({
      id: team.id,
      name: team.name,
      memberCount: team.members.length,
    })),
    currentStage: 1,
    totalStages: engine.TOTAL_STAGES,
    totalQuestions: engine.TOTAL_QUESTIONS,
    startsAt: new Date(),
  });

  Array.from(teams.values()).forEach((team) => sendQuestionToTeam(team));
  emitLeaderboard(io);
  emitAdminState(io);
  return { ok: true };
}

function rejectManualAdvance(socket) {
  socket.emit('error', {
    message: 'Next Question and Next Stage are disabled. Teams advance automatically.',
  });
}

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  ioRef = io;

  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('admin:join', () => {
      socket.join('admin');
      emitAdminState(io);
      emitLobbyUpdate(io);
    });

    socket.on('player:join_lobby', (data = {}) => {
      try {
        const displayName = String(data.displayName || '').trim();
        const avatarKey = data.avatarKey || 'knight';
        if (!displayName) return;

        const userId = String(data.userId || '').trim() || engine.createId();
        let user = users.get(userId);

        if (!user) {
          if (users.size >= engine.MAX_PLAYERS && gameState.status === 'lobby') {
            socket.emit('error', { message: `Lobby is full (${engine.MAX_PLAYERS} players)` });
            return;
          }
          user = {
            id: userId,
            displayName,
            avatarKey,
            roleClass: avatarKey,
            socketId: socket.id,
            isConnected: true,
            isReady: false,
            teamId: undefined,
            correctCount: 0,
            totalTimeSeconds: 0,
            points: 0,
          };
          users.set(userId, user);
        } else {
          user.displayName = displayName;
          user.avatarKey = avatarKey;
          user.roleClass = avatarKey;
          user.socketId = socket.id;
          user.isConnected = true;
        }

        socketToUser.set(socket.id, user.id);
        gameState.connectedPlayers.set(socket.id, user);
        socket.emit('player:profile', { userId: user.id });

        if (user.teamId && teams.has(user.teamId)) {
          socket.join(`team:${user.teamId}`);
          const team = teams.get(user.teamId);
          socket.emit('team:assigned', serializeTeam(team));
          if (gameState.status === 'live' && !team.completed) {
            const payload = engine.publicQuestionPayload(team.currentQuestionIndex);
            if (payload) socket.emit('question:show', payload);
          } else if (gameState.status === 'finished' && gameState.finalResults) {
            socket.emit('game:ended', {
              reason: 'already_finished',
              winnerTeamId: gameState.finalResults.champion
                ? gameState.finalResults.champion.teamId
                : '',
              winnerTeamName: gameState.finalResults.champion
                ? gameState.finalResults.champion.teamName
                : '',
              finalLeaderboard: gameState.finalResults.leaderboard,
              results: gameState.finalResults,
            });
          }
        }

        console.log(`${user.displayName} joined the lobby`);
        emitLobbyUpdate(io);
        emitAdminState(io);
      } catch (error) {
        console.error('Error joining lobby:', error);
      }
    });

    socket.on('player:ready', (data = {}) => {
      const userId = data.userId || socketToUser.get(socket.id);
      const user = userId ? users.get(userId) : null;
      if (!user) return;
      user.isReady = true;
      emitLobbyUpdate(io);
    });

    socket.on('admin:start_game', () => {
      try {
        console.log(`Starting game with ${users.size} players`);
        const result = assignTeamsAndStart(io);
        if (!result.ok) {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        console.error('Error starting game:', error);
      }
    });

    socket.on('admin:next_question', () => {
      rejectManualAdvance(socket);
    });

    socket.on('admin:next_stage', () => {
      rejectManualAdvance(socket);
    });

    socket.on('admin:force_next_stage', () => {
      rejectManualAdvance(socket);
    });

    socket.on('admin:show_leaderboard', () => {
      gameState.leaderboardVisible = true;
      const entries = emitLeaderboard(io);
      io.emit('leaderboard:show', { entries, visible: true });
      emitAdminState(io);
    });

    socket.on('admin:end_game', () => {
      endGame('admin');
    });

    socket.on('leaderboard:request', () => {
      socket.emit('leaderboard:update', {
        entries: engine.buildLeaderboard(Array.from(teams.values())),
      });
      if (gameState.finalResults) {
        socket.emit('game:ended', {
          reason: gameState.status === 'finished' ? 'already_finished' : 'live',
          winnerTeamId: gameState.finalResults.champion
            ? gameState.finalResults.champion.teamId
            : '',
          winnerTeamName: gameState.finalResults.champion
            ? gameState.finalResults.champion.teamName
            : '',
          finalLeaderboard: gameState.finalResults.leaderboard,
          results: gameState.finalResults,
        });
      }
    });

    socket.on('player:submit_answer', (data = {}) => {
      const userId = socketToUser.get(socket.id);
      if (!userId) return;
      const user = users.get(userId);
      if (!user || !user.teamId) return;
      const team = teams.get(user.teamId);
      if (!team || team.completed || team.settling || gameState.status !== 'live') return;

      const currentQuestion = engine.getQuestionAtIndex(team.currentQuestionIndex);
      if (!currentQuestion) return;
      if (data.questionId && data.questionId !== currentQuestion.id) return;
      if (team.answersThisQuestion[user.id]) return;

      const elapsed = team.questionStartedAt
        ? Math.round((Date.now() - team.questionStartedAt) / 1000)
        : Number(data.timeUsedSeconds) || 0;
      const result = engine.scoreAnswer(team.currentQuestionIndex, data.answer, elapsed);

      team.answersThisQuestion[user.id] = {
        answer: String(data.answer || ''),
        timeUsedSeconds: result.timeUsedSeconds,
        isCorrect: result.isCorrect,
        pointsAwarded: result.pointsAwarded,
      };

      if (result.isCorrect) user.correctCount += 1;
      user.totalTimeSeconds += result.timeUsedSeconds;
      user.points += result.pointsAwarded;

      socket.emit('answer:result', {
        questionId: currentQuestion.id,
        userAnswer: data.answer,
        isCorrect: result.isCorrect,
        timeUsed: result.timeUsedSeconds,
        pointsAwarded: result.pointsAwarded,
        correctAnswer: result.correctAnswer,
      });

      io.emit('answer:status', {
        playerName: user.displayName,
        isCorrect: result.isCorrect,
      });

      emitToTeam(team, 'team:answer_status', {
        teamId: team.id,
        answeredCount: Object.keys(team.answersThisQuestion).length,
        memberCount: connectedTeamMembers(team).length,
      });

      tryAutoAdvance(team);
    });

    socket.on('disconnect', () => {
      const userId = socketToUser.get(socket.id);
      if (!userId) return;
      const user = users.get(userId);
      socketToUser.delete(socket.id);
      gameState.connectedPlayers.delete(socket.id);

      if (!user) return;

      if (gameState.status === 'lobby') {
        users.delete(userId);
        console.log(`${user.displayName} disconnected. Total: ${users.size}`);
        emitLobbyUpdate(io);
        emitAdminState(io);
        return;
      }

      user.isConnected = false;
      user.socketId = undefined;
      console.log(`${user.displayName} disconnected during the game`);

      if (user.teamId && teams.has(user.teamId) && gameState.status === 'live') {
        tryAutoAdvance(teams.get(user.teamId));
      }

      emitAdminState(io);
    });
  });

  return io;
}

module.exports = { initializeSocket };

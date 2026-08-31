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
    connectedPlayers: allUsers.filter((user) => user.isConnected !== false).length,
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

function connectedTeamMemberIds(team) {
  return connectedTeamMembers(team).map((member) => member.id);
}

function serializeTeam(team) {
  return {
    id: team.id,
    teamId: team.id,
    name: team.name,
    teamName: team.name,
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
    connectedPlayers: Array.from(users.values()).filter((user) => user.isConnected !== false).length,
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

function clearAllTeamTimers() {
  Array.from(teamTimers.keys()).forEach(clearTeamTimer);
}

function emitToTeam(team, event, payload) {
  if (!ioRef) return;

  getTeamMembers(team).forEach((member) => {
    if (member.isConnected !== false && member.socketId) {
      ioRef.to(member.socketId).emit(event, payload);
    }
  });
}

function scheduleTeamTimeout(team, timeLimitSeconds) {
  clearTeamTimer(team.id);

  const timer = setTimeout(() => {
    advanceTeamIfReady(team, true);
  }, timeLimitSeconds * 1000);

  teamTimers.set(team.id, timer);
}

function emitCurrentQuestion(team, payload) {
  if (!ioRef || !payload || team.completed) return;

  team.settling = false;

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

function startTeamQuestion(team) {
  if (!ioRef || team.completed) return;

  const payload = engine.publicQuestionPayload(team.currentQuestionIndex);
  if (!payload) {
    finishTeam(team);
    return;
  }

  engine.beginTeamQuestion(team, Date.now());
  emitCurrentQuestion(team, payload);
}

function finishTeam(team) {
  if (!team) return;

  clearTeamTimer(team.id);
  team.settling = false;
  engine.recalculateTeamTotals(team, users);

  if (!team.completed) {
    team.completed = true;
    team.finishedAt = Date.now();
    team.currentQuestionIndex = engine.TOTAL_QUESTIONS;
    team.currentStage = engine.TOTAL_STAGES;
    team.questionStartedAt = null;
    team.answersThisQuestion = {};
  }

  emitToTeam(team, 'team:finished', {
    teamId: team.id,
    teamName: team.name,
    totalCorrect: team.totalCorrect,
    totalTimeSeconds: team.totalTimeSeconds,
    finalScore: team.finalScore,
  });

  if (!ioRef) return;

  emitLeaderboard(ioRef);
  emitAdminState(ioRef);
  maybeEndGame();
}

function maybeEndGame() {
  if (gameState.status !== 'live') return;
  if (!engine.allTeamsCompleted(Array.from(teams.values()))) return;
  endGame('all_teams_completed');
}

function endGame(reason) {
  if (gameState.status === 'finished') return;

  clearAllTeamTimers();
  const endedAt = Date.now();

  Array.from(teams.values()).forEach((team) => {
    engine.recalculateTeamTotals(team, users);
    if (!team.completed) {
      team.completed = true;
      team.finishedAt = endedAt;
      team.questionStartedAt = null;
      team.answersThisQuestion = {};
      team.settling = false;
    }
  });

  gameState.status = 'finished';
  gameState.endedAt = endedAt;
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

function advanceTeamIfReady(team, timedOut = false) {
  if (!team || team.completed || team.settling || gameState.status !== 'live') {
    return;
  }

  const connectedMemberIds = connectedTeamMemberIds(team);

  if (!timedOut && !engine.shouldAutoAdvanceTeam(team, connectedMemberIds)) {
    return;
  }

  const question = engine.getQuestionAtIndex(team.currentQuestionIndex);
  if (!question) {
    finishTeam(team);
    return;
  }

  team.settling = true;
  clearTeamTimer(team.id);

  const answersBeforeAdvance = Object.values(team.answersThisQuestion);
  const correctThisQuestion = answersBeforeAdvance.filter((answer) => answer.isCorrect).length;

  const result = engine.completeTeamQuestionAndAdvance(
    team,
    users,
    connectedMemberIds,
    timedOut,
    Date.now()
  );

  emitToTeam(team, 'question:completed', {
    questionId: question.id,
    timedOut: Boolean(timedOut),
    teamCorrect: correctThisQuestion > 0,
    correctThisQuestion,
    correctAnswer: question.correctAnswer,
    totalCorrect: team.totalCorrect,
    totalTimeSeconds: team.totalTimeSeconds,
    finalScore: team.finalScore,
  });

  if (result.finished) {
    finishTeam(team);
    return;
  }

  emitCurrentQuestion(team, result.nextQuestion);

  if (ioRef) {
    emitLeaderboard(ioRef);
    emitAdminState(ioRef);
  }
}

function tryAutoAdvance(team) {
  if (!team || team.completed) return;

  const connectedMemberIds = connectedTeamMemberIds(team);
  if (engine.shouldAutoAdvanceTeam(team, connectedMemberIds)) {
    advanceTeamIfReady(team, engine.isQuestionTimedOut(team));
  }
}

function resetPlayerForGame(player) {
  player.teamId = undefined;
  player.correctCount = 0;
  player.totalTimeSeconds = 0;
  player.points = 0;
}

function assignTeamsAndStart(io) {
  if (gameState.status !== 'lobby') {
    return { ok: false, message: 'The game has already started' };
  }

  const allPlayers = Array.from(users.values()).filter((user) => user.isConnected !== false);
  const validation = engine.canStartGame(allPlayers.length);
  if (!validation.ok) {
    return validation;
  }

  teams.clear();
  clearAllTeamTimers();
  allPlayers.forEach(resetPlayerForGame);

  const assignments = engine.createTeamAssignments(allPlayers);

  assignments.forEach((assignment) => {
    const teamId = engine.createId();
    const memberIds = assignment.members.map((member) => member.id);
    const team = engine.createRuntimeTeam(teamId, assignment.name, memberIds);
    team.settling = false;
    teams.set(teamId, team);

    assignment.members.forEach((member) => {
      const player = users.get(member.id);
      if (!player) return;
      player.teamId = teamId;
      if (player.socketId) {
        const playerSocket = io.sockets.sockets.get(player.socketId);
        if (playerSocket) {
          playerSocket.join(`team:${teamId}`);
        }
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

  Array.from(teams.values()).forEach((team) => {
    emitToTeam(team, 'team:assigned', serializeTeam(team));
  });

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
    startsAt: new Date(gameState.startedAt),
  });

  Array.from(teams.values()).forEach(startTeamQuestion);
  emitLeaderboard(io);
  emitAdminState(io);
  return { ok: true };
}

function rejectManualAdvance(socket) {
  socket.emit('error', {
    message: 'Next Question and Next Stage are disabled. Teams advance automatically.',
  });
}

function emitFinishedGame(socket, reason) {
  if (!gameState.finalResults) return;

  const champion = gameState.finalResults.champion;
  socket.emit('game:ended', {
    reason,
    winnerTeamId: champion ? champion.teamId : '',
    winnerTeamName: champion ? champion.teamName : '',
    finalLeaderboard: gameState.finalResults.leaderboard,
    results: gameState.finalResults,
  });
}

function reconnectPlayerToGame(socket, user) {
  if (!user.teamId || !teams.has(user.teamId)) return;

  const team = teams.get(user.teamId);
  socket.join(`team:${team.id}`);
  socket.emit('team:assigned', serializeTeam(team));

  if (gameState.status === 'live') {
    if (team.completed) {
      socket.emit('team:finished', {
        teamId: team.id,
        teamName: team.name,
        totalCorrect: team.totalCorrect,
        totalTimeSeconds: team.totalTimeSeconds,
        finalScore: team.finalScore,
      });
      return;
    }

    const payload = engine.publicQuestionPayload(team.currentQuestionIndex);
    if (payload) {
      socket.emit('question:show', payload);
    }
    return;
  }

  if (gameState.status === 'finished' && gameState.finalResults) {
    emitFinishedGame(socket, 'already_finished');
  }
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

        if (!displayName) {
          socket.emit('error', { message: 'Display name is required' });
          return;
        }

        const requestedUserId = String(data.userId || '').trim();
        const userId = requestedUserId || engine.createId();
        let user = users.get(userId);

        if (!user) {
          if (gameState.status !== 'lobby') {
            socket.emit('error', { message: 'The game has already started' });
            return;
          }

          if (users.size >= engine.MAX_PLAYERS) {
            socket.emit('error', { message: `Lobby is full (${engine.MAX_PLAYERS} players)` });
            return;
          }

          user = engine.createRuntimePlayer({
            id: userId,
            displayName,
            avatarKey,
            roleClass: avatarKey,
            socketId: socket.id,
            isConnected: true,
          });
          user.isReady = false;
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
        reconnectPlayerToGame(socket, user);

        console.log(`${user.displayName} joined the lobby`);
        emitLobbyUpdate(io);
        emitAdminState(io);
      } catch (error) {
        console.error('Error joining lobby:', error);
        socket.emit('error', { message: 'Unable to join the lobby' });
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
        socket.emit('error', { message: 'Unable to start the game' });
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
        emitFinishedGame(socket, gameState.status === 'finished' ? 'already_finished' : 'live');
      }
    });

    socket.on('player:submit_answer', (data = {}) => {
      const userId = socketToUser.get(socket.id);
      if (!userId) return;

      const user = users.get(userId);
      if (!user || !user.teamId) return;

      const team = teams.get(user.teamId);
      if (!team || team.completed || team.settling || gameState.status !== 'live') {
        return;
      }

      const currentQuestion = engine.getQuestionAtIndex(team.currentQuestionIndex);
      if (!currentQuestion) return;
      if (data.questionId && data.questionId !== currentQuestion.id) return;

      const answerRecord = engine.recordPlayerAnswer(
        team,
        user,
        String(data.answer || ''),
        Date.now()
      );

      if (answerRecord.alreadyAnswered) return;

      const result = answerRecord.result;
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
      socketToUser.delete(socket.id);
      gameState.connectedPlayers.delete(socket.id);
      if (!userId) return;

      const user = users.get(userId);
      if (!user) return;

      // Ignore stale disconnects from an older socket after reconnect.
      if (user.socketId !== socket.id) return;

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

      emitLobbyUpdate(io);
      emitAdminState(io);
    });
  });

  return io;
}

module.exports = { initializeSocket };

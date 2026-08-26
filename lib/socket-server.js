const { Server } = require('socket.io');

const gameState = {
  sessionId: '',
  currentStage: 1,
  status: 'lobby',
  connectedPlayers: new Map(),
};

const socketToUser = new Map();
const users = new Map();
const teams = new Map();

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`✅ Jugador conectado: ${socket.id}`);

    socket.on('player:join_lobby', (data) => {
      try {
        const userId = Math.random().toString(36).substr(2, 9);
        const user = {
          id: userId,
          displayName: data.displayName,
          avatarKey: data.avatarKey,
          roleClass: data.avatarKey,
          socketId: socket.id,
          isConnected: true,
        };

        users.set(userId, user);
        socketToUser.set(socket.id, userId);
        gameState.connectedPlayers.set(socket.id, user);

        console.log(`📢 ${user.displayName} se unió al juego`);

        const allUsers = Array.from(users.values());
        io.emit('lobby:update', {
          connectedPlayers: allUsers.length,
          maxPlayers: 200,
          minPlayers: 2,
          players: allUsers.map(u => ({
            id: u.id,
            displayName: u.displayName,
            avatarKey: u.avatarKey,
            isConnected: true,
          })),
        });

        socket.emit('player:profile', { userId: user.id });
      } catch (error) {
        console.error('Error joining lobby:', error);
      }
    });

    socket.on('admin:start_game', () => {
      try {
        const allUsers = Array.from(users.values());
        console.log(`🎮 Iniciando juego con ${allUsers.length} jugadores`);

        if (allUsers.length < 2) {
          socket.emit('error', { message: 'Se necesitan al menos 2 jugadores' });
          return;
        }

        const teamNames = ['Dragones', 'Elfos', 'Enanos', 'Magos', 'Caballeros'];
        const teamConfigs = [];
        const playersPerTeam = Math.ceil(allUsers.length / 2);

        for (let i = 0; i < allUsers.length; i += playersPerTeam) {
          const teamId = Math.random().toString(36).substr(2, 9);
          const teamName = teamNames[Math.floor(i / playersPerTeam)] || `Equipo ${Math.floor(i / playersPerTeam) + 1}`;
          const teamMembers = allUsers.slice(i, i + playersPerTeam);

          const team = {
            id: teamId,
            name: teamName,
            members: teamMembers.map(m => m.id),
            currentStage: 1,
            totalCorrect: 0,
            finalScore: 0,
          };

          teams.set(teamId, team);
          teamConfigs.push({ id: teamId, name: teamName });
        }

        gameState.status = 'live';
        gameState.currentStage = 1;

        io.emit('game:started', {
          teams: teamConfigs,
          currentStage: 1,
          startsAt: new Date(),
        });

        console.log(`⚔️ Juego iniciado. Equipos: ${teamConfigs.map(t => t.name).join(', ')}`);
      } catch (error) {
        console.error('Error starting game:', error);
      }
    });

    socket.on('player:submit_answer', (data) => {
      const userId = socketToUser.get(socket.id);
      if (!userId) return;

      const isCorrect = data.answer.toUpperCase() === data.correctAnswer.toUpperCase();
      const pointsAwarded = isCorrect ? data.pointsBase : 0;

      console.log(`📝 ${data.playerName} respondió: ${isCorrect ? '✅ CORRECTO' : '❌ INCORRECTO'}`);

      socket.emit('answer:result', {
        questionId: data.questionId,
        isCorrect,
        pointsAwarded,
        correctAnswer: data.correctAnswer,
      });

      io.emit('answer:status', {
        playerName: data.playerName,
        isCorrect,
      });
    });

    socket.on('disconnect', () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        const user = users.get(userId);
        users.delete(userId);
        socketToUser.delete(socket.id);
        gameState.connectedPlayers.delete(socket.id);

        console.log(`❌ ${user?.displayName || 'Jugador'} desconectado. Total: ${gameState.connectedPlayers.size}`);

        const allUsers = Array.from(users.values());
        io.emit('lobby:update', {
          connectedPlayers: allUsers.length,
          maxPlayers: 200,
          minPlayers: 2,
          players: allUsers.map(u => ({
            id: u.id,
            displayName: u.displayName,
            avatarKey: u.avatarKey,
          })),
        });
      }
    });
  });

  return io;
}

module.exports = { initializeSocket };

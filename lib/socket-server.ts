// lib/socket-server.ts
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { db } from './prisma';
import { generateTeams } from './teams';

interface GameState {
  sessionId: string;
  currentStage: number;
  status: 'lobby' | 'live' | 'finished';
  connectedPlayers: Map<string, any>;
}

const gameState: GameState = {
  sessionId: '',
  currentStage: 1,
  status: 'lobby',
  connectedPlayers: new Map(),
};

export function initializeSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Mapeo de socket a usuario
  const socketToUser = new Map<string, string>();

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Jugador conectado: ${socket.id}`);

    // Jugador entra al lobby
    socket.on('player:join_lobby', async (data: { displayName: string; avatarKey: string }) => {
      try {
        const user = await db.createUser({
          displayName: data.displayName,
          avatarKey: data.avatarKey,
          roleClass: data.avatarKey,
          socketId: socket.id,
        });

        socketToUser.set(socket.id, user.id);
        gameState.connectedPlayers.set(socket.id, user);

        console.log(`📢 ${user.displayName} se unió al juego`);

        // Broadcast de actualización del lobby
        const allUsers = await db.getAllUsers();
        io.emit('lobby:update', {
          connectedPlayers: allUsers.length,
          maxPlayers: 200,
          minPlayers: 10,
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

    // Admin inicia el juego
    socket.on('admin:start_game', async () => {
      try {
        const allUsers = await db.getAllUsers();
        console.log(`🎮 Iniciando juego con ${allUsers.length} jugadores`);

        if (allUsers.length < 2) {
          socket.emit('error', { message: 'Se necesitan al menos 2 jugadores' });
          return;
        }

        // Generar equipos
        const teamConfigs = generateTeams(allUsers, 2, false);
        const teams = [];

        for (const teamConfig of teamConfigs) {
          const team = await db.createTeam({
            name: teamConfig.name,
            currentStage: 1,
            totalCorrect: 0,
          });
          teams.push({ id: team.id, name: team.name });
        }

        gameState.status = 'live';
        gameState.currentStage = 1;

        // Notificar a todos
        io.emit('game:started', {
          teams,
          currentStage: 1,
          startsAt: new Date(),
        });

        console.log(`⚔️ Juego iniciado. Equipos: ${teams.map(t => t.name).join(', ')}`);
      } catch (error) {
        console.error('Error starting game:', error);
      }
    });

    // Enviar respuesta
    socket.on('player:submit_answer', (data: any) => {
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

      // Broadcast a otros
      io.emit('answer:status', {
        playerName: data.playerName,
        isCorrect,
      });
    });

    // Desconexión
    socket.on('disconnect', async () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        await db.deleteUser(userId);
        socketToUser.delete(socket.id);
        gameState.connectedPlayers.delete(socket.id);

        console.log(`❌ Jugador desconectado. Total: ${gameState.connectedPlayers.size}`);

        // Actualizar lobby
        const allUsers = await db.getAllUsers();
        io.emit('lobby:update', {
          connectedPlayers: allUsers.length,
          maxPlayers: 200,
          minPlayers: 10,
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

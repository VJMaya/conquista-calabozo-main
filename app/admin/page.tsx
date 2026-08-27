'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function AdminPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState(0);

  useEffect(() => {
    const newSocket = io();

    newSocket.on('connect', () => {
      console.log('✅ Admin conectado');
    });

    newSocket.on('lobby:update', (data) => {
      setPlayers(data.connectedPlayers || 0);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const startGame = () => {
    socket?.emit('admin:start_game');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#111827',
        color: 'white',
        padding: '40px',
      }}
    >
      <h1 style={{ fontSize: '40px', marginBottom: '20px' }}>
        🎮 PANEL DE ADMINISTRADOR
      </h1>

      <h2 style={{ marginBottom: '20px' }}>
        Jugadores conectados: {players}
      </h2>

      <button
        onClick={startGame}
        style={{
          padding: '15px 30px',
          background: '#16a34a',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '20px',
          cursor: 'pointer',
        }}
      >
        🚀 Iniciar Juego
      </button>
    </div>
  );
}
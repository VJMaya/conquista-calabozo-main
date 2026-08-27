'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function GamePage() {
  const [status, setStatus] = useState('Esperando pregunta...');

  useEffect(() => {
    const socket = io();

    socket.on('connect', () => {
      console.log('✅ Conectado al juego');
    });

    socket.on('question:show', (data) => {
      setStatus(`Pregunta ${data.questionNumber}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#111827',
        color: 'white',
        padding: '40px'
      }}
    >
      <h1>⚔️ CONQUISTA DEL CALABOZO</h1>

      <h2>{status}</h2>

      <p>
        El juego ha iniciado correctamente.
      </p>
    </div>
  );
}
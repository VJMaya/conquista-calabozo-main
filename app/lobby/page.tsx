// app/lobby/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { io, Socket } from 'socket.io-client';

interface LobbyPlayer {
  id: string;
  displayName: string;
  avatarKey: string;
}

export default function LobbyPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [connectedPlayers, setConnectedPlayers] = useState(0);
  const [maxPlayers] = useState(200);
  const [minPlayers] = useState(10);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const displayName = localStorage.getItem('displayName');
    const avatarKey = localStorage.getItem('avatarKey');

    if (!userId || !displayName || !avatarKey) {
      router.push('/');
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');

    newSocket.on('connect', () => {
      newSocket.emit('player:join_lobby', { displayName, avatarKey });
    });

    newSocket.on('lobby:update', (data) => {
      setPlayers(data.players || []);
      setConnectedPlayers(data.connectedPlayers);
    });

    setSocket(newSocket);
    setIsLoading(false);

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  const handleReady = () => {
    if (socket && !isReady) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        socket.emit('player:ready', { userId });
        setIsReady(true);
      }
    }
  };

  const canStart = connectedPlayers >= minPlayers && connectedPlayers <= maxPlayers;

  return (
    <Layout>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="dungeon-title text-4xl mb-2">SALA DE ESPERA</h1>
            <p className="dungeon-subtitle">Preparándose para el Calabozo</p>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <div className="text-center">
                <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Jugadores</p>
                <p className="text-3xl font-bold text-dungeon-border">
                  {connectedPlayers}/{maxPlayers}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Equipos</p>
                <p className="text-3xl font-bold text-dungeon-blue">
                  {Math.floor(connectedPlayers / 5)}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Estado</p>
                <p className={`text-lg font-bold ${
                  canStart ? 'text-dungeon-green' : 'text-yellow-400'
                }`}>
                  {canStart ? '✓ Listo' : '⏳ Esperando'}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Mínimo</p>
                <p className="text-3xl font-bold text-dungeon-purple">
                  {minPlayers}
                </p>
              </div>
            </Card>
          </div>

          {/* Info Message */}
          <Card className="mb-8 bg-dungeon-purple border-dungeon-border">
            <p className="text-center text-dungeon-text">
              Los equipos se formarán automáticamente cuando se reúnan {minPlayers} jugadores.
              Haz clic en "Estoy Listo" para confirmar tu participación.
            </p>
          </Card>

          {/* Players Grid */}
          <div className="mb-8">
            <h2 className="dungeon-title text-2xl mb-4">JUGADORES CONECTADOS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => {
                const emoji = {
                  fairy: '✨',
                  wizard: '🧙',
                  knight: '⚔️',
                  archer: '🏹',
                  elf: '🧝',
                  dwarf: '⛏️',
                }[player.avatarKey] || '⚔️';

                return (
                  <Card key={player.id}>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{emoji}</div>
                      <div>
                        <p className="font-bold text-dungeon-text">{player.displayName}</p>
                        <p className="text-xs uppercase text-dungeon-text-secondary">
                          {player.avatarKey}
                        </p>
                      </div>
                      <div className="ml-auto w-2 h-2 bg-dungeon-green rounded-full" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <Button
              onClick={handleReady}
              disabled={isReady || isLoading}
              size="lg"
              variant="success"
              className="px-12"
            >
              {isReady ? '✓ Ya Estoy Listo' : 'Estoy Listo'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

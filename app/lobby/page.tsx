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
  const [maxPlayers] = useState(250);
  const [minPlayers] = useState(2);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const displayName = localStorage.getItem('displayName');
    const avatarKey = localStorage.getItem('avatarKey');

    if (!userId || !displayName || !avatarKey) {
      router.push('/');
      return undefined;
    }

    const newSocket = io();

    newSocket.on('connect', () => {
      newSocket.emit('player:join_lobby', {
        userId,
        displayName,
        avatarKey,
      });
    });

    newSocket.on('player:profile', (data) => {
      if (data.userId) {
        localStorage.setItem('userId', data.userId);
      }
    });

    newSocket.on('lobby:update', (data) => {
      setPlayers(data.players || []);
      setConnectedPlayers(data.connectedPlayers || 0);
    });

    newSocket.on('game:started', (data) => {
      localStorage.setItem('currentStage', String(data.currentStage));
      router.push('/game');
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
          <div className="text-center mb-12">
            <h1 className="dungeon-title text-4xl mb-2">Waiting Room</h1>
            <p className="dungeon-subtitle">Preparing for the dungeon</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <div className="text-center">
                <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Players</p>
                <p className="text-3xl font-bold text-dungeon-border">
                  {connectedPlayers}/{maxPlayers}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Teams</p>
                <p className="text-3xl font-bold text-dungeon-blue">
                  {Math.ceil(connectedPlayers / 5)}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Status</p>
                <p className={`text-lg font-bold ${canStart ? 'text-dungeon-green' : 'text-yellow-400'}`}>
                  {canStart ? 'Ready' : 'Waiting'}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Minimum</p>
                <p className="text-3xl font-bold text-dungeon-purple">{minPlayers}</p>
              </div>
            </Card>
          </div>

          <Card className="mb-8 bg-dungeon-purple border-dungeon-border">
            <p className="text-center text-dungeon-text">
              Teams of 5 are created automatically when the admin starts the game. Up to 50 teams
              (250 players) can enter.
            </p>
          </Card>

          <div className="mb-8">
            <h2 className="dungeon-title text-2xl mb-4">Connected players</h2>
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

          <div className="text-center">
            <Button
              onClick={handleReady}
              disabled={isReady || isLoading}
              size="lg"
              variant="success"
              className="px-12"
            >
              {isReady ? 'You are ready' : 'I am ready'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

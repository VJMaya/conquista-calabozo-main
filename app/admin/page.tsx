'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LeaderboardPanel from '@/components/game/LeaderboardPanel';
import { LeaderboardEntry } from '@/types/game';

interface AdminTeam {
  id: string;
  name: string;
  memberCount?: number;
  members?: Array<{ id: string; displayName: string }>;
  currentStage: number;
  currentQuestionIndex: number;
  totalCorrect: number;
  totalTimeSeconds: number;
  completed: boolean;
}

export default function AdminPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState(0);
  const [status, setStatus] = useState('lobby');
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [completedTeams, setCompletedTeams] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const newSocket = io();

    newSocket.on('connect', () => {
      newSocket.emit('admin:join');
    });

    newSocket.on('lobby:update', (data) => {
      setPlayers(data.connectedPlayers || 0);
    });

    newSocket.on('admin:live_update', (data) => {
      setStatus(data.status || 'lobby');
      setPlayers(data.connectedPlayers || 0);
      setTeams(data.teams || []);
      setLeaderboard(data.leaderboard || []);
      setCompletedTeams(data.completedTeams || 0);
      setTotalTeams(data.totalTeams || 0);
    });

    newSocket.on('game:started', () => {
      setStatus('live');
      setMessage('Game started. Teams are advancing independently.');
    });

    newSocket.on('game:ended', () => {
      setStatus('finished');
      setMessage('Game finished. Final ranking is ready.');
    });

    newSocket.on('error', (data) => {
      setMessage(data.message || 'Unable to complete that action.');
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const emit = (event: string) => {
    socket?.emit(event);
  };

  const statusLabel = useMemo(() => {
    if (status === 'live') return 'Live';
    if (status === 'finished') return 'Finished';
    return 'Lobby';
  }, [status]);

  return (
    <Layout>
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="dungeon-title text-4xl mb-2">Admin Panel</h1>
          <p className="dungeon-subtitle mb-8">Conquest of the Dungeon — V5 control room</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Players</p>
              <p className="text-3xl font-bold text-dungeon-border">{players}/250</p>
            </Card>
            <Card>
              <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Status</p>
              <p className="text-2xl font-bold text-dungeon-green">{statusLabel}</p>
            </Card>
            <Card>
              <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Teams finished</p>
              <p className="text-3xl font-bold text-dungeon-blue">
                {completedTeams}/{totalTeams}
              </p>
            </Card>
            <Card>
              <p className="text-dungeon-text-secondary text-xs uppercase mb-2">Auto teams</p>
              <p className="text-lg font-bold">5 players · up to 50 teams</p>
            </Card>
          </div>

          {message && (
            <Card className="mb-6">
              <p>{message}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            <Button onClick={() => emit('admin:start_game')} variant="success" disabled={status !== 'lobby'}>
              Start Game
            </Button>
            <Button onClick={() => emit('admin:next_question')} disabled={status !== 'live'}>
              Next Question
            </Button>
            <Button onClick={() => emit('admin:next_stage')} disabled={status !== 'live'}>
              Next Stage
            </Button>
            <Button onClick={() => emit('admin:show_leaderboard')} variant="secondary">
              Show Leaderboard
            </Button>
            <Button onClick={() => emit('admin:end_game')} variant="danger" disabled={status === 'lobby'}>
              End Game
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="dungeon-title text-2xl mb-4">Team progress</h2>
              <div className="space-y-3 max-h-[480px] overflow-y-auto">
                {teams.length === 0 && (
                  <p className="text-dungeon-text-secondary">Teams will appear after the game starts.</p>
                )}
                {teams.map((team) => (
                  <div key={team.id} className="border border-dungeon-text-secondary p-3">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-bold">{team.name}</p>
                        <p className="text-xs uppercase text-dungeon-text-secondary">
                          Stage {team.currentStage}/10 · Question {Math.min(team.currentQuestionIndex + 1, 50)}/50
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-dungeon-green">{team.totalCorrect} correct</p>
                        <p className="text-xs">{team.completed ? 'Completed' : 'In progress'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <LeaderboardPanel entries={leaderboard} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

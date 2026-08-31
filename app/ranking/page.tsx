'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LeaderboardPanel from '@/components/game/LeaderboardPanel';
import { LeaderboardEntry } from '@/types/game';

export default function RankingPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState('Loading ranking...');
  const [teamId, setTeamId] = useState('');

  useEffect(() => {
    const socket = io();
    const userId = localStorage.getItem('userId');
    const displayName = localStorage.getItem('displayName');
    const avatarKey = localStorage.getItem('avatarKey');

    socket.on('connect', () => {
      socket.emit('leaderboard:request');
      if (userId && displayName && avatarKey) {
        socket.emit('player:join_lobby', { userId, displayName, avatarKey });
      }
    });

    socket.on('team:assigned', (data: { id?: string }) => {
      if (data.id) setTeamId(data.id);
    });

    socket.on('leaderboard:update', (data: { entries?: LeaderboardEntry[] }) => {
      setEntries(data.entries || []);
      setStatus((current) => (current === 'Final ranking' ? current : 'Live ranking'));
    });

    socket.on('leaderboard:show', (data: { entries?: LeaderboardEntry[] }) => {
      setEntries(data.entries || []);
      setStatus('Leaderboard published by admin');
    });

    socket.on('game:ended', (data: {
      results?: { leaderboard?: LeaderboardEntry[] };
      finalLeaderboard?: LeaderboardEntry[];
    }) => {
      localStorage.setItem('finalResults', JSON.stringify(data.results || data));
      setEntries(data.finalLeaderboard || data.results?.leaderboard || []);
      setStatus('Final ranking');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const leader = entries[0];
  const completedCount = entries.filter((entry) => entry.completed).length;

  return (
    <Layout>
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="dungeon-title text-4xl mb-2">Ranking</h1>
          <p className="dungeon-subtitle mb-4">{status}</p>
          <p className="mb-6 text-sm text-dungeon-text-secondary">
            Primary: most correct answers. Tie-breaker: lowest total completion time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <p className="text-xs uppercase text-dungeon-text-secondary">Teams</p>
              <p className="text-2xl font-bold">{entries.length}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-dungeon-text-secondary">Finished</p>
              <p className="text-2xl font-bold">{completedCount}/{entries.length || 0}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-dungeon-text-secondary">Leader</p>
              <p className="text-lg font-bold truncate">{leader ? leader.teamName : '—'}</p>
            </Card>
          </div>

          {entries.length === 0 ? (
            <Card>
              <p>No ranking yet. Rankings appear after the admin starts the game.</p>
            </Card>
          ) : (
            <LeaderboardPanel entries={entries} currentUserTeamId={teamId || undefined} />
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" type="button" onClick={() => router.push('/game')}>
              Back to game
            </Button>
            <Button type="button" onClick={() => router.push('/final')}>
              Final screen
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

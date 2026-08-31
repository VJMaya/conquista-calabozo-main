'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

interface FeedItem {
  id: string;
  time: string;
  text: string;
}

const TOTAL_QUESTIONS = 50;
const TOTAL_STAGES = 10;
const MAX_PLAYERS = 250;
const MAX_FEED = 24;

function questionNumberFor(team: AdminTeam) {
  if (team.completed) return TOTAL_QUESTIONS;
  return Math.min(Math.max(team.currentQuestionIndex + 1, 1), TOTAL_QUESTIONS);
}

function stageNumberFor(team: AdminTeam) {
  if (team.completed) return TOTAL_STAGES;
  return Math.min(Math.max(team.currentStage || 1, 1), TOTAL_STAGES);
}

function stamp() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
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
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const previousTeamsRef = useRef<Map<string, AdminTeam>>(new Map());

  const pushFeed = (text: string) => {
    setFeed((current) =>
      [{ id: `${Date.now()}-${Math.random()}`, time: stamp(), text }, ...current].slice(0, MAX_FEED)
    );
  };

  useEffect(() => {
    const newSocket = io();

    newSocket.on('connect', () => {
      newSocket.emit('admin:join');
    });

    newSocket.on('lobby:update', (data) => {
      setPlayers(data.connectedPlayers || 0);
    });

    newSocket.on('admin:live_update', (data) => {
      const nextTeams: AdminTeam[] = data.teams || [];
      const previous = previousTeamsRef.current;

      nextTeams.forEach((team) => {
        const before = previous.get(team.id);
        if (!before) return;

        if (!before.completed && team.completed) {
          pushFeed(`${team.name} finished game`);
        } else if (!team.completed && team.currentStage > (before.currentStage || 1)) {
          pushFeed(`${team.name} completed stage ${before.currentStage}`);
        }
      });

      previousTeamsRef.current = new Map(nextTeams.map((team) => [team.id, team]));
      setStatus(data.status || 'lobby');
      setPlayers(data.connectedPlayers || 0);
      setTeams(nextTeams);
      setLeaderboard(data.leaderboard || []);
      setCompletedTeams(data.completedTeams || 0);
      setTotalTeams(data.totalTeams || 0);
    });

    newSocket.on('game:started', () => {
      setStatus('live');
      setMessage('Game started. Teams are advancing independently.');
      pushFeed('Tournament started');
    });

    newSocket.on('game:ended', () => {
      setStatus('finished');
      setMessage('Game finished. Final ranking is ready.');
      pushFeed('Tournament ended');
    });

    newSocket.on('answer:status', (data: { playerName?: string; isCorrect?: boolean }) => {
      const name = data.playerName || 'A player';
      pushFeed(data.isCorrect ? `${name} answered correctly` : `${name} answered`);
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

  const liveTeams = teams.filter((team) => !team.completed);
  const currentQuestion = liveTeams.length
    ? Math.max(...liveTeams.map(questionNumberFor))
    : teams.length
      ? TOTAL_QUESTIONS
      : 1;
  const currentStage = liveTeams.length
    ? Math.max(...liveTeams.map(stageNumberFor))
    : teams.length
      ? TOTAL_STAGES
      : 1;

  const tournamentProgress = teams.length
    ? Math.round(
        (teams.reduce((sum, team) => sum + (team.completed ? TOTAL_QUESTIONS : team.currentQuestionIndex), 0) /
          (teams.length * TOTAL_QUESTIONS)) *
          100
      )
    : 0;

  const top3 = leaderboard.slice(0, 3);

  const fastestTeams = [...teams]
    .filter((team) => (team.totalTimeSeconds || 0) > 0)
    .sort((a, b) => a.totalTimeSeconds - b.totalTimeSeconds)
    .slice(0, 3);

  const attemptedAnswers = teams.reduce((sum, team) => {
    const members = team.members?.length || team.memberCount || 1;
    const questionsDone = team.completed ? TOTAL_QUESTIONS : team.currentQuestionIndex;
    return sum + questionsDone * members;
  }, 0);
  const totalCorrect = teams.reduce((sum, team) => sum + (team.totalCorrect || 0), 0);
  const accuracyPercent =
    attemptedAnswers > 0 ? Math.round((totalCorrect / attemptedAnswers) * 100) : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0e27] px-3 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <header className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.35em] text-[#d4af37]">Dungeon Master</p>
            <h1 className="dungeon-title mt-2 text-3xl sm:text-4xl lg:text-5xl">LIVE CONTROL CENTER</h1>
            <p className="dungeon-subtitle mt-1">Conquest of the Dungeon — V5</p>
          </header>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-dungeon-text-secondary">Connected Players</p>
              <p className="mt-2 text-3xl font-black text-[#d4af37]">
                {players}
                <span className="text-sm font-bold text-dungeon-text-secondary">/{MAX_PLAYERS}</span>
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-dungeon-text-secondary">Teams</p>
              <p className="mt-2 text-3xl font-black text-dungeon-blue">{totalTeams || teams.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-dungeon-text-secondary">Teams Finished</p>
              <p className="mt-2 text-3xl font-black text-dungeon-green">
                {completedTeams}/{totalTeams || teams.length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-dungeon-text-secondary">Current Question</p>
              <p className="mt-2 text-3xl font-black">{currentQuestion}/{TOTAL_QUESTIONS}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-dungeon-text-secondary">Current Stage</p>
              <p className="mt-2 text-3xl font-black">{currentStage}/{TOTAL_STAGES}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-dungeon-text-secondary">Status</p>
              <p className="mt-2 text-2xl font-black text-dungeon-green">{statusLabel}</p>
            </Card>
          </div>

          <Card>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">Overall Tournament Progress</p>
                <p className="mt-1 text-sm text-dungeon-text-secondary">
                  {completedTeams} of {totalTeams || teams.length} teams have cleared the dungeon
                </p>
              </div>
              <p className="text-2xl font-black text-[#d4af37]">{tournamentProgress}%</p>
            </div>
            <div className="mt-4 h-5 overflow-hidden border-2 border-[#d4af37] bg-[#0a0e27]">
              <div
                className="h-full bg-[#d4af37] transition-all duration-300"
                style={{ width: `${Math.min(100, tournamentProgress)}%` }}
              />
            </div>
          </Card>

          {message && (
            <Card>
              <p>{message}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">Top 3 Teams</p>
              <div className="mt-4 space-y-3">
                {top3.length === 0 && (
                  <p className="text-sm text-dungeon-text-secondary">Leaderboard appears after Start Game.</p>
                )}
                {top3.map((entry, index) => (
                  <div key={entry.teamId} className="flex items-center justify-between border border-[#d4af37]/40 p-3">
                    <div>
                      <p className="font-black">
                        {index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'} {entry.teamName}
                      </p>
                      <p className="text-xs uppercase text-dungeon-text-secondary">
                        {entry.totalCorrect} correct · {entry.totalTimeSeconds}s
                      </p>
                    </div>
                    <p className="text-xl font-black text-[#d4af37]">#{entry.rank}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">Fastest Teams</p>
              <div className="mt-4 space-y-3">
                {fastestTeams.length === 0 && (
                  <p className="text-sm text-dungeon-text-secondary">Times appear as teams answer.</p>
                )}
                {fastestTeams.map((team, index) => (
                  <div key={team.id} className="flex items-center justify-between border border-dungeon-text-secondary p-3">
                    <div>
                      <p className="font-bold">
                        {index + 1}. {team.name}
                      </p>
                      <p className="text-xs uppercase text-dungeon-text-secondary">Lowest accumulated time</p>
                    </div>
                    <p className="font-black text-dungeon-blue">{team.totalTimeSeconds}s</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">Tournament Accuracy %</p>
              <p className="mt-6 text-6xl font-black text-dungeon-green">{accuracyPercent}%</p>
              <p className="mt-3 text-sm text-dungeon-text-secondary">
                {totalCorrect} correct answers recorded
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2 overflow-hidden p-4 sm:p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">Detailed Team Progress Table</p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#d4af37] text-xs uppercase tracking-wide text-dungeon-text-secondary">
                      <th className="py-2 pr-3">Team Name</th>
                      <th className="py-2 pr-3">Stage</th>
                      <th className="py-2 pr-3">Question</th>
                      <th className="py-2 pr-3">Correct Answers</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-dungeon-text-secondary">
                          Teams will appear after the game starts.
                        </td>
                      </tr>
                    )}
                    {teams.map((team) => (
                      <tr key={team.id} className="border-b border-dungeon-text-secondary/40">
                        <td className="py-3 pr-3 font-bold">{team.name}</td>
                        <td className="py-3 pr-3">{stageNumberFor(team)}/{TOTAL_STAGES}</td>
                        <td className="py-3 pr-3">{questionNumberFor(team)}/{TOTAL_QUESTIONS}</td>
                        <td className="py-3 pr-3 text-dungeon-green">{team.totalCorrect}</td>
                        <td className="py-3">
                          <span className={team.completed ? 'text-dungeon-green' : 'text-[#d4af37]'}>
                            {team.completed ? 'Finished' : 'In progress'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">Live Activity Feed</p>
              <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">
                {feed.length === 0 && (
                  <p className="text-sm text-dungeon-text-secondary">Waiting for live events...</p>
                )}
                {feed.map((item) => (
                  <div key={item.id} className="border border-dungeon-text-secondary/40 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-[#d4af37]">{item.time}</p>
                    <p className="text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <LeaderboardPanel entries={leaderboard} />
        </div>
      </div>
    </Layout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LeaderboardPanel from '@/components/game/LeaderboardPanel';
import { LeaderboardEntry } from '@/types/game';
import {
  averageResponseTime,
  formatAverageTime,
  top10PlayersFrom,
} from '@/lib/player-leaderboard';
import {
  formatAccuracyPercent,
  formatActivePlayers,
  resolveActivePlayerCount,
  teamAccuracyPercent,
} from '@/lib/team-ranking';

interface MvpPlayer {
  displayName: string;
  teamName: string;
  correctCount: number;
  totalTimeSeconds: number;
  points: number;
}

interface PlayerStandingRow {
  userId?: string;
  displayName: string;
  answeredCount?: number;
  correctCount?: number;
  totalTimeSeconds?: number;
  points?: number;
}

interface FinalStats {
  totalPlayers: number;
  totalTeams: number;
  totalQuestions: number;
  totalStages: number;
  totalCorrectAnswers: number;
  totalPossibleAnswers?: number;
  accuracyPercent: number;
}

interface FinalResults {
  champion: LeaderboardEntry | null;
  top3: LeaderboardEntry[];
  mvp: MvpPlayer | null;
  leaderboard: LeaderboardEntry[];
  standings?: PlayerStandingRow[];
  stats: FinalStats;
}

interface MvpPlayer {
  displayName: string;
  teamName: string;
  correctCount: number;
  totalTimeSeconds: number;
  points: number;
}

interface FinalStats {
  totalPlayers: number;
  totalTeams: number;
  totalQuestions: number;
  totalStages: number;
  totalCorrectAnswers: number;
  totalPossibleAnswers?: number;
  accuracyPercent: number;
}

interface FinalResults {
  champion: LeaderboardEntry | null;
  top3: LeaderboardEntry[];
  mvp: MvpPlayer | null;
  leaderboard: LeaderboardEntry[];
  stats: FinalStats;
}

function isFinalResults(value: unknown): value is FinalResults {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<FinalResults>;
  return Array.isArray(data.leaderboard) && Boolean(data.stats);
}

export default function FinalPage() {
  const router = useRouter();
  const [results, setResults] = useState<FinalResults | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('finalResults');
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (isFinalResults(parsed)) {
          setResults(parsed);
        }
      } catch {
        setResults(null);
      }
    }

    const socket = io();

    socket.on('connect', () => {
      socket.emit('leaderboard:request');
    });

    socket.on('game:ended', (data: { results?: unknown }) => {
      if (isFinalResults(data.results)) {
        localStorage.setItem('finalResults', JSON.stringify(data.results));
        setResults(data.results);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!results) {
    return (
      <Layout>
        <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center">
          <h1 className="dungeon-title text-4xl mb-4">Final Chamber</h1>
          <p className="dungeon-subtitle mb-6 max-w-lg">
            The final screen appears when every team has finished all 30 questions, or when the
            admin ends the game.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => router.push('/game')}>
              Back to game
            </Button>
            <Button type="button" onClick={() => router.push('/ranking')}>
              View ranking
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const places = ['1st', '2nd', '3rd'];
  const top3 = results.top3?.length ? results.top3 : results.leaderboard.slice(0, 3);
  const hallOfHeroes = top10PlayersFrom(results.standings || []);

  const teamAccuracy = (team: LeaderboardEntry) =>
    typeof team.accuracyPercent === 'number'
      ? team.accuracyPercent
      : teamAccuracyPercent(team.totalCorrect, resolveActivePlayerCount(team));
  const teamActivePlayers = (team: LeaderboardEntry) => resolveActivePlayerCount(team);

  return (
    <Layout>
      <div className="min-h-full overflow-x-hidden overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="dungeon-title text-4xl mb-2">Dungeon Conquered</h1>
          <p className="dungeon-subtitle mb-8">Final results of Conquest of the Dungeon</p>

          <Card className="mb-6 text-center">
            <p className="text-sm uppercase text-dungeon-text-secondary mb-2">Champion Team</p>
            <h2 className="dungeon-title text-3xl mb-2">
              {results.champion ? `🏆 ${results.champion.teamName}` : 'No champion yet'}
            </h2>
            {results.champion && (
              <p>
                {formatAccuracyPercent(teamAccuracy(results.champion))} · {results.champion.totalCorrect}{' '}
                correct answers · {results.champion.totalTimeSeconds}s ·{' '}
                {formatActivePlayers(teamActivePlayers(results.champion))}
              </p>
            )}
          </Card>

          <h2 className="dungeon-title text-2xl mb-3">Top 3 Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {top3.map((team, index) => (
              <Card key={team.teamId}>
                <p className="text-sm uppercase text-dungeon-text-secondary mb-1">
                  {places[index] || `${index + 1}th`}
                </p>
                <p className="font-bold text-xl">{team.teamName}</p>
                <p className="text-2xl font-black text-[#d4af37]">{formatAccuracyPercent(teamAccuracy(team))}</p>
                <p className="text-sm">
                  {team.totalCorrect} correct · {team.totalTimeSeconds}s ·{' '}
                  {formatActivePlayers(teamActivePlayers(team))}
                </p>
              </Card>
            ))}
          </div>

          <Card className="mb-6">
            <p className="text-sm uppercase text-dungeon-text-secondary mb-2">MVP Player</p>
            {results.mvp ? (
              <>
                <h3 className="text-2xl font-bold">{results.mvp.displayName}</h3>
                <p>
                  {results.mvp.teamName} · {results.mvp.correctCount} correct · {results.mvp.points}{' '}
                  points · {results.mvp.totalTimeSeconds}s
                </p>
              </>
            ) : (
              <p>No MVP data yet.</p>
            )}
          </Card>

          <h2 className="dungeon-title text-2xl mb-3">Final Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <p className="text-xs uppercase text-dungeon-text-secondary">Players</p>
              <p className="text-2xl font-bold">{results.stats.totalPlayers}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-dungeon-text-secondary">Teams</p>
              <p className="text-2xl font-bold">{results.stats.totalTeams}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-dungeon-text-secondary">Questions</p>
              <p className="text-2xl font-bold">{results.stats.totalQuestions}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-dungeon-text-secondary">Stages</p>
              <p className="text-2xl font-bold">{results.stats.totalStages}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-dungeon-text-secondary">Correct answers</p>
              <p className="text-2xl font-bold">{results.stats.totalCorrectAnswers}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-dungeon-text-secondary">Accuracy</p>
              <p className="text-2xl font-bold">{results.stats.accuracyPercent}%</p>
            </Card>
          </div>

          <LeaderboardPanel entries={results.leaderboard || []} />

          <Card className="mt-8 mb-6 overflow-hidden">
            <p className="text-xs uppercase tracking-[0.35em] text-[#d4af37]">Hall of Heroes</p>
            <h2 className="dungeon-title mt-2 text-2xl">Top 10 Players</h2>
            <p className="mt-1 text-sm text-dungeon-text-secondary">
              Individual honors from the same player totals shown in the Admin Portal
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d4af37] text-xs uppercase tracking-wide text-dungeon-text-secondary">
                    <th className="py-2 pr-3">Rank</th>
                    <th className="py-2 pr-3">Player Name</th>
                    <th className="py-2 pr-3">Correct Answers</th>
                    <th className="py-2 pr-3">Average Response Time</th>
                    <th className="py-2">Total Points</th>
                  </tr>
                </thead>
                <tbody>
                  {hallOfHeroes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-dungeon-text-secondary">
                        Player honors appear when final results include player standings.
                      </td>
                    </tr>
                  )}
                  {hallOfHeroes.map((player, index) => (
                    <tr
                      key={player.userId || `${player.displayName}-${index}`}
                      className="border-b border-dungeon-text-secondary/40"
                    >
                      <td className="py-3 pr-3 font-black text-[#d4af37]">#{index + 1}</td>
                      <td className="py-3 pr-3 font-bold">{player.displayName}</td>
                      <td className="py-3 pr-3 text-dungeon-green">{player.correctCount || 0}</td>
                      <td className="py-3 pr-3">{formatAverageTime(averageResponseTime(player))}</td>
                      <td className="py-3 font-black text-[#d4af37]">{player.points || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" type="button" onClick={() => router.push('/ranking')}>
              Ranking
            </Button>
            <Button type="button" onClick={() => router.push('/')}>
              Return to gate
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

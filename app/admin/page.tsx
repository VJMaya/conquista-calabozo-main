'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import LeaderboardPanel from '@/components/game/LeaderboardPanel';
import { LeaderboardEntry } from '@/types/game';
import { TOTAL_QUESTIONS, TOTAL_STAGES } from '@/data/pack';
import '../landing-hero.css';
import '../lobby-hall.css';
import '../admin-command.css';
import {
  averageResponseTime,
  formatAverageTime,
  top10PlayersFrom,
} from '@/lib/player-leaderboard';
import {
  formatAccuracyPercent,
  formatPlayersRoster,
  participatingMemberCount,
  resolveActivePlayerCount,
  teamAccuracyPercent,
} from '@/lib/team-ranking';

interface AdminTeam {
  id: string;
  name: string;
  memberCount?: number;
  members?: Array<{
    id: string;
    displayName: string;
    answeredCount?: number;
    correctCount?: number;
    totalTimeSeconds?: number;
    points?: number;
  }>;
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

const MAX_PLAYERS = 250;
const MAX_FEED = 24;
const RANK_MEDALS = ['🥇', '🥈', '🥉'];

const EMBERS = [
  { left: '8%', delay: '0s', duration: '8s' },
  { left: '24%', delay: '1.3s', duration: '10s' },
  { left: '41%', delay: '0.5s', duration: '9s' },
  { left: '58%', delay: '2s', duration: '11s' },
  { left: '73%', delay: '0.9s', duration: '8.5s' },
  { left: '89%', delay: '1.7s', duration: '9.5s' },
];

const SPARKS = [
  { left: '12%', top: '18%', delay: '0s' },
  { left: '31%', top: '54%', delay: '1.1s' },
  { left: '52%', top: '28%', delay: '0.4s' },
  { left: '71%', top: '62%', delay: '1.6s' },
  { left: '86%', top: '36%', delay: '0.8s' },
];

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

  const top10Players = useMemo(() => {
    return top10PlayersFrom(teams.flatMap((team) => team.members || []));
  }, [teams]);

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
    <section className="landing-hero hall command">
      <div className="landing-hero-bg" aria-hidden />
      <div className="landing-hero-overlay" aria-hidden />
      <div className="landing-hero-stone" aria-hidden />
      <div className="landing-hero-glow is-left" aria-hidden />
      <div className="landing-hero-glow is-right" aria-hidden />
      <div className="hall-torch is-left" aria-hidden />
      <div className="hall-torch is-right" aria-hidden />
      <div className="hall-embers" aria-hidden>
        {EMBERS.map((ember) => (
          <span
            key={ember.left}
            className="hall-ember"
            style={{
              left: ember.left,
              animationDelay: ember.delay,
              animationDuration: ember.duration,
            }}
          />
        ))}
      </div>
      <div className="hall-sparks" aria-hidden>
        {SPARKS.map((spark) => (
          <span
            key={`${spark.left}-${spark.top}`}
            className="hall-spark"
            style={{ left: spark.left, top: spark.top, animationDelay: spark.delay }}
          />
        ))}
      </div>

      <div className="dm-inner">
        <header className="dm-header">
          <h1 className="dm-title">DUNGEON MASTER CONTROL ROOM</h1>
          <p className="dm-subtitle">Manage the challenge. Control the dungeon.</p>
        </header>

        <div className="dm-status">
          <article className="dm-panel dm-status-card">
            <p className="dm-status-label">⚔ Adventurers</p>
            <p className="dm-status-value">
              {players}/{MAX_PLAYERS}
            </p>
          </article>
          <article className="dm-panel dm-status-card">
            <p className="dm-status-label">🏰 Parties</p>
            <p className="dm-status-value">{totalTeams || teams.length}</p>
          </article>
          <article className="dm-panel dm-status-card">
            <p className="dm-status-label">🔥 Dungeon Status</p>
            <p className="dm-status-value">{statusLabel}</p>
          </article>
          <article className="dm-panel dm-status-card">
            <p className="dm-status-label">👑 Dungeon Master</p>
            <p className="dm-status-value">In command</p>
          </article>
        </div>

        <div className="dm-gauges">
          <article className="dm-panel dm-status-card">
            <p className="dm-status-label">Parties finished</p>
            <p className="dm-status-value">
              {completedTeams}/{totalTeams || teams.length}
            </p>
          </article>
          <article className="dm-panel dm-status-card">
            <p className="dm-status-label">Current question</p>
            <p className="dm-status-value">
              {currentQuestion}/{TOTAL_QUESTIONS}
            </p>
          </article>
          <article className="dm-panel dm-status-card">
            <p className="dm-status-label">Current stage</p>
            <p className="dm-status-value">
              {currentStage}/{TOTAL_STAGES}
            </p>
          </article>
        </div>

        <article className="dm-panel">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="dm-kicker">Overall Tournament Progress</p>
              <p className="dm-copy">
                {completedTeams} of {totalTeams || teams.length} teams have cleared the dungeon
              </p>
            </div>
            <p className="dm-status-value">{tournamentProgress}%</p>
          </div>
          <div className="dm-progress-track">
            <div className="dm-progress-fill" style={{ width: `${Math.min(100, tournamentProgress)}%` }} />
          </div>
        </article>

        {message && (
          <article className="dm-panel dm-message">
            <p>{message}</p>
          </article>
        )}

        <div className="dm-commands">
          <button
            type="button"
            className="landing-enter dm-open"
            onClick={() => emit('admin:start_game')}
            disabled={status !== 'lobby'}
          >
            ⚔ OPEN THE DUNGEON ⚔
          </button>
          <button type="button" className="dm-cmd" onClick={() => emit('admin:next_question')} disabled={status !== 'live'}>
            Next Question
          </button>
          <button type="button" className="dm-cmd" onClick={() => emit('admin:next_stage')} disabled={status !== 'live'}>
            Next Stage
          </button>
          <button type="button" className="dm-cmd" onClick={() => emit('admin:show_leaderboard')}>
            Show Leaderboard
          </button>
          <button
            type="button"
            className="dm-cmd is-danger"
            onClick={() => emit('admin:end_game')}
            disabled={status === 'lobby'}
          >
            End Game
          </button>
        </div>

        <div className="dm-grid-3">
          <article className="dm-panel">
            <p className="dm-kicker">Top 3 Teams</p>
            <div className="mt-4 space-y-3">
              {top3.length === 0 && <p className="dm-empty">Leaderboard appears after Start Game.</p>}
              {top3.map((entry, index) => (
                <div key={entry.teamId} className="dm-rank-row">
                  <div>
                    <p className="dm-team-name">
                      {RANK_MEDALS[index] || `#${entry.rank}`} {entry.teamName}
                    </p>
                    <p className="dm-copy">
                      {formatAccuracyPercent(
                        typeof entry.accuracyPercent === 'number'
                          ? entry.accuracyPercent
                          : teamAccuracyPercent(entry.totalCorrect, resolveActivePlayerCount(entry))
                      )}{' '}
                      · {entry.totalCorrect} correct · {entry.totalTimeSeconds}s
                    </p>
                    <p className="dm-copy">
                      {formatPlayersRoster(
                        resolveActivePlayerCount(entry),
                        participatingMemberCount(entry)
                      )}
                    </p>
                  </div>
                  <p className="dm-medal">#{entry.rank}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="dm-panel">
            <p className="dm-kicker">Fastest Teams</p>
            <div className="mt-4 space-y-3">
              {fastestTeams.length === 0 && <p className="dm-empty">Times appear as teams answer.</p>}
              {fastestTeams.map((team, index) => (
                <div key={team.id} className="dm-rank-row">
                  <div>
                    <p className="dm-team-name">
                      {index + 1}. {team.name}
                    </p>
                    <p className="dm-copy">Lowest accumulated time</p>
                  </div>
                  <p className="dm-medal">{team.totalTimeSeconds}s</p>
                </div>
              ))}
            </div>
          </article>

          <article className="dm-panel" style={{ textAlign: 'center' }}>
            <p className="dm-kicker">Tournament Accuracy %</p>
            <p className="dm-status-value" style={{ fontSize: '3.4rem', marginTop: '1.2rem' }}>
              {accuracyPercent}%
            </p>
            <p className="dm-copy">{totalCorrect} correct answers recorded</p>
          </article>
        </div>

        <article className="dm-panel">
          <p className="dm-kicker">Hall of Heroes</p>
          <p className="dm-copy">Live player standings from current game runtime totals</p>
          <div className="dm-heroes mt-4">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player Name</th>
                  <th>Correct Answers</th>
                  <th>Average Response Time</th>
                  <th>Total Points</th>
                </tr>
              </thead>
              <tbody>
                {top10Players.length === 0 && (
                  <tr>
                    <td colSpan={5} className="dm-empty">
                      Player rankings appear as answers are recorded.
                    </td>
                  </tr>
                )}
                {top10Players.map((player, index) => (
                  <tr
                    key={player.id}
                    className={index === 0 ? 'is-top is-first' : index < 3 ? 'is-top' : ''}
                  >
                    <td className="dm-medal">
                      {RANK_MEDALS[index] || `#${index + 1}`}
                    </td>
                    <td>{player.displayName}</td>
                    <td>{player.correctCount || 0}</td>
                    <td>{formatAverageTime(averageResponseTime(player))}</td>
                    <td className="dm-medal">{player.points || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="dm-grid-split">
          <article className="dm-panel">
            <p className="dm-kicker">Party Status</p>
            {teams.length === 0 && <p className="dm-empty mt-4">Teams will appear after the game starts.</p>}
            <div className="dm-teams mt-4">
              {teams.map((team) => (
                <article key={team.id} className="dm-panel dm-team">
                  <h3 className="dm-team-name">{team.name}</h3>
                  <div className="dm-team-meta">
                    <p>
                      Players:{' '}
                      <strong>
                        {formatPlayersRoster(
                          resolveActivePlayerCount(team),
                          participatingMemberCount(team)
                        ).replace('Players: ', '')}
                      </strong>
                    </p>
                    <p>
                      Ready Status:{' '}
                      <strong>{team.completed ? 'Finished' : 'In progress'}</strong>
                    </p>
                    <p>
                      Accuracy %:{' '}
                      <strong>
                        {formatAccuracyPercent(
                          teamAccuracyPercent(team.totalCorrect, resolveActivePlayerCount(team))
                        )}
                      </strong>
                    </p>
                    <p>
                      Current Progress:{' '}
                      <strong>
                        Stage {stageNumberFor(team)}/{TOTAL_STAGES} · Question {questionNumberFor(team)}/
                        {TOTAL_QUESTIONS} · {team.totalCorrect} correct
                      </strong>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="dm-panel">
            <p className="dm-kicker">Live Activity Feed</p>
            <div className="dm-feed mt-4">
              {feed.length === 0 && <p className="dm-empty">Waiting for live events...</p>}
              {feed.map((item) => (
                <div key={item.id} className="dm-feed-item">
                  <p className="dm-feed-time">{item.time}</p>
                  <p className="dm-feed-text">{item.text}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <LeaderboardPanel entries={leaderboard} />
      </div>
    </section>
  );
}

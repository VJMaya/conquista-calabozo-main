'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { HERO_PORTRAIT_PATHS } from '@/lib/battle-assets';
import '../landing-hero.css';
import '../lobby-hall.css';

interface LobbyPlayer {
  id: string;
  displayName: string;
  avatarKey: string;
  isReady?: boolean;
}

const CLASS_LABELS: Record<string, string> = {
  fairy: 'Fairy',
  wizard: 'Wizard',
  knight: 'Knight',
  archer: 'Archer',
  elf: 'Elf',
  dwarf: 'Dwarf',
};

const EMBERS = [
  { left: '8%', delay: '0s', duration: '8s' },
  { left: '22%', delay: '1.4s', duration: '10s' },
  { left: '37%', delay: '0.6s', duration: '9s' },
  { left: '51%', delay: '2.1s', duration: '11s' },
  { left: '66%', delay: '0.9s', duration: '8.5s' },
  { left: '79%', delay: '1.8s', duration: '9.5s' },
  { left: '91%', delay: '0.3s', duration: '10.5s' },
];

const SPARKS = [
  { left: '14%', top: '22%', delay: '0s' },
  { left: '28%', top: '58%', delay: '1.2s' },
  { left: '47%', top: '34%', delay: '0.4s' },
  { left: '63%', top: '18%', delay: '1.8s' },
  { left: '76%', top: '62%', delay: '0.7s' },
  { left: '88%', top: '40%', delay: '1.5s' },
];

export default function LobbyPage() {
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [connectedPlayers, setConnectedPlayers] = useState(0);
  const [maxPlayers] = useState(250);
  const [minPlayers] = useState(2);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const displayName = localStorage.getItem('displayName');
    const avatarKey = localStorage.getItem('avatarKey');

    if (!userId || !displayName || !avatarKey) {
      router.push('/');
      return undefined;
    }

    setCurrentUserId(userId);

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
        setCurrentUserId(data.userId);
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
    <section className="landing-hero hall">
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
            style={{
              left: spark.left,
              top: spark.top,
              animationDelay: spark.delay,
            }}
          />
        ))}
      </div>

      <div className="hall-inner">
        <header className="hall-header">
          <h1 className="hall-title">THE ASSEMBLY HALL</h1>
          <p className="hall-subtitle">Gather your heroes before entering the dungeon.</p>
        </header>

        <div className="hall-stats">
          <article className="hall-stat">
            <p className="hall-stat-label">Players</p>
            <p className="hall-stat-value">
              {connectedPlayers}/{maxPlayers}
            </p>
          </article>
          <article className="hall-stat">
            <p className="hall-stat-label">Teams</p>
            <p className="hall-stat-value">{Math.ceil(connectedPlayers / 5)}</p>
          </article>
          <article className="hall-stat">
            <p className="hall-stat-label">Status</p>
            <p className={`hall-stat-value ${canStart ? 'is-ready' : 'is-waiting'}`}>
              {canStart ? 'Ready' : 'Waiting'}
            </p>
          </article>
          <article className="hall-stat">
            <p className="hall-stat-label">Minimum</p>
            <p className="hall-stat-value">{minPlayers}</p>
          </article>
        </div>

        <div className="hall-portal-wrap">
          <div className="hall-portal" aria-hidden>
            <span className="hall-portal-ring" />
            <span className="hall-portal-core" />
          </div>
          <p className="hall-portal-copy">Preparing the Dungeon</p>
          <p className="hall-portal-count">
            {connectedPlayers} {connectedPlayers === 1 ? 'hero assembled' : 'heroes assembled'}
          </p>
        </div>

        <p className="hall-note">
          Teams of 5 are created automatically when the admin starts the game. Up to 50 teams
          (250 players) can enter.
        </p>

        <h2 className="hall-roster-title">Connected players</h2>
        <div className="hall-roster">
          {players.map((player) => {
            const src = HERO_PORTRAIT_PATHS[player.avatarKey] || HERO_PORTRAIT_PATHS.knight;
            const klass = CLASS_LABELS[player.avatarKey] || player.avatarKey;
            const playerReady =
              Boolean(player.isReady) || (player.id === currentUserId && isReady);
            return (
              <article key={player.id} className="hall-hero">
                <span className="hall-hero-art">
                  <Image src={src} alt="" fill sizes="72px" />
                </span>
                <div>
                  <p className="hall-hero-name">{player.displayName}</p>
                  <p className="hall-hero-class">{klass}</p>
                </div>
                <span className={`hall-hero-status${playerReady ? ' is-ready' : ''}`}>
                  {playerReady ? 'Ready' : 'Gathering'}
                </span>
              </article>
            );
          })}
        </div>

        <div className="hall-ready-wrap">
          <button
            type="button"
            className="landing-enter"
            onClick={handleReady}
            disabled={isReady || isLoading}
          >
            ⚔ READY FOR BATTLE ⚔
          </button>
        </div>
      </div>
    </section>
  );
}

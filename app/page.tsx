'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HERO_PORTRAIT_PATHS } from '@/lib/battle-assets';
import { AvatarClass } from '@/types/game';
import './landing-hero.css';

const AVATAR_CLASSES: { key: AvatarClass; name: string; lines: [string, string] }[] = [
  { key: 'fairy', name: 'Fairy', lines: ['Mystical support hero.', 'Master of arcane energy.'] },
  { key: 'wizard', name: 'Wizard', lines: ['Ancient spellcaster.', 'Controls powerful magic.'] },
  { key: 'knight', name: 'Knight', lines: ['Frontline warrior.', 'Fearless protector.'] },
  { key: 'archer', name: 'Archer', lines: ['Precision marksman.', 'Deadly from distance.'] },
  { key: 'elf', name: 'Elf', lines: ['Agile assassin.', 'Master of enchanted blades.'] },
  { key: 'dwarf', name: 'Dwarf', lines: ['Forge-born fighter.', 'Devastating hammer attacks.'] },
];

const LANDING_STATS = [
  '30 QUESTIONS',
  '3 PHASES',
  '250 PLAYERS',
  'REAL-TIME MULTIPLAYER',
];

export default function HomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarClass>('knight');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, avatarKey: selectedAvatar }),
      });

      if (!response.ok) {
        throw new Error('Unable to create your profile');
      }

      const data = await response.json();
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('displayName', displayName);
      localStorage.setItem('avatarKey', selectedAvatar);

      router.push('/lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedHero =
    AVATAR_CLASSES.find((avatar) => avatar.key === selectedAvatar) || AVATAR_CLASSES[2];

  return (
    <section className="landing-hero">
      <div className="landing-hero-bg" aria-hidden />
      <div className="landing-hero-overlay" aria-hidden />
      <div className="landing-hero-stone" aria-hidden />
      <div className="landing-hero-glow is-left" aria-hidden />
      <div className="landing-hero-glow is-right" aria-hidden />

      <div className="landing-hero-inner">
        <header className="landing-header">
          <h1 className="landing-title">CONQUEST OF THE DUNGEON</h1>
          <p className="landing-subtitle">ENTER. THINK. SOLVE. CONQUER.</p>
          <p className="landing-secondary">ONLY A TEAM CAN BECOME THE CHAMPION</p>
        </header>

        <div className="landing-gate">
          <label className="landing-gate-label" htmlFor="adventurer-name">
            Adventurer name
          </label>
          <input
            id="adventurer-name"
            className="landing-input"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setError('');
            }}
            placeholder="Speak your name..."
            maxLength={50}
            disabled={isLoading}
          />

          <p className="landing-gate-label is-classes">Choose your class</p>

          <div className="landing-showcase">
            <div className="landing-showcase-aura" aria-hidden />
            <span className="landing-showcase-art">
              <Image
                src={HERO_PORTRAIT_PATHS[selectedHero.key]}
                alt={selectedHero.name}
                fill
                sizes="280px"
                priority
              />
            </span>
            <h2 className="landing-showcase-name">{selectedHero.name}</h2>
            {selectedHero.lines.map((line) => (
              <p key={line} className="landing-showcase-line">
                {line}
              </p>
            ))}
          </div>

          <div className="landing-classes">
            {AVATAR_CLASSES.map((avatar) => {
              const selected = selectedAvatar === avatar.key;
              const src = HERO_PORTRAIT_PATHS[avatar.key];
              return (
                <button
                  key={avatar.key}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.key)}
                  disabled={isLoading}
                  className={`landing-class${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                >
                  <span className="landing-class-art">
                    <Image src={src} alt={avatar.name} fill sizes="120px" />
                  </span>
                  <p className="landing-class-name">{avatar.name}</p>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="landing-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            className="landing-enter"
            onClick={handleJoin}
            disabled={isLoading}
          >
            {isLoading ? 'ENTERING...' : '⚔ ENTER THE DUNGEON ⚔'}
          </button>
        </div>

        <footer className="landing-stats">
          {LANDING_STATS.map((stat) => (
            <div key={stat} className="landing-stat">
              {stat}
            </div>
          ))}
        </footer>
      </div>
    </section>
  );
}

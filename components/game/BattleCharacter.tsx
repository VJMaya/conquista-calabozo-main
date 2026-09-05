'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { CharacterVisualState } from '@/types/battle';
import { resolveAttackStyle } from '@/lib/battle-animation';
import { resolveHeroPortrait } from '@/lib/battle-assets';

const CLASS_LABELS: Record<string, string> = {
  fairy: 'Fairy',
  wizard: 'Wizard',
  knight: 'Knight',
  archer: 'Archer',
  elf: 'Elf',
  dwarf: 'Dwarf',
};

interface BattleCharacterProps {
  displayName: string;
  avatarKey: string;
  visualState: CharacterVisualState;
  isCurrentUser?: boolean;
  reducedMotion?: boolean;
}

interface RPGHeroPortraitProps {
  avatarKey: string;
  compact?: boolean;
  className?: string;
}

export function RPGHeroPortrait({
  avatarKey,
  compact = false,
  className = '',
}: RPGHeroPortraitProps) {
  const klass = CLASS_LABELS[avatarKey] ? avatarKey : 'knight';
  const src = resolveHeroPortrait(klass);
  const [failed, setFailed] = useState(!src);

  return (
    <div
      className={`hero-portrait ${klass} ${compact ? 'is-compact' : ''} has-art ${className}`}
      aria-hidden
    >
      <span className="hero-portrait-glow" />
      <span className="hero-portrait-shadow" />
      {!failed && src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={compact ? '56px' : '(max-width: 1366px) 220px, (max-width: 1600px) 280px, 330px'}
          className="hero-portrait-art"
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

export default function BattleCharacter({
  displayName,
  avatarKey,
  visualState,
  isCurrentUser = false,
  reducedMotion = false,
}: BattleCharacterProps) {
  const klass = CLASS_LABELS[avatarKey] ? avatarKey : 'knight';
  const attackStyle = resolveAttackStyle(klass);
  const motionClass =
    reducedMotion || visualState === 'idle'
      ? ''
      : visualState === 'missed-attack'
        ? 'is-miss'
        : visualState === 'attacking' || visualState === 'successful-hit'
          ? 'is-attacking'
          : '';

  return (
    <div className="battle-character" data-attack-style={attackStyle}>
      <div
        className={`battle-hero-motion ${motionClass} ${isCurrentUser ? 'is-current' : ''}`}
        title={`${displayName} (${CLASS_LABELS[klass] || 'Adventurer'})`}
      >
        <RPGHeroPortrait avatarKey={klass} />
        <span className="hero-weapon-flash" aria-hidden />
      </div>
      <p className="battle-character-name">
        {displayName}
      </p>
    </div>
  );
}

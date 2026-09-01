'use client';

import type { CharacterVisualState } from '@/types/battle';
import { resolveAttackStyle } from '@/lib/battle-animation';

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

  return (
    <div
      className={`rpg-hero ${klass} ${compact ? 'is-compact' : ''} ${className}`}
      aria-hidden
    >
      <span className="rpg-hero-aura" />
      <span className="rpg-hero-shadow" />
      <span className="rpg-hero-cape" />
      <span className="rpg-hero-wings" />
      <span className="rpg-hero-hat" />
      <span className="rpg-hero-ears" />
      <span className="rpg-hero-head">
        <span className="rpg-hero-hair" />
        <span className="rpg-hero-face" />
      </span>
      <span className="rpg-hero-body" />
      <span className="rpg-hero-weapon" />
      <span className="rpg-hero-class-mark" />
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
      </div>
      <p className="battle-character-name">
        {displayName}
      </p>
    </div>
  );
}

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
    <div className="flex flex-col items-center gap-1" data-attack-style={attackStyle}>
      <div
        className={`px-hero battle-pixel ${klass} ${motionClass} ${isCurrentUser ? 'is-current' : ''}`}
        title={`${displayName} (${CLASS_LABELS[klass] || 'Adventurer'})`}
        aria-hidden
      >
        <div className="px-hero-head" />
        <div className="px-hero-body" />
      </div>
      <p className="max-w-[72px] truncate text-center text-[10px] font-bold uppercase tracking-wide text-[#e0e6ff]">
        {displayName}
      </p>
    </div>
  );
}

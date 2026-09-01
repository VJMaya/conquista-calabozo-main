'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { BossVisualState } from '@/types/battle';
import './battle-arena.css';

interface BattleBossProps {
  visualState?: BossVisualState;
  bossHealthPercent: number;
  teamFinished?: boolean;
  reducedMotion?: boolean;
  activeHit?: boolean;
  activeDodge?: boolean;
  questionNumber?: number;
}

const PHASES = {
  1: {
    src: '/game-assets/bosses/dragon-idle.webp',
    label: 'PHASE I',
    title: 'THE AWAKENING',
    description: 'Vorthak has awakened and watches the adventurers.',
    fx: 'phase-i',
  },
  2: {
    src: '/game-assets/bosses/dragon-defeated.webp',
    label: 'PHASE II',
    title: 'THE FALLEN KING',
    description: 'The dragon begins transforming and its power grows.',
    fx: 'phase-ii',
  },
  3: {
    src: '/game-assets/bosses/dragon-hit.webp',
    label: 'PHASE III',
    title: 'THE FINAL BATTLE',
    description: 'Vorthak unleashes his full power.',
    fx: 'phase-iii',
  },
} as const;

function clampHealth(value: number) {
  if (!Number.isFinite(value)) return 100;
  return Math.max(0, Math.min(100, value));
}

function dragonPhase(questionNumber: number): 1 | 2 | 3 {
  if (questionNumber <= 10) return 1;
  if (questionNumber <= 20) return 2;
  return 3;
}

export default function BattleBoss({
  visualState,
  bossHealthPercent,
  teamFinished = false,
  reducedMotion = false,
  activeHit = false,
  activeDodge = false,
  questionNumber = 1,
}: BattleBossProps) {
  const health = clampHealth(bossHealthPercent);
  const [imageFailed, setImageFailed] = useState(false);
  const phase = dragonPhase(questionNumber);
  const phaseMeta = PHASES[phase];

  let motion: BossVisualState = 'idle';
  if (visualState === 'hit' || activeHit) {
    motion = 'hit';
  } else if (visualState === 'dodge' || activeDodge) {
    motion = 'dodge';
  }

  const src = useMemo(() => phaseMeta.src, [phaseMeta.src]);
  useEffect(() => {
    setImageFailed(false);
  }, [src]);
  const motionClass = reducedMotion
    ? ''
    : motion === 'hit'
      ? 'is-hit'
      : motion === 'dodge'
        ? 'is-dodge'
        : 'is-idle';
  const clearedClass = teamFinished ? 'is-team-cleared' : '';

  return (
    <div className="flex w-full max-w-[220px] flex-col items-center sm:max-w-[240px] lg:max-w-[260px]">
      <p className="text-center text-[10px] font-black uppercase tracking-[0.28em] text-[#d4af37]">
        {phaseMeta.label}
      </p>
      <p className="mt-1 text-center text-xs font-black uppercase tracking-wide text-[#e0e6ff]">
        {phaseMeta.title}
      </p>
      <p className="mt-1 text-center text-[10px] italic leading-snug text-[#8892b0]">
        {phaseMeta.description}
      </p>
      <p className="mb-2 mt-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">
        Vorthak the Ancient
      </p>
      <div
        className="mb-3 h-4 w-full overflow-hidden border-[3px] border-[#1a1408] bg-[#0a0e27]"
        style={{ boxShadow: 'inset 0 0 0 2px #d4af37' }}
        aria-hidden
      >
        <div
          className="h-full bg-[#c41e3a]"
          style={{
            width: `${health}%`,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 4px)',
          }}
        />
      </div>

      {imageFailed ? (
        <div className={`px-boss battle-pixel ${motionClass} ${clearedClass}`} aria-hidden>
          <div className="px-boss-head">
            <span className="px-boss-eye l" />
            <span className="px-boss-eye r" />
          </div>
          <div className="px-boss-coil c1" />
          <div className="px-boss-coil c2" />
          <div className="px-boss-coil c3" />
        </div>
      ) : (
        <div className={`dragon-frame ${phaseMeta.fx} ${motionClass} ${clearedClass}`} aria-hidden>
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, 260px"
            className={`dragon-art object-contain ${motionClass} ${clearedClass}`}
            onError={() => setImageFailed(true)}
            priority={false}
          />
          {phase === 1 && !teamFinished && (
            <>
              <span className="dragon-eye-glow left" />
              <span className="dragon-eye-glow right" />
            </>
          )}
          {phase === 2 && !teamFinished && <span className="dragon-rune-glow" />}
          {phase === 3 && !teamFinished && (
            <>
              <span className="dragon-fire-glow" />
              <span className="dragon-fire-breath" />
              <span className="dragon-ember e1" />
              <span className="dragon-ember e2" />
              <span className="dragon-ember e3" />
            </>
          )}
        </div>
      )}
    </div>
  );
}

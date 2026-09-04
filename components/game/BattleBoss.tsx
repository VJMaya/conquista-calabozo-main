'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { BossVisualState } from '@/types/battle';
import { BATTLE_ASSET_PATHS, resolveBossPhase } from '@/lib/battle-assets';
import './battle-arena.css';

interface BattleBossProps {
  visualState?: BossVisualState;
  bossHealthPercent: number;
  teamFinished?: boolean;
  reducedMotion?: boolean;
  activeHit?: boolean;
  activeDodge?: boolean;
  criticalHit?: boolean;
  questionNumber?: number;
}

const PHASES = {
  1: {
    src: BATTLE_ASSET_PATHS.bosses.idle,
    label: 'PHASE I',
    title: 'THE AWAKENING',
    description: 'Vorthak has awakened and watches the adventurers.',
    fx: 'phase-i',
  },
  2: {
    src: BATTLE_ASSET_PATHS.bosses.defeated,
    label: 'PHASE II',
    title: 'THE FALLEN KING',
    description: 'The dragon begins transforming and its power grows.',
    fx: 'phase-ii',
  },
  3: {
    src: BATTLE_ASSET_PATHS.bosses.hit,
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

export default function BattleBoss({
  visualState,
  bossHealthPercent,
  teamFinished = false,
  reducedMotion = false,
  activeHit = false,
  activeDodge = false,
  criticalHit = false,
  questionNumber = 1,
}: BattleBossProps) {
  const health = clampHealth(bossHealthPercent);
  const [imageFailed, setImageFailed] = useState(false);
  const phase = resolveBossPhase(questionNumber);
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
  const critClass = criticalHit && motion === 'hit' ? 'is-crit' : '';
  const dodgeDir = questionNumber % 2 === 0 ? 'is-dodge-left' : 'is-dodge-right';
  const showFx = !teamFinished && !imageFailed;

  return (
    <div className="battle-boss-stage">
      <p className="text-center text-[10px] font-black uppercase tracking-[0.28em] text-[#d4af37]">
        {phaseMeta.label}
      </p>
      <p className="mt-1 text-center text-xs font-black uppercase tracking-wide text-[#e0e6ff] sm:text-sm">
        {phaseMeta.title}
      </p>
      <p className="mt-1 text-center text-[10px] italic leading-snug text-[#8892b0]">
        {phaseMeta.description}
      </p>
      <div
        className="boss-health-frame"
        role="meter"
        aria-label="Vorthak health"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(health)}
      >
        <span className="boss-health-name">VORTHAK THE ANCIENT</span>
        <span className="boss-health-ornament left" aria-hidden />
        <span className="boss-health-ornament right" aria-hidden />
        <div
          className="boss-health-track"
          aria-hidden
        >
          <span
            className="boss-health-fill"
            style={{ width: `${health}%` }}
          />
        </div>
      </div>

      {imageFailed ? (
        <div className={`px-boss battle-pixel ${motionClass} ${critClass} ${motion === 'dodge' ? dodgeDir : ''} ${clearedClass}`} aria-hidden>
          <div className="px-boss-head">
            <span className="px-boss-eye l" />
            <span className="px-boss-eye r" />
          </div>
          <div className="px-boss-coil c1" />
          <div className="px-boss-coil c2" />
          <div className="px-boss-coil c3" />
        </div>
      ) : (
        <div
          className={`dragon-frame ${phaseMeta.fx} ${motionClass} ${critClass} ${motion === 'dodge' ? dodgeDir : ''} ${clearedClass}`}
          aria-hidden
        >
          <span className="dragon-aura" />
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="(max-width: 767px) 45vw, (max-width: 1023px) 50vw, 55vw"
            className={`dragon-art object-contain object-bottom ${motionClass} ${clearedClass}`}
            onError={() => setImageFailed(true)}
            priority
          />
          {showFx && phase === 1 && (
            <>
              <span className="dragon-eye-glow left" />
              <span className="dragon-eye-glow right" />
            </>
          )}
          {showFx && phase === 2 && (
            <>
              <span className="dragon-rune-glow" />
              <span className="dragon-ember ember-soft e1" />
              <span className="dragon-ember ember-soft e2" />
              <span className="dragon-ember ember-soft e3" />
            </>
          )}
          {showFx && phase === 3 && (
            <>
              <span className="dragon-wing-highlight left" />
              <span className="dragon-wing-highlight right" />
              <span className="dragon-fire-glow" />
              <span className="dragon-fire-breath" />
              <span className="dragon-ember e1" />
              <span className="dragon-ember e2" />
              <span className="dragon-ember e3" />
              <span className="dragon-ember e4" />
            </>
          )}
        </div>
      )}
    </div>
  );
}

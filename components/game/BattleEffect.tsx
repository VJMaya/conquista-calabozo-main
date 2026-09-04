'use client';

import type { BattleAnimEvent, BattleEffectKind } from '@/types/battle';

interface BattleEffectProps {
  kind: BattleEffectKind;
  event?: BattleAnimEvent | null;
  showCorrectAnswer?: boolean;
  correctAnswer?: string;
}

export default function BattleEffect({
  kind,
  event,
  showCorrectAnswer = false,
  correctAnswer,
}: BattleEffectProps) {
  if (kind === 'none' && !event) return null;

  const success =
    kind === 'success' ||
    kind === 'critical' ||
    event?.kind === 'success' ||
    event?.kind === 'critical';
  const critical =
    kind === 'critical' ||
    event?.kind === 'critical' ||
    (success && (event?.pointsAwarded ?? 0) > 100);
  const timeout = kind === 'timeout' || event?.kind === 'timeout';
  const miss = !success && (kind === 'miss' || event?.kind === 'miss' || timeout);
  const variant = critical ? 'critical' : success ? 'success' : timeout ? 'timeout' : 'miss';
  const label = critical ? 'CRITICAL HIT' : success ? 'SUCCESSFUL HIT' : timeout ? 'TIME OUT' : 'MISS';

  return (
    <div
      key={event?.key || variant}
      className={`combat-fx is-${variant}`}
      aria-hidden
    >
      <span className="combat-flash" />
      {success && (
        <>
          <span className="combat-slash" />
          <span className="combat-burst" />
          <span className="combat-spark s1" />
          <span className="combat-spark s2" />
          <span className="combat-spark s3" />
          <span className="combat-spark s4" />
          <span className="combat-spark s5" />
        </>
      )}
      {miss && !timeout && (
        <>
          <span className="combat-dust d1" />
          <span className="combat-dust d2" />
          <span className="combat-dust d3" />
        </>
      )}
      {timeout && (
        <>
          <span className="combat-smoke sm1" />
          <span className="combat-smoke sm2" />
          <span className="combat-ash a1" />
          <span className="combat-ash a2" />
          <span className="combat-ash a3" />
        </>
      )}
      <p className="combat-label">{label}</p>
      {miss && showCorrectAnswer && correctAnswer && (
        <p className="combat-sublabel">Correct Answer: {correctAnswer}</p>
      )}
    </div>
  );
}

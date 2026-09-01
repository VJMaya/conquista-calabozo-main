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

  const success = kind === 'success' || kind === 'critical' || event?.kind === 'success' || event?.kind === 'critical';
  const critical = kind === 'critical' || event?.kind === 'critical';
  const timeout = kind === 'timeout' || event?.kind === 'timeout';
  const miss = !success && (kind === 'miss' || event?.kind === 'miss' || timeout);

  return (
    <div className="px-fx pointer-events-none absolute inset-x-0 top-4 z-10 flex flex-col items-center text-center">
      {success && (
        <p className="text-lg text-[#3dff7a] sm:text-2xl">
          {critical ? 'CRITICAL HIT!' : 'SUCCESSFUL HIT!'}
        </p>
      )}
      {miss && (
        <>
          <p className="text-lg text-[#c41e3a] sm:text-2xl">{timeout ? 'TIME OUT' : 'MISS!'}</p>
          {showCorrectAnswer && correctAnswer && (
            <p className="mt-1 text-sm text-[#e0e6ff]">Correct Answer: {correctAnswer}</p>
          )}
        </>
      )}
    </div>
  );
}

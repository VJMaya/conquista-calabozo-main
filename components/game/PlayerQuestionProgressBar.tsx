'use client';

import { useMemo } from 'react';
import './battle-arena.css';

export interface PlayerQuestionProgressBarProps {
  playerName: string;
  answeredCount: number;
  correctCount: number;
  totalQuestions: number;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export default function PlayerQuestionProgressBar({
  playerName,
  answeredCount,
  correctCount,
  totalQuestions,
}: PlayerQuestionProgressBarProps) {
  const total = Math.max(1, Math.floor(totalQuestions) || 30);

  const { correctPct, incorrectPct, remainingPct, answered, correct, incorrect, remaining } =
    useMemo(() => {
      const answeredSafe = clamp(Math.floor(answeredCount), 0, total);
      const correctSafe = clamp(Math.floor(correctCount), 0, answeredSafe);
      const incorrectSafe = Math.max(0, answeredSafe - correctSafe);
      const remainingSafe = Math.max(0, total - answeredSafe);

      let correctPercent = (correctSafe / total) * 100;
      let incorrectPercent = (incorrectSafe / total) * 100;
      let remainingPercent = (remainingSafe / total) * 100;

      const sum = correctPercent + incorrectPercent + remainingPercent;
      if (sum > 100 && sum > 0) {
        const scale = 100 / sum;
        correctPercent *= scale;
        incorrectPercent *= scale;
        remainingPercent *= scale;
      }

      return {
        correctPct: clamp(correctPercent, 0, 100),
        incorrectPct: clamp(incorrectPercent, 0, 100),
        remainingPct: clamp(remainingPercent, 0, 100),
        answered: answeredSafe,
        correct: correctSafe,
        incorrect: incorrectSafe,
        remaining: remainingSafe,
      };
    }, [answeredCount, correctCount, total]);

  return (
    <div
      className="battle-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={answered}
      aria-label={`${playerName}: ${correct} correct, ${incorrect} incorrect, and ${remaining} remaining out of ${total} questions`}
    >
      <div className="battle-progress-track">
        {correctPct > 0 && (
          <div className="battle-progress-seg correct" style={{ width: `${correctPct}%` }} />
        )}
        {incorrectPct > 0 && (
          <div className="battle-progress-seg incorrect" style={{ width: `${incorrectPct}%` }} />
        )}
        {remainingPct > 0 && (
          <div className="battle-progress-seg remaining" style={{ width: `${remainingPct}%` }} />
        )}
      </div>
    </div>
  );
}

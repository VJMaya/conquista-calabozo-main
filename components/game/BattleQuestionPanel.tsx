'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import type { BattleFeedback, BattleQuestion } from '@/types/battle';
import './battle-arena.css';

interface BattleQuestionPanelProps {
  question: BattleQuestion | null;
  remainingSeconds: number;
  answered: boolean;
  waitingForTeammates: boolean;
  teamFinished: boolean;
  teamName: string;
  currentRank?: number | null;
  stageNumber: number;
  questionNumber: number;
  totalQuestions: number;
  totalStages: number;
  feedback?: BattleFeedback | null;
  onSubmit: (letter: string) => void;
  onOpenRanking?: () => void;
}

export default function BattleQuestionPanel({
  question,
  remainingSeconds,
  answered,
  waitingForTeammates,
  teamFinished,
  teamName,
  currentRank,
  stageNumber,
  questionNumber,
  totalQuestions,
  totalStages,
  feedback,
  onSubmit,
  onOpenRanking,
}: BattleQuestionPanelProps) {
  const [selected, setSelected] = useState('');
  const limit = question?.timeLimitSeconds || 30;
  const timerPercent = Math.max(0, Math.min(100, (remainingSeconds / limit) * 100));
  const timerClass =
    timerPercent > 50 ? 'bg-[#3dff7a]' : timerPercent > 25 ? 'bg-[#e6c34a]' : 'bg-[#c41e3a]';

  if (teamFinished) {
    return (
      <section className="battle-panel p-5 text-center">
        <p className="dungeon-title text-2xl sm:text-4xl">DUNGEON CLEARED!</p>
        <p className="mt-3 text-lg font-bold uppercase">TEAM {teamName}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[#d4af37]">Current Rank</p>
        <p className="text-4xl font-black text-[#d4af37]">#{currentRank || '—'}</p>
        <p className="mt-4 text-sm uppercase tracking-wide text-[#8892b0]">
          Waiting for the remaining teams...
        </p>
        {onOpenRanking && (
          <Button className="mt-4" variant="secondary" type="button" onClick={onOpenRanking}>
            Ranking
          </Button>
        )}
      </section>
    );
  }

  if (waitingForTeammates && answered) {
    return (
      <section className="battle-panel p-5 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">Waiting for teammates</p>
        <h2 className="dungeon-title mt-2 text-2xl">Answer locked in</h2>
        {feedback && (
          <p className="mt-3 font-bold">
            {feedback.isCorrect
              ? `SUCCESSFUL HIT! +${feedback.pointsAwarded} POINTS`
              : `MISS! Correct Answer: ${feedback.correctAnswer}`}
          </p>
        )}
      </section>
    );
  }

  if (!question) {
    return (
      <section className="battle-panel p-5 text-center">
        <p className="dungeon-title text-xl">Waiting for the next question</p>
      </section>
    );
  }

  const options: Array<{ letter: string; text?: string }> = [
    { letter: 'A', text: question.optionA },
    { letter: 'B', text: question.optionB },
    { letter: 'C', text: question.optionC },
    { letter: 'D', text: question.optionD },
  ];

  return (
    <section className="battle-panel p-4 sm:p-5">
      <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">
        To pass, answer the question!
      </p>
      <p className="mt-2 text-center text-[11px] uppercase text-[#8892b0]">
        Stage {stageNumber} of {totalStages} · Question {Math.min(questionNumber, totalQuestions)} / {totalQuestions}
      </p>
      <p className="mt-3 text-center text-lg font-black leading-snug text-[#e0e6ff] sm:text-2xl">
        {question.questionText}
      </p>

      <div className="mx-auto mt-4 max-w-xl text-center">
        <p className="text-sm font-black uppercase">
          {remainingSeconds} {remainingSeconds === 1 ? 'Second' : 'Seconds'} Remaining
        </p>
        <div className="mt-2 h-5 overflow-hidden border-2 border-[#d4af37] bg-[#0a0e27]">
          <div className={`h-full ${timerClass}`} style={{ width: `${timerPercent}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.letter}
            type="button"
            disabled={answered}
            onClick={() => setSelected(option.letter)}
            className={`min-h-[48px] border-2 px-3 py-3 text-left font-bold uppercase ${
              selected === option.letter
                ? 'border-[#d4af37] bg-[#d4af37] text-[#0a0e27]'
                : 'border-[#8892b0] bg-[#141829] text-[#e0e6ff]'
            }`}
          >
            {option.letter}) {option.text}
          </button>
        ))}
      </div>

      <Button
        className="mt-4 w-full"
        size="lg"
        type="button"
        disabled={!selected || answered}
        onClick={() => {
          if (!selected || answered) return;
          onSubmit(selected);
        }}
      >
        Submit answer
      </Button>
    </section>
  );
}

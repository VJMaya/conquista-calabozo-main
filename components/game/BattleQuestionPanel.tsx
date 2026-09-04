'use client';

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
  selectedAnswer: string;
  onSubmit: (letter: string) => void;
  onSelectAnswer?: (letter: string) => void;
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
  selectedAnswer,
  onSubmit,
  onSelectAnswer,
  onOpenRanking,
}: BattleQuestionPanelProps) {
  const limit = question?.timeLimitSeconds || 30;
  const timerPercent = Math.max(0, Math.min(100, (remainingSeconds / limit) * 100));
  const timerClass =
    timerPercent > 50 ? 'bg-[#3dff7a]' : timerPercent > 25 ? 'bg-[#e6c34a]' : 'bg-[#c41e3a]';
  const selected = selectedAnswer || '';
  const outcome = feedback?.outcome || (feedback?.isCorrect ? 'correct' : feedback ? 'incorrect' : null);

  const correctAnswerLabel = (() => {
    if (!feedback?.correctAnswer || !question) return feedback?.correctAnswer || '';
    const key = String(feedback.correctAnswer).trim().toUpperCase();
    const byLetter: Record<string, string | undefined> = {
      A: question.optionA,
      B: question.optionB,
      C: question.optionC,
      D: question.optionD,
    };
    const text = byLetter[key];
    return text ? `${key}) ${text}` : feedback.correctAnswer;
  })();

  if (teamFinished) {
    return (
      <section className="battle-panel battle-victory-panel p-5 text-center">
        <p className="defeat-victory-kicker">VICTORY</p>
        <p className="dungeon-title text-2xl sm:text-4xl">DUNGEON CLEARED</p>
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

      {feedback && outcome && (
        <div className={`answer-result is-${outcome}`} role="status" aria-live="polite">
          <p className="answer-result-title">
            {outcome === 'correct'
              ? '✅ CORRECT ANSWER'
              : outcome === 'timeout'
                ? '⏳ TIME OUT'
                : '❌ INCORRECT ANSWER'}
          </p>
          {outcome === 'correct' && (
            <p className="answer-result-points">Points Awarded: +{feedback.pointsAwarded}</p>
          )}
          {correctAnswerLabel && (
            <p className="answer-result-answer">Correct Answer: {correctAnswerLabel}</p>
          )}
        </div>
      )}

      {waitingForTeammates && answered && (
        <p className="mt-3 text-center text-xs uppercase tracking-[0.22em] text-[#d4af37]">
          Waiting for teammates
        </p>
      )}

      <div className="mx-auto mt-4 max-w-xl text-center">
        <p className="text-sm font-black uppercase">
          {remainingSeconds} {remainingSeconds === 1 ? 'Second' : 'Seconds'} Remaining
        </p>
        <div className="battle-timer-track mt-2">
          <div className={`h-full ${timerClass}`} style={{ width: `${timerPercent}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={`${question.id}-${option.letter}`}
            type="button"
            disabled={answered}
            onClick={() => {
              if (answered) return;
              onSelectAnswer?.(option.letter);
            }}
            className={`battle-answer min-h-[48px] px-3 py-3 text-left font-bold uppercase ${
              selected === option.letter ? 'is-selected' : ''
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

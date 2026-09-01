'use client';

import { useMemo } from 'react';
import './battle-arena.css';
import BattleBoss from '@/components/game/BattleBoss';
import BattleCharacter from '@/components/game/BattleCharacter';
import BattleEffect from '@/components/game/BattleEffect';
import BattleQuestionPanel from '@/components/game/BattleQuestionPanel';
import BattleRoster from '@/components/game/BattleRoster';
import { prefersReducedMotion } from '@/lib/battle-animation';
import type { BattleArenaProps, BossVisualState, CharacterVisualState } from '@/types/battle';
import { TOTAL_QUESTIONS, TOTAL_STAGES } from '@/data/pack';

export default function BattleArena({
  currentUserId,
  teamName,
  members,
  question,
  remainingSeconds,
  answered,
  waitingForTeammates,
  teamFinished,
  currentRank,
  stageNumber,
  questionNumber,
  totalQuestions = TOTAL_QUESTIONS,
  totalStages = TOTAL_STAGES,
  feedback,
  activeAnim,
  bossHealthPercent,
  onSubmit,
  onOpenRanking,
}: BattleArenaProps) {
  const reducedMotion = prefersReducedMotion();
  const party = members.slice(0, 5);
  const clampedBossHealth = Math.max(
    0,
    Math.min(100, Number.isFinite(bossHealthPercent) ? bossHealthPercent : 100)
  );

  const bossState: BossVisualState = useMemo(() => {
    if (!activeAnim) return 'idle';
    if (activeAnim.isCorrect) return 'hit';
    return 'dodge';
  }, [activeAnim]);

  const effectKind = !activeAnim
    ? 'none'
    : activeAnim.kind === 'timeout'
      ? 'timeout'
      : activeAnim.kind === 'critical'
        ? 'critical'
        : activeAnim.kind === 'success'
          ? 'success'
          : 'miss';

  return (
    <div className="battle-arena-bg flex min-h-screen flex-col overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 p-3 sm:p-4 lg:grid lg:grid-cols-[220px_1fr_180px] lg:items-stretch">
        <BattleRoster
          members={party}
          currentUserId={currentUserId}
          totalQuestions={totalQuestions}
        />

        <div className="relative flex min-h-[220px] flex-col justify-end border-2 border-[#d4af37] bg-[#0a0e27]/40 p-3 sm:min-h-[280px]">
          <BattleEffect
            kind={effectKind}
            event={activeAnim}
            showCorrectAnswer={Boolean(
              activeAnim && activeAnim.userId === currentUserId && !activeAnim.isCorrect
            )}
            correctAnswer={feedback?.correctAnswer}
          />
          <div className="flex items-end justify-around gap-2">
            {party.map((member) => {
              let visualState: CharacterVisualState = 'idle';
              if (activeAnim && activeAnim.userId === member.id) {
                visualState = activeAnim.isCorrect ? 'successful-hit' : 'missed-attack';
              }
              return (
                <BattleCharacter
                  key={member.id}
                  displayName={member.displayName}
                  avatarKey={member.avatarKey}
                  visualState={visualState}
                  isCurrentUser={member.id === currentUserId}
                  reducedMotion={reducedMotion}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-end justify-center">
          <BattleBoss
            visualState={bossState}
            bossHealthPercent={clampedBossHealth}
            teamFinished={teamFinished}
            reducedMotion={reducedMotion}
            activeHit={Boolean(activeAnim?.isCorrect)}
            activeDodge={Boolean(activeAnim && !activeAnim.isCorrect)}
            questionNumber={questionNumber}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-3 pb-4">
        <BattleQuestionPanel
          question={question}
          remainingSeconds={remainingSeconds}
          answered={answered}
          waitingForTeammates={waitingForTeammates}
          teamFinished={teamFinished}
          teamName={teamName}
          currentRank={currentRank}
          stageNumber={stageNumber}
          questionNumber={Math.min(questionNumber, totalQuestions)}
          totalQuestions={totalQuestions}
          totalStages={totalStages}
          feedback={feedback}
          onSubmit={onSubmit}
          onOpenRanking={onOpenRanking}
        />
      </div>
    </div>
  );
}

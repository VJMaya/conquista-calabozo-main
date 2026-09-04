'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import './battle-arena.css';
import BattleBoss from '@/components/game/BattleBoss';
import BattleCharacter from '@/components/game/BattleCharacter';
import BattleEffect from '@/components/game/BattleEffect';
import BattleQuestionPanel from '@/components/game/BattleQuestionPanel';
import BattleRoster from '@/components/game/BattleRoster';
import { prefersReducedMotion } from '@/lib/battle-animation';
import {
  BATTLE_ASSET_PATHS,
  BOSS_PHASE_CLASS,
  orderPartyForFormation,
  resolveBossPhase,
} from '@/lib/battle-assets';
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
  const formation = useMemo(() => orderPartyForFormation(party), [party]);
  const clampedBossHealth = Math.max(
    0,
    Math.min(100, Number.isFinite(bossHealthPercent) ? bossHealthPercent : 100)
  );

  const bossState: BossVisualState = useMemo(() => {
    if (!activeAnim) return 'idle';
    if (activeAnim.isCorrect) return 'hit';
    return 'dodge';
  }, [activeAnim]);

  const criticalHit =
    Boolean(activeAnim?.isCorrect) &&
    (activeAnim?.kind === 'critical' || (activeAnim?.pointsAwarded ?? 0) > 100);

  const effectKind = !activeAnim
    ? 'none'
    : activeAnim.kind === 'timeout'
      ? 'timeout'
      : activeAnim.kind === 'critical' || (activeAnim.isCorrect && activeAnim.pointsAwarded > 100)
        ? 'critical'
        : activeAnim.kind === 'success'
          ? 'success'
          : activeAnim.kind === 'miss'
            ? 'miss'
            : 'miss';

  const phase = resolveBossPhase(questionNumber);
  const phaseClass = BOSS_PHASE_CLASS[phase];
  const [arenaBgFailed, setArenaBgFailed] = useState(false);

  return (
    <div className="battle-arena-bg flex min-h-screen flex-col overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-2 p-2 sm:p-4">
        <div className={`battle-stage ${phaseClass} ${teamFinished ? 'is-cleared' : ''}`}>
          <section className="battle-scene">
            <div className="battle-scene-craft" aria-hidden>
              <div className="dungeon-wall" />
              <div className="dungeon-arch a1" />
              <div className="dungeon-arch a2" />
              <div className="dungeon-arch a3" />
              <div className="dungeon-banner b1" />
              <div className="dungeon-banner b2" />
              <div className="dungeon-torch t1">
                <span className="torch-flame" />
              </div>
              <div className="dungeon-torch t2">
                <span className="torch-flame" />
              </div>
              <div className="dungeon-floor" />
            </div>
            <div className="battle-scene-photo" aria-hidden>
              {!arenaBgFailed && (
                <Image
                  src={BATTLE_ASSET_PATHS.background}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1152px) 100vw, 1152px"
                  className="battle-scene-photo-img"
                  onError={() => setArenaBgFailed(true)}
                />
              )}
            </div>
            <div className="battle-scene-atmosphere" aria-hidden />
            <div className="battle-scene-fade" aria-hidden />
            <div className="dungeon-ambient" aria-hidden>
              <span className="dungeon-fog fog-1" />
              <span className="dungeon-fog fog-2" />
              <span className="dungeon-dust dust-1" />
              <span className="dungeon-dust dust-2" />
              <span className="dungeon-dust dust-3" />
              <span className="dungeon-dust dust-4" />
              <span className="dungeon-mote mote-1" />
              <span className="dungeon-mote mote-2" />
              <span className="dungeon-mote mote-3" />
              <span className="dungeon-mote mote-4" />
              <span className="dungeon-mote mote-5" />
              <span className="dungeon-mote mote-6" />
            </div>

            {!teamFinished && (
              <div className="scene-embers" aria-hidden>
                <span className="scene-ember s1" />
                <span className="scene-ember s2" />
                <span className="scene-ember s3" />
                <span className="scene-ember s4" />
                <span className="scene-ember s5" />
                <span className="scene-ember s6" />
                <span className="scene-ash ash-1" />
                <span className="scene-ash ash-2" />
                <span className="scene-ash ash-3" />
              </div>
            )}

            <BattleEffect
              kind={effectKind}
              event={activeAnim}
              showCorrectAnswer={Boolean(
                activeAnim && activeAnim.userId === currentUserId && !activeAnim.isCorrect
              )}
              correctAnswer={feedback?.correctAnswer}
            />

            <div className="battle-party">
              {formation.map((member, index) => {
                let visualState: CharacterVisualState = 'idle';
                if (activeAnim && activeAnim.userId === member.id) {
                  visualState = activeAnim.isCorrect ? 'successful-hit' : 'missed-attack';
                }
                return (
                  <div key={member.id} className={`battle-party-slot slot-${index + 1}`}>
                    <BattleCharacter
                      displayName={member.displayName}
                      avatarKey={member.avatarKey}
                      visualState={visualState}
                      isCurrentUser={member.id === currentUserId}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                );
              })}
            </div>

            <div className="battle-boss-anchor">
              <BattleBoss
                visualState={bossState}
                bossHealthPercent={clampedBossHealth}
                teamFinished={teamFinished}
                reducedMotion={reducedMotion}
                activeHit={Boolean(activeAnim?.isCorrect)}
                activeDodge={Boolean(activeAnim && !activeAnim.isCorrect)}
                criticalHit={criticalHit}
                questionNumber={questionNumber}
              />
            </div>
          </section>

          <div className="battle-dialogue">
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

        <BattleRoster
          members={party}
          currentUserId={currentUserId}
          totalQuestions={totalQuestions}
        />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import './battle-arena.css';
import BattleBoss from '@/components/game/BattleBoss';
import BattleCharacter from '@/components/game/BattleCharacter';
import BattleEffect from '@/components/game/BattleEffect';
import BattleQuestionPanel from '@/components/game/BattleQuestionPanel';
import BattleRoster from '@/components/game/BattleRoster';
import { DEFEAT_BEAT_MS, prefersReducedMotion } from '@/lib/battle-animation';
import {
  BATTLE_ASSET_PATHS,
  BOSS_PHASE_CLASS,
  orderPartyForFormation,
  resolveBossPhase,
} from '@/lib/battle-assets';
import type {
  BattleArenaProps,
  BossVisualState,
  CharacterVisualState,
  DefeatBeat,
} from '@/types/battle';
import { TOTAL_QUESTIONS, TOTAL_STAGES } from '@/data/pack';

const GOLD_MOTES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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
  const [defeatBeat, setDefeatBeat] = useState<DefeatBeat>('idle');
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

  useEffect(() => {
    if (!teamFinished) {
      setDefeatBeat('idle');
      return undefined;
    }
    if (reducedMotion) {
      setDefeatBeat('victory');
      return undefined;
    }
    setDefeatBeat('roar');
    const timers = [
      window.setTimeout(() => setDefeatBeat('fall'), DEFEAT_BEAT_MS.fall),
      window.setTimeout(() => setDefeatBeat('silence'), DEFEAT_BEAT_MS.silence),
      window.setTimeout(() => setDefeatBeat('title-falls'), DEFEAT_BEAT_MS.titleFalls),
      window.setTimeout(() => setDefeatBeat('title-cleared'), DEFEAT_BEAT_MS.titleCleared),
      window.setTimeout(() => setDefeatBeat('victory'), DEFEAT_BEAT_MS.victory),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [teamFinished, reducedMotion]);

  const clearing = teamFinished && defeatBeat !== 'idle';
  const dragonFallen = clearing && defeatBeat !== 'roar';
  const showVictoryPanel = !teamFinished || defeatBeat === 'victory';

  return (
    <div className="battle-arena-bg flex min-h-screen flex-col overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-2 p-2 sm:p-4">
        <div className={`battle-stage ${phaseClass} ${clearing ? `is-clearing is-${defeatBeat}` : ''}`}>
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
                teamFinished={dragonFallen}
                reducedMotion={reducedMotion}
                activeHit={Boolean(activeAnim?.isCorrect)}
                activeDodge={Boolean(activeAnim && !activeAnim.isCorrect)}
                criticalHit={criticalHit}
                questionNumber={questionNumber}
                defeatBeat={defeatBeat}
              />
            </div>

            {clearing && (
              <div className={`defeat-cinematic is-${defeatBeat}`} aria-live="polite">
                <span className="defeat-veil" aria-hidden />
                <span className="defeat-roar-wave w1" aria-hidden />
                <span className="defeat-roar-wave w2" aria-hidden />
                <span className="defeat-roar-wave w3" aria-hidden />
                {defeatBeat === 'title-falls' && (
                  <p className="defeat-title is-falls">VORTHAK FALLS</p>
                )}
                {(defeatBeat === 'title-cleared' || defeatBeat === 'victory') && (
                  <>
                    <span className="defeat-victory-burst" aria-hidden />
                    <div className="defeat-gold-motes" aria-hidden>
                      {GOLD_MOTES.map((mote) => (
                        <span key={mote} className={`defeat-gold-mote g${mote}`} />
                      ))}
                    </div>
                  </>
                )}
                {defeatBeat === 'title-cleared' && (
                  <p className="defeat-title is-cleared-copy">DUNGEON CLEARED</p>
                )}
              </div>
            )}
          </section>

          <div className={`battle-dialogue ${teamFinished && defeatBeat !== 'victory' ? 'is-cinematic-hidden' : ''}`}>
            <BattleQuestionPanel
              question={question}
              remainingSeconds={remainingSeconds}
              answered={answered}
              waitingForTeammates={waitingForTeammates}
              teamFinished={showVictoryPanel && teamFinished}
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

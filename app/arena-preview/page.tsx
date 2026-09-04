'use client';

import { useEffect, useState } from 'react';
import BattleArena from '@/components/game/BattleArena';
import { BATTLE_ANIM_MS } from '@/lib/battle-animation';
import type { BattleAnimEvent, BattleMember } from '@/types/battle';

const MEMBERS: BattleMember[] = [
  { id: 'u1', displayName: 'Aldric', avatarKey: 'knight', isConnected: true, answeredCount: 7, correctCount: 5 },
  { id: 'u2', displayName: 'Brunn', avatarKey: 'dwarf', isConnected: true, answeredCount: 7, correctCount: 6 },
  { id: 'u3', displayName: 'Selene', avatarKey: 'wizard', isConnected: true, answeredCount: 6, correctCount: 4 },
  { id: 'u4', displayName: 'Kaia', avatarKey: 'archer', isConnected: false, answeredCount: 7, correctCount: 3 },
  { id: 'u5', displayName: 'Lyra', avatarKey: 'fairy', isConnected: true, answeredCount: 7, correctCount: 7 },
];

export default function ArenaPreviewPage() {
  const [questionNumber, setQuestionNumber] = useState(4);
  const [activeAnim, setActiveAnim] = useState<BattleAnimEvent | null>(null);
  const [teamFinished, setTeamFinished] = useState(false);

  useEffect(() => {
    if (!activeAnim) return undefined;
    const timer = window.setTimeout(() => setActiveAnim(null), BATTLE_ANIM_MS);
    return () => window.clearTimeout(timer);
  }, [activeAnim]);

  // Drop back to idle for a frame so the cinematic restarts from the roar.
  const replayCinematic = () => {
    setTeamFinished(false);
    window.setTimeout(() => setTeamFinished(true), 60);
  };

  const play = (kind: BattleAnimEvent['kind'], pointsAwarded: number, isCorrect: boolean) => {
    setActiveAnim({
      key: `${kind}-${Date.now()}`,
      userId: 'u1',
      avatarKey: 'knight',
      isCorrect,
      pointsAwarded,
      kind,
      questionId: 'q1',
    });
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 p-2">
        {[4, 14, 24].map((value) => (
          <button
            key={value}
            type="button"
            className="border-2 border-[#d4af37] px-3 py-1 text-xs font-bold uppercase text-[#e0e6ff]"
            onClick={() => setQuestionNumber(value)}
          >
            Q{value}
          </button>
        ))}
        <button
          type="button"
          className="border-2 border-[#d4af37] px-3 py-1 text-xs font-bold uppercase text-[#ffd24a]"
          onClick={() => play('success', 100, true)}
        >
          Hit
        </button>
        <button
          type="button"
          className="border-2 border-[#d4af37] px-3 py-1 text-xs font-bold uppercase text-[#ffd24a]"
          onClick={() => play('critical', 180, true)}
        >
          Crit
        </button>
        <button
          type="button"
          className="border-2 border-[#8892b0] px-3 py-1 text-xs font-bold uppercase text-[#c9d0dc]"
          onClick={() => play('miss', 0, false)}
        >
          Miss
        </button>
        <button
          type="button"
          className="border-2 border-[#d4af37] px-3 py-1 text-xs font-bold uppercase text-[#ffd24a]"
          onClick={() => play('timeout', 0, false)}
        >
          Time out
        </button>
        <button
          type="button"
          className="border-2 border-[#ffd24a] px-3 py-1 text-xs font-bold uppercase text-[#ffd24a]"
          onClick={replayCinematic}
        >
          Clear dungeon
        </button>
        <button
          type="button"
          className="border-2 border-[#8892b0] px-3 py-1 text-xs font-bold uppercase text-[#c9d0dc]"
          onClick={() => setTeamFinished(false)}
        >
          Reset
        </button>
      </div>
      <BattleArena
        currentUserId="u1"
        teamName="Obsidian Dragons"
        members={MEMBERS}
        question={{
          id: 'q1',
          questionText: 'Which planet is known as the Red Planet?',
          optionA: 'Venus',
          optionB: 'Mars',
          optionC: 'Jupiter',
          optionD: 'Mercury',
          stageNumber: Math.ceil(questionNumber / 10),
          questionNumber,
          totalQuestions: 30,
          timeLimitSeconds: 30,
        }}
        remainingSeconds={21}
        answered={false}
        waitingForTeammates={false}
        teamFinished={teamFinished}
        currentRank={2}
        stageNumber={Math.ceil(questionNumber / 10)}
        questionNumber={questionNumber}
        totalQuestions={30}
        totalStages={3}
        feedback={null}
        activeAnim={activeAnim}
        bossHealthPercent={62}
        onSubmit={() => undefined}
      />
    </div>
  );
}

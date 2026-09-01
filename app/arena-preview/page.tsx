'use client';

import { useState } from 'react';
import BattleArena from '@/components/game/BattleArena';
import type { BattleMember } from '@/types/battle';

const MEMBERS: BattleMember[] = [
  { id: 'u1', displayName: 'Aldric', avatarKey: 'knight', isConnected: true, answeredCount: 7, correctCount: 5 },
  { id: 'u2', displayName: 'Brunn', avatarKey: 'dwarf', isConnected: true, answeredCount: 7, correctCount: 6 },
  { id: 'u3', displayName: 'Selene', avatarKey: 'wizard', isConnected: true, answeredCount: 6, correctCount: 4 },
  { id: 'u4', displayName: 'Kaia', avatarKey: 'archer', isConnected: false, answeredCount: 7, correctCount: 3 },
  { id: 'u5', displayName: 'Lyra', avatarKey: 'fairy', isConnected: true, answeredCount: 7, correctCount: 7 },
];

export default function ArenaPreviewPage() {
  const [questionNumber, setQuestionNumber] = useState(4);

  return (
    <div>
      <div className="flex gap-2 p-2">
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
        teamFinished={false}
        currentRank={2}
        stageNumber={Math.ceil(questionNumber / 10)}
        questionNumber={questionNumber}
        totalQuestions={30}
        totalStages={3}
        feedback={null}
        activeAnim={null}
        bossHealthPercent={62}
        onSubmit={() => undefined}
      />
    </div>
  );
}

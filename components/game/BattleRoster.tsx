'use client';

import PlayerQuestionProgressBar from '@/components/game/PlayerQuestionProgressBar';
import type { BattleMember } from '@/types/battle';
import './battle-arena.css';

const CLASS_LABELS: Record<string, string> = {
  fairy: 'Fairy',
  wizard: 'Wizard',
  knight: 'Knight',
  archer: 'Archer',
  elf: 'Elf',
  dwarf: 'Dwarf',
};

interface BattleRosterProps {
  members: BattleMember[];
  currentUserId: string;
  totalQuestions: number;
}

export default function BattleRoster({
  members,
  currentUserId,
  totalQuestions,
}: BattleRosterProps) {
  const roster = members.slice(0, 5);

  return (
    <aside className="battle-roster-strip flex gap-2 overflow-x-auto">
      {roster.map((member) => {
        const connected = member.isConnected !== false;
        const isCurrent = member.id === currentUserId;
        const klass = CLASS_LABELS[member.avatarKey] || 'Adventurer';
        return (
          <div
            key={member.id}
            className={`min-w-[150px] flex-1 border-2 p-2 ${
              isCurrent ? 'border-[#d4af37] bg-[#141829]' : 'border-[#1a1408] bg-[#1a1f3a]'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <div className={`px-hero battle-pixel ${CLASS_LABELS[member.avatarKey] ? member.avatarKey : 'knight'} scale-75 origin-left`} aria-hidden>
                <div className="px-hero-head" />
                <div className="px-hero-body" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase text-[#e0e6ff]">{member.displayName}</p>
                <p className="text-[10px] uppercase tracking-wide text-[#8892b0]">{klass}</p>
                <p className={`text-[10px] font-bold uppercase ${connected ? 'text-[#3dff7a]' : 'text-[#c41e3a]'}`}>
                  {connected ? '🟢 Connected' : '🔴 Disconnected'}
                </p>
              </div>
            </div>
            <PlayerQuestionProgressBar
              playerName={member.displayName}
              answeredCount={member.answeredCount}
              correctCount={member.correctCount}
              totalQuestions={totalQuestions}
            />
          </div>
        );
      })}
    </aside>
  );
}

// components/game/PlayerCard.tsx
import React from 'react';
import { Player } from '@/types/game';

interface PlayerCardProps {
  player: Player & { correctAnswers?: number; hp?: number; mp?: number };
  isCurrentUser?: boolean;
}

const AVATAR_ICONS: Record<string, string> = {
  fairy: '✨',
  wizard: '🧙',
  knight: '⚔️',
  archer: '🏹',
  elf: '🧝',
  dwarf: '⛏️',
};

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentUser = false,
}) => {
  return (
    <div className={`dungeon-panel p-3 ${
      isCurrentUser ? 'border-dungeon-green shadow-lg' : ''
    }`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{AVATAR_ICONS[player.avatarKey] || '⚔️'}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-dungeon-text truncate text-sm">
            {player.displayName}
          </p>
          <p className="text-dungeon-text-secondary text-xs uppercase">
            {player.avatarKey}
          </p>
          {player.correctAnswers !== undefined && (
            <p className="text-dungeon-green text-xs font-bold mt-1">
              ✓ {player.correctAnswers}
            </p>
          )}
        </div>
        {player.isConnected ? (
          <div className="w-2 h-2 bg-dungeon-green rounded-full" />
        ) : (
          <div className="w-2 h-2 bg-dungeon-red rounded-full" />
        )}
      </div>
      {player.hp !== undefined && (
        <div className="mt-2">
          <div className="hp-bar" style={{ width: `${Math.max(0, player.hp)}%` }} />
        </div>
      )}
      {player.mp !== undefined && (
        <div className="mt-1">
          <div className="mp-bar" style={{ width: `${Math.max(0, player.mp)}%` }} />
        </div>
      )}
    </div>
  );
};

export default PlayerCard;

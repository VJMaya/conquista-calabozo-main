// components/game/LeaderboardPanel.tsx
import React from 'react';
import { LeaderboardEntry } from '@/types/game';
import { TOTAL_STAGES } from '@/data/pack';
import {
  formatAccuracyLabel,
  resolveActivePlayerCount,
  teamAccuracyPercent,
} from '@/lib/team-ranking';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  currentUserTeamId?: string;
}

function accuracyFor(entry: LeaderboardEntry) {
  if (typeof entry.accuracyPercent === 'number') return entry.accuracyPercent;
  return teamAccuracyPercent(entry.totalCorrect, resolveActivePlayerCount(entry));
}

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  entries,
  currentUserTeamId,
}) => {
  return (
    <div className="dungeon-panel p-4">
      <h3 className="dungeon-title text-lg mb-4">LIVE RANKING</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.teamId}
            className={`p-3 border-2 ${
              currentUserTeamId === entry.teamId
                ? 'bg-dungeon-border text-dungeon-bg border-dungeon-green'
                : 'bg-dungeon-secondary border-dungeon-text-secondary'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">
                  {entry.rank === 1 && '🏆 '}
                  {entry.rank === 2 && '🥈 '}
                  {entry.rank === 3 && '🥉 '}
                  {entry.teamName}
                </p>
                <p className="text-xs uppercase opacity-75">
                  Stage {entry.currentStage}/{TOTAL_STAGES} • ✓ {entry.totalCorrect} · {entry.totalTimeSeconds}s
                </p>
              </div>
              <p className="font-bold text-lg">{formatAccuracyLabel(accuracyFor(entry))}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPanel;

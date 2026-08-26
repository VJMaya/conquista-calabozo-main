// components/ui/TimerBar.tsx
import React, { useEffect, useState } from 'react';

interface TimerBarProps {
  totalSeconds: number;
  remainingSeconds: number;
  isActive?: boolean;
  onExpire?: () => void;
}

const TimerBar: React.FC<TimerBarProps> = ({
  totalSeconds,
  remainingSeconds,
  isActive = true,
  onExpire,
}) => {
  const percentage = (remainingSeconds / totalSeconds) * 100;
  const isWarning = percentage < 20;
  const isEmergency = percentage < 10;

  useEffect(() => {
    if (remainingSeconds <= 0 && isActive && onExpire) {
      onExpire();
    }
  }, [remainingSeconds, isActive, onExpire]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-dungeon-text-secondary text-sm uppercase">Tiempo restante</span>
        <span className={`font-bold ${
          isEmergency ? 'text-dungeon-red' :
          isWarning ? 'text-yellow-400' :
          'text-dungeon-green'
        }`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
      <div className="h-4 bg-dungeon-secondary border-2 border-dungeon-border overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ${
            isEmergency ? 'bg-dungeon-red' :
            isWarning ? 'bg-yellow-400' :
            'bg-dungeon-green'
          }`}
          style={{ width: `${Math.max(0, percentage)}%` }}
        />
      </div>
    </div>
  );
};

export default TimerBar;

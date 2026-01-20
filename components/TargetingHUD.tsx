import React, { useEffect, useState } from 'react';
import { LockState } from '../game/GameEngine';
import type { Lock } from '../game/GameEngine';

interface TargetingState {
  lockCount: number;
  maxLocks: number;
  hasAnyLock: boolean;
  primaryTarget: Lock | null;
  allLocks: Lock[];
}

/**
 * TargetingHUD - Displays targeting system status
 * Shows lock slots, primary target info, and warning indicators
 */
export const TargetingHUD: React.FC = () => {
  const [targetingState, setTargetingState] = useState<TargetingState | null>(null);

  useEffect(() => {
    const handleTargetingUpdate = (e: CustomEvent) => {
      setTargetingState(e.detail);
    };

    window.addEventListener('targeting-update', handleTargetingUpdate as EventListener);
    return () => {
      window.removeEventListener('targeting-update', handleTargetingUpdate as EventListener);
    };
  }, []);

  if (!targetingState) return null;

  const { lockCount, maxLocks, primaryTarget, allLocks } = targetingState;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
      {/* Lock Slots Display */}
      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-cyan-400/30">
        <div className="text-cyan-400 text-xs font-mono mb-2 uppercase tracking-wider">
          Target Locks
        </div>
        
        {/* Lock slot indicators */}
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: maxLocks }).map((_, index) => {
            const lock = allLocks[index];
            return (
              <LockSlot 
                key={index} 
                slotNumber={index + 1}
                lock={lock}
              />
            );
          })}
        </div>

        {/* Lock status summary */}
        <div className="mt-3 pt-2 border-t border-cyan-400/20">
          <div className="text-xs font-mono text-cyan-400/70">
            {lockCount === 0 ? (
              <span className="text-gray-500">NO LOCKS</span>
            ) : (
              <span>
                <span className="text-cyan-400">{lockCount}</span>
                <span className="text-gray-500">/{maxLocks}</span>
                <span className="text-cyan-400 ml-2">ACTIVE</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary Target Info */}
      {primaryTarget && (
        <div className="mt-3 bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-red-500/50">
          <div className="text-red-500 text-xs font-mono mb-2 uppercase tracking-wider flex items-center gap-2">
            <span className="animate-pulse">◆</span>
            Primary Target
          </div>
          <div className="text-sm font-mono">
            <div className="text-red-400">
              ID: {primaryTarget.target.id.toUpperCase()}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              HP: {primaryTarget.target.health}
            </div>
            <div className="text-green-400 text-xs">
              LOCKED
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface LockSlotProps {
  slotNumber: number;
  lock?: Lock;
}

const LockSlot: React.FC<LockSlotProps> = ({ slotNumber, lock }) => {
  if (!lock) {
    // Empty slot
    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border border-gray-600/50 rounded-sm flex items-center justify-center">
          <span className="text-gray-600 text-xs">{slotNumber}</span>
        </div>
        <div className="text-gray-600 text-xs font-mono">---</div>
      </div>
    );
  }

  const isLocked = lock.state === LockState.LOCKED;
  const isTracking = lock.state === LockState.TRACKING;
  const isPrimary = lock.isPrimary;
  const progress = (lock.acquireTimer / 2.0) * 100; // 2 second acquisition

  // Colors based on state
  const bgColor = isPrimary 
    ? 'bg-red-500/20 border-red-500' 
    : isLocked 
      ? 'bg-orange-400/20 border-orange-400' 
      : 'bg-yellow-400/20 border-yellow-400';
  const textColor = isPrimary ? 'text-red-400' : isLocked ? 'text-orange-400' : 'text-yellow-400';

  return (
    <div className="flex items-center gap-2">
      {/* Slot indicator with state */}
      <div className={`w-5 h-5 border rounded-sm flex items-center justify-center ${bgColor}`}>
        <span className={`text-xs font-bold ${textColor}`}>
          {isPrimary ? '◆' : isLocked ? '◇' : '○'}
        </span>
      </div>

      {/* Target info */}
      <div className="flex-1">
        <div className={`text-xs font-mono ${textColor}`}>
          {lock.target.id.slice(-4).toUpperCase()}
        </div>
        
        {/* Progress bar for tracking */}
        {isTracking && (
          <div className="w-16 h-1 bg-gray-700/50 rounded-full overflow-hidden mt-0.5">
            <div 
              className="h-full bg-yellow-400 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Status label */}
      <div className={`text-xs font-mono ${textColor}`}>
        {isPrimary ? 'PRI' : isLocked ? 'LCK' : 'TRK'}
      </div>
    </div>
  );
};

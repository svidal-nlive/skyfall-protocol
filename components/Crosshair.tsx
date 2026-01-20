import React, { useEffect, useState } from 'react';
import { LockState } from '../game/GameEngine';
import type { Lock } from '../game/GameEngine';

interface LockScreenPosition {
  lock: Lock;
  screenX: number;
  screenY: number;
  isVisible: boolean;
}

interface TargetingState {
  lockCount: number;
  maxLocks: number;
  hasAnyLock: boolean;
  lockScreenPositions: LockScreenPosition[];
}

export const Crosshair: React.FC = () => {
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

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
      {/* Position crosshair in center - where jet was, jet moves lower */}
      <div className="relative -translate-y-[5vh]">
        {/* Simple clean reticle - not too busy */}
        {/* Outer targeting brackets */}
        <div className="w-24 h-24 relative flex items-center justify-center">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/70" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/70" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/70" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/70" />
          
          {/* Inner circle */}
          <div className="w-8 h-8 border border-cyan-400/50 rounded-full flex items-center justify-center">
            {/* Center pip */}
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          </div>
          
          {/* Horizontal tick marks */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-cyan-400/60" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-cyan-400/60" />
          
          {/* Vertical tick marks */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 h-2 w-0.5 bg-cyan-400/60" />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-2 w-0.5 bg-cyan-400/60" />
        </div>
      </div>

      {/* Lock indicators on targets */}
      {targetingState?.lockScreenPositions.map((lockPos, index) => (
        lockPos.isVisible && (
          <LockIndicator 
            key={lockPos.lock.target.id}
            lock={lockPos.lock}
            screenX={lockPos.screenX}
            screenY={lockPos.screenY}
          />
        )
      ))}

      {/* Lock count indicator */}
      {targetingState && targetingState.lockCount > 0 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 text-cyan-400 font-mono text-sm">
          LOCKS: {targetingState.lockCount}/{targetingState.maxLocks}
        </div>
      )}
    </div>
  );
};

interface LockIndicatorProps {
  lock: Lock;
  screenX: number;
  screenY: number;
}

const LockIndicator: React.FC<LockIndicatorProps> = ({ lock, screenX, screenY }) => {
  const isLocked = lock.state === LockState.LOCKED;
  const isPrimary = lock.isPrimary;
  const progress = lock.acquireTimer / 2.0; // 2 second acquisition

  // Colors based on state
  const color = isPrimary ? 'text-red-500' : isLocked ? 'text-orange-400' : 'text-yellow-400';
  const borderColor = isPrimary ? 'border-red-500' : isLocked ? 'border-orange-400' : 'border-yellow-400';
  const glowColor = isPrimary ? 'shadow-red-500/50' : isLocked ? 'shadow-orange-400/50' : 'shadow-yellow-400/50';

  return (
    <div 
      className="fixed pointer-events-none"
      style={{ 
        left: screenX, 
        top: screenY,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Lock reticle */}
      <div className={`relative w-12 h-12 ${isLocked ? 'animate-pulse' : ''}`}>
        {/* Diamond shape for primary, square for secondary */}
        {isPrimary ? (
          // Diamond shape for primary target
          <div className={`absolute inset-0 border-2 ${borderColor} shadow-lg ${glowColor}`}
               style={{ transform: 'rotate(45deg)' }}>
            <div className={`absolute inset-1 border ${borderColor}/50`} />
          </div>
        ) : (
          // Square brackets for secondary
          <>
            <div className={`absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 ${borderColor}`} />
            <div className={`absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 ${borderColor}`} />
            <div className={`absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 ${borderColor}`} />
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 ${borderColor}`} />
          </>
        )}

        {/* Lock progress circle (while tracking) */}
        {!isLocked && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progress * 100}, 100`}
              className={color}
            />
          </svg>
        )}

        {/* Lock symbol */}
        <div className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${color}`}>
          {isPrimary ? '◆' : isLocked ? '◇' : '○'}
        </div>
      </div>

      {/* Target ID label */}
      <div className={`text-xs font-mono ${color} text-center mt-1 whitespace-nowrap`}>
        {isPrimary ? 'PRIMARY' : isLocked ? 'LOCKED' : 'TRACKING'}
      </div>
    </div>
  );
};

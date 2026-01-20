/**
 * EdgeIndicators - Off-screen target arrows
 * 
 * Features:
 * - Edge arrows pointing to off-screen locked targets
 * - Distance-based sizing (closer = larger arrow)
 * - Lock state colors: Acquiring (amber pulse) → Locked (emerald solid)
 * - Cluster nearby targets to reduce clutter
 * - Primary target indicator (diamond vs triangle for others)
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useHUDContext } from './HUDLayout';
import { LockState } from '../../game/GameEngine';
import type { Lock } from '../../game/GameEngine';

interface ScreenPosition {
  x: number;
  y: number;
  isOnScreen: boolean;
  distance: number;
}

interface IndicatorData {
  id: string;
  screenPos: ScreenPosition;
  lock: Lock;
  edgePosition: { x: number; y: number };
  angle: number;
  size: number;
}

export const EdgeIndicators: React.FC = () => {
  const hudContext = useHUDContext();
  const [indicators, setIndicators] = useState<IndicatorData[]>([]);
  const frameRef = useRef<number>(0);

  const processLocks = useCallback((locks: Lock[], screenPositions: Map<string, ScreenPosition>) => {
    const margin = 40; // Edge margin
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    const newIndicators: IndicatorData[] = [];

    locks.forEach(lock => {
      const screenPos = screenPositions.get(lock.target.id);
      if (!screenPos || screenPos.isOnScreen) return;

      // Calculate angle from center to target
      const dx = screenPos.x - centerX;
      const dy = screenPos.y - centerY;
      const angle = Math.atan2(dy, dx);

      // Find edge intersection
      let edgeX: number, edgeY: number;
      
      // Calculate where the line from center to target intersects the screen edge
      const tanAngle = Math.tan(angle);
      const halfWidth = (screenWidth / 2) - margin;
      const halfHeight = (screenHeight / 2) - margin;

      // Check which edge it hits
      if (Math.abs(Math.cos(angle)) * halfHeight > Math.abs(Math.sin(angle)) * halfWidth) {
        // Hits left or right edge
        edgeX = Math.sign(dx) * halfWidth + centerX;
        edgeY = Math.sign(dx) * halfWidth * tanAngle + centerY;
      } else {
        // Hits top or bottom edge
        edgeY = Math.sign(dy) * halfHeight + centerY;
        edgeX = Math.sign(dy) * halfHeight / tanAngle + centerX;
      }

      // Clamp to screen bounds with margin
      edgeX = Math.max(margin, Math.min(screenWidth - margin, edgeX));
      edgeY = Math.max(margin, Math.min(screenHeight - margin, edgeY));

      // Size based on distance (closer = larger)
      const maxDistance = 500;
      const minSize = hudContext.isMinimalMode ? 16 : 24;
      const maxSize = hudContext.isMinimalMode ? 28 : 40;
      const distanceRatio = Math.max(0, 1 - (screenPos.distance / maxDistance));
      const size = minSize + (maxSize - minSize) * distanceRatio;

      newIndicators.push({
        id: lock.target.id,
        screenPos,
        lock,
        edgePosition: { x: edgeX, y: edgeY },
        angle: angle + Math.PI / 2, // Rotate to point inward
        size,
      });
    });

    setIndicators(newIndicators);
  }, [hudContext.isMinimalMode]);

  useEffect(() => {
    const handleTargetingUpdate = (e: CustomEvent) => {
      const { allLocks, screenPositions } = e.detail;
      if (allLocks && screenPositions) {
        processLocks(allLocks, screenPositions);
      }
    };

    window.addEventListener('targeting-update', handleTargetingUpdate as EventListener);
    
    return () => {
      window.removeEventListener('targeting-update', handleTargetingUpdate as EventListener);
      cancelAnimationFrame(frameRef.current);
    };
  }, [processLocks]);

  // Don't render if no off-screen indicators
  if (indicators.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 'var(--z-hud-indicators)',
    }}>
      {indicators.map(indicator => (
        <EdgeArrow key={indicator.id} indicator={indicator} />
      ))}
    </div>
  );
};

// Individual edge arrow component
interface EdgeArrowProps {
  indicator: IndicatorData;
}

const EdgeArrow: React.FC<EdgeArrowProps> = ({ indicator }) => {
  const { lock, edgePosition, angle, size } = indicator;
  const isLocked = lock.state === LockState.LOCKED;
  const isTracking = lock.state === LockState.TRACKING;
  const isPrimary = lock.isPrimary;

  // Colors based on state
  const getColor = (): string => {
    if (isPrimary) return 'var(--hud-lock-primary)';
    if (isLocked) return 'var(--hud-lock-locked)';
    return 'var(--hud-lock-acquiring)';
  };

  const color = getColor();

  // Calculate progress for tracking state
  const progress = isTracking 
    ? (lock.acquireTimer / 1.0) * 100 // 1 second acquisition
    : 100;

  return (
    <div
      style={{
        position: 'absolute',
        left: edgePosition.x,
        top: edgePosition.y,
        transform: `translate(-50%, -50%) rotate(${angle}rad)`,
        width: size,
        height: size,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Arrow shape */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{
          filter: `drop-shadow(0 0 4px ${color})`,
          animation: isTracking ? 'hud-pulse 0.5s ease-in-out infinite' : undefined,
        }}
      >
        {isPrimary ? (
          // Diamond for primary target
          <polygon
            points="12,2 22,12 12,22 2,12"
            fill={color}
            stroke="white"
            strokeWidth="1"
          />
        ) : (
          // Triangle for other targets
          <polygon
            points="12,2 22,20 2,20"
            fill={color}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
          />
        )}

        {/* Progress arc for tracking */}
        {isTracking && (
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={`${progress * 0.628} 62.8`}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
            }}
          />
        )}
      </svg>

      {/* Distance text (rotated back to be readable) */}
      <div
        style={{
          position: 'absolute',
          bottom: -14,
          transform: `rotate(${-angle}rad)`,
          fontSize: '10px',
          fontFamily: 'var(--hud-font-mono)',
          color: color,
          textShadow: `0 0 4px ${color}`,
          whiteSpace: 'nowrap',
        }}
      >
        {Math.round(indicator.screenPos.distance)}m
      </div>

      {/* Primary target marker */}
      {isPrimary && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            transform: `rotate(${-angle}rad)`,
            fontSize: '8px',
            fontFamily: 'var(--hud-font-mono)',
            color: 'var(--hud-lock-primary)',
            textShadow: '0 0 4px var(--hud-lock-primary)',
            fontWeight: 'bold',
          }}
        >
          PRI
        </div>
      )}
    </div>
  );
};

export default EdgeIndicators;

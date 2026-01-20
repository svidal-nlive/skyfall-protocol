/**
 * WeaponsStrip - Compact icon-based weapons display
 * 
 * Features:
 * - Icon-based missile count (filled/empty icons)
 * - Circular reload progress around missile icon
 * - Thin cannon heat bar
 * - Horizontal strip layout (bottom-right)
 * - Lock glow animation when target acquired
 */

import React, { useEffect, useState } from 'react';
import { useHUDContext } from './HUDLayout';
import { HUDPanel, HUDLabel } from './HUDPanel';

interface MissileSlot {
  isReady: boolean;
  cooldownTimer: number;
  cooldownDuration: number;
}

interface MissileInfo {
  readyCount: number;
  maxMissiles: number;
  slots: MissileSlot[];
  activeMissiles: number;
}

interface CannonInfo {
  isFiring: boolean;
  activeProjectiles: number;
  muzzleFlash: number;
}

interface WeaponsState {
  missiles: MissileInfo;
  cannon: CannonInfo;
}

export const WeaponsStrip: React.FC = () => {
  const hudContext = useHUDContext();
  const [weaponsState, setWeaponsState] = useState<WeaponsState | null>(null);
  const [hasTarget, setHasTarget] = useState(false);

  useEffect(() => {
    const handleWeaponsUpdate = (e: CustomEvent) => {
      setWeaponsState(e.detail);
    };

    const handleTargetingUpdate = (e: CustomEvent) => {
      setHasTarget(e.detail.lockCount > 0);
    };

    window.addEventListener('weapons-update', handleWeaponsUpdate as EventListener);
    window.addEventListener('targeting-update', handleTargetingUpdate as EventListener);
    
    return () => {
      window.removeEventListener('weapons-update', handleWeaponsUpdate as EventListener);
      window.removeEventListener('targeting-update', handleTargetingUpdate as EventListener);
    };
  }, []);

  if (!weaponsState) return null;

  const { missiles, cannon } = weaponsState;
  const showLabels = !hudContext.isMinimalMode;
  const isCompact = hudContext.isMinimalMode || hudContext.isCompactMode;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--hud-edge-margin)',
      right: 'var(--hud-edge-margin)',
      zIndex: 'var(--z-hud-panels)',
      display: 'flex',
      flexDirection: isCompact ? 'row' : 'column',
      gap: '8px',
      alignItems: 'flex-end',
    }}>
      {/* Missiles Panel */}
      <HUDPanel 
        color={hasTarget && missiles.readyCount > 0 ? 'weapons' : 'default'}
        animate={hasTarget && missiles.readyCount > 0 ? 'glow' : 'none'}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {/* Label row */}
          {showLabels && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '8px',
            }}>
              <HUDLabel size="xs" color="secondary">MISSILES</HUDLabel>
              <span style={{
                color: 'var(--hud-weapons-ready)',
                fontFamily: 'var(--hud-font-mono)',
                fontSize: 'var(--hud-font-sm)',
                fontWeight: 'bold',
              }}>
                {missiles.readyCount}/{missiles.maxMissiles}
              </span>
            </div>
          )}

          {/* Missile slot indicators */}
          <div style={{
            display: 'flex',
            gap: isCompact ? '4px' : '6px',
          }}>
            {missiles.slots.map((slot, index) => (
              <MissileIcon key={index} slot={slot} compact={isCompact} />
            ))}
          </div>

          {/* Active missiles in flight */}
          {missiles.activeMissiles > 0 && showLabels && (
            <div style={{
              fontSize: 'var(--hud-font-xs)',
              color: 'var(--hud-score-combo)',
              fontFamily: 'var(--hud-font-mono)',
            }}>
              {missiles.activeMissiles} IN FLIGHT
            </div>
          )}
        </div>
      </HUDPanel>

      {/* Cannon Panel */}
      <HUDPanel 
        color={cannon.isFiring ? 'weapons' : 'default'}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: isCompact ? '40px' : '80px',
        }}>
          {/* Label row */}
          {showLabels && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '8px',
            }}>
              <HUDLabel size="xs" color="secondary">CANNON</HUDLabel>
              <span style={{
                color: cannon.isFiring ? 'var(--hud-weapons-firing)' : 'var(--hud-text-muted)',
                fontFamily: 'var(--hud-font-mono)',
                fontSize: 'var(--hud-font-xs)',
              }}>
                {cannon.isFiring ? 'FIRING' : 'READY'}
              </span>
            </div>
          )}

          {/* Cannon icon with activity bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {/* Lightning icon */}
            <span style={{
              fontSize: 'var(--hud-icon-small)',
              color: cannon.isFiring ? 'var(--hud-weapons-firing)' : 'var(--hud-text-muted)',
              animation: cannon.isFiring ? 'hud-pulse 0.15s ease-in-out infinite' : undefined,
            }}>
              ⚡
            </span>

            {/* Heat/activity bar */}
            <div style={{
              flex: 1,
              height: '6px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '3px',
              overflow: 'hidden',
              minWidth: '40px',
            }}>
              <div style={{
                width: cannon.isFiring ? '100%' : '0%',
                height: '100%',
                background: cannon.isFiring 
                  ? 'linear-gradient(90deg, var(--hud-weapons-ready), var(--hud-weapons-firing))'
                  : 'var(--hud-weapons-empty)',
                transition: 'width 0.1s ease-out',
                boxShadow: cannon.isFiring ? '0 0 10px var(--hud-weapons-firing)' : undefined,
              }} />
            </div>
          </div>

          {/* Muzzle flash glow */}
          {cannon.muzzleFlash > 0 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              boxShadow: `inset 0 0 20px rgba(34, 211, 238, ${cannon.muzzleFlash * 0.3})`,
              pointerEvents: 'none',
            }} />
          )}
        </div>
      </HUDPanel>
    </div>
  );
};

// Missile icon with circular reload progress
interface MissileIconProps {
  slot: MissileSlot;
  compact: boolean;
}

const MissileIcon: React.FC<MissileIconProps> = ({ slot, compact }) => {
  const size = compact ? 20 : 28;
  const strokeWidth = 2;
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  
  const progress = slot.isReady 
    ? 100 
    : ((slot.cooldownDuration - slot.cooldownTimer) / slot.cooldownDuration) * 100;
  
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
    }}>
      {/* SVG circle for reload progress */}
      <svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          transform: 'rotate(-90deg)',
        }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(100, 116, 139, 0.3)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        {!slot.isReady && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--hud-weapons-reload)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
          />
        )}
      </svg>

      {/* Missile icon in center */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: compact ? '10px' : '14px',
        color: slot.isReady ? 'var(--hud-health-full)' : 'var(--hud-text-muted)',
      }}>
        {slot.isReady ? '🚀' : '○'}
      </div>
    </div>
  );
};

export default WeaponsStrip;

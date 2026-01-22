/**
 * ThrottleBar - Horizontal throttle/speed indicator
 * 
 * Features:
 * - Horizontal bar positioned above health bar
 * - Speed readout in game units
 * - Color transitions based on throttle range
 * - Boost zone indicator
 * - Compact design to avoid radar overlap
 */

import React, { useEffect, useState } from 'react';
import { useHUDContext } from './HUDLayout';
import { HUDPanel, HUDLabel } from './HUDPanel';

interface ThrottleState {
  throttle: number;
  throttlePercent: number;
  speed: number;
  energy: number;
  maxEnergy: number;
  isBoosting: boolean;
}

export const ThrottleBar: React.FC = () => {
  const hudContext = useHUDContext();
  const [throttleState, setThrottleState] = useState<ThrottleState>({
    throttle: 0.3,
    throttlePercent: 30,
    speed: 20,
    energy: 100,
    maxEnergy: 100,
    isBoosting: false,
  });

  useEffect(() => {
    const handleThrottleUpdate = (e: CustomEvent) => {
      setThrottleState(e.detail);
    };

    window.addEventListener('throttle-update', handleThrottleUpdate as EventListener);
    
    return () => {
      window.removeEventListener('throttle-update', handleThrottleUpdate as EventListener);
    };
  }, []);

  const { throttle, throttlePercent, speed, energy, maxEnergy, isBoosting } = throttleState;
  const isCompact = hudContext.isMinimalMode || hudContext.isCompactMode;
  
  // Calculate bar widths
  const normalWidth = Math.min(throttle * 2, 1) * 100;  // 0-50% throttle = 0-100% of normal zone
  const boostWidth = Math.max(0, (throttle - 0.5) * 2) * 100;  // 50-100% throttle = 0-100% of boost zone
  const energyPercent = (energy / maxEnergy) * 100;
  
  // Color based on throttle position
  const getThrottleColor = (): string => {
    if (isBoosting && energy > 0) return '#ff6600';  // Orange for boosting
    if (throttle > 0.4) return '#00ff88';  // Green for normal flight
    if (throttle > 0.2) return '#ffff00';  // Yellow for low throttle
    return '#ff4444';  // Red for very low
  };
  
  const barWidth = isCompact ? 140 : 180;
  const barHeight = isCompact ? 10 : 14;

  return (
    <div style={{
      position: 'fixed',
      left: 'var(--hud-edge-margin)',
      bottom: 'calc(var(--hud-edge-margin) + 140px)', // Position higher up, well above health bar
      zIndex: 'var(--z-hud-panels)',
    }}>
      <HUDPanel color={isBoosting ? 'warning' : 'default'}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '6px 8px',
        }}>
          {/* Top row: Label + Speed + Percentage */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            <HUDLabel size="xs" color="secondary">THR</HUDLabel>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {/* Speed Display */}
              <div style={{
                fontSize: isCompact ? '10px' : '11px',
                color: 'var(--hud-text-secondary)',
                fontFamily: 'var(--hud-font-mono)',
              }}>
                {speed}<span style={{ fontSize: '8px', opacity: 0.7 }}>kts</span>
              </div>
              
              {/* Percentage Display */}
              <div style={{
                fontSize: isCompact ? '11px' : '13px',
                fontWeight: 'bold',
                color: getThrottleColor(),
                textShadow: `0 0 6px ${getThrottleColor()}`,
                fontFamily: 'var(--hud-font-mono)',
                minWidth: '32px',
                textAlign: 'right',
              }}>
                {throttlePercent}%
              </div>
            </div>
          </div>
          
          {/* Horizontal Throttle Bar */}
          <div style={{
            position: 'relative',
            width: `${barWidth}px`,
            height: `${barHeight}px`,
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            {/* Boost Zone Background (right 50%) */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '50%',
              background: 'rgba(255, 100, 0, 0.1)',
              borderLeft: '1px dashed rgba(255, 100, 0, 0.3)',
            }} />
            
            {/* 50% Marker Line */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: '1px',
              background: 'rgba(0, 255, 255, 0.3)',
            }} />
            
            {/* Normal Throttle Fill (left 50% of bar) */}
            <div style={{
              position: 'absolute',
              left: '2px',
              top: '2px',
              bottom: '2px',
              width: `calc(${normalWidth / 2}% - 2px)`,  // Scale to left half
              maxWidth: 'calc(50% - 2px)',
              background: getThrottleColor(),
              boxShadow: `0 0 6px ${getThrottleColor()}`,
              transition: 'width 0.1s ease-out, background 0.2s ease',
              borderRadius: '2px',
            }} />
            
            {/* Boost Throttle Fill (right 50% of bar) */}
            {boostWidth > 0 && (
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '2px',
                bottom: '2px',
                width: `calc(${boostWidth / 2}% - 2px)`,  // Scale to right half
                maxWidth: 'calc(50% - 4px)',
                background: energy > 0 ? '#ff6600' : '#663300',
                boxShadow: energy > 0 ? '0 0 8px #ff6600' : 'none',
                transition: 'width 0.1s ease-out',
                borderRadius: '2px',
              }} />
            )}
            
            {/* Throttle Position Indicator */}
            <div style={{
              position: 'absolute',
              left: `calc(${throttle * 100}% - 2px)`,
              top: '-1px',
              bottom: '-1px',
              width: '4px',
              background: '#ffffff',
              boxShadow: '0 0 6px #ffffff',
              borderRadius: '2px',
              transition: 'left 0.05s ease-out',
            }} />
          </div>
          
          {/* Energy Bar (only when in boost zone) */}
          {isBoosting && (
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${energyPercent}%`,
                height: '100%',
                background: energy > 20 ? '#00aaff' : '#ff4400',
                boxShadow: `0 0 4px ${energy > 20 ? '#00aaff' : '#ff4400'}`,
                transition: 'width 0.1s ease-out',
              }} />
            </div>
          )}
        </div>
      </HUDPanel>
    </div>
  );
};

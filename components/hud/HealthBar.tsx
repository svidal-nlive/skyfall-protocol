/**
 * HealthBar - Edge-anchored health display
 * 
 * Features:
 * - Horizontal bar with gradient fill (Emerald → Amber → Rose)
 * - Damage flash animation
 * - Low health warning pulse
 * - Responsive sizing
 * - Icon-only in minimal mode, percentage in full mode
 */

import React, { useEffect, useState, useRef } from 'react';
import { useHUDContext } from './HUDLayout';
import { HUDPanel, HUDLabel, HUDValue } from './HUDPanel';

interface HealthState {
  health: number;
  maxHealth: number;
  healthPercent: number;
  isLowHealth: boolean;
  isCriticalHealth: boolean;
  isInvulnerable: boolean;
  recentDamage: number;
}

export const HealthBar: React.FC = () => {
  const hudContext = useHUDContext();
  const [healthState, setHealthState] = useState<HealthState>({
    health: 100,
    maxHealth: 100,
    healthPercent: 1,
    isLowHealth: false,
    isCriticalHealth: false,
    isInvulnerable: false,
    recentDamage: 0,
  });
  
  const [showDamageFlash, setShowDamageFlash] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<{id: number; damage: number}[]>([]);
  const damageIdRef = useRef(0);

  useEffect(() => {
    const handleHealthUpdate = (e: CustomEvent) => {
      setHealthState(e.detail);
    };

    const handleDamage = (e: CustomEvent) => {
      const { damage } = e.detail;
      
      // Show damage flash
      setShowDamageFlash(true);
      setTimeout(() => setShowDamageFlash(false), 150);

      // Add floating damage number
      const id = damageIdRef.current++;
      setDamageNumbers(prev => [...prev, { id, damage }]);
      
      // Remove after animation
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(d => d.id !== id));
      }, 1000);
    };

    window.addEventListener('player-health-update', handleHealthUpdate as EventListener);
    window.addEventListener('player-damage', handleDamage as EventListener);

    return () => {
      window.removeEventListener('player-health-update', handleHealthUpdate as EventListener);
      window.removeEventListener('player-damage', handleDamage as EventListener);
    };
  }, []);

  // Get health color based on percentage
  const getHealthColor = (percent: number): string => {
    if (percent > 0.6) return 'var(--hud-health-full)';
    if (percent > 0.3) return 'var(--hud-health-warning)';
    return 'var(--hud-health-critical)';
  };

  // Get gradient for health bar fill
  const getHealthGradient = (percent: number): string => {
    const color = getHealthColor(percent);
    return `linear-gradient(90deg, ${color}, ${color}dd)`;
  };

  const healthColor = getHealthColor(healthState.healthPercent);
  const panelColor = healthState.isCriticalHealth ? 'critical' 
                   : healthState.isLowHealth ? 'warning' 
                   : 'health';

  // Determine what to show based on mode
  const showPercentage = !hudContext.isMinimalMode;
  const showLabel = hudContext.isFullMode;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--hud-edge-margin)',
      left: 'var(--hud-edge-margin)',
      zIndex: 'var(--z-hud-panels)',
    }}>
      <HUDPanel 
        color={panelColor}
        animate={healthState.isCriticalHealth ? 'pulse' : 'none'}
      >
        {/* Damage flash overlay */}
        {showDamageFlash && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--hud-health-critical)',
            opacity: 0.4,
            borderRadius: 'inherit',
            animation: 'hud-flash 0.15s ease-out forwards',
            pointerEvents: 'none',
          }} />
        )}

        {/* Label - only in full mode */}
        {showLabel && (
          <div style={{ 
            marginBottom: '4px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}>
            <span style={{ fontSize: 'var(--hud-icon-small)' }}>❤️</span>
            <HUDLabel size="xs" color="secondary">HULL</HUDLabel>
          </div>
        )}

        {/* Health bar container */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {/* Heart icon - minimal mode */}
          {!showLabel && (
            <span style={{
              fontSize: 'var(--hud-icon-small)',
              animation: healthState.isCriticalHealth ? 'hud-pulse 0.5s ease-in-out infinite' : undefined,
            }}>
              ❤️
            </span>
          )}

          {/* The actual health bar */}
          <div style={{
            width: 'var(--hud-health-width)',
            height: 'var(--hud-health-height)',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            {/* Health fill */}
            <div style={{
              width: `${healthState.healthPercent * 100}%`,
              height: '100%',
              background: getHealthGradient(healthState.healthPercent),
              boxShadow: `0 0 10px ${healthColor}`,
              transition: 'width 0.3s ease-out, background 0.3s',
              position: 'relative',
            }}>
              {/* Shimmer effect */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                opacity: 0.5,
              }} />
            </div>

            {/* Segment lines */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 9%,
                rgba(0, 0, 0, 0.3) 9%,
                rgba(0, 0, 0, 0.3) 10%
              )`,
              pointerEvents: 'none',
            }} />

            {/* Invulnerability overlay */}
            {healthState.isInvulnerable && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255, 255, 255, 0.3)',
                animation: 'hud-pulse 0.3s ease-in-out infinite',
              }} />
            )}
          </div>

          {/* Percentage display */}
          {showPercentage && (
            <HUDValue 
              size="sm" 
              color={healthColor}
              glow={healthState.isCriticalHealth}
            >
              {Math.round(healthState.healthPercent * 100)}%
            </HUDValue>
          )}
        </div>

        {/* Damage numbers */}
        {damageNumbers.map((dn) => (
          <div
            key={dn.id}
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'var(--hud-health-critical)',
              fontSize: 'var(--hud-font-md)',
              fontWeight: 'bold',
              fontFamily: 'var(--hud-font-mono)',
              textShadow: '0 0 10px var(--hud-health-critical)',
              animation: 'hud-slide-in-top 1s ease-out forwards',
              pointerEvents: 'none',
            }}
          >
            -{dn.damage}
          </div>
        ))}
      </HUDPanel>
    </div>
  );
};

export default HealthBar;

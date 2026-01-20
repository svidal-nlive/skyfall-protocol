import React, { useEffect, useState, useRef } from 'react';

interface HealthState {
  health: number;
  maxHealth: number;
  healthPercent: number;
  isLowHealth: boolean;
  isCriticalHealth: boolean;
  isInvulnerable: boolean;
  recentDamage: number;
}

/**
 * HealthHUD - Displays player health with visual feedback
 * 
 * Features:
 * - Health bar with color transitions
 * - Damage flash effect
 * - Low health warning pulse
 * - Critical health alarm
 * - Damage number indicators
 */
export const HealthHUD: React.FC = () => {
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
  const [damageNumbers, setDamageNumbers] = useState<{id: number; damage: number; x: number; y: number}[]>([]);
  const damageIdRef = useRef(0);

  useEffect(() => {
    const handleHealthUpdate = (e: CustomEvent) => {
      setHealthState(e.detail);
    };

    const handleDamage = (e: CustomEvent) => {
      const { damage, isCritical } = e.detail;
      
      // Show damage flash
      setShowDamageFlash(true);
      setTimeout(() => setShowDamageFlash(false), 150);

      // Add damage number
      const id = damageIdRef.current++;
      const x = 50 + (Math.random() - 0.5) * 20;
      const y = 70 + (Math.random() - 0.5) * 10;
      
      setDamageNumbers(prev => [...prev, { id, damage, x, y }]);
      
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

  // Calculate health bar color
  const getHealthColor = (percent: number): string => {
    if (percent > 0.6) return '#44ff44';  // Green
    if (percent > 0.3) return '#ffaa00';  // Orange
    return '#ff4444';                      // Red
  };

  const getHealthGlow = (percent: number): string => {
    if (percent > 0.6) return '0 0 10px #44ff44';
    if (percent > 0.3) return '0 0 10px #ffaa00';
    return '0 0 15px #ff4444, 0 0 30px #ff0000';
  };

  const healthColor = getHealthColor(healthState.healthPercent);

  // Container style
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    width: '280px',
    fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
    zIndex: 100,
  };

  // Health bar container
  const healthBarContainerStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.7)',
    border: '1px solid rgba(68, 136, 255, 0.3)',
    borderRadius: '4px',
    padding: '12px',
    backdropFilter: 'blur(4px)',
  };

  // Health bar outer
  const healthBarOuterStyle: React.CSSProperties = {
    width: '100%',
    height: '20px',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '3px',
    overflow: 'hidden',
    position: 'relative',
  };

  // Health bar fill
  const healthBarFillStyle: React.CSSProperties = {
    width: `${healthState.healthPercent * 100}%`,
    height: '100%',
    background: `linear-gradient(90deg, ${healthColor}, ${healthColor}dd)`,
    boxShadow: getHealthGlow(healthState.healthPercent),
    transition: 'width 0.3s ease-out, background 0.3s',
    position: 'relative',
  };

  // Segmented overlay
  const segmentStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `repeating-linear-gradient(
      90deg,
      transparent,
      transparent 9%,
      rgba(0, 0, 0, 0.3) 9%,
      rgba(0, 0, 0, 0.3) 10%
    )`,
    pointerEvents: 'none',
  };

  // Health text
  const healthTextStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    fontSize: '12px',
    letterSpacing: '1px',
  };

  // Label style
  const labelStyle: React.CSSProperties = {
    color: '#888888',
    fontSize: '10px',
    letterSpacing: '2px',
  };

  // Value style
  const valueStyle: React.CSSProperties = {
    color: healthColor,
    fontWeight: 'bold',
    fontSize: '16px',
    textShadow: `0 0 10px ${healthColor}`,
  };

  // Damage flash overlay
  const damageFlashStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle, transparent 50%, rgba(255, 0, 0, 0.4) 100%)',
    pointerEvents: 'none',
    opacity: showDamageFlash ? 1 : 0,
    transition: 'opacity 0.15s',
    zIndex: 50,
  };

  // Low health warning vignette
  const lowHealthVignetteStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle, transparent 40%, rgba(255, 0, 0, 0.3) 100%)',
    pointerEvents: 'none',
    opacity: healthState.isLowHealth ? (healthState.isCriticalHealth ? 0.8 : 0.4) : 0,
    animation: healthState.isCriticalHealth ? 'criticalPulse 0.5s infinite' : 'none',
    zIndex: 49,
  };

  // Invulnerability indicator
  const invulnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    border: '2px solid rgba(68, 136, 255, 0.8)',
    borderRadius: '3px',
    animation: 'invulnFlash 0.2s infinite',
    pointerEvents: 'none',
  };

  // Armor icon
  const armorIconStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.5)',
    border: `1px solid ${healthColor}`,
    borderRadius: '3px',
    color: healthColor,
    fontSize: '14px',
    marginRight: '8px',
  };

  return (
    <>
      {/* Damage flash overlay */}
      <div style={damageFlashStyle} />
      
      {/* Low health vignette */}
      <div style={lowHealthVignetteStyle} />

      {/* Damage numbers */}
      {damageNumbers.map(dn => (
        <div
          key={dn.id}
          style={{
            position: 'fixed',
            left: `${dn.x}%`,
            top: `${dn.y}%`,
            transform: 'translate(-50%, -50%)',
            color: '#ff4444',
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: "'Orbitron', sans-serif",
            textShadow: '0 0 10px #ff0000, 2px 2px 0 #000',
            animation: 'damageFloat 1s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 200,
          }}
        >
          -{dn.damage}
        </div>
      ))}

      {/* Main health bar */}
      <div style={containerStyle}>
        <div style={healthBarContainerStyle}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={armorIconStyle}>♥</div>
            <div style={labelStyle}>HULL INTEGRITY</div>
          </div>
          
          {/* Health bar */}
          <div style={healthBarOuterStyle}>
            <div style={healthBarFillStyle}>
              {healthState.isInvulnerable && <div style={invulnStyle} />}
            </div>
            <div style={segmentStyle} />
          </div>
          
          {/* Health text */}
          <div style={healthTextStyle}>
            <span style={{ color: '#666666' }}>HP</span>
            <span style={valueStyle}>
              {healthState.health} / {healthState.maxHealth}
            </span>
          </div>
        </div>
      </div>

      {/* Critical health warning text */}
      {healthState.isCriticalHealth && (
        <div style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#ff4444',
          fontSize: '18px',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 'bold',
          letterSpacing: '4px',
          textShadow: '0 0 20px #ff0000',
          animation: 'criticalBlink 0.5s infinite',
          zIndex: 150,
        }}>
          ⚠ HULL CRITICAL ⚠
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes criticalPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        @keyframes criticalBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes invulnFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes damageFloat {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -150%) scale(1.5);
          }
        }
      `}</style>
    </>
  );
};

export default HealthHUD;

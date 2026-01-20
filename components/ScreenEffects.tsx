/**
 * ScreenEffects - Full-screen visual effects overlay
 * 
 * Features:
 * - Damage flash (red vignette)
 * - Hit flash (white screen flash)
 * - Low health warning vignette
 * - Speed lines overlay (optional)
 * - Chromatic aberration simulation
 */

import React, { useEffect, useState, useCallback } from 'react';

interface EffectsState {
  hitFlash: number;      // 0-1 intensity of white flash
  vignette: number;      // 0-1 intensity of damage vignette
  chromaticAberration: number; // 0-1 chromatic aberration amount
  shake: number;         // 0-1 shake intensity (for visual indicator)
  lowHealth: number;     // 0-1 low health warning intensity
}

export const ScreenEffects: React.FC = () => {
  const [effects, setEffects] = useState<EffectsState>({
    hitFlash: 0,
    vignette: 0,
    chromaticAberration: 0,
    shake: 0,
    lowHealth: 0,
  });
  
  // Listen for camera effects updates
  useEffect(() => {
    const handleEffectsUpdate = (e: CustomEvent) => {
      setEffects(prev => ({
        ...prev,
        hitFlash: e.detail.hitFlash || 0,
        vignette: e.detail.vignette || 0,
        chromaticAberration: e.detail.chromaticAberration || 0,
        shake: e.detail.shake || 0,
      }));
    };
    
    // Listen for low health updates
    const handleHealthUpdate = (e: CustomEvent) => {
      const healthPercent = e.detail.health / e.detail.maxHealth;
      // Pulse effect when below 30% health
      if (healthPercent < 0.3) {
        const intensity = (0.3 - healthPercent) / 0.3;
        setEffects(prev => ({ ...prev, lowHealth: intensity }));
      } else {
        setEffects(prev => ({ ...prev, lowHealth: 0 }));
      }
    };
    
    window.addEventListener('camera-effects-update', handleEffectsUpdate as EventListener);
    window.addEventListener('health-update', handleHealthUpdate as EventListener);
    
    return () => {
      window.removeEventListener('camera-effects-update', handleEffectsUpdate as EventListener);
      window.removeEventListener('health-update', handleHealthUpdate as EventListener);
    };
  }, []);
  
  // Calculate if any effect is active
  const hasActiveEffects = effects.hitFlash > 0.01 || 
                           effects.vignette > 0.01 || 
                           effects.lowHealth > 0.01;
  
  if (!hasActiveEffects) return null;
  
  // Generate low health pulse animation
  const lowHealthPulse = effects.lowHealth > 0 
    ? 0.3 + Math.sin(Date.now() / 200) * 0.2 * effects.lowHealth 
    : 0;
  
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Hit Flash - white screen flash on damage */}
      {effects.hitFlash > 0.01 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(255, 255, 255, ' + effects.hitFlash * 0.8 + ')',
            transition: 'background-color 0.05s ease-out',
          }}
        />
      )}
      
      {/* Damage Vignette - red edges on damage */}
      {effects.vignette > 0.01 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, 
              transparent 30%, 
              rgba(255, 0, 0, ${effects.vignette * 0.4}) 70%, 
              rgba(139, 0, 0, ${effects.vignette * 0.6}) 100%
            )`,
            transition: 'opacity 0.1s ease-out',
          }}
        />
      )}
      
      {/* Low Health Warning - pulsing red vignette */}
      {effects.lowHealth > 0.01 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, 
              transparent 40%, 
              rgba(200, 0, 0, ${lowHealthPulse}) 80%, 
              rgba(100, 0, 0, ${lowHealthPulse * 1.5}) 100%
            )`,
            animation: 'pulse 0.5s ease-in-out infinite',
          }}
        />
      )}
      
      {/* Chromatic Aberration - color separation effect (CSS approximation) */}
      {effects.chromaticAberration > 0.1 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            mixBlendMode: 'screen',
            opacity: effects.chromaticAberration * 0.3,
            background: `
              linear-gradient(90deg, 
                rgba(255, 0, 0, 0.1) 0%, 
                transparent 20%, 
                transparent 80%, 
                rgba(0, 255, 255, 0.1) 100%
              )
            `,
          }}
        />
      )}
      
      {/* Top and bottom letterbox bars for cinematic moments (optional) */}
    </div>
  );
};

export default ScreenEffects;

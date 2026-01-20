/**
 * MiniRadar - Responsive radar display
 * 
 * Features:
 * - Responsive sizing (48px mobile → 120px desktop)
 * - Minimize to dot indicator on mobile portrait
 * - Expand on touch/hover
 * - Enemy blips with state-based colors
 * - Beacon direction indicator
 * - Lock count badge
 */

import React, { useEffect, useState, useRef } from 'react';
import { useHUDContext } from './HUDLayout';
import { HUDPanel, HUDLabel } from './HUDPanel';

interface RadarBlip {
  id: string;
  x: number;
  z: number;
  type: 'enemy' | 'beacon';
  state?: 'patrol' | 'engagement' | 'retreat' | 'destroyed';
}

interface RadarState {
  blips: RadarBlip[];
  playerHeading: number;
  radarRange: number;
  lockCount?: number;
}

export const MiniRadar: React.FC = () => {
  const hudContext = useHUDContext();
  const [radarState, setRadarState] = useState<RadarState>({
    blips: [],
    playerHeading: 0,
    radarRange: 300,
    lockCount: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const handleRadarUpdate = (e: CustomEvent) => {
      setRadarState(e.detail);
    };

    const handleTargetingUpdate = (e: CustomEvent) => {
      setRadarState(prev => ({
        ...prev,
        lockCount: e.detail.lockCount || 0,
      }));
    };

    window.addEventListener('radar-update', handleRadarUpdate as EventListener);
    window.addEventListener('targeting-update', handleTargetingUpdate as EventListener);
    
    return () => {
      window.removeEventListener('radar-update', handleRadarUpdate as EventListener);
      window.removeEventListener('targeting-update', handleTargetingUpdate as EventListener);
    };
  }, []);

  // Determine radar size based on breakpoint and expansion state
  const getRadarSize = (): number => {
    if (hudContext.isMinimalMode && !isExpanded) return 40;
    if (hudContext.isMinimalMode && isExpanded) return 80;
    if (hudContext.isCompactMode) return 70;
    if (hudContext.isStandardMode) return 100;
    return 120;
  };

  const radarSize = getRadarSize();
  const isMinimized = hudContext.isMinimalMode && !isExpanded;

  // Canvas-based radar rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = (size / 2) - 4;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(-radarState.playerHeading);

      // Background
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'var(--hud-radar-ring)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Range rings
      if (!isMinimized) {
        [0.33, 0.66, 1.0].forEach(ring => {
          ctx.beginPath();
          ctx.arc(0, 0, radius * ring, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(20, 184, 166, 0.15)';
          ctx.stroke();
        });

        // Cardinal lines
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, radius);
        ctx.moveTo(-radius, 0);
        ctx.lineTo(radius, 0);
        ctx.stroke();
      }

      // Draw blips
      radarState.blips.forEach((blip) => {
        const blipX = blip.x * radius;
        const blipZ = blip.z * radius;
        const blipSize = isMinimized ? 2 : 4;

        if (blip.type === 'beacon') {
          // Beacon - pulsing diamond
          const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
          ctx.save();
          ctx.translate(blipX, blipZ);
          ctx.rotate(Math.PI / 4);
          
          ctx.fillStyle = `rgba(6, 182, 212, ${0.6 + pulse * 0.4})`;
          ctx.fillRect(-blipSize, -blipSize, blipSize * 2, blipSize * 2);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = isMinimized ? 1 : 2;
          ctx.strokeRect(-blipSize, -blipSize, blipSize * 2, blipSize * 2);
          
          ctx.restore();
        } else if (blip.type === 'enemy') {
          // Enemy - color based on state
          let color = '#22c55e'; // patrol - green
          switch (blip.state) {
            case 'engagement':
              color = '#ef4444'; // red
              break;
            case 'retreat':
              color = '#eab308'; // yellow
              break;
          }

          ctx.save();
          ctx.translate(blipX, blipZ);
          ctx.rotate(Math.PI / 4);
          
          ctx.fillStyle = color;
          ctx.fillRect(-blipSize / 2, -blipSize / 2, blipSize, blipSize);
          
          // Pulse for engaging enemies
          if (blip.state === 'engagement' && !isMinimized) {
            const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + pulse * 0.4})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(-blipSize, -blipSize, blipSize * 2, blipSize * 2);
          }
          
          ctx.restore();
        }
      });

      ctx.restore();

      // Player triangle (always at center)
      ctx.save();
      ctx.translate(center, center);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(-3, 3);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      // North indicator (if not minimized)
      if (!isMinimized) {
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(-radarState.playerHeading);
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = 'rgba(20, 184, 166, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('N', 0, -radius + 8);
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [radarState, isMinimized]);

  // Handle touch/click to expand on mobile
  const handleInteraction = () => {
    if (hudContext.isMinimalMode) {
      setIsExpanded(!isExpanded);
    }
  };

  // Always position radar at top-left (consistent across all devices)
  return (
    <div style={{
      position: 'fixed',
      top: 'calc(var(--hud-edge-margin) + 50px)', // Below top bar
      left: 'var(--hud-edge-margin)',
      zIndex: 'var(--z-hud-panels)',
    }}>
      <HUDPanel 
        color="radar"
        interactive={hudContext.isMinimalMode}
        onClick={handleInteraction}
        style={{
          padding: '4px',
          borderRadius: '50%',
          transition: 'all 0.2s ease-out',
        }}
      >
        {/* Radar Canvas */}
        <canvas
          ref={canvasRef}
          width={radarSize}
          height={radarSize}
          style={{
            display: 'block',
            borderRadius: '50%',
          }}
        />

        {/* Lock count badge */}
        {(radarState.lockCount ?? 0) > 0 && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'var(--hud-lock-locked)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'var(--hud-font-mono)',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 8px var(--hud-lock-locked)',
          }}>
            {radarState.lockCount}
          </div>
        )}

        {/* Range label (only when not minimized) */}
        {!isMinimized && (
          <div style={{
            position: 'absolute',
            bottom: '-16px',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}>
            <HUDLabel size="xs" color="muted">
              {radarState.radarRange}m
            </HUDLabel>
          </div>
        )}

        {/* Expand hint on mobile */}
        {hudContext.isMinimalMode && !isExpanded && (
          <div style={{
            position: 'absolute',
            bottom: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '8px',
            color: 'var(--hud-text-muted)',
          }}>
            TAP
          </div>
        )}
      </HUDPanel>

      {/* Legend (only on larger screens) */}
      {hudContext.isFullMode && (
        <div style={{
          marginTop: '8px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '4px',
          padding: '4px 8px',
          display: 'flex',
          gap: '8px',
          fontSize: '9px',
          fontFamily: 'var(--hud-font-mono)',
        }}>
          <span style={{ color: '#22c55e' }}>◆ PTL</span>
          <span style={{ color: '#ef4444' }}>◆ ENG</span>
          <span style={{ color: '#eab308' }}>◆ RTR</span>
        </div>
      )}
    </div>
  );
};

export default MiniRadar;

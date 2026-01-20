/**
 * TopBar - Consolidated wave/enemies/beacon timer display
 * 
 * Features:
 * - Single bar: Wave | Enemies | Beacon Timer
 * - Wave: "W3" or icon-based
 * - Enemies: skull icon + count
 * - Beacon timer: only visible when < 30s remaining
 * - Collapsible in portrait mode (tap to expand)
 */

import React, { useState, useEffect } from 'react';
import { useHUDContext } from './HUDLayout';
import { HUDPanel, HUDLabel, HUDValue } from './HUDPanel';
import { WaveState } from '../../game/WaveManager';

interface WaveHUDData {
  waveNumber: number;
  totalWaves: number;
  waveName: string;
  act: number;
  enemiesRemaining: number;
  totalEnemies: number;
  state: WaveState;
  isBoss: boolean;
  bossType?: string;
}

interface BeaconData {
  distance: number;
  timeRemaining: number | null;
  timeLimit: number | null;
  timerEnabled: boolean;
  urgencyLevel: number;
}

export const TopBar: React.FC = () => {
  const hudContext = useHUDContext();
  const [waveData, setWaveData] = useState<WaveHUDData>({
    waveNumber: 1,
    totalWaves: 15,
    waveName: '',
    act: 1,
    enemiesRemaining: 0,
    totalEnemies: 0,
    state: WaveState.PRE_GAME,
    isBoss: false,
  });
  
  const [beaconData, setBeaconData] = useState<BeaconData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWaveAnnouncement, setShowWaveAnnouncement] = useState(false);

  useEffect(() => {
    const handleWaveUpdate = (e: CustomEvent) => {
      setWaveData(e.detail);
    };

    const handleWaveStart = () => {
      setShowWaveAnnouncement(true);
      setTimeout(() => setShowWaveAnnouncement(false), 2000);
    };

    const handleBeaconUpdate = (e: CustomEvent) => {
      setBeaconData(e.detail);
    };

    const handleBeaconDespawn = () => {
      setBeaconData(null);
    };

    window.addEventListener('wave-hud-update', handleWaveUpdate as EventListener);
    window.addEventListener('wave-start', handleWaveStart as EventListener);
    window.addEventListener('beacon-update', handleBeaconUpdate as EventListener);
    window.addEventListener('beacon-despawn', handleBeaconDespawn as EventListener);

    return () => {
      window.removeEventListener('wave-hud-update', handleWaveUpdate as EventListener);
      window.removeEventListener('wave-start', handleWaveStart as EventListener);
      window.removeEventListener('beacon-update', handleBeaconUpdate as EventListener);
      window.removeEventListener('beacon-despawn', handleBeaconDespawn as EventListener);
    };
  }, []);

  const getActColor = (act: number): string => {
    switch (act) {
      case 1: return 'var(--hud-act-1)';
      case 2: return 'var(--hud-act-2)';
      case 3: return 'var(--hud-act-3)';
      default: return 'var(--hud-act-1)';
    }
  };

  const getActName = (act: number): string => {
    switch (act) {
      case 1: return 'FIRST CONTACT';
      case 2: return 'ESCALATION';
      case 3: return 'SKYFALL';
      default: return `ACT ${act}`;
    }
  };

  const actColor = getActColor(waveData.act);
  const isMinimal = hudContext.isMinimalMode;
  const showTimer = beaconData && beaconData.timerEnabled && 
                    beaconData.timeRemaining !== null && 
                    beaconData.timeRemaining < 30;
  
  const isTimerCritical = beaconData && beaconData.timeRemaining !== null && 
                          beaconData.timeRemaining < 10;

  // Handle tap to expand on mobile
  const handleToggle = () => {
    if (isMinimal) {
      setIsExpanded(!isExpanded);
    }
  };

  // Minimal collapsed view for mobile
  if (isMinimal && !isExpanded) {
    return (
      <div style={{
        position: 'fixed',
        top: 'var(--hud-edge-margin)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-hud-top)',
      }}>
        <HUDPanel 
          interactive 
          onClick={handleToggle}
          style={{ padding: '4px 12px' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'var(--hud-font-mono)',
          }}>
            {/* Wave number */}
            <span style={{ 
              color: waveData.isBoss ? 'var(--hud-health-critical)' : actColor,
              fontWeight: 'bold',
            }}>
              W{waveData.waveNumber}
            </span>
            
            {/* Enemy count */}
            <span style={{
              color: waveData.enemiesRemaining > 0 
                ? 'var(--hud-health-critical)' 
                : 'var(--hud-health-full)',
            }}>
              💀{waveData.enemiesRemaining}
            </span>

            {/* Timer (only if critical) */}
            {isTimerCritical && beaconData && (
              <span style={{
                color: 'var(--hud-health-critical)',
                animation: 'hud-pulse 0.5s ease-in-out infinite',
              }}>
                ⏱{Math.ceil(beaconData.timeRemaining!)}s
              </span>
            )}
          </div>
        </HUDPanel>
      </div>
    );
  }

  return (
    <>
      {/* Main Top Bar */}
      <div style={{
        position: 'fixed',
        top: 'var(--hud-edge-margin)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-hud-top)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}>
        {/* Act indicator */}
        <div style={{
          fontSize: 'var(--hud-font-xs)',
          letterSpacing: '2px',
          color: actColor,
          textShadow: `0 0 10px ${actColor}`,
          fontFamily: 'var(--hud-font-mono)',
        }}>
          {getActName(waveData.act)}
        </div>

        {/* Main info panel */}
        <HUDPanel 
          interactive={isMinimal}
          onClick={handleToggle}
          color={waveData.isBoss ? 'critical' : 'default'}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: hudContext.isCompactMode ? '12px' : '20px',
          }}>
            {/* Wave Info */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <HUDLabel size="xs" color="muted">WAVE</HUDLabel>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <HUDValue 
                  size="lg" 
                  color={waveData.isBoss ? 'var(--hud-health-critical)' : 'var(--hud-text-primary)'}
                  glow={waveData.isBoss}
                >
                  {waveData.waveNumber}
                </HUDValue>
                <span style={{
                  fontSize: 'var(--hud-font-sm)',
                  color: 'var(--hud-text-muted)',
                }}>
                  /{waveData.totalWaves}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{
              width: '1px',
              height: '32px',
              background: 'var(--hud-border-color)',
            }} />

            {/* Enemies Remaining */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <HUDLabel size="xs" color="muted">HOSTILES</HUDLabel>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <HUDValue 
                  size="lg" 
                  color={waveData.enemiesRemaining > 0 
                    ? 'var(--hud-health-critical)' 
                    : 'var(--hud-health-full)'}
                >
                  {waveData.enemiesRemaining}
                </HUDValue>
                <span style={{
                  fontSize: 'var(--hud-font-sm)',
                  color: 'var(--hud-text-muted)',
                }}>
                  /{waveData.totalEnemies}
                </span>
              </div>
            </div>

            {/* Boss indicator */}
            {waveData.isBoss && (
              <>
                <div style={{
                  width: '1px',
                  height: '32px',
                  background: 'var(--hud-health-critical)',
                }} />
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <span style={{
                    color: 'var(--hud-health-critical)',
                    fontSize: 'var(--hud-font-xs)',
                    animation: 'hud-pulse 1s ease-in-out infinite',
                  }}>
                    ⚠️ BOSS
                  </span>
                  <span style={{
                    color: 'var(--hud-health-warning)',
                    fontSize: 'var(--hud-font-xs)',
                  }}>
                    {waveData.bossType}
                  </span>
                </div>
              </>
            )}

            {/* Beacon Timer (when active) */}
            {showTimer && beaconData && (
              <>
                <div style={{
                  width: '1px',
                  height: '32px',
                  background: isTimerCritical 
                    ? 'var(--hud-health-critical)' 
                    : 'var(--hud-border-color)',
                }} />
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <HUDLabel size="xs" color="muted">BEACON</HUDLabel>
                  <HUDValue 
                    size="lg" 
                    color={isTimerCritical 
                      ? 'var(--hud-health-critical)' 
                      : 'var(--hud-health-warning)'}
                    glow={!!isTimerCritical}
                  >
                    {Math.ceil(beaconData.timeRemaining!)}s
                  </HUDValue>
                </div>
              </>
            )}
          </div>
        </HUDPanel>

        {/* Wave name (if available) */}
        {waveData.waveName && hudContext.isFullMode && (
          <div style={{
            fontSize: 'var(--hud-font-xs)',
            color: 'var(--hud-text-muted)',
            fontStyle: 'italic',
          }}>
            "{waveData.waveName}"
          </div>
        )}
      </div>

      {/* Wave Start Announcement */}
      {showWaveAnnouncement && (
        <div style={{
          position: 'fixed',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 'var(--z-hud-alerts)',
          pointerEvents: 'none',
          animation: 'hud-slide-in-top 0.3s ease-out',
        }}>
          <div style={{
            fontSize: 'var(--hud-font-xl)',
            fontWeight: 'bold',
            fontFamily: 'var(--hud-font-family)',
            color: actColor,
            textShadow: `0 0 30px ${actColor}`,
            letterSpacing: '4px',
          }}>
            WAVE {waveData.waveNumber}
          </div>
          {waveData.isBoss && (
            <div style={{
              fontSize: 'var(--hud-font-lg)',
              color: 'var(--hud-health-critical)',
              textShadow: '0 0 20px var(--hud-health-critical)',
              textAlign: 'center',
              marginTop: '8px',
            }}>
              ⚠️ BOSS INCOMING ⚠️
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TopBar;

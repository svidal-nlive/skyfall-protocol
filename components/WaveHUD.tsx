/**
 * WaveHUD - Displays wave information during gameplay
 * 
 * Shows:
 * - Current wave number / total
 * - Current act
 * - Enemies remaining
 * - Wave complete announcement
 * - Boss wave indicator
 */

import React, { useState, useEffect } from 'react';
import { WaveState } from '../game/WaveManager';
import { ProgressManager } from '../game/ProgressManager';

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
  timeRemaining: number | null;  // null = free flight (no timer)
  timeLimit: number | null;
  timerEnabled: boolean;
  urgencyLevel: number;
}

const WaveHUD: React.FC = () => {
  const [hudData, setHudData] = useState<WaveHUDData>({
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
  const [showWaveComplete, setShowWaveComplete] = useState(false);
  const [showWaveStart, setShowWaveStart] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(ProgressManager.isDevMode());

  useEffect(() => {
    // Listen for wave data updates
    const handleWaveUpdate = (e: CustomEvent) => {
      setHudData(e.detail);
    };

    // Listen for wave start
    const handleWaveStart = (e: CustomEvent) => {
      setShowWaveStart(true);
      setBeaconData(null); // Clear beacon when wave starts
      setTimeout(() => setShowWaveStart(false), 2000);
    };

    // Listen for wave complete
    const handleWaveComplete = (e: CustomEvent) => {
      setShowWaveComplete(true);
      setTimeout(() => setShowWaveComplete(false), 2000);
    };

    // Listen for beacon updates
    const handleBeaconUpdate = (e: CustomEvent) => {
      setBeaconData(e.detail);
    };

    // Listen for beacon despawn
    const handleBeaconDespawn = () => {
      setBeaconData(null);
    };

    // Listen for timeout
    const handleTimeout = () => {
      setShowTimeout(true);
      setTimeout(() => setShowTimeout(false), 3000);
    };

    // Listen for dev mode changes
    const handleDevModeChange = (e: CustomEvent) => {
      setDevModeEnabled(e.detail.enabled);
    };

    window.addEventListener('wave-hud-update', handleWaveUpdate as EventListener);
    window.addEventListener('wave-start', handleWaveStart as EventListener);
    window.addEventListener('wave-complete', handleWaveComplete as EventListener);
    window.addEventListener('beacon-update', handleBeaconUpdate as EventListener);
    window.addEventListener('beacon-despawn', handleBeaconDespawn as EventListener);
    window.addEventListener('beacon-timeout', handleTimeout as EventListener);
    window.addEventListener('dev-mode-change', handleDevModeChange as EventListener);

    return () => {
      window.removeEventListener('wave-hud-update', handleWaveUpdate as EventListener);
      window.removeEventListener('wave-start', handleWaveStart as EventListener);
      window.removeEventListener('wave-complete', handleWaveComplete as EventListener);
      window.removeEventListener('beacon-update', handleBeaconUpdate as EventListener);
      window.removeEventListener('beacon-despawn', handleBeaconDespawn as EventListener);
      window.removeEventListener('beacon-timeout', handleTimeout as EventListener);
      window.removeEventListener('dev-mode-change', handleDevModeChange as EventListener);
    };
  }, []);

  const getActName = (act: number): string => {
    switch (act) {
      case 1: return 'FIRST CONTACT';
      case 2: return 'ESCALATION';
      case 3: return 'SKYFALL PROTOCOL';
      default: return `ACT ${act}`;
    }
  };

  const getActColor = (act: number): string => {
    switch (act) {
      case 1: return '#4488ff'; // Blue
      case 2: return '#ffaa00'; // Orange
      case 3: return '#ff4444'; // Red
      default: return '#4488ff';
    }
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 40,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  };

  // Wave info panel
  const panelStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(68, 136, 255, 0.3)',
    borderRadius: '8px',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontFamily: 'monospace',
  };

  // Wave number style
  const waveNumberStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  // Enemy counter style
  const enemyCounterStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderLeft: '1px solid rgba(68, 136, 255, 0.3)',
    paddingLeft: '16px',
  };

  // Announcement overlay
  const announcementStyle: React.CSSProperties = {
    position: 'fixed',
    top: '30%',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    animation: 'fadeInOut 2s ease-in-out',
    pointerEvents: 'none',
  };

  return (
    <>
      {/* Main Wave HUD Panel */}
      <div style={containerStyle}>
        {/* Act indicator */}
        <div style={{
          fontSize: '10px',
          letterSpacing: '3px',
          color: getActColor(hudData.act),
          textShadow: `0 0 10px ${getActColor(hudData.act)}`,
        }}>
          {getActName(hudData.act)}
        </div>

        <div style={panelStyle}>
          {/* Wave Number */}
          <div style={waveNumberStyle}>
            <span style={{ fontSize: '10px', color: '#888888', letterSpacing: '2px' }}>
              WAVE
            </span>
            <span style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: hudData.isBoss ? '#ff4444' : '#ffffff',
              textShadow: hudData.isBoss ? '0 0 10px #ff4444' : 'none',
            }}>
              {hudData.waveNumber}
              <span style={{ fontSize: '14px', color: '#666666' }}>/{hudData.totalWaves}</span>
            </span>
          </div>

          {/* Enemy Counter */}
          <div style={enemyCounterStyle}>
            <span style={{ fontSize: '10px', color: '#888888', letterSpacing: '2px' }}>
              HOSTILES
            </span>
            <span style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: hudData.enemiesRemaining > 0 ? '#ff6666' : '#44ff44',
            }}>
              {hudData.enemiesRemaining}
              <span style={{ fontSize: '14px', color: '#666666' }}>/{hudData.totalEnemies}</span>
            </span>
          </div>

          {/* Boss Indicator */}
          {hudData.isBoss && (
            <div style={{
              borderLeft: '1px solid rgba(255, 68, 68, 0.3)',
              paddingLeft: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '10px', color: '#ff4444', letterSpacing: '2px' }}>
                ⚠ BOSS
              </span>
              <span style={{ fontSize: '12px', color: '#ff8888' }}>
                {hudData.bossType || 'Unknown'}
              </span>
            </div>
          )}
        </div>

        {/* Wave Name (smaller, below panel) */}
        {hudData.waveName && (
          <div style={{
            fontSize: '11px',
            color: '#666666',
            letterSpacing: '1px',
          }}>
            "{hudData.waveName}"
          </div>
        )}

        {/* Dev Mode: Wave Clear Button (Mobile) */}
        {devModeEnabled && (
          <button
            onClick={() => {
              const canvases = document.querySelectorAll('canvas');
              if (canvases.length > 0) {
                const gameCanvas = canvases[0] as any;
                // Access the GameEngine instance through the canvas element
                // We'll dispatch an event instead that GameView can handle
                window.dispatchEvent(new CustomEvent('dev-clear-wave'));
              }
            }}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 100, 100, 0.7)',
              color: '#ffffff',
              border: '1px solid #ff6464',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 10px rgba(255, 100, 100, 0.5)',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 120, 120, 0.9)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 15px rgba(255, 100, 100, 0.8)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 100, 100, 0.7)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 10px rgba(255, 100, 100, 0.5)';
            }}
          >
            [DEV] CLEAR WAVE
          </button>
        )}
      </div>

      {/* Wave Start Announcement */}
      {showWaveStart && (
        <div style={announcementStyle}>
          <div style={{
            fontSize: '14px',
            color: '#888888',
            letterSpacing: '4px',
            marginBottom: '8px',
          }}>
            {getActName(hudData.act)}
          </div>
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: hudData.isBoss ? '#ff4444' : '#4488ff',
            textShadow: hudData.isBoss 
              ? '0 0 30px #ff4444, 0 0 60px #ff0000' 
              : '0 0 30px #4488ff, 0 0 60px #0044ff',
            letterSpacing: '8px',
          }}>
            WAVE {hudData.waveNumber}
          </div>
          <div style={{
            fontSize: '18px',
            color: '#aaaaaa',
            marginTop: '8px',
            letterSpacing: '2px',
          }}>
            {hudData.waveName}
          </div>
          {hudData.isBoss && (
            <div style={{
              marginTop: '16px',
              fontSize: '24px',
              color: '#ff4444',
              letterSpacing: '4px',
              animation: 'pulse 0.5s infinite',
            }}>
              ⚠ {hudData.bossType?.toUpperCase()} ⚠
            </div>
          )}
        </div>
      )}

      {/* Wave Complete Announcement */}
      {showWaveComplete && (
        <div style={announcementStyle}>
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#44ff44',
            textShadow: '0 0 30px #44ff44, 0 0 60px #00ff00',
            letterSpacing: '8px',
          }}>
            WAVE COMPLETE
          </div>
          <div style={{
            fontSize: '18px',
            color: '#88ff88',
            marginTop: '16px',
            letterSpacing: '2px',
          }}>
            +{100 * hudData.waveNumber} BONUS
          </div>
        </div>
      )}

      {/* Beacon Navigation HUD */}
      {beaconData && hudData.state === WaveState.BEACON_ACTIVE && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
        }}>
          {/* Beacon indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${beaconData.urgencyLevel > 0.5 ? 'rgba(255, 170, 0, 0.5)' : 'rgba(0, 255, 255, 0.5)'}`,
            borderRadius: '8px',
            padding: '12px 20px',
            fontFamily: 'monospace',
          }}>
            {/* Diamond icon */}
            <div style={{
              width: '20px',
              height: '20px',
              background: beaconData.urgencyLevel > 0.5 ? '#ffaa00' : '#00ffff',
              transform: 'rotate(45deg)',
              boxShadow: `0 0 10px ${beaconData.urgencyLevel > 0.5 ? '#ffaa00' : '#00ffff'}`,
              animation: 'pulse 1s infinite',
            }} />
            
            {/* Distance */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#888888', letterSpacing: '2px' }}>
                WAYPOINT
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: beaconData.urgencyLevel > 0.5 ? '#ffaa00' : '#00ffff',
              }}>
                {beaconData.distance < 1000 
                  ? `${Math.round(beaconData.distance)}m`
                  : `${(beaconData.distance / 1000).toFixed(1)}km`
                }
              </div>
            </div>

            {/* Separator - only show if timer is active */}
            {beaconData.timerEnabled && (
              <div style={{ 
                width: '1px', 
                height: '40px', 
                background: 'rgba(68, 136, 255, 0.3)' 
              }} />
            )}

            {/* Timer - only show if timer is enabled */}
            {beaconData.timerEnabled && beaconData.timeRemaining !== null && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#888888', letterSpacing: '2px' }}>
                  TIME
                </div>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  color: beaconData.urgencyLevel > 0.7 ? '#ff4444' 
                       : beaconData.urgencyLevel > 0.5 ? '#ffaa00' 
                       : '#ffffff',
                  animation: beaconData.urgencyLevel > 0.7 ? 'pulse 0.5s infinite' : 'none',
                }}>
                  {Math.floor(beaconData.timeRemaining / 60)}:{String(Math.floor(beaconData.timeRemaining % 60)).padStart(2, '0')}
                </div>
              </div>
            )}

            {/* Free Flight indicator - show when no timer */}
            {!beaconData.timerEnabled && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#44ffaa', letterSpacing: '2px' }}>
                  FREE FLIGHT
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#44ffaa',
                }}>
                  ∞
                </div>
              </div>
            )}
          </div>

          {/* Navigation hint */}
          <div style={{
            fontSize: '12px',
            color: '#666666',
            letterSpacing: '2px',
          }}>
            FLY TO WAYPOINT TO CONTINUE
          </div>
        </div>
      )}

      {/* Timeout Announcement */}
      {showTimeout && (
        <div style={announcementStyle}>
          <div style={{
            fontSize: '18px',
            color: '#ffaa00',
            letterSpacing: '4px',
            marginBottom: '16px',
          }}>
            ⚠ INTEL UNRELIABLE
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#ff4444',
            textShadow: '0 0 30px #ff4444, 0 0 60px #ff0000',
            letterSpacing: '6px',
          }}>
            MISSION ABORTED
          </div>
          <div style={{
            fontSize: '14px',
            color: '#888888',
            marginTop: '16px',
            letterSpacing: '2px',
          }}>
            RETURNING TO HANGAR...
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
          20% { opacity: 1; transform: translateX(-50%) scale(1); }
          80% { opacity: 1; transform: translateX(-50%) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) scale(1.1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

export default WaveHUD;

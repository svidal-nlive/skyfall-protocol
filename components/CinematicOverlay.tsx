/**
 * CinematicOverlay - Visual overlay for wave entry cinematics
 * 
 * Shows:
 * - Letterbox bars (black bars top/bottom)
 * - Wave number title card
 * - Enemy type announcements
 * - Skip prompt
 * - Boss name display
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CinematicSegment } from '../game/WaveCinematicController';
import { EnemyType } from '../game/WaveManager';

interface CinematicState {
  isActive: boolean;
  waveNumber: number;
  waveName: string;
  isBoss: boolean;
  bossType?: string;
  isIntro: boolean;
  isOutro: boolean;
  currentSegment: CinematicSegment | null;
  progress: number;
}

// Enemy type display names
const ENEMY_DISPLAY_NAMES: Record<EnemyType, string> = {
  phantom: 'PHANTOM SCOUTS',
  viper: 'VIPER FIGHTERS',
  warden: 'WARDEN GUNSHIPS',
  specter: 'SPECTER ELITES',
};

const CinematicOverlay: React.FC = () => {
  const [state, setState] = useState<CinematicState>({
    isActive: false,
    waveNumber: 0,
    waveName: '',
    isBoss: false,
    isIntro: false,
    isOutro: false,
    currentSegment: null,
    progress: 0,
  });

  const [showTitle, setShowTitle] = useState(false);
  const [showEnemyType, setShowEnemyType] = useState(false);
  const [currentEnemyName, setCurrentEnemyName] = useState('');

  // Handle skip input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (state.isActive && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('cinematic-skip', {}));
    }
  }, [state.isActive]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    // Handle cinematic start
    const handleStart = (e: CustomEvent) => {
      const { waveNumber, waveName, isBoss, bossType } = e.detail;
      setState({
        isActive: true,
        waveNumber,
        waveName,
        isBoss,
        bossType,
        isIntro: true,
        isOutro: false,
        currentSegment: null,
        progress: 0,
      });
      setShowTitle(true);
      setShowEnemyType(false);
    };

    // Handle progress updates
    const handleProgress = (e: CustomEvent) => {
      const { progress, isIntro, isOutro, currentSegment } = e.detail;
      setState(prev => ({
        ...prev,
        progress,
        isIntro,
        isOutro,
        currentSegment,
      }));

      // Show title during intro
      if (isIntro && progress < 0.8) {
        setShowTitle(true);
      } else {
        setShowTitle(false);
      }
    };

    // Handle segment changes
    const handleSegment = (e: CustomEvent) => {
      const { segment } = e.detail as { segment: CinematicSegment };
      setCurrentEnemyName(ENEMY_DISPLAY_NAMES[segment.enemyType]);
      setShowEnemyType(true);
      
      // Hide after a moment
      setTimeout(() => setShowEnemyType(false), 800);
    };

    // Handle cinematic complete
    const handleComplete = () => {
      setState(prev => ({ ...prev, isActive: false }));
      setShowTitle(false);
      setShowEnemyType(false);
    };

    window.addEventListener('cinematic-start', handleStart as EventListener);
    window.addEventListener('cinematic-progress', handleProgress as EventListener);
    window.addEventListener('cinematic-segment', handleSegment as EventListener);
    window.addEventListener('cinematic-complete', handleComplete as EventListener);

    return () => {
      window.removeEventListener('cinematic-start', handleStart as EventListener);
      window.removeEventListener('cinematic-progress', handleProgress as EventListener);
      window.removeEventListener('cinematic-segment', handleSegment as EventListener);
      window.removeEventListener('cinematic-complete', handleComplete as EventListener);
    };
  }, []);

  if (!state.isActive) return null;

  // Calculate letterbox bar heights (slide in/out)
  const barHeight = state.isIntro
    ? Math.min(state.progress * 2, 1) * 60  // Slide in during intro
    : state.isOutro
      ? (1 - state.progress) * 60           // Slide out during outro
      : 60;                                  // Full during segments

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      {/* Top Letterbox Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: `${barHeight}px`,
        background: 'black',
        transition: 'height 0.3s ease-out',
      }} />

      {/* Bottom Letterbox Bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${barHeight}px`,
        background: 'black',
        transition: 'height 0.3s ease-out',
      }} />

      {/* Wave Title Card */}
      {showTitle && (
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease-out',
        }}>
          {/* Act indicator */}
          <div style={{
            fontSize: '14px',
            color: '#666666',
            letterSpacing: '6px',
            marginBottom: '12px',
          }}>
            {state.isBoss ? '⚠ WARNING ⚠' : 'INCOMING'}
          </div>
          
          {/* Wave number */}
          <div style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: state.isBoss ? '#ff4444' : '#ffffff',
            textShadow: state.isBoss 
              ? '0 0 40px #ff4444, 0 0 80px #ff0000'
              : '0 0 40px #4488ff, 0 0 80px #0044ff',
            letterSpacing: '12px',
            fontFamily: 'monospace',
          }}>
            WAVE {state.waveNumber}
          </div>
          
          {/* Wave name */}
          <div style={{
            fontSize: '18px',
            color: '#888888',
            marginTop: '12px',
            letterSpacing: '4px',
          }}>
            {state.waveName}
          </div>

          {/* Boss type - Large dramatic title */}
          {state.isBoss && state.bossType && (
            <div style={{
              marginTop: '30px',
              padding: '20px 40px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,0,0,0.2) 20%, rgba(255,0,0,0.3) 50%, rgba(255,0,0,0.2) 80%, transparent 100%)',
              borderTop: '2px solid #ff4444',
              borderBottom: '2px solid #ff4444',
            }}>
              <div style={{
                fontSize: '14px',
                color: '#ff6666',
                letterSpacing: '8px',
                marginBottom: '8px',
              }}>
                HOSTILE FLAGSHIP DETECTED
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ff4444',
                letterSpacing: '8px',
                textShadow: '0 0 30px #ff0000, 0 0 60px #ff0000',
                animation: 'bossPulse 1s infinite',
              }}>
                {state.bossType.toUpperCase()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enemy Type Announcement */}
      {showEnemyType && (
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          animation: 'slideIn 0.3s ease-out',
        }}>
          <div style={{
            fontSize: '24px',
            color: '#00ffff',
            letterSpacing: '6px',
            textShadow: '0 0 20px #00ffff',
            fontFamily: 'monospace',
          }}>
            {currentEnemyName}
          </div>
          {state.currentSegment && (
            <div style={{
              fontSize: '14px',
              color: '#666666',
              marginTop: '8px',
              letterSpacing: '2px',
            }}>
              × {state.currentSegment.actualCount}
            </div>
          )}
        </div>
      )}

      {/* Skip Prompt */}
      <div style={{
        position: 'absolute',
        bottom: `${barHeight + 20}px`,
        right: '40px',
        fontSize: '12px',
        color: '#555555',
        letterSpacing: '2px',
        fontFamily: 'monospace',
        animation: 'blink 2s infinite',
      }}>
        PRESS SPACE TO SKIP
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-50%) translateX(-30px); }
          to { opacity: 1; transform: translateX(-50%) translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes bossPulse {
          0%, 100% { 
            opacity: 1; 
            text-shadow: 0 0 30px #ff0000, 0 0 60px #ff0000;
          }
          50% { 
            opacity: 0.8; 
            text-shadow: 0 0 50px #ff0000, 0 0 100px #ff0000, 0 0 150px #ff0000;
          }
        }
        @keyframes blink {
          0%, 50%, 100% { opacity: 0.4; }
          25%, 75% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default CinematicOverlay;

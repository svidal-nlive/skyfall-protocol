/**
 * ScoreDisplay - Minimal score with expand animation
 * 
 * Features:
 * - Minimal: just number with subtle glow
 * - Expand on score gain, shrink after 1s
 * - Combo badge (×2, ×3, etc.)
 * - Position: top-right, always visible but unobtrusive
 */

import React, { useEffect, useState, useRef } from 'react';
import { useHUDContext } from './HUDLayout';
import { HUDPanel, HUDValue } from './HUDPanel';
import type { ScoreState, KillData } from '../../game/ScoreManager';

export const ScoreDisplay: React.FC = () => {
  const hudContext = useHUDContext();
  const [scoreState, setScoreState] = useState<ScoreState>({
    score: 0,
    combo: 0,
    comboTimer: 0,
    kills: 0,
    killStreak: 0,
    highScore: 0,
    recentKill: null,
    killStats: { phantom: 0, viper: 0, warden: 0, specter: 0 },
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showKillPopup, setShowKillPopup] = useState(false);
  const previousScoreRef = useRef(0);
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScoreUpdate = (e: CustomEvent) => {
      const newState = e.detail as ScoreState;
      
      // Check if score increased
      if (newState.score > previousScoreRef.current) {
        setIsExpanded(true);
        
        // Clear previous timeout
        if (expandTimeoutRef.current) {
          clearTimeout(expandTimeoutRef.current);
        }
        
        // Shrink after 1 second
        expandTimeoutRef.current = setTimeout(() => {
          setIsExpanded(false);
        }, 1000);
      }
      
      previousScoreRef.current = newState.score;
      setScoreState(newState);
      
      // Show kill popup
      if (newState.recentKill) {
        setShowKillPopup(true);
        setTimeout(() => setShowKillPopup(false), 1500);
      }
    };

    window.addEventListener('score-update', handleScoreUpdate as EventListener);
    return () => {
      window.removeEventListener('score-update', handleScoreUpdate as EventListener);
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
      }
    };
  }, []);

  const { score, combo, comboTimer, kills, highScore, recentKill } = scoreState;
  const comboActive = combo > 0 && comboTimer > 0;
  
  const showDetails = !hudContext.isMinimalMode;
  const showKillCount = hudContext.isFullMode;

  return (
    <>
      {/* Main Score Display - Top Right */}
      <div style={{
        position: 'fixed',
        top: 'var(--hud-edge-margin)',
        right: 'var(--hud-edge-margin)',
        zIndex: 'var(--z-hud-top)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
      }}>
        {/* Score Panel */}
        <HUDPanel 
          color="score"
          animate={isExpanded ? 'glow' : 'none'}
          style={{
            transform: isExpanded ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s ease-out',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '2px',
          }}>
            {/* Score number */}
            <HUDValue 
              size={hudContext.isMinimalMode ? 'md' : 'lg'} 
              color="var(--hud-score-primary)"
              glow={isExpanded}
            >
              {score.toLocaleString()}
            </HUDValue>
            
            {/* High score (on larger screens) */}
            {showDetails && highScore > 0 && (
              <div style={{
                fontSize: 'var(--hud-font-xs)',
                color: 'var(--hud-text-muted)',
                fontFamily: 'var(--hud-font-mono)',
              }}>
                BEST: {highScore.toLocaleString()}
              </div>
            )}
          </div>
        </HUDPanel>

        {/* Combo Badge */}
        {comboActive && (
          <div style={{
            background: 'var(--hud-score-combo)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '16px',
            fontFamily: 'var(--hud-font-mono)',
            fontWeight: 'bold',
            fontSize: 'var(--hud-font-md)',
            boxShadow: '0 0 15px var(--hud-score-combo)',
            animation: combo >= 5 ? 'hud-shake 0.1s ease-in-out infinite' : 'hud-pulse 0.5s ease-in-out infinite',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: 'var(--hud-font-lg)' }}>×{combo}</span>
              {combo >= 5 && <span>🔥</span>}
            </div>
            
            {/* Timer bar */}
            <div style={{
              width: '100%',
              height: '3px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '2px',
              marginTop: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(comboTimer / 3.0) * 100}%`,
                height: '100%',
                background: 'white',
                transition: 'width 0.1s linear',
              }} />
            </div>
          </div>
        )}

        {/* Kill count (only on full mode) */}
        {showKillCount && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px 10px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--hud-font-mono)',
            fontSize: 'var(--hud-font-sm)',
          }}>
            <span style={{ color: 'var(--hud-health-critical)' }}>💀</span>
            <span style={{ color: 'var(--hud-text-secondary)' }}>{kills}</span>
          </div>
        )}
      </div>

      {/* Kill Confirmation Popup - Center Screen */}
      {showKillPopup && recentKill && (
        <KillPopup kill={recentKill} />
      )}
    </>
  );
};

// Kill popup component
const KillPopup: React.FC<{ kill: KillData }> = ({ kill }) => {
  const isMegaKill = kill.combo >= 5;
  const isMultiKill = kill.combo >= 3;

  return (
    <div style={{
      position: 'fixed',
      top: '30%',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 'var(--z-hud-alerts)',
      pointerEvents: 'none',
      animation: 'hud-slide-in-bottom 0.3s ease-out',
      textAlign: 'center',
    }}>
      {/* Multi-kill badge */}
      {isMegaKill && (
        <div style={{
          fontSize: 'var(--hud-font-lg)',
          fontWeight: 'bold',
          color: 'var(--hud-health-critical)',
          textShadow: '0 0 20px var(--hud-health-critical)',
          animation: 'hud-shake 0.1s ease-in-out infinite',
        }}>
          🔥 MEGA KILL 🔥
        </div>
      )}
      {isMultiKill && !isMegaKill && (
        <div style={{
          fontSize: 'var(--hud-font-md)',
          fontWeight: 'bold',
          color: 'var(--hud-score-combo)',
          textShadow: '0 0 10px var(--hud-score-combo)',
        }}>
          Multi Kill!
        </div>
      )}

      {/* Points */}
      <div style={{
        fontSize: 'var(--hud-font-xl)',
        fontWeight: 'bold',
        fontFamily: 'var(--hud-font-mono)',
        color: isMegaKill ? 'var(--hud-health-critical)' 
             : isMultiKill ? 'var(--hud-score-combo)' 
             : 'var(--hud-health-full)',
        textShadow: '0 0 20px currentColor',
      }}>
        +{kill.points}
      </div>

      {/* Enemy name */}
      <div style={{
        fontSize: 'var(--hud-font-sm)',
        color: 'var(--hud-text-secondary)',
        marginTop: '4px',
      }}>
        {kill.enemyName || 'Enemy'} Destroyed
      </div>
    </div>
  );
};

export default ScoreDisplay;

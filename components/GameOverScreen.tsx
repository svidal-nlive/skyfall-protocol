import React, { useEffect, useState } from 'react';
import { useIsTouchDevice } from '../hooks/useDeviceDetection';

interface GameOverData {
  waveReached: number;
  score: number;
  kills: number;
  accuracy: number;
}

/**
 * GameOverScreen - Displayed when player is destroyed
 * 
 * Features:
 * - Death animation sequence
 * - Final stats display
 * - Retry and hangar options
 */
export const GameOverScreen: React.FC = () => {
  const isTouchDevice = useIsTouchDevice();
  const [isVisible, setIsVisible] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [gameOverData, setGameOverData] = useState<GameOverData>({
    waveReached: 1,
    score: 0,
    kills: 0,
    accuracy: 0,
  });

  useEffect(() => {
    const handlePlayerDeath = (e: CustomEvent) => {
      console.log('[GAME OVER] Player death received');
      setIsVisible(true);
      
      // Get stats from event or window
      const stats = (window as unknown as { gameStats?: GameOverData }).gameStats || {
        waveReached: 1,
        score: 0,
        kills: 0,
        accuracy: 0,
      };
      setGameOverData(stats);
      
      // Staggered reveal
      setTimeout(() => setShowStats(true), 1500);
      setTimeout(() => setShowButtons(true), 2500);
    };

    const handleGameStateChange = (e: CustomEvent) => {
      if (e.detail.state === 'PLAYING') {
        setIsVisible(false);
        setShowStats(false);
        setShowButtons(false);
      }
    };

    window.addEventListener('player-death', handlePlayerDeath as EventListener);
    window.addEventListener('game-state-change', handleGameStateChange as EventListener);

    return () => {
      window.removeEventListener('player-death', handlePlayerDeath as EventListener);
      window.removeEventListener('game-state-change', handleGameStateChange as EventListener);
    };
  }, []);

  const handleRetry = () => {
    window.dispatchEvent(new CustomEvent('game-action', { 
      detail: { action: 'restart' }
    }));
  };

  const handleHangar = () => {
    window.dispatchEvent(new CustomEvent('game-action', { 
      detail: { action: 'hangar' }
    }));
  };

  if (!isVisible) return null;

  // Container style
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.85)',
    fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
    animation: 'fadeIn 1s ease-out',
    zIndex: 1000,
  };

  // Title style
  const titleStyle: React.CSSProperties = {
    fontSize: '64px',
    fontWeight: 'bold',
    color: '#ff4444',
    textShadow: '0 0 30px #ff0000, 0 0 60px #ff0000',
    letterSpacing: '12px',
    marginBottom: '20px',
    animation: 'glitchTitle 2s infinite',
  };

  // Subtitle style
  const subtitleStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#888888',
    letterSpacing: '4px',
    marginBottom: '60px',
    animation: 'fadeIn 1.5s ease-out',
  };

  // Stats container style
  const statsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '40px',
    marginBottom: '60px',
    opacity: showStats ? 1 : 0,
    transform: showStats ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.5s ease-out',
  };

  // Stat box style
  const statBoxStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '20px 30px',
    background: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    borderRadius: '4px',
  };

  // Stat label style
  const statLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#666666',
    letterSpacing: '2px',
    marginBottom: '8px',
  };

  // Stat value style
  const statValueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: '0 0 10px rgba(255, 68, 68, 0.5)',
  };

  // Button container style
  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '20px',
    opacity: showButtons ? 1 : 0,
    transform: showButtons ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.5s ease-out',
  };

  // Button base style
  const buttonBaseStyle: React.CSSProperties = {
    padding: '16px 48px',
    fontSize: '16px',
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 'bold',
    letterSpacing: '3px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  // Retry button style
  const retryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'linear-gradient(180deg, #ff4444 0%, #cc2222 100%)',
    color: '#ffffff',
    boxShadow: '0 0 20px rgba(255, 68, 68, 0.5)',
  };

  // Hangar button style
  const hangarButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'rgba(0, 0, 0, 0.5)',
    color: '#888888',
    border: '1px solid #444444',
  };

  return (
    <div style={containerStyle}>
      {/* Red scan line effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(transparent 50%, rgba(255, 0, 0, 0.02) 50%)',
        backgroundSize: '100% 4px',
        pointerEvents: 'none',
      }} />

      {/* Death title */}
      <div style={titleStyle}>
        DESTROYED
      </div>
      
      <div style={subtitleStyle}>
        AIRCRAFT LOST • MISSION FAILED
      </div>

      {/* Stats */}
      <div style={statsContainerStyle}>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>WAVE REACHED</div>
          <div style={statValueStyle}>{gameOverData.waveReached}</div>
        </div>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>FINAL SCORE</div>
          <div style={statValueStyle}>{gameOverData.score.toLocaleString()}</div>
        </div>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>KILLS</div>
          <div style={statValueStyle}>{gameOverData.kills}</div>
        </div>
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>ACCURACY</div>
          <div style={statValueStyle}>{gameOverData.accuracy}%</div>
        </div>
      </div>

      {/* Buttons */}
      <div style={buttonContainerStyle}>
        <button
          style={retryButtonStyle}
          onClick={handleRetry}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 68, 68, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.5)';
          }}
        >
          RETRY
        </button>
        <button
          style={hangarButtonStyle}
          onClick={handleHangar}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#888888';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888888';
            e.currentTarget.style.borderColor = '#444444';
          }}
        >
          HANGAR
        </button>
      </div>

      {/* Keyboard hints - only show on desktop */}
      {!isTouchDevice && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          fontSize: '12px',
          color: '#444444',
          letterSpacing: '2px',
        }}>
          PRESS <span style={{ color: '#666666' }}>SPACE</span> TO RETRY • <span style={{ color: '#666666' }}>ESC</span> FOR HANGAR
        </div>
      )}

      {/* Touch hints - only show on mobile */}
      {isTouchDevice && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          fontSize: '12px',
          color: '#444444',
          letterSpacing: '2px',
        }}>
          TAP BUTTONS ABOVE TO CONTINUE
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes glitchTitle {
          0%, 90%, 100% { 
            text-shadow: 0 0 30px #ff0000, 0 0 60px #ff0000;
            transform: translateX(0);
          }
          92% { 
            text-shadow: -3px 0 #00ffff, 3px 0 #ff00ff, 0 0 30px #ff0000;
            transform: translateX(-2px);
          }
          94% { 
            text-shadow: 3px 0 #00ffff, -3px 0 #ff00ff, 0 0 30px #ff0000;
            transform: translateX(2px);
          }
          96% { 
            text-shadow: -2px 0 #00ffff, 2px 0 #ff00ff, 0 0 30px #ff0000;
            transform: translateX(-1px);
          }
        }
      `}</style>
    </div>
  );
};

export default GameOverScreen;

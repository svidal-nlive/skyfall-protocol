import React, { useState, useEffect, useCallback } from 'react';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

interface BriefingData {
  commanderName: string;
  commanderTitle: string;
  missionTitle: string;
  briefingText: string[];
  objectives: string[];
  waveNumber: number;
  actNumber: number;
  isBoss?: boolean;
  bossName?: string;
}

interface BriefingScreenProps {
  briefing: BriefingData;
  onLaunch: () => void;
  onSkip?: () => void;
}

const BriefingScreen: React.FC<BriefingScreenProps> = ({ briefing, onLaunch, onSkip }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showObjectives, setShowObjectives] = useState(false);
  const [showLaunchButton, setShowLaunchButton] = useState(false);
  const [skipTyping, setSkipTyping] = useState(false);
  const deviceInfo = useDeviceDetection();
  const isMobile = deviceInfo.isMobile || deviceInfo.screenWidth < 768;

  // Typewriter effect
  useEffect(() => {
    if (currentParagraph >= briefing.briefingText.length) {
      setIsTyping(false);
      setShowObjectives(true);
      setTimeout(() => setShowLaunchButton(true), 500);
      return;
    }

    const fullText = briefing.briefingText[currentParagraph];
    
    if (skipTyping) {
      setDisplayedText(fullText);
      setTimeout(() => {
        setCurrentParagraph(prev => prev + 1);
        setDisplayedText('');
        setSkipTyping(false);
      }, 200);
      return;
    }

    let charIndex = 0;
    setDisplayedText('');

    const typeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setCurrentParagraph(prev => prev + 1);
          setDisplayedText('');
        }, 800);
      }
    }, isMobile ? 20 : 30); // Faster on mobile

    return () => clearInterval(typeInterval);
  }, [currentParagraph, briefing.briefingText, skipTyping, isMobile]);

  // Handle click to skip current paragraph typing
  const handleClick = useCallback(() => {
    if (isTyping) {
      setSkipTyping(true);
    }
  }, [isTyping]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (showLaunchButton) {
          onLaunch();
        } else if (isTyping) {
          setSkipTyping(true);
        }
      }
      if (e.code === 'Escape' && onSkip) {
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLaunchButton, isTyping, onLaunch, onSkip]);

  // Get act color theme
  const getActColor = () => {
    switch (briefing.actNumber) {
      case 1: return '#00ffff'; // Cyan
      case 2: return '#ff8800'; // Orange
      case 3: return '#ff0066'; // Red/Pink
      default: return '#00ffff';
    }
  };

  const actColor = getActColor();

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Orbitron", "Rajdhani", monospace',
        color: '#ffffff',
        zIndex: 2000,
        cursor: isTyping ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
      onClick={handleClick}
    >
      {/* Scanlines overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        pointerEvents: 'none',
      }} />

      {/* Top bar - Wave/Act info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '12px 16px' : '20px 40px',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: isMobile ? '11px' : '14px',
          color: actColor,
          textTransform: 'uppercase',
          letterSpacing: isMobile ? '1px' : '3px',
        }}>
          Act {briefing.actNumber} - Wave {briefing.waveNumber}
        </div>
        {!deviceInfo.isTouchDevice && (
          <div style={{
            fontSize: '12px',
            color: '#666',
          }}>
            [SPACE] Continue • [ESC] Skip
          </div>
        )}
      </div>

      {/* Main scrollable content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: isMobile ? '0 16px 16px' : '0 40px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Content container */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'flex-start',
          maxWidth: '900px',
          width: '100%',
          gap: isMobile ? '16px' : '40px',
        }}>
          {/* Commander section - Compact on mobile */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            alignItems: 'center',
            gap: isMobile ? '12px' : '0',
            flexShrink: 0,
            width: isMobile ? '100%' : 'auto',
          }}>
            {/* Portrait frame - Smaller on mobile */}
            <div style={{
              width: isMobile ? '60px' : '160px',
              height: isMobile ? '75px' : '200px',
              background: 'linear-gradient(180deg, #1a2a3a 0%, #0a1520 100%)',
              border: '2px solid ' + actColor,
              borderRadius: isMobile ? '4px' : '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px ' + actColor + '40, inset 0 0 30px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {/* Commander silhouette */}
              <div style={{
                fontSize: isMobile ? '30px' : '80px',
                color: actColor,
                opacity: 0.8,
                textShadow: '0 0 20px ' + actColor,
              }}>
                ⬡
              </div>
              {/* Rank insignia */}
              {!isMobile && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '20px',
                }}>
                  ★★★
                </div>
              )}
              {/* Status indicator */}
              <div style={{
                position: 'absolute',
                bottom: isMobile ? '4px' : '10px',
                left: isMobile ? '4px' : '10px',
                width: isMobile ? '6px' : '10px',
                height: isMobile ? '6px' : '10px',
                background: '#00ff00',
                borderRadius: '50%',
                boxShadow: '0 0 10px #00ff00',
                animation: 'pulse 2s infinite',
              }} />
            </div>
            
            {/* Commander info - Inline on mobile */}
            <div style={{
              textAlign: isMobile ? 'left' : 'center',
              marginTop: isMobile ? '0' : '15px',
              flex: isMobile ? 1 : 'auto',
            }}>
              <div style={{
                fontSize: isMobile ? '14px' : '18px',
                fontWeight: 'bold',
                color: actColor,
                textShadow: '0 0 10px ' + actColor + '60',
              }}>
                {briefing.commanderName}
              </div>
              <div style={{
                fontSize: isMobile ? '10px' : '12px',
                color: '#888',
                marginTop: '4px',
                textTransform: 'uppercase',
                letterSpacing: isMobile ? '1px' : '2px',
              }}>
                {briefing.commanderTitle}
              </div>
            </div>
          </div>

          {/* Briefing text section */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            width: '100%',
          }}>
            {/* Mission title */}
            <div style={{
              fontSize: isMobile ? '16px' : '24px',
              fontWeight: 'bold',
              color: actColor,
              marginBottom: isMobile ? '12px' : '20px',
              textTransform: 'uppercase',
              letterSpacing: isMobile ? '2px' : '4px',
              textShadow: '0 0 20px ' + actColor + '60',
              borderBottom: '1px solid ' + actColor + '40',
              paddingBottom: isMobile ? '8px' : '10px',
            }}>
              {briefing.isBoss ? '⚠ ' : ''}{briefing.missionTitle}
            </div>

            {/* Boss warning */}
            {briefing.isBoss && briefing.bossName && (
              <div style={{
                background: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid #ff4444',
                borderRadius: '4px',
                padding: isMobile ? '8px 10px' : '10px 15px',
                marginBottom: isMobile ? '10px' : '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: isMobile ? '16px' : '20px' }}>⚠</span>
                <span style={{ color: '#ff6666', fontSize: isMobile ? '12px' : '14px' }}>
                  HOSTILE FLAGSHIP: <strong>{briefing.bossName}</strong>
                </span>
              </div>
            )}

            {/* Previous paragraphs (faded) */}
            {briefing.briefingText.slice(0, currentParagraph).map((text, idx) => (
              <div key={idx} style={{
                fontSize: isMobile ? '13px' : '16px',
                lineHeight: '1.5',
                color: '#888',
                marginBottom: isMobile ? '8px' : '12px',
              }}>
                "{text}"
              </div>
            ))}

            {/* Current paragraph (typing) */}
            {currentParagraph < briefing.briefingText.length && (
              <div style={{
                fontSize: isMobile ? '13px' : '16px',
                lineHeight: '1.5',
                color: '#ffffff',
                marginBottom: isMobile ? '8px' : '12px',
                minHeight: isMobile ? '40px' : '50px',
              }}>
                "{displayedText}
                <span style={{
                  borderRight: '2px solid #ffffff',
                  animation: 'blink 0.8s infinite',
                  marginLeft: '2px',
                }} />"
              </div>
            )}

            {/* Objectives panel */}
            <div style={{
              marginTop: isMobile ? '12px' : '20px',
              background: 'rgba(0, 255, 255, 0.05)',
              border: '1px solid ' + actColor + '40',
              borderRadius: isMobile ? '6px' : '8px',
              padding: isMobile ? '10px' : '15px',
              opacity: showObjectives ? 1 : 0.3,
              transition: 'opacity 0.5s ease',
            }}>
              <div style={{
                fontSize: isMobile ? '10px' : '12px',
                color: actColor,
                textTransform: 'uppercase',
                letterSpacing: isMobile ? '1px' : '2px',
                marginBottom: isMobile ? '8px' : '10px',
              }}>
                Mission Objectives
              </div>
              {briefing.objectives.map((obj, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: isMobile ? '8px' : '10px',
                  marginBottom: isMobile ? '6px' : '8px',
                  opacity: showObjectives ? 1 : 0,
                  transform: showObjectives ? 'translateX(0)' : 'translateX(-20px)',
                  transition: 'all 0.3s ease ' + (idx * 0.1) + 's',
                }}>
                  <span style={{
                    width: isMobile ? '16px' : '20px',
                    height: isMobile ? '16px' : '20px',
                    border: '2px solid ' + actColor,
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '8px' : '10px',
                    color: actColor,
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{
                    fontSize: isMobile ? '12px' : '14px',
                    color: '#cccccc',
                  }}>
                    {obj}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Launch button - Fixed at bottom */}
      <div style={{
        flexShrink: 0,
        padding: isMobile ? '12px 16px' : '20px 40px',
        display: 'flex',
        justifyContent: 'center',
        background: 'linear-gradient(0deg, rgba(10,10,26,0.95) 0%, transparent 100%)',
        opacity: showLaunchButton ? 1 : 0,
        transform: showLaunchButton ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s ease',
        pointerEvents: showLaunchButton ? 'auto' : 'none',
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLaunch();
          }}
          style={{
            background: 'linear-gradient(180deg, ' + actColor + ' 0%, ' + actColor + '88 100%)',
            border: 'none',
            borderRadius: isMobile ? '6px' : '8px',
            padding: isMobile ? '12px 40px' : '15px 60px',
            fontSize: isMobile ? '14px' : '18px',
            fontWeight: 'bold',
            color: '#000',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: isMobile ? '2px' : '4px',
            boxShadow: '0 0 30px ' + actColor + '60, 0 4px 20px rgba(0,0,0,0.5)',
            transition: 'all 0.2s ease',
            width: isMobile ? '100%' : 'auto',
            maxWidth: '300px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 50px ' + actColor + '80, 0 4px 30px rgba(0,0,0,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px ' + actColor + '60, 0 4px 20px rgba(0,0,0,0.5)';
          }}
        >
          🚀 Launch Mission
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default BriefingScreen;

/**
 * ScrapHUD - Displays current scrap currency during gameplay
 * 
 * Phase 10: Upgrade Shop & Currency
 * - Shows current scrap count
 * - Animated scrap gain popups
 * - Compact display in corner
 */

import React, { useState, useEffect, useRef } from 'react';
import { currencyManager, CurrencyState, ScrapEarnedEvent } from '../game/CurrencyManager';

interface ScrapPopup {
  id: number;
  amount: number;
  source: string;
  timestamp: number;
}

export const ScrapHUD: React.FC = () => {
  // Initialize with current scrap value from currency manager
  const [scrap, setScrap] = useState(() => currencyManager.getScrap());
  const [popups, setPopups] = useState<ScrapPopup[]>([]);
  const popupIdRef = useRef(0);

  useEffect(() => {
    const handleScrapUpdate = (e: CustomEvent<CurrencyState>) => {
      setScrap(e.detail.scrap);
    };

    const handleScrapEarned = (e: CustomEvent<ScrapEarnedEvent>) => {
      const { amount, source } = e.detail;
      
      // Add popup
      const popup: ScrapPopup = {
        id: ++popupIdRef.current,
        amount,
        source,
        timestamp: Date.now(),
      };
      
      setPopups(prev => [...prev, popup]);
      
      // Remove popup after animation
      setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== popup.id));
      }, 1500);
    };

    window.addEventListener('scrap-update', handleScrapUpdate as EventListener);
    window.addEventListener('scrap-earned', handleScrapEarned as EventListener);

    return () => {
      window.removeEventListener('scrap-update', handleScrapUpdate as EventListener);
      window.removeEventListener('scrap-earned', handleScrapEarned as EventListener);
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '120px',
    right: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontFamily: '"Orbitron", "Rajdhani", monospace',
    pointerEvents: 'none',
    zIndex: 100,
  };

  const scrapDisplayStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.2) 0%, rgba(255, 100, 0, 0.1) 100%)',
    border: '1px solid rgba(255, 170, 0, 0.5)',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(255, 170, 0, 0.3)',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '20px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(255, 170, 0, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffaa00',
    textShadow: '0 0 10px rgba(255, 170, 0, 0.5)',
    minWidth: '60px',
    textAlign: 'right',
  };

  const popupsContainerStyle: React.CSSProperties = {
    position: 'relative',
    height: '60px',
    width: '150px',
    overflow: 'hidden',
  };

  const getPopupStyle = (popup: ScrapPopup): React.CSSProperties => {
    const age = Date.now() - popup.timestamp;
    const progress = Math.min(age / 1500, 1);
    const opacity = 1 - progress;
    const translateY = -30 * progress;

    return {
      position: 'absolute',
      right: 0,
      bottom: 0,
      transform: `translateY(${translateY}px)`,
      opacity,
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#00ff88',
      textShadow: '0 0 8px rgba(0, 255, 136, 0.5)',
      whiteSpace: 'nowrap',
      transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
    };
  };

  return (
    <div style={containerStyle}>
      {/* Scrap popups */}
      <div style={popupsContainerStyle}>
        {popups.map(popup => (
          <div key={popup.id} style={getPopupStyle(popup)}>
            +{popup.amount} ⚙️
          </div>
        ))}
      </div>

      {/* Main scrap display */}
      <div style={scrapDisplayStyle}>
        <span style={iconStyle}>⚙️</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={labelStyle}>SCRAP</span>
          <span style={valueStyle}>{scrap}</span>
        </div>
      </div>
    </div>
  );
};

export default ScrapHUD;

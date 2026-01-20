/**
 * EnemyCompass - Navigation aid for finding enemies
 * 
 * Features:
 * - Always-visible compass pointing to nearest enemy
 * - Distance indicator
 * - Visual urgency based on distance
 * - Fades when enemy is on-screen or very close
 */

import React, { useEffect, useState, useRef } from 'react';
import { useHUDContext } from './HUDLayout';

interface NearestEnemyData {
  distance: number;
  bearing: number; // Angle in radians relative to player heading
  state: string;
  isOnScreen: boolean;
}

export const EnemyCompass: React.FC = () => {
  const hudContext = useHUDContext();
  const [enemyData, setEnemyData] = useState<NearestEnemyData | null>(null);
  const [visible, setVisible] = useState(false);
  const fadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleEnemyCompass = (e: CustomEvent) => {
      const data = e.detail as NearestEnemyData | null;
      
      if (data && !data.isOnScreen && data.distance > 50) {
        setEnemyData(data);
        setVisible(true);
        
        // Clear any pending fade timeout
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
          fadeTimeoutRef.current = null;
        }
      } else {
        // Fade out after a short delay
        if (fadeTimeoutRef.current === null) {
          fadeTimeoutRef.current = window.setTimeout(() => {
            setVisible(false);
            fadeTimeoutRef.current = null;
          }, 1000);
        }
      }
    };

    window.addEventListener('enemy-compass', handleEnemyCompass as EventListener);
    
    return () => {
      window.removeEventListener('enemy-compass', handleEnemyCompass as EventListener);
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  if (!visible || !enemyData) return null;

  // Color based on distance (closer = more urgent)
  const getColor = () => {
    if (enemyData.distance < 100) return '#ef4444'; // Red - very close
    if (enemyData.distance < 200) return '#f97316'; // Orange - close
    return '#22c55e'; // Green - far
  };

  const color = getColor();
  const arrowRotation = enemyData.bearing * (180 / Math.PI);
  
  // Size based on screen size
  const compassSize = hudContext.isMinimalMode ? 60 : 80;
  const fontSize = hudContext.isMinimalMode ? 10 : 12;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: compassSize,
        height: compassSize,
        pointerEvents: 'none',
        zIndex: 'var(--z-hud-indicators)',
        opacity: visible ? 0.9 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Outer ring */}
      <svg
        width={compassSize}
        height={compassSize}
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
        
        {/* Cardinal markers */}
        <text x="50" y="12" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="var(--hud-font-mono)">N</text>
        <text x="92" y="53" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="var(--hud-font-mono)">E</text>
        <text x="50" y="95" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="var(--hud-font-mono)">S</text>
        <text x="8" y="53" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="var(--hud-font-mono)">W</text>
      </svg>
      
      {/* Arrow pointing to enemy */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${arrowRotation}deg)`,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: '8px',
        }}
      >
        <svg
          width="20"
          height="30"
          viewBox="0 0 20 30"
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        >
          <polygon
            points="10,0 20,25 10,20 0,25"
            fill={color}
            stroke="white"
            strokeWidth="1"
          />
        </svg>
      </div>
      
      {/* Distance label */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        <span
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: 'var(--hud-font-mono)',
            color: color,
            textShadow: `0 0 4px ${color}`,
            fontWeight: 'bold',
          }}
        >
          {Math.round(enemyData.distance)}m
        </span>
        <span
          style={{
            fontSize: `${fontSize - 2}px`,
            fontFamily: 'var(--hud-font-mono)',
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
          }}
        >
          Enemy
        </span>
      </div>
      
      {/* "FIND TARGET" label when far */}
      {enemyData.distance > 150 && (
        <div
          style={{
            position: 'absolute',
            bottom: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: `${fontSize - 1}px`,
            fontFamily: 'var(--hud-font-mono)',
            color: '#f97316',
            textShadow: '0 0 4px rgba(249, 115, 22, 0.5)',
            whiteSpace: 'nowrap',
            animation: 'hud-pulse 1s ease-in-out infinite',
          }}
        >
          RETURN TO COMBAT
        </div>
      )}
    </div>
  );
};

export default EnemyCompass;

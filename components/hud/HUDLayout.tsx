/**
 * HUDLayout - Master container for all HUD elements
 * 
 * Provides:
 * - Responsive breakpoint context
 * - Safe area handling for notched devices
 * - Z-index management
 * - Edge-anchored positioning
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useDeviceDetection, useBreakpoint } from '../../hooks/useDeviceDetection';

type Breakpoint = ReturnType<typeof useBreakpoint>;
import '../../styles/hud.css';

// HUD Context for child components
interface HUDContextType {
  breakpoint: Breakpoint;
  isPortrait: boolean;
  isLandscape: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isMinimalMode: boolean;  // Portrait mobile = minimal
  isCompactMode: boolean;  // Landscape mobile = compact
  isStandardMode: boolean; // Tablet = standard
  isFullMode: boolean;     // Desktop = full
}

const HUDContext = createContext<HUDContextType | null>(null);

export const useHUDContext = () => {
  const context = useContext(HUDContext);
  if (!context) {
    throw new Error('useHUDContext must be used within HUDLayout');
  }
  return context;
};

interface HUDLayoutProps {
  children: ReactNode;
  visible?: boolean;
}

export const HUDLayout: React.FC<HUDLayoutProps> = ({ children, visible = true }) => {
  const deviceInfo = useDeviceDetection();
  const breakpoint = useBreakpoint();
  
  // Determine HUD mode based on screen size
  const isMinimalMode = breakpoint === 'xs';
  const isCompactMode = breakpoint === 'sm';
  const isStandardMode = breakpoint === 'md';
  const isFullMode = breakpoint === 'lg' || breakpoint === 'xl';
  
  const contextValue: HUDContextType = {
    breakpoint,
    isPortrait: deviceInfo.isPortrait,
    isLandscape: deviceInfo.isLandscape,
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isDesktop: deviceInfo.isDesktop,
    isTouchDevice: deviceInfo.isTouchDevice,
    isMinimalMode,
    isCompactMode,
    isStandardMode,
    isFullMode,
  };

  if (!visible) return null;

  return (
    <HUDContext.Provider value={contextValue}>
      <div 
        className="hud-container"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease-out',
        }}
      >
        {/* Top Zone - Wave info, score */}
        <div style={{
          position: 'absolute',
          top: 'var(--hud-edge-margin)',
          left: 'var(--hud-edge-margin)',
          right: 'var(--hud-edge-margin)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--hud-gap)',
          zIndex: 'var(--z-hud-top)',
        }}>
          {/* Top-Left slot */}
          <div id="hud-top-left" style={{ flex: '0 0 auto' }} />
          
          {/* Top-Center slot */}
          <div id="hud-top-center" style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center' }} />
          
          {/* Top-Right slot */}
          <div id="hud-top-right" style={{ flex: '0 0 auto' }} />
        </div>

        {/* Middle Zone - Left and Right panels */}
        <div style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          left: 'var(--hud-edge-margin)',
          zIndex: 'var(--z-hud-panels)',
        }}>
          <div id="hud-middle-left" />
        </div>

        <div style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          right: 'var(--hud-edge-margin)',
          zIndex: 'var(--z-hud-panels)',
        }}>
          <div id="hud-middle-right" />
        </div>

        {/* Bottom Zone - Health, weapons, radar */}
        <div style={{
          position: 'absolute',
          bottom: 'var(--hud-edge-margin)',
          left: 'var(--hud-edge-margin)',
          right: 'var(--hud-edge-margin)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 'var(--hud-gap)',
          zIndex: 'var(--z-hud-panels)',
        }}>
          {/* Bottom-Left slot */}
          <div id="hud-bottom-left" style={{ flex: '0 0 auto' }} />
          
          {/* Bottom-Center slot */}
          <div id="hud-bottom-center" style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center' }} />
          
          {/* Bottom-Right slot */}
          <div id="hud-bottom-right" style={{ flex: '0 0 auto' }} />
        </div>

        {/* Edge Indicators Layer - for off-screen target arrows */}
        <div 
          id="hud-edge-indicators"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 'var(--z-hud-indicators)',
          }}
        />

        {/* Center Zone - Crosshair area (should remain mostly clear) */}
        <div 
          id="hud-center"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 'var(--z-hud-base)',
          }}
        />

        {/* Render children */}
        {children}
      </div>
    </HUDContext.Provider>
  );
};

export default HUDLayout;

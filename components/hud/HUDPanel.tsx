/**
 * HUDPanel - Reusable styled panel component
 * 
 * Provides consistent styling for all HUD elements:
 * - Translucent background with blur
 * - Subtle border with glow
 * - Corner accent decorations
 * - Size variants for responsiveness
 * - Animation support
 */

import React, { ReactNode, CSSProperties } from 'react';
import { useHUDContext } from './HUDLayout';

export type PanelVariant = 'minimal' | 'compact' | 'standard' | 'expanded';
export type PanelColor = 'default' | 'health' | 'weapons' | 'score' | 'radar' | 'warning' | 'critical';

interface HUDPanelProps {
  children: ReactNode;
  variant?: PanelVariant;
  color?: PanelColor;
  showCorners?: boolean;
  className?: string;
  style?: CSSProperties;
  interactive?: boolean;
  animate?: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'pulse' | 'glow';
  onClick?: () => void;
}

const getColorStyles = (color: PanelColor): { border: string; glow: string } => {
  switch (color) {
    case 'health':
      return {
        border: 'var(--hud-health-full)',
        glow: 'rgba(16, 185, 129, 0.3)',
      };
    case 'weapons':
      return {
        border: 'var(--hud-weapons-ready)',
        glow: 'rgba(14, 165, 233, 0.3)',
      };
    case 'score':
      return {
        border: 'var(--hud-score-primary)',
        glow: 'rgba(139, 92, 246, 0.3)',
      };
    case 'radar':
      return {
        border: 'var(--hud-radar-ring)',
        glow: 'rgba(20, 184, 166, 0.3)',
      };
    case 'warning':
      return {
        border: 'var(--hud-health-warning)',
        glow: 'rgba(245, 158, 11, 0.4)',
      };
    case 'critical':
      return {
        border: 'var(--hud-health-critical)',
        glow: 'rgba(244, 63, 94, 0.5)',
      };
    default:
      return {
        border: 'var(--hud-border-color)',
        glow: 'var(--hud-border-glow)',
      };
  }
};

const getVariantStyles = (variant: PanelVariant): CSSProperties => {
  switch (variant) {
    case 'minimal':
      return {
        padding: '4px 8px',
        borderRadius: '4px',
        backdropFilter: 'blur(4px)',
      };
    case 'compact':
      return {
        padding: '6px 10px',
        borderRadius: '6px',
        backdropFilter: 'blur(6px)',
      };
    case 'standard':
      return {
        padding: 'var(--hud-panel-padding)',
        borderRadius: 'var(--hud-panel-radius)',
        backdropFilter: 'blur(8px)',
      };
    case 'expanded':
      return {
        padding: 'calc(var(--hud-panel-padding) * 1.5)',
        borderRadius: 'calc(var(--hud-panel-radius) * 1.5)',
        backdropFilter: 'blur(10px)',
      };
    default:
      return {};
  }
};

const getAnimationStyle = (animate: HUDPanelProps['animate']): CSSProperties => {
  switch (animate) {
    case 'fade':
      return {
        animation: 'hud-slide-in-bottom 0.3s ease-out',
      };
    case 'slide-up':
      return {
        animation: 'hud-slide-in-bottom 0.3s ease-out',
      };
    case 'slide-down':
      return {
        animation: 'hud-slide-in-top 0.3s ease-out',
      };
    case 'pulse':
      return {
        animation: 'hud-pulse 1s ease-in-out infinite',
      };
    case 'glow':
      return {
        animation: 'hud-glow 1.5s ease-in-out infinite',
      };
    default:
      return {};
  }
};

export const HUDPanel: React.FC<HUDPanelProps> = ({
  children,
  variant = 'standard',
  color = 'default',
  showCorners = true,
  className = '',
  style = {},
  interactive = false,
  animate = 'none',
  onClick,
}) => {
  const hudContext = useHUDContext();
  
  // Auto-adjust variant based on breakpoint if not explicitly set
  const effectiveVariant = variant === 'standard' 
    ? (hudContext.isMinimalMode ? 'minimal' 
       : hudContext.isCompactMode ? 'compact' 
       : hudContext.isFullMode ? 'expanded' 
       : 'standard')
    : variant;
  
  const colorStyles = getColorStyles(color);
  const variantStyles = getVariantStyles(effectiveVariant);
  const animationStyles = getAnimationStyle(animate);

  const combinedStyles: CSSProperties = {
    background: 'var(--hud-bg-primary)',
    border: `1px solid ${colorStyles.border}`,
    boxShadow: `0 0 10px ${colorStyles.glow}`,
    fontFamily: 'var(--hud-font-family)',
    color: 'var(--hud-text-primary)',
    transition: 'all var(--hud-transition-normal)',
    position: 'relative',
    ...variantStyles,
    ...animationStyles,
    ...style,
    cursor: onClick ? 'pointer' : undefined,
    pointerEvents: interactive || onClick ? 'auto' : 'none',
  };

  return (
    <div
      className={`${showCorners ? 'hud-corner-accent' : ''} ${className}`}
      style={combinedStyles}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Additional utility components for common HUD patterns

interface HUDLabelProps {
  children: ReactNode;
  size?: 'xs' | 'sm' | 'md';
  color?: 'primary' | 'secondary' | 'muted' | 'inherit';
}

export const HUDLabel: React.FC<HUDLabelProps> = ({
  children,
  size = 'sm',
  color = 'secondary',
}) => {
  const fontSize = size === 'xs' ? 'var(--hud-font-xs)' 
                 : size === 'sm' ? 'var(--hud-font-sm)' 
                 : 'var(--hud-font-md)';
  
  const textColor = color === 'primary' ? 'var(--hud-text-primary)'
                  : color === 'secondary' ? 'var(--hud-text-secondary)'
                  : color === 'muted' ? 'var(--hud-text-muted)'
                  : 'inherit';

  return (
    <span style={{
      fontSize,
      color: textColor,
      fontFamily: 'var(--hud-font-mono)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    }}>
      {children}
    </span>
  );
};

interface HUDValueProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  glow?: boolean;
}

export const HUDValue: React.FC<HUDValueProps> = ({
  children,
  size = 'md',
  color = 'var(--hud-text-primary)',
  glow = false,
}) => {
  const fontSize = size === 'sm' ? 'var(--hud-font-sm)'
                 : size === 'md' ? 'var(--hud-font-md)'
                 : size === 'lg' ? 'var(--hud-font-lg)'
                 : 'var(--hud-font-xl)';

  return (
    <span style={{
      fontSize,
      fontWeight: 'bold',
      color,
      fontFamily: 'var(--hud-font-mono)',
      fontVariantNumeric: 'tabular-nums',
      textShadow: glow ? `0 0 10px ${color}` : undefined,
    }}>
      {children}
    </span>
  );
};

interface HUDIconProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  pulse?: boolean;
}

export const HUDIcon: React.FC<HUDIconProps> = ({
  children,
  size = 'md',
  color = 'currentColor',
  pulse = false,
}) => {
  const iconSize = size === 'sm' ? 'var(--hud-icon-small)'
                 : size === 'md' ? 'var(--hud-icon-size)'
                 : 'calc(var(--hud-icon-size) * 1.5)';

  return (
    <span style={{
      width: iconSize,
      height: iconSize,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: iconSize,
      color,
      animation: pulse ? 'hud-pulse 1s ease-in-out infinite' : undefined,
    }}>
      {children}
    </span>
  );
};

export default HUDPanel;

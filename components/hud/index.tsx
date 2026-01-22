/**
 * HUD Components - Barrel Export
 * 
 * Phase 14: Responsive HUD Refactor
 * 
 * New unified HUD system with:
 * - Responsive breakpoints (mobile → desktop)
 * - Minimalist, futuristic design
 * - Edge-anchored layout
 * - Icon-first approach
 */

// Layout & Framework
export { HUDLayout, useHUDContext } from './HUDLayout';
export { HUDPanel, HUDLabel, HUDValue, HUDIcon } from './HUDPanel';
export type { PanelVariant, PanelColor } from './HUDPanel';

// Core HUD Elements
export { HealthBar } from './HealthBar';
export { WeaponsStrip } from './WeaponsStrip';
export { MiniRadar } from './MiniRadar';
export { ScoreDisplay } from './ScoreDisplay';
export { TopBar } from './TopBar';
export { EdgeIndicators } from './EdgeIndicators';
export { EnemyCompass } from './EnemyCompass';
export { ThrottleBar } from './ThrottleBar';

// Default export - Complete HUD composition
import React from 'react';
import { HUDLayout } from './HUDLayout';
import { HealthBar } from './HealthBar';
import { WeaponsStrip } from './WeaponsStrip';
import { MiniRadar } from './MiniRadar';
import { ScoreDisplay } from './ScoreDisplay';
import { TopBar } from './TopBar';
import { EdgeIndicators } from './EdgeIndicators';
import { EnemyCompass } from './EnemyCompass';
import { ThrottleBar } from './ThrottleBar';

interface CompleteHUDProps {
  visible?: boolean;
}

/**
 * CompleteHUD - All-in-one HUD composition
 * 
 * Use this for the complete responsive HUD experience.
 * Individual components can also be imported and used separately.
 */
export const CompleteHUD: React.FC<CompleteHUDProps> = ({ visible = true }) => {
  return (
    <HUDLayout visible={visible}>
      {/* Top Center - Wave info, enemies, timer */}
      <TopBar />
      
      {/* Top Right - Score, combo */}
      <ScoreDisplay />
      
      {/* Bottom Left - Health */}
      <HealthBar />
      
      {/* Bottom Left (above health) - Radar */}
      <MiniRadar />
      
      {/* Left Center - Throttle indicator */}
      <ThrottleBar />
      
      {/* Bottom Right - Weapons */}
      <WeaponsStrip />
      
      {/* Screen edges - Off-screen target indicators */}
      <EdgeIndicators />
      
      {/* Center screen - Enemy compass for navigation */}
      <EnemyCompass />
    </HUDLayout>
  );
};

export default CompleteHUD;

/**
 * EndlessHUD - Additional HUD elements for Endless Mode
 * 
 * Phase 16: Endless Mode
 * - Current wave display (no total)
 * - Best wave indicator
 * - Wave modifier display
 * - Difficulty indicator
 */

import React, { useState, useEffect } from 'react';
import { Infinity, Zap, Trophy, TrendingUp, AlertTriangle, Skull } from 'lucide-react';
import { endlessModeManager, WaveModifier } from '../game/EndlessModeManager';
import { waveManager } from '../game/WaveManager';

interface ModifierInfo {
  modifier: WaveModifier;
  name: string;
  description: string;
}

const EndlessHUD: React.FC = () => {
  const [currentWave, setCurrentWave] = useState(0);
  const [bestWave, setBestWave] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [activeModifier, setActiveModifier] = useState<ModifierInfo | null>(null);
  const [showModifierPopup, setShowModifierPopup] = useState(false);
  const [isEndlessActive, setIsEndlessActive] = useState(false);

  useEffect(() => {
    // Update stats periodically
    const updateStats = () => {
      if (endlessModeManager.isActive()) {
        setIsEndlessActive(true);
        setCurrentWave(endlessModeManager.getCurrentWave());
        setBestWave(endlessModeManager.getBestWave());
        setDifficulty(endlessModeManager.getEnemyStatMultiplier());
      } else {
        setIsEndlessActive(false);
      }
    };

    const interval = setInterval(updateStats, 500);
    updateStats();

    // Listen for modifier notifications
    const handleModifier = (e: CustomEvent) => {
      const { modifier, name, description } = e.detail;
      setActiveModifier({ modifier, name, description });
      setShowModifierPopup(true);
      
      // Hide popup after 4 seconds
      setTimeout(() => setShowModifierPopup(false), 4000);
    };

    // Listen for endless mode events
    const handleEndlessStart = () => setIsEndlessActive(true);
    const handleEndlessEnd = () => setIsEndlessActive(false);

    window.addEventListener('endless-modifier', handleModifier as EventListener);
    window.addEventListener('endless-mode-start', handleEndlessStart);
    window.addEventListener('endless-mode-end', handleEndlessEnd);

    return () => {
      clearInterval(interval);
      window.removeEventListener('endless-modifier', handleModifier as EventListener);
      window.removeEventListener('endless-mode-start', handleEndlessStart);
      window.removeEventListener('endless-mode-end', handleEndlessEnd);
    };
  }, []);

  if (!isEndlessActive) return null;

  const getDifficultyColor = () => {
    if (difficulty < 1.5) return 'text-green-400';
    if (difficulty < 2.0) return 'text-yellow-400';
    if (difficulty < 3.0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getDifficultyLabel = () => {
    if (difficulty < 1.3) return 'NORMAL';
    if (difficulty < 1.8) return 'HARD';
    if (difficulty < 2.5) return 'EXTREME';
    if (difficulty < 3.5) return 'INSANE';
    return 'NIGHTMARE';
  };

  const getModifierIcon = (modifier: WaveModifier) => {
    switch (modifier) {
      case 'phantom_swarm':
      case 'speed_demons':
        return <Zap className="w-5 h-5" />;
      case 'warden_wall':
      case 'iron_fortress':
        return <Skull className="w-5 h-5" />;
      case 'specter_ambush':
      case 'elite_guard':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  return (
    <>
      {/* Endless Mode Badge - Top Left */}
      <div className="fixed top-4 left-4 z-40 pointer-events-none">
        <div className="flex items-center gap-3">
          {/* Endless Badge */}
          <div className="bg-purple-900/80 border border-purple-500/50 rounded-lg px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Infinity className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 font-bold tracking-wider text-sm">ENDLESS</span>
            </div>
          </div>

          {/* Wave Counter */}
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-lg px-4 py-2 backdrop-blur-sm">
            <div className="text-xs text-purple-300/70 tracking-wider">WAVE</div>
            <div className="text-2xl font-black text-white leading-none">
              {currentWave}
            </div>
          </div>

          {/* Best Wave */}
          {bestWave > 0 && (
            <div className="bg-slate-900/60 border border-yellow-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-400 font-bold">{bestWave}</span>
              </div>
            </div>
          )}

          {/* Difficulty Indicator */}
          <div className={`bg-slate-900/60 border rounded-lg px-3 py-2 backdrop-blur-sm ${getDifficultyColor()} border-current/30`}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-bold text-sm">{getDifficultyLabel()}</span>
              <span className="text-xs opacity-70">×{difficulty.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modifier Popup - Top Center */}
      {showModifierPopup && activeModifier && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-pulse">
          <div className="bg-gradient-to-r from-purple-900/90 to-slate-900/90 border-2 border-purple-500/60 rounded-xl px-8 py-4 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400">
                {getModifierIcon(activeModifier.modifier)}
              </div>
              <div>
                <div className="text-xs text-purple-300/70 tracking-wider mb-1">WAVE MODIFIER</div>
                <div className="text-xl font-black text-white">{activeModifier.name}</div>
                <div className="text-sm text-purple-300/80">{activeModifier.description}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Modifier Indicator - Below Wave Counter */}
      {activeModifier && !showModifierPopup && activeModifier.modifier !== 'none' && (
        <div className="fixed top-20 left-4 z-40 pointer-events-none">
          <div className="bg-purple-900/60 border border-purple-500/30 rounded-lg px-3 py-1.5 backdrop-blur-sm flex items-center gap-2">
            {getModifierIcon(activeModifier.modifier)}
            <span className="text-purple-300 text-sm font-medium">{activeModifier.name}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default EndlessHUD;


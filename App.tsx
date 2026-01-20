import React, { useState, useEffect } from 'react';
import { GameView } from './components/GameView';
import { VirtualControls } from './components/VirtualControls';
import { Crosshair } from './components/Crosshair';
// New unified HUD system (Phase 14)
import { CompleteHUD } from './components/hud';
// Phase 15: Polish & Effects
import ScreenEffects from './components/ScreenEffects';
import PerformanceOverlay from './components/PerformanceOverlay';
// Phase 16: Endless Mode
import ModeSelect from './components/ModeSelect';
import LeaderboardDisplay from './components/LeaderboardDisplay';
import EndlessHUD from './components/EndlessHUD';
import { ProgressManager } from './game/ProgressManager';
// Kept components (overlays, modals)
import CinematicOverlay from './components/CinematicOverlay';
import PauseMenu from './components/PauseMenu';
import GameOverScreen from './components/GameOverScreen';
import ScrapHUD from './components/ScrapHUD';
import UpgradeShop from './components/UpgradeShop';
import BriefingScreen from './components/BriefingScreen';
import BossHUD from './components/BossHUD';
import AircraftSelect from './components/AircraftSelect';
import { storyManager, BriefingData } from './game/StoryManager';
import { Play, Settings, Zap, Plane, Infinity, Trophy, Warehouse, Bug } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState('MENU');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeStyle, setActiveStyle] = useState('ACE');
  const [shopOpen, setShopOpen] = useState(false);
  const [hangarOpen, setHangarOpen] = useState(false);
  const [hangarShopOpen, setHangarShopOpen] = useState(false);
  const [currentWave, setCurrentWave] = useState(1);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [currentBriefing, setCurrentBriefing] = useState<BriefingData | null>(null);
  // Phase 16: Mode selection state
  const [modeSelectOpen, setModeSelectOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [isEndlessMode, setIsEndlessMode] = useState(false);
  // Dev mode state
  const [devMode, setDevMode] = useState(ProgressManager.isDevMode());

  // Toggle dev mode
  const toggleDevMode = () => {
    const newState = ProgressManager.toggleDevMode();
    setDevMode(newState);
  };

  useEffect(() => {
    const handleStateChange = (e: CustomEvent) => {
      setGameState(e.detail.state);
    };
    
    // Listen for shop open/close events
    const handleShopOpen = (e: CustomEvent) => {
      setCurrentWave(e.detail?.waveNumber || 1);
      setShopOpen(true);
    };
    
    const handleShopClose = () => {
      setShopOpen(false);
    };
    
    // Listen for briefing events
    const handleBriefingOpen = (e: CustomEvent) => {
      const waveNumber = e.detail?.waveNumber || 1;
      // Skip briefings in endless mode
      if (isEndlessMode) {
        window.dispatchEvent(new CustomEvent('briefing-complete', { detail: { waveNumber } }));
        return;
      }
      const briefing = storyManager.getBriefing(waveNumber);
      if (briefing) {
        setCurrentBriefing(briefing);
        setBriefingOpen(true);
      } else {
        // No briefing for this wave, launch directly
        window.dispatchEvent(new CustomEvent('briefing-complete', { detail: { waveNumber } }));
      }
    };
    
    // Phase 16: Listen for endless mode events
    const handleEndlessModeStart = () => {
      setIsEndlessMode(true);
    };
    
    const handleEndlessModeEnd = () => {
      setIsEndlessMode(false);
    };
    
    window.addEventListener('game-state-change', handleStateChange as EventListener);
    window.addEventListener('upgrade-shop-open', handleShopOpen as EventListener);
    window.addEventListener('upgrade-shop-close', handleShopClose as EventListener);
    window.addEventListener('show-briefing', handleBriefingOpen as EventListener);
    window.addEventListener('endless-mode-start', handleEndlessModeStart);
    window.addEventListener('endless-mode-end', handleEndlessModeEnd);
    
    return () => {
      window.removeEventListener('game-state-change', handleStateChange as EventListener);
      window.removeEventListener('upgrade-shop-open', handleShopOpen as EventListener);
      window.removeEventListener('upgrade-shop-close', handleShopClose as EventListener);
      window.removeEventListener('show-briefing', handleBriefingOpen as EventListener);
      window.removeEventListener('endless-mode-start', handleEndlessModeStart);
      window.removeEventListener('endless-mode-end', handleEndlessModeEnd);
    };
  }, [isEndlessMode]);

  // Open mode selection (Campaign vs Endless)
  const openModeSelect = () => {
    setModeSelectOpen(true);
  };

  // Start Campaign mode
  const startCampaign = () => {
    setModeSelectOpen(false);
    setIsEndlessMode(false);
    // Show briefing for Wave 1 before starting
    const briefing = storyManager.getBriefing(1);
    if (briefing) {
      setCurrentBriefing(briefing);
      setBriefingOpen(true);
    } else {
      window.dispatchEvent(new CustomEvent('game-action', { detail: { action: 'start', mode: 'campaign' } }));
    }
  };

  // Start Endless mode
  const startEndless = () => {
    setModeSelectOpen(false);
    setIsEndlessMode(true);
    // Get selected aircraft from ProgressManager
    const aircraftId = ProgressManager.getSelectedAircraftId();
    window.dispatchEvent(new CustomEvent('game-action', { 
      detail: { action: 'start', mode: 'endless', aircraftId } 
    }));
  };

  // Legacy startGame - now opens mode select
  const startGame = () => {
    openModeSelect();
  };

  const handleBriefingLaunch = () => {
    setBriefingOpen(false);
    const waveNumber = currentBriefing?.waveNumber || 1;
    
    if (waveNumber === 1) {
      // First wave - start the game (campaign mode)
      window.dispatchEvent(new CustomEvent('game-action', { detail: { action: 'start', mode: 'campaign' } }));
    } else {
      // Subsequent waves - signal briefing complete
      window.dispatchEvent(new CustomEvent('briefing-complete', { detail: { waveNumber } }));
    }
  };

  const handleBriefingSkip = () => {
    setBriefingOpen(false);
    const waveNumber = currentBriefing?.waveNumber || 1;
    
    if (waveNumber === 1) {
      window.dispatchEvent(new CustomEvent('game-action', { detail: { action: 'start', mode: 'campaign' } }));
    } else {
      window.dispatchEvent(new CustomEvent('briefing-complete', { detail: { waveNumber } }));
    }
  };

  const setFlightStyle = (style: string) => {
    setActiveStyle(style);
    window.dispatchEvent(new CustomEvent('game-settings', { detail: { style } }));
  };

  const handleShopClose = () => {
    setShopOpen(false);
    window.dispatchEvent(new CustomEvent('upgrade-shop-closed', {}));
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* 3D Game Canvas */}
      <GameView />
      
      {/* Phase 15: Screen Effects Overlay (hit flash, vignette) */}
      <ScreenEffects />
      
      {/* Phase 15: Performance Overlay (toggle with ~ key) */}
      <PerformanceOverlay />
      
      {/* HUD Layer - New Responsive HUD (Phase 14) */}
      {gameState === 'PLAYING' && (
        <>
          {/* Unified Responsive HUD */}
          <CompleteHUD />
          
          {/* Phase 16: Endless Mode HUD */}
          {isEndlessMode && <EndlessHUD />}
          
          {/* Crosshair / Reticle */}
          <Crosshair />
          
          {/* Scrap Currency HUD (Phase 10) */}
          <ScrapHUD />
          
          {/* Cinematic Overlay (Phase 8C) */}
          <CinematicOverlay />
          
          {/* Pause Menu (Phase 8D) */}
          <PauseMenu />
          
          {/* Boss HUD (Phase 12) */}
          <BossHUD />
          
          {/* Upgrade Shop (Phase 10) */}
          <UpgradeShop 
            isVisible={shopOpen}
            waveNumber={currentWave}
            onClose={handleShopClose}
          />
          
          {/* Virtual Controls */}
          <VirtualControls />
        </>
      )}

      {/* Game Over Screen (Phase 9) */}
      {gameState === 'GAME_OVER' && (
        <GameOverScreen />
      )}

      {/* Briefing Screen (Phase 11) */}
      {briefingOpen && currentBriefing && (
        <BriefingScreen
          briefing={currentBriefing}
          onLaunch={handleBriefingLaunch}
          onSkip={handleBriefingSkip}
        />
      )}

      {/* Phase 16: Mode Selection Screen */}
      {modeSelectOpen && (
        <ModeSelect
          onSelectCampaign={startCampaign}
          onSelectEndless={startEndless}
          onBack={() => setModeSelectOpen(false)}
        />
      )}

      {/* Phase 16: Leaderboard Display */}
      <LeaderboardDisplay
        isVisible={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />

      {/* Hangar Screen - Aircraft Select + Upgrades */}
      {hangarOpen && (
        <div className="fixed inset-0 z-50">
          <AircraftSelect
            onSelect={(aircraftId) => {
              ProgressManager.selectAircraft(aircraftId);
              // Stay in hangar - selection is saved
            }}
            onBack={() => {
              setHangarOpen(false);
              setHangarShopOpen(false);
            }}
            onOpenUpgrades={() => setHangarShopOpen(true)}
            onLaunch={() => {
              setHangarOpen(false);
              setHangarShopOpen(false);
              openModeSelect();
            }}
          />
          {/* Upgrade shop within hangar */}
          <UpgradeShop
            isVisible={hangarShopOpen}
            waveNumber={0}
            onClose={() => setHangarShopOpen(false)}
            context="hangar"
          />
        </div>
      )}

      {/* Menu Overlay - Hide when mode select or other screens are open */}
      {gameState === 'MENU' && !modeSelectOpen && !leaderboardOpen && !hangarOpen && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto text-center">
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 tracking-tight drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
                DEFENDER
              </h1>
              <p className="text-cyan-300/60 tracking-[0.3em] text-sm mt-2">
                VOXEL ACE FLIGHT SIM
              </p>
            </div>

            {/* Start Button */}
            <button
              onClick={startGame}
              className="group relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-white tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5" />
                <span>LAUNCH</span>
              </div>
            </button>

            {/* Secondary Buttons */}
            <div className="flex items-center justify-center gap-4 mt-4">
              {/* Hangar Button */}
              <button
                onClick={() => setHangarOpen(true)}
                className="px-6 py-2 text-amber-400/80 hover:text-amber-300 transition-colors flex items-center gap-2"
              >
                <Warehouse className="w-4 h-4" />
                <span className="text-sm tracking-wider">HANGAR</span>
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="px-6 py-2 text-cyan-400/80 hover:text-cyan-300 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm tracking-wider">CONFIG</span>
              </button>

              {/* Leaderboard Button (Phase 16) */}
              {ProgressManager.isEndlessUnlocked() && (
                <button
                  onClick={() => setLeaderboardOpen(true)}
                  className="px-6 py-2 text-purple-400/80 hover:text-purple-300 transition-colors flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm tracking-wider">LEADERBOARD</span>
                </button>
              )}
            </div>

            {/* Dev Mode Toggle */}
            <div className="mt-6">
              <button
                onClick={toggleDevMode}
                className={`px-4 py-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                  devMode
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-amber-500/50 hover:text-amber-400/60'
                }`}
              >
                <Bug className="w-4 h-4" />
                <span className="text-xs tracking-wider font-medium">
                  DEV MODE {devMode ? 'ON' : 'OFF'}
                </span>
              </button>
              {devMode && (
                <p className="text-amber-400/60 text-xs mt-2 max-w-[280px] text-center">
                  All ships unlocked • Infinite scrap • Endless mode available
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900/95 border border-cyan-500/30 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-cyan-400 tracking-wider flex items-center gap-2">
                <Plane className="w-5 h-5" />
                FLIGHT CONFIG
              </h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-cyan-400/60 hover:text-cyan-300 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Control Style */}
            <div className="mb-6">
              <label className="text-cyan-400/80 text-sm tracking-wider mb-3 block">
                CONTROL STYLE
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'HERO', label: 'HERO', desc: 'Auto-level' },
                  { id: 'ACE', label: 'ACE', desc: 'Balanced' },
                  { id: 'SIM', label: 'SIM', desc: 'Full Control' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setFlightStyle(style.id)}
                    className={`p-3 rounded-lg border transition-all ${
                      activeStyle === style.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-cyan-500/50'
                    }`}
                  >
                    <div className="font-bold text-sm">{style.label}</div>
                    <div className="text-xs opacity-60">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-400 text-sm mb-2">
                <Zap className="w-4 h-4" />
                <span className="font-bold">CONTROLS</span>
              </div>
              <ul className="text-cyan-100/70 text-sm space-y-1">
                <li>• W/S - Pitch</li>
                <li>• A/D - Turn (double-tap for Barrel Roll)</li>
                <li>• SHIFT - Afterburner</li>
                <li>• B - Air brake</li>
              </ul>
            </div>

            {/* Close */}
            <button
              onClick={() => setSettingsOpen(false)}
              className="w-full mt-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white tracking-wider transition-colors"
            >
              CONFIRM
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

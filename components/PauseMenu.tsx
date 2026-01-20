/**
 * PauseMenu - In-game pause menu during beacon phase
 * 
 * Phase 8D: Boss Waves & Polish
 * Phase 13: Added Audio Settings
 * 
 * Options:
 * - RESUME - Continue to beacon
 * - AUDIO - Toggle audio settings panel
 * - HANGAR - Return to aircraft selection (keeps wave progress)
 * - QUIT - Exit to main menu
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Pause, Play, Home, X, AlertTriangle, Volume2 } from 'lucide-react';
import AudioSettingsPanel from './AudioSettings';
import { useIsTouchDevice } from '../hooks/useDeviceDetection';

interface PauseMenuProps {
  onResume?: () => void;
  onHangar?: () => void;
  onQuit?: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onHangar, onQuit }) => {
  const isTouchDevice = useIsTouchDevice();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'hangar' | 'quit' | null>(null);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [waveState, setWaveState] = useState<string>('COMBAT');
  const [waveNumber, setWaveNumber] = useState(1);

  // Track wave state to only allow pause during beacon phase
  useEffect(() => {
    const handleWaveState = (e: CustomEvent) => {
      setWaveState(e.detail.state);
    };

    const handleWaveStart = (e: CustomEvent) => {
      const wave = e.detail.wave;
      if (wave) {
        setWaveNumber(wave.id);
      }
    };

    window.addEventListener('wave-state-change', handleWaveState as EventListener);
    window.addEventListener('wave-start', handleWaveStart as EventListener);
    
    return () => {
      window.removeEventListener('wave-state-change', handleWaveState as EventListener);
      window.removeEventListener('wave-start', handleWaveStart as EventListener);
    };
  }, []);

  // Resume/close pause menu and dispatch event
  const handleResume = useCallback(() => {
    setIsOpen(false);
    setShowConfirm(null);
    window.dispatchEvent(new CustomEvent('game-pause', { detail: { paused: false } }));
    onResume?.();
  }, [onResume]);

  // Handle escape key to toggle pause during any game phase
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        // Allow pause during all gameplay phases
        const pausableStates = ['BEACON_ACTIVE', 'INTERMISSION', 'WAVE_COMPLETE', 'COMBAT'];
        if (pausableStates.includes(waveState)) {
          e.preventDefault();
          setIsOpen((prev: boolean) => {
            if (prev) {
              // Closing menu
              window.dispatchEvent(new CustomEvent('game-pause', { detail: { paused: false } }));
            } else {
              // Opening menu
              window.dispatchEvent(new CustomEvent('game-pause', { detail: { paused: true } }));
            }
            return !prev;
          });
        } else if (isOpen) {
          // Allow closing menu even during other states
          e.preventDefault();
          handleResume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, waveState, handleResume]);

  // Handle pause input from virtual controls (mobile pause button)
  useEffect(() => {
    const handleGameInput = (e: any) => {
      if (e.detail && e.detail.type === 'pause') {
        const pausableStates = ['BEACON_ACTIVE', 'INTERMISSION', 'WAVE_COMPLETE', 'COMBAT'];
        if (pausableStates.includes(waveState)) {
          setIsOpen((prev: boolean) => {
            const newState = !prev;
            if (newState) {
              window.dispatchEvent(new CustomEvent('game-pause', { detail: { paused: true } }));
            } else {
              window.dispatchEvent(new CustomEvent('game-pause', { detail: { paused: false } }));
            }
            return newState;
          });
        }
      }
    };

    window.addEventListener('game-input', handleGameInput as EventListener);
    return () => {
      window.removeEventListener('game-input', handleGameInput as EventListener);
    };
  }, [waveState]);

  const handleHangarClick = () => {
    setShowConfirm('hangar');
  };

  const handleQuitClick = () => {
    setShowConfirm('quit');
  };

  const confirmHangar = () => {
    setIsOpen(false);
    setShowConfirm(null);
    window.dispatchEvent(new CustomEvent('game-pause', { detail: { paused: false } }));
    window.dispatchEvent(new CustomEvent('game-action', { detail: { action: 'hangar' } }));
    onHangar?.();
  };

  const confirmQuit = () => {
    setIsOpen(false);
    setShowConfirm(null);
    window.dispatchEvent(new CustomEvent('game-pause', { detail: { paused: false } }));
    window.dispatchEvent(new CustomEvent('game-action', { detail: { action: 'quit' } }));
    onQuit?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60">
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-xl p-6 max-w-sm w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-cyan-400 tracking-wider flex items-center gap-2">
            <Pause className="w-5 h-5" />
            PAUSED
          </h2>
          <button
            onClick={handleResume}
            className="text-cyan-400/60 hover:text-cyan-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wave Info */}
        <div className="mb-6 p-3 bg-cyan-900/20 rounded-lg border border-cyan-500/20">
          <div className="text-cyan-400/60 text-xs tracking-wider mb-1">CURRENT WAVE</div>
          <div className="text-cyan-300 text-2xl font-bold">{waveNumber} / 15</div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="mb-4 p-4 bg-amber-900/30 border border-amber-500/50 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold">
                {showConfirm === 'hangar' ? 'RETURN TO HANGAR?' : 'QUIT MISSION?'}
              </span>
            </div>
            <p className="text-amber-200/80 text-sm mb-4">
              {showConfirm === 'hangar' 
                ? 'Your wave progress will be saved. You can change aircraft and resume from this wave.'
                : 'All progress will be lost. Are you sure?'
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 font-bold transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={showConfirm === 'hangar' ? confirmHangar : confirmQuit}
                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                  showConfirm === 'hangar'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                CONFIRM
              </button>
            </div>
          </div>
        )}

        {/* Menu Options */}
        {!showConfirm && !showAudioSettings && (
          <div className="space-y-3">
            {/* Resume */}
            <button
              onClick={handleResume}
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white tracking-wider transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5" />
              RESUME
            </button>

            {/* Audio Settings */}
            <button
              onClick={() => setShowAudioSettings(true)}
              className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-slate-300 tracking-wider transition-all flex items-center justify-center gap-3"
            >
              <Volume2 className="w-5 h-5" />
              AUDIO SETTINGS
            </button>

            {/* Hangar - only during beacon phase */}
            {waveState === 'BEACON_ACTIVE' && (
              <button
                onClick={handleHangarClick}
                className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-slate-300 tracking-wider transition-all flex items-center justify-center gap-3"
              >
                <Home className="w-5 h-5" />
                RETURN TO HANGAR
              </button>
            )}

            {/* Quit */}
            <button
              onClick={handleQuitClick}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-red-900/50 border border-slate-700 hover:border-red-500/50 rounded-lg font-bold text-slate-400 hover:text-red-400 tracking-wider transition-all flex items-center justify-center gap-3"
            >
              <X className="w-5 h-5" />
              QUIT MISSION
            </button>
          </div>
        )}

        {/* Audio Settings Panel */}
        {showAudioSettings && (
          <AudioSettingsPanel 
            isVisible={true} 
            onClose={() => setShowAudioSettings(false)} 
            compact 
          />
        )}

        {/* Footer hint - keyboard hint only on desktop */}
        {!isTouchDevice && (
          <div className="mt-4 text-center text-cyan-600/60 text-xs tracking-wider">
            Press ESC to {isOpen ? 'resume' : 'pause'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PauseMenu;

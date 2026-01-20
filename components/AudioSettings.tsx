/**
 * AudioSettings - Phase 13: Audio Settings Panel
 * 
 * Provides volume controls for:
 * - Master volume
 * - Sound effects volume
 * - Music volume
 * - Engine sounds volume
 * - Mute toggle
 */

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Zap, Settings } from 'lucide-react';
import { audioManager, AudioSettings as AudioSettingsType } from '../game/AudioManager';

interface AudioSettingsPanelProps {
  isVisible: boolean;
  onClose?: () => void;
  compact?: boolean;  // For embedding in pause menu
}

const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({
  isVisible,
  onClose,
  compact = false
}) => {
  const [settings, setSettings] = useState<AudioSettingsType>(audioManager.getSettings());

  useEffect(() => {
    // Refresh settings when panel becomes visible
    if (isVisible) {
      setSettings(audioManager.getSettings());
    }
  }, [isVisible]);

  const updateSetting = (key: keyof AudioSettingsType, value: number | boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    audioManager.updateSettings({ [key]: value });
    
    // Play a test sound for volume changes
    if (typeof value === 'number' && key !== 'muted') {
      audioManager.play('button-click');
    }
  };

  const handleMuteToggle = () => {
    const newMuted = !settings.muted;
    updateSetting('muted', newMuted);
  };

  if (!isVisible) return null;

  // Compact version for embedding in pause menu
  if (compact) {
    return (
      <div className="space-y-4 w-full">
        {/* Mute Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-cyan-300 text-sm font-mono">AUDIO</span>
          <button
            onClick={handleMuteToggle}
            className={`p-2 rounded-lg transition-colors ${
              settings.muted 
                ? 'bg-red-500/30 text-red-400' 
                : 'bg-cyan-500/30 text-cyan-400'
            }`}
          >
            {settings.muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Master Volume */}
        <VolumeSlider
          label="Master"
          value={settings.masterVolume}
          onChange={(v) => updateSetting('masterVolume', v)}
          disabled={settings.muted}
          icon={<Volume2 className="w-4 h-4" />}
        />

        {/* SFX Volume */}
        <VolumeSlider
          label="SFX"
          value={settings.sfxVolume}
          onChange={(v) => updateSetting('sfxVolume', v)}
          disabled={settings.muted}
          icon={<Zap className="w-4 h-4" />}
        />

        {/* Music Volume */}
        <VolumeSlider
          label="Music"
          value={settings.musicVolume}
          onChange={(v) => updateSetting('musicVolume', v)}
          disabled={settings.muted}
          icon={<Music className="w-4 h-4" />}
        />
      </div>
    );
  }

  // Full panel version
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-cyan-300 tracking-wide">AUDIO SETTINGS</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-cyan-500 hover:text-cyan-300 text-2xl"
            >
              ×
            </button>
          )}
        </div>

        {/* Mute Toggle */}
        <div className="flex items-center justify-between mb-6 p-3 bg-black/40 rounded-lg">
          <span className="text-cyan-300 font-mono">MASTER MUTE</span>
          <button
            onClick={handleMuteToggle}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              settings.muted 
                ? 'bg-red-500/30 text-red-400 border border-red-500/50' 
                : 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50'
            }`}
          >
            {settings.muted ? (
              <div className="flex items-center gap-2">
                <VolumeX className="w-5 h-5" />
                <span>MUTED</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                <span>ON</span>
              </div>
            )}
          </button>
        </div>

        {/* Volume Sliders */}
        <div className="space-y-5">
          <VolumeSlider
            label="Master Volume"
            value={settings.masterVolume}
            onChange={(v) => updateSetting('masterVolume', v)}
            disabled={settings.muted}
            icon={<Volume2 className="w-5 h-5" />}
            showPercentage
          />

          <VolumeSlider
            label="Sound Effects"
            value={settings.sfxVolume}
            onChange={(v) => updateSetting('sfxVolume', v)}
            disabled={settings.muted}
            icon={<Zap className="w-5 h-5" />}
            showPercentage
          />

          <VolumeSlider
            label="Music"
            value={settings.musicVolume}
            onChange={(v) => updateSetting('musicVolume', v)}
            disabled={settings.muted}
            icon={<Music className="w-5 h-5" />}
            showPercentage
          />

          <VolumeSlider
            label="Engine Sounds"
            value={settings.engineVolume}
            onChange={(v) => updateSetting('engineVolume', v)}
            disabled={settings.muted}
            icon={<Settings className="w-5 h-5" />}
            showPercentage
          />
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 
                       text-cyan-300 font-bold rounded-lg transition-colors
                       border border-cyan-500/30"
          >
            CLOSE
          </button>
        )}
      </div>
    </div>
  );
};

// ============ Volume Slider Component ============

interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  showPercentage?: boolean;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  icon,
  showPercentage = false
}) => {
  const percentage = Math.round(value * 100);

  return (
    <div className={`${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-cyan-400">
          {icon}
          <span className="text-sm font-mono tracking-wide">{label}</span>
        </div>
        {showPercentage && (
          <span className="text-cyan-300 font-mono text-sm">{percentage}%</span>
        )}
      </div>
      
      <div className="relative">
        {/* Track Background */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          {/* Fill */}
          <div 
            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Slider Input */}
        <input
          type="range"
          min="0"
          max="100"
          value={percentage}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        {/* Thumb Indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full 
                     shadow-lg shadow-cyan-500/50 pointer-events-none transition-all"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};

export default AudioSettingsPanel;

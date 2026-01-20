/**
 * AccessibilitySettings - UI panel for accessibility options
 * 
 * Features:
 * - Colorblind mode selection
 * - HUD opacity slider
 * - HUD scale slider
 * - Screen shake toggle
 * - Flash effects toggle
 */

import React, { useState, useEffect } from 'react';
import { 
  accessibilityManager, 
  ColorblindMode, 
  AccessibilitySettings as Settings 
} from '../game/AccessibilityManager';
import { Eye, Palette, Move, Zap, RotateCcw } from 'lucide-react';

interface AccessibilitySettingsProps {
  onClose?: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<Settings>(accessibilityManager.getSettings());
  
  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent) => {
      setSettings(e.detail);
    };
    
    window.addEventListener('accessibility-settings-change', handleSettingsChange as EventListener);
    return () => window.removeEventListener('accessibility-settings-change', handleSettingsChange as EventListener);
  }, []);
  
  const colorblindOptions: { value: ColorblindMode; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'protanopia', label: 'Protanopia (Red-Blind)' },
    { value: 'deuteranopia', label: 'Deuteranopia (Green-Blind)' },
    { value: 'tritanopia', label: 'Tritanopia (Blue-Blind)' },
  ];
  
  const handleColorblindChange = (mode: ColorblindMode) => {
    accessibilityManager.setColorblindMode(mode);
  };
  
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    accessibilityManager.setHudOpacity(parseFloat(e.target.value));
  };
  
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    accessibilityManager.setHudScale(parseFloat(e.target.value));
  };
  
  const handleScreenShakeToggle = () => {
    accessibilityManager.setScreenShakeEnabled(!settings.screenShakeEnabled);
  };
  
  const handleFlashEffectsToggle = () => {
    accessibilityManager.setFlashEffectsEnabled(!settings.flashEffectsEnabled);
  };
  
  const handleReducedMotionToggle = () => {
    accessibilityManager.setReducedMotion(!settings.reducedMotion);
  };
  
  const handleReset = () => {
    accessibilityManager.resetToDefaults();
  };
  
  return (
    <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-6 max-w-md w-full border border-cyan-500/30">
      <h2 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
        <Eye size={24} />
        Accessibility Settings
      </h2>
      
      {/* Colorblind Mode */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
          <Palette size={16} />
          Colorblind Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {colorblindOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleColorblindChange(option.value)}
              className={`px-3 py-2 rounded text-sm transition-all ${
                settings.colorblindMode === option.value
                  ? 'bg-cyan-500 text-black font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* HUD Opacity Slider */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          HUD Opacity: {Math.round(settings.hudOpacity * 100)}%
        </label>
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.05"
          value={settings.hudOpacity}
          onChange={handleOpacityChange}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>
      
      {/* HUD Scale Slider */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          HUD Scale: {Math.round(settings.hudScale * 100)}%
        </label>
        <input
          type="range"
          min="0.8"
          max="1.5"
          step="0.05"
          value={settings.hudScale}
          onChange={handleScaleChange}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>
      
      {/* Toggle Options */}
      <div className="space-y-3 mb-6">
        {/* Screen Shake */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-slate-300">
            <Move size={16} />
            Screen Shake
          </span>
          <button
            onClick={handleScreenShakeToggle}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.screenShakeEnabled ? 'bg-cyan-500' : 'bg-slate-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                settings.screenShakeEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
        
        {/* Flash Effects */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-slate-300">
            <Zap size={16} />
            Flash Effects
          </span>
          <button
            onClick={handleFlashEffectsToggle}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.flashEffectsEnabled ? 'bg-cyan-500' : 'bg-slate-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                settings.flashEffectsEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
        
        {/* Reduced Motion */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-slate-300">
            <Move size={16} className="opacity-50" />
            Reduced Motion
          </span>
          <button
            onClick={handleReducedMotionToggle}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.reducedMotion ? 'bg-cyan-500' : 'bg-slate-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                settings.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>
      
      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="w-full py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw size={16} />
        Reset to Defaults
      </button>
      
      {/* Close button if provided */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 px-4 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors"
        >
          Done
        </button>
      )}
    </div>
  );
};

export default AccessibilitySettings;

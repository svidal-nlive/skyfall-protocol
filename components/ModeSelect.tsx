/**
 * ModeSelect - Game mode selection screen
 * 
 * Phase 16: Endless Mode
 * - Campaign mode (15 waves, story progression)
 * - Endless mode (infinite waves, unlock after campaign)
 * - Shows best scores and unlock status
 */

import React from 'react';
import { Play, Infinity, Lock, Trophy, Target, Skull, Clock } from 'lucide-react';
import { ProgressManager } from '../game/ProgressManager';
import { endlessModeManager } from '../game/EndlessModeManager';

interface ModeSelectProps {
  onSelectCampaign: () => void;
  onSelectEndless: () => void;
  onBack: () => void;
}

const ModeSelect: React.FC<ModeSelectProps> = ({ 
  onSelectCampaign, 
  onSelectEndless, 
  onBack 
}) => {
  const endlessUnlocked = ProgressManager.isEndlessUnlocked();
  const campaignComplete = ProgressManager.isCampaignComplete();
  const highestWave = ProgressManager.getHighestWave();
  const highScore = ProgressManager.getHighScore();
  const endlessBestWave = ProgressManager.getEndlessBestWave();
  const endlessBestScore = ProgressManager.getEndlessBestScore();
  const endlessRuns = ProgressManager.getEndlessTotalRuns();
  
  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div className="max-w-4xl w-full mx-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
            SELECT MODE
          </h1>
          <p className="text-cyan-300/60 tracking-wider text-sm mt-2">
            Choose your mission
          </p>
        </div>
        
        {/* Mode Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Campaign Mode */}
          <button
            onClick={onSelectCampaign}
            className="group relative bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,211,238,0.3)]"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  CAMPAIGN
                  {campaignComplete && (
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  )}
                </h2>
                <p className="text-cyan-300/70 text-sm mb-4">
                  15 waves across 3 acts. Fight through the Skyfall Protocol.
                </p>
                
                {/* Campaign Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/30 flex items-center justify-center text-xs">✓</span>
                    <span>Story-driven progression</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/30 flex items-center justify-center text-xs">✓</span>
                    <span>3 Boss encounters</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/30 flex items-center justify-center text-xs">✓</span>
                    <span>Unlock aircraft & upgrades</span>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Highest Wave</span>
                    <span className="text-cyan-400 font-bold">{highestWave}/15</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-500">High Score</span>
                    <span className="text-cyan-400 font-bold">{highScore.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Play indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-8 h-8 text-cyan-400" />
            </div>
          </button>
          
          {/* Endless Mode */}
          <button
            onClick={endlessUnlocked ? onSelectEndless : undefined}
            disabled={!endlessUnlocked}
            className={`group relative bg-gradient-to-br rounded-xl p-6 text-left transition-all duration-300 ${
              endlessUnlocked
                ? 'from-purple-900/80 to-slate-900 border-2 border-purple-500/40 hover:border-purple-400 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]'
                : 'from-slate-900/50 to-slate-800/50 border-2 border-slate-700/50 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
                endlessUnlocked ? 'bg-purple-500/20' : 'bg-slate-700/30'
              }`}>
                {endlessUnlocked ? (
                  <Infinity className="w-8 h-8 text-purple-400" />
                ) : (
                  <Lock className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold mb-1 flex items-center gap-2 ${
                  endlessUnlocked ? 'text-white' : 'text-slate-500'
                }`}>
                  ENDLESS
                  {endlessRuns > 0 && (
                    <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded-full text-purple-300">
                      {endlessRuns} runs
                    </span>
                  )}
                </h2>
                <p className={`text-sm mb-4 ${
                  endlessUnlocked ? 'text-purple-300/70' : 'text-slate-500'
                }`}>
                  {endlessUnlocked 
                    ? 'Infinite waves with scaling difficulty. How far can you go?'
                    : 'Complete the campaign to unlock Endless Mode'
                  }
                </p>
                
                {/* Endless Features */}
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${endlessUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Infinity className="w-4 h-4" />
                    <span>Infinite waves</span>
                  </div>
                  <div className={`flex items-center gap-2 ${endlessUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Skull className="w-4 h-4" />
                    <span>Boss every 5 waves</span>
                  </div>
                  <div className={`flex items-center gap-2 ${endlessUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Trophy className="w-4 h-4" />
                    <span>Leaderboard tracking</span>
                  </div>
                </div>
                
                {/* Endless Stats (if unlocked) */}
                {endlessUnlocked && (
                  <div className="mt-4 pt-4 border-t border-purple-700/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Best Wave</span>
                      <span className="text-purple-400 font-bold">
                        {endlessBestWave > 0 ? `Wave ${endlessBestWave}` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-slate-500">Best Score</span>
                      <span className="text-purple-400 font-bold">
                        {endlessBestScore > 0 ? endlessBestScore.toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Unlock Progress */}
                {!endlessUnlocked && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Lock className="w-3 h-3" />
                      <span>Complete Campaign Wave 15 to unlock</span>
                    </div>
                    <div className="mt-2 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                        style={{ width: `${Math.min(100, (highestWave / 15) * 100)}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-slate-600 mt-1">
                      {Math.round((highestWave / 15) * 100)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Play indicator */}
            {endlessUnlocked && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-purple-400" />
              </div>
            )}
          </button>
        </div>
        
        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={onBack}
            className="px-8 py-2 text-cyan-400/70 hover:text-cyan-300 transition-colors text-sm tracking-wider"
          >
            ← BACK TO MENU
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-8 flex justify-center gap-8 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Total Flights: {ProgressManager.getProgress().totalSessions}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Total Kills: {ProgressManager.getProgress().totalKills}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>Career Points: {ProgressManager.getCareerPoints().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelect;


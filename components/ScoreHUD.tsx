import React, { useEffect, useState } from 'react';
import type { ScoreState, KillData } from '../game/ScoreManager';

const ScoreHUD: React.FC = () => {
  const [scoreState, setScoreState] = useState<ScoreState>({
    score: 0,
    combo: 0,
    comboTimer: 0,
    kills: 0,
    killStreak: 0,
    highScore: 0,
    recentKill: null,
    killStats: { phantom: 0, viper: 0, warden: 0, specter: 0 },
  });

  useEffect(() => {
    const handleScoreUpdate = (e: CustomEvent) => {
      setScoreState(e.detail);
    };

    window.addEventListener('score-update', handleScoreUpdate as EventListener);
    return () => {
      window.removeEventListener('score-update', handleScoreUpdate as EventListener);
    };
  }, []);

  const { score, combo, comboTimer, kills, killStreak, highScore, recentKill } = scoreState;
  const comboActive = combo > 0 && comboTimer > 0;

  return (
    <>
      {/* Score Display - Top Center */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none z-20">
        {/* Main Score */}
        <div className="bg-black/60 border border-cyan-500/50 rounded px-4 py-2 backdrop-blur-sm">
          <div className="text-4xl font-bold text-cyan-400 tabular-nums tracking-wider">
            {score.toLocaleString()}
          </div>
          <div className="text-xs text-cyan-600 text-center uppercase tracking-widest">
            Score
          </div>
        </div>

        {/* Combo Indicator */}
        {comboActive && (
          <div 
            className="bg-orange-500/80 border border-orange-400 rounded px-3 py-1 animate-pulse"
            style={{
              animation: combo >= 5 ? 'pulse 0.3s ease-in-out infinite' : 'pulse 0.5s ease-in-out infinite'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">
                {combo}x
              </span>
              <span className="text-sm text-orange-100 uppercase font-bold">
                Combo!
              </span>
            </div>
            {/* Combo Timer Bar */}
            <div className="w-full h-1 bg-orange-900 rounded mt-1">
              <div 
                className="h-full bg-orange-300 rounded transition-all duration-100"
                style={{ width: `${(comboTimer / 3.0) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Kill Confirmation - Center Screen */}
      {recentKill && (
        <KillConfirmation kill={recentKill} />
      )}

      {/* Stats - Top Right */}
      <div className="fixed top-4 right-4 flex flex-col gap-1 pointer-events-none z-20">
        {/* High Score */}
        <div className="bg-black/40 border border-purple-500/30 rounded px-3 py-1 text-right">
          <div className="text-xs text-purple-400 uppercase">Best</div>
          <div className="text-lg font-bold text-purple-300 tabular-nums">
            {highScore.toLocaleString()}
          </div>
        </div>
        
        {/* Kill Count */}
        <div className="bg-black/40 border border-red-500/30 rounded px-3 py-1 text-right">
          <div className="text-xs text-red-400 uppercase">Kills</div>
          <div className="text-lg font-bold text-red-300 tabular-nums">
            {kills}
          </div>
        </div>
      </div>
    </>
  );
};

// Kill Confirmation Component
const KillConfirmation: React.FC<{ kill: KillData }> = ({ kill }) => {
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(0.5);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => {
      setScale(1);
    });

    // Animate out
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
      setTranslateY(-20);
    }, 1500);

    return () => clearTimeout(fadeTimer);
  }, [kill.timestamp]);

  const isMultiKill = kill.combo >= 3;
  const isMegaKill = kill.combo >= 5;

  return (
    <div 
      className="fixed top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-30 transition-all duration-300"
      style={{
        opacity,
        transform: `translateX(-50%) translateY(${translateY}px) scale(${scale})`,
      }}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Kill Type */}
        {isMegaKill && (
          <div className="text-2xl font-black text-red-500 animate-bounce uppercase tracking-widest">
            🔥 MEGA KILL 🔥
          </div>
        )}
        {isMultiKill && !isMegaKill && (
          <div className="text-xl font-bold text-orange-400 uppercase tracking-wider">
            Multi Kill!
          </div>
        )}
        
        {/* Enemy Name */}
        <div className="text-sm text-gray-300 uppercase tracking-wider">
          {kill.enemyName || 'Enemy'} Destroyed
        </div>
        
        {/* Points */}
        <div 
          className={`text-3xl font-black ${
            isMegaKill ? 'text-red-400' : 
            isMultiKill ? 'text-orange-300' : 
            'text-green-400'
          }`}
          style={{
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor'
          }}
        >
          +{kill.points}
        </div>
        
        {/* Combo indicator */}
        {kill.combo > 1 && (
          <div className="text-sm text-yellow-400 font-bold">
            {kill.combo}x COMBO
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreHUD;

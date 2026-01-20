import React, { useState, useEffect } from 'react';

interface BossHealthState {
  name: string;
  title: string;
  health: number;
  maxHealth: number;
  currentPhase: number;
  totalPhases: number;
  phaseName?: string;
}

interface WeakPointState {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  destroyed: boolean;
}

const BossHUD: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [bossState, setBossState] = useState<BossHealthState | null>(null);
  const [weakPoints, setWeakPoints] = useState<WeakPointState[]>([]);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [phaseMessage, setPhaseMessage] = useState('');
  const [damageFlash, setDamageFlash] = useState(false);

  useEffect(() => {
    const handleBossSpawned = (e: CustomEvent) => {
      const { name, title, health, maxHealth, phases, currentPhase } = e.detail;
      setBossState({
        name,
        title,
        health,
        maxHealth,
        currentPhase,
        totalPhases: phases,
      });
      setIsVisible(true);
      setWeakPoints([]);
    };

    const handleBossHealthUpdate = (e: CustomEvent) => {
      const { health, maxHealth, currentPhase } = e.detail;
      setBossState(prev => prev ? {
        ...prev,
        health,
        maxHealth,
        currentPhase,
      } : null);
      
      // Flash on damage
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 100);
    };

    const handlePhaseChange = (e: CustomEvent) => {
      const { phase, phaseName, description } = e.detail;
      setBossState(prev => prev ? {
        ...prev,
        currentPhase: phase,
        phaseName,
      } : null);
      
      // Show phase transition message
      setPhaseMessage(`${phaseName}\n${description}`);
      setShowPhaseTransition(true);
      setTimeout(() => setShowPhaseTransition(false), 3000);
    };

    const handleWeakPointHit = (e: CustomEvent) => {
      const { weakPointId, weakPointName, remainingHealth, destroyed } = e.detail;
      
      setWeakPoints(prev => {
        const existing = prev.find(wp => wp.id === weakPointId);
        if (existing) {
          return prev.map(wp => wp.id === weakPointId ? {
            ...wp,
            health: remainingHealth,
            destroyed,
          } : wp);
        } else {
          return [...prev, {
            id: weakPointId,
            name: weakPointName,
            health: remainingHealth,
            maxHealth: remainingHealth + 100, // Approximate
            destroyed,
          }];
        }
      });
    };

    const handleBossDefeated = () => {
      setTimeout(() => {
        setIsVisible(false);
        setBossState(null);
        setWeakPoints([]);
      }, 3000);
    };

    window.addEventListener('boss-spawned', handleBossSpawned as EventListener);
    window.addEventListener('boss-health-update', handleBossHealthUpdate as EventListener);
    window.addEventListener('boss-phase-change', handlePhaseChange as EventListener);
    window.addEventListener('boss-weakpoint-hit', handleWeakPointHit as EventListener);
    window.addEventListener('boss-defeated', handleBossDefeated as EventListener);

    return () => {
      window.removeEventListener('boss-spawned', handleBossSpawned as EventListener);
      window.removeEventListener('boss-health-update', handleBossHealthUpdate as EventListener);
      window.removeEventListener('boss-phase-change', handlePhaseChange as EventListener);
      window.removeEventListener('boss-weakpoint-hit', handleWeakPointHit as EventListener);
      window.removeEventListener('boss-defeated', handleBossDefeated as EventListener);
    };
  }, []);

  if (!isVisible || !bossState) return null;

  const healthPercent = (bossState.health / bossState.maxHealth) * 100;
  const healthColor = healthPercent > 50 ? '#ff4444' : healthPercent > 25 ? '#ff8800' : '#ff0044';

  return (
    <>
      {/* Boss Health Bar - Top Center */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          maxWidth: '600px',
          zIndex: 100,
          fontFamily: '"Orbitron", "Rajdhani", monospace',
        }}
      >
        {/* Boss Name & Title */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 8,
        }}>
          <div>
            <div style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#ff4444',
              textShadow: '0 0 20px rgba(255, 68, 68, 0.8)',
              letterSpacing: 4,
            }}>
              ⚠ {bossState.name}
            </div>
            <div style={{
              fontSize: 12,
              color: '#ff8888',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              {bossState.title}
            </div>
          </div>
          <div style={{
            fontSize: 14,
            color: '#888',
          }}>
            PHASE {bossState.currentPhase}/{bossState.totalPhases}
          </div>
        </div>

        {/* Health Bar Container */}
        <div style={{
          position: 'relative',
          height: 30,
          background: 'rgba(0, 0, 0, 0.7)',
          border: `2px solid ${damageFlash ? '#ffffff' : healthColor}`,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: `0 0 20px ${healthColor}40`,
        }}>
          {/* Health Fill */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${healthPercent}%`,
            background: `linear-gradient(180deg, ${healthColor} 0%, ${healthColor}88 100%)`,
            transition: 'width 0.3s ease',
            boxShadow: `inset 0 0 10px rgba(255, 255, 255, 0.3)`,
          }} />

          {/* Phase Markers */}
          {bossState.totalPhases > 1 && (
            <>
              {[...Array(bossState.totalPhases - 1)].map((_, i) => {
                const threshold = 100 - ((i + 1) * (100 / bossState.totalPhases));
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${threshold}%`,
                      width: 2,
                      height: '100%',
                      background: 'rgba(255, 255, 255, 0.5)',
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Health Text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 14,
            fontWeight: 'bold',
            color: '#ffffff',
            textShadow: '0 0 5px rgba(0, 0, 0, 1)',
          }}>
            {Math.floor(bossState.health)} / {bossState.maxHealth}
          </div>
        </div>

        {/* Weak Points Display */}
        {weakPoints.length > 0 && (
          <div style={{
            marginTop: 10,
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {weakPoints.map(wp => (
              <div
                key={wp.id}
                style={{
                  padding: '4px 12px',
                  background: wp.destroyed ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                  border: `1px solid ${wp.destroyed ? '#00ff00' : '#ff0000'}`,
                  borderRadius: 4,
                  fontSize: 11,
                  color: wp.destroyed ? '#00ff00' : '#ff6666',
                }}
              >
                {wp.name}: {wp.destroyed ? '✓ DESTROYED' : `${Math.floor(wp.health)} HP`}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase Transition Overlay */}
      {showPhaseTransition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 150,
          pointerEvents: 'none',
        }}>
          <div style={{
            textAlign: 'center',
            animation: 'phaseIn 0.5s ease',
          }}>
            <div style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#ff4444',
              textShadow: '0 0 30px rgba(255, 68, 68, 0.8)',
              letterSpacing: 4,
              marginBottom: 10,
            }}>
              ⚠ PHASE TRANSITION ⚠
            </div>
            <div style={{
              fontSize: 18,
              color: '#ffffff',
              whiteSpace: 'pre-line',
            }}>
              {phaseMessage}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes phaseIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default BossHUD;

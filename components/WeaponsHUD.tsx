import React, { useEffect, useState } from 'react';

interface MissileSlot {
  isReady: boolean;
  cooldownTimer: number;
  cooldownDuration: number;
}

interface MissileInfo {
  readyCount: number;
  maxMissiles: number;
  slots: MissileSlot[];
  activeMissiles: number;
}

interface CannonInfo {
  isFiring: boolean;
  activeProjectiles: number;
  muzzleFlash: number;
}

interface WeaponsState {
  missiles: MissileInfo;
  cannon: CannonInfo;
}

/**
 * WeaponsHUD - Displays weapon system status
 * Shows missile slots, reload progress, cannon status
 */
export const WeaponsHUD: React.FC = () => {
  const [weaponsState, setWeaponsState] = useState<WeaponsState | null>(null);

  useEffect(() => {
    const handleWeaponsUpdate = (e: CustomEvent) => {
      setWeaponsState(e.detail);
    };

    window.addEventListener('weapons-update', handleWeaponsUpdate as EventListener);
    return () => {
      window.removeEventListener('weapons-update', handleWeaponsUpdate as EventListener);
    };
  }, []);

  if (!weaponsState) return null;

  const { missiles, cannon } = weaponsState;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
      {/* Missile Status */}
      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-cyan-400/30 mb-3">
        <div className="text-cyan-400 text-xs font-mono mb-2 uppercase tracking-wider flex items-center gap-2">
          <span>🚀</span>
          <span>MISSILES</span>
          <span className="ml-auto text-sm font-bold">
            {missiles.readyCount}/{missiles.maxMissiles}
          </span>
        </div>
        
        {/* Missile slot indicators */}
        <div className="flex gap-1">
          {missiles.slots.map((slot, index) => (
            <MissileSlotIndicator key={index} slot={slot} index={index} />
          ))}
        </div>

        {/* Active missiles in flight */}
        {missiles.activeMissiles > 0 && (
          <div className="text-xs text-orange-400 font-mono mt-2">
            {missiles.activeMissiles} IN FLIGHT
          </div>
        )}

        {/* Fire instruction */}
        <div className="text-xs text-gray-500 font-mono mt-2">
          [SPACE] Fire
        </div>
      </div>

      {/* Cannon Status */}
      <div className={`bg-black/30 backdrop-blur-sm rounded-lg p-3 border transition-colors ${
        cannon.isFiring ? 'border-cyan-400' : 'border-cyan-400/30'
      }`}>
        <div className="text-cyan-400 text-xs font-mono mb-2 uppercase tracking-wider flex items-center gap-2">
          <span className={cannon.isFiring ? 'animate-pulse' : ''}>⚡</span>
          <span>CANNON</span>
          <span className={`ml-auto text-sm font-bold ${cannon.isFiring ? 'text-green-400' : ''}`}>
            {cannon.isFiring ? 'FIRING' : 'READY'}
          </span>
        </div>

        {/* Cannon heat/activity bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-75 ${
              cannon.isFiring 
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse' 
                : 'bg-cyan-600'
            }`}
            style={{ 
              width: cannon.isFiring ? '100%' : '0%',
            }}
          />
        </div>

        {/* Muzzle flash indicator */}
        {cannon.muzzleFlash > 0 && (
          <div 
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              boxShadow: `inset 0 0 20px rgba(0, 255, 255, ${cannon.muzzleFlash * 0.3})`,
            }}
          />
        )}

        {/* Fire instruction */}
        <div className="text-xs text-gray-500 font-mono mt-2">
          [F] Hold to Fire
        </div>
      </div>
    </div>
  );
};

interface MissileSlotIndicatorProps {
  slot: MissileSlot;
  index: number;
}

const MissileSlotIndicator: React.FC<MissileSlotIndicatorProps> = ({ slot, index }) => {
  const progress = slot.isReady 
    ? 100 
    : ((slot.cooldownDuration - slot.cooldownTimer) / slot.cooldownDuration) * 100;

  return (
    <div 
      className={`relative w-6 h-8 rounded-sm border-2 transition-colors ${
        slot.isReady 
          ? 'border-green-400 bg-green-400/20' 
          : 'border-gray-600 bg-gray-800'
      }`}
      title={slot.isReady ? 'Ready' : `Reloading: ${slot.cooldownTimer.toFixed(1)}s`}
    >
      {/* Reload progress fill */}
      {!slot.isReady && (
        <div 
          className="absolute bottom-0 left-0 right-0 bg-yellow-400/50 transition-all duration-100"
          style={{ height: `${progress}%` }}
        />
      )}

      {/* Missile icon when ready */}
      {slot.isReady && (
        <div className="absolute inset-0 flex items-center justify-center text-green-400 text-xs">
          ▲
        </div>
      )}

      {/* Slot number */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] text-gray-500">
        {index + 1}
      </div>
    </div>
  );
};

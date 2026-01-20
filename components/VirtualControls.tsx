import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useIsTouchDevice } from '../hooks/useDeviceDetection';
import { Crosshair, Rocket, Pause, ChevronUp, ChevronDown } from 'lucide-react';

interface VirtualControlsProps {
  onStickMove?: (roll: number, pitch: number) => void;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({ onStickMove }) => {
  const isTouchDevice = useIsTouchDevice();
  const stickRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  
  // Button states
  const [isFiringPrimary, setIsFiringPrimary] = useState(false);
  const [isFiringSecondary, setIsFiringSecondary] = useState(false);
  const [isThrottleUp, setIsThrottleUp] = useState(false);
  const [isThrottleDown, setIsThrottleDown] = useState(false);

  // Don't render on non-touch devices
  if (!isTouchDevice) {
    return null;
  }

  // Joystick handlers
  const handleStart = useCallback((clientX: number, clientY: number, touchId?: number) => {
    if (!stickRef.current) return;
    
    const rect = stickRef.current.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    if (touchId !== undefined) {
      touchIdRef.current = touchId;
    }
    
    setIsActive(true);
    handleMove(clientX, clientY);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isActive && touchIdRef.current === null) return;
    
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    
    const maxDist = 40;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
    const angle = Math.atan2(dy, dx);
    
    const normalizedX = (dist / maxDist) * Math.cos(angle);
    const normalizedY = (dist / maxDist) * Math.sin(angle);
    
    setStickPos({ x: normalizedX * maxDist, y: normalizedY * maxDist });
    
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: {
        type: 'stick',
        roll: -normalizedX,
        pitch: -normalizedY
      }
    }));
    
    onStickMove?.(-normalizedX, -normalizedY);
  }, [isActive, onStickMove]);

  const handleEnd = useCallback(() => {
    setIsActive(false);
    touchIdRef.current = null;
    setStickPos({ x: 0, y: 0 });
    
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: { type: 'stick', roll: 0, pitch: 0 }
    }));
    
    onStickMove?.(0, 0);
  }, [onStickMove]);

  // Fire Primary (Cannon)
  const handleFirePrimaryStart = useCallback(() => {
    setIsFiringPrimary(true);
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: { type: 'fire-primary', pressed: true }
    }));
  }, []);

  const handleFirePrimaryEnd = useCallback(() => {
    setIsFiringPrimary(false);
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: { type: 'fire-primary', pressed: false }
    }));
  }, []);

  // Fire Secondary (Missiles)
  const handleFireSecondaryStart = useCallback(() => {
    setIsFiringSecondary(true);
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: { type: 'fire-secondary', pressed: true }
    }));
  }, []);

  const handleFireSecondaryEnd = useCallback(() => {
    setIsFiringSecondary(false);
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: { type: 'fire-secondary', pressed: false }
    }));
  }, []);

  // Throttle Up (Afterburner)
  const handleThrottleUpStart = useCallback(() => {
    setIsThrottleUp(true);
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: { type: 'throttle-up', pressed: true }
    }));
  }, []);

  const handleThrottleUpEnd = useCallback(() => {
    setIsThrottleUp(false);
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: { type: 'throttle-up', pressed: false }
    }));
  }, []);

  // Throttle Down (Brake)
  const handleThrottleDownStart = useCallback(() => {
    setIsThrottleDown(true);
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: { type: 'throttle-down', pressed: true }
    }));
  }, []);

  const handleThrottleDownEnd = useCallback(() => {
    setIsThrottleDown(false);
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: { type: 'throttle-down', pressed: false }
    }));
  }, []);

  // Pause
  const handlePause = useCallback(() => {
    window.dispatchEvent(new CustomEvent('game-input', {
      detail: { type: 'pause' }
    }));
  }, []);

  // Touch events for joystick
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, touch.identifier);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchIdRef.current) {
        handleMove(e.touches[i].clientX, e.touches[i].clientY);
        break;
      }
    }
  };

  // Global touch end
  useEffect(() => {
    const onTouchEnd = (e: TouchEvent) => {
      // Check if it's the joystick touch
      let joystickTouchEnded = true;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === touchIdRef.current) {
          joystickTouchEnded = false;
          break;
        }
      }
      if (joystickTouchEnded && touchIdRef.current !== null) {
        handleEnd();
      }
    };

    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    
    return () => {
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleEnd]);

  // Button component for consistent styling
  const ControlButton: React.FC<{
    onStart: () => void;
    onEnd: () => void;
    isPressed: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: 'cyan' | 'orange' | 'red' | 'gray';
    children: React.ReactNode;
    label?: string;
  }> = ({ onStart, onEnd, isPressed, size = 'md', color = 'cyan', children, label }) => {
    const sizeClasses = {
      sm: 'w-12 h-12',
      md: 'w-16 h-16',
      lg: 'w-20 h-20',
    };
    
    const colorClasses = {
      cyan: isPressed 
        ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)]' 
        : 'bg-cyan-900/40 border-cyan-500/50',
      orange: isPressed 
        ? 'bg-orange-400 border-orange-300 shadow-[0_0_20px_rgba(251,146,60,0.8)]' 
        : 'bg-orange-900/40 border-orange-500/50',
      red: isPressed 
        ? 'bg-red-400 border-red-300 shadow-[0_0_20px_rgba(248,113,113,0.8)]' 
        : 'bg-red-900/40 border-red-500/50',
      gray: isPressed 
        ? 'bg-slate-400 border-slate-300' 
        : 'bg-slate-900/40 border-slate-500/50',
    };
    
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full border-2 backdrop-blur-sm flex items-center justify-center transition-all duration-100 active:scale-95`}
          onTouchStart={(e) => { e.preventDefault(); onStart(); }}
          onTouchEnd={(e) => { e.preventDefault(); onEnd(); }}
          onTouchCancel={(e) => { e.preventDefault(); onEnd(); }}
          style={{ touchAction: 'none' }}
        >
          {children}
        </button>
        {label && (
          <span className={`text-[10px] font-mono tracking-wider ${isPressed ? 'text-white' : 'text-white/50'}`}>
            {label}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Left side - Joystick */}
      <div className="fixed bottom-8 left-4 z-50 pointer-events-auto">
        {/* Joystick Base */}
        <div
          ref={stickRef}
          className="w-28 h-28 rounded-full bg-cyan-900/30 border-2 border-cyan-500/50 backdrop-blur-sm flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{ touchAction: 'none' }}
        >
          {/* Joystick Knob */}
          <div
            className={`w-12 h-12 rounded-full transition-colors duration-100 ${
              isActive 
                ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]' 
                : 'bg-cyan-600/80'
            }`}
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
            }}
          />
        </div>
        
        {/* Label */}
        <div className="text-center mt-1 text-cyan-400/50 text-[10px] font-mono tracking-wider">
          FLIGHT
        </div>
      </div>

      {/* Right side - Fire buttons */}
      <div className="fixed bottom-8 right-4 z-50 pointer-events-auto flex flex-col items-end gap-3">
        {/* Primary & Secondary fire in a row */}
        <div className="flex gap-3">
          {/* Fire Secondary (Missiles) - Left */}
          <ControlButton
            onStart={handleFireSecondaryStart}
            onEnd={handleFireSecondaryEnd}
            isPressed={isFiringSecondary}
            size="md"
            color="orange"
            label="MISSILE"
          >
            <Rocket className="w-6 h-6 text-white" />
          </ControlButton>
          
          {/* Fire Primary (Cannon) - Right, larger */}
          <ControlButton
            onStart={handleFirePrimaryStart}
            onEnd={handleFirePrimaryEnd}
            isPressed={isFiringPrimary}
            size="lg"
            color="red"
            label="FIRE"
          >
            <Crosshair className="w-8 h-8 text-white" />
          </ControlButton>
        </div>
      </div>

      {/* Left side - Throttle controls (above joystick) */}
      <div className="fixed bottom-44 left-4 z-50 pointer-events-auto flex flex-col gap-2">
        {/* Throttle Up */}
        <ControlButton
          onStart={handleThrottleUpStart}
          onEnd={handleThrottleUpEnd}
          isPressed={isThrottleUp}
          size="sm"
          color="cyan"
          label="BOOST"
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </ControlButton>
        
        {/* Throttle Down */}
        <ControlButton
          onStart={handleThrottleDownStart}
          onEnd={handleThrottleDownEnd}
          isPressed={isThrottleDown}
          size="sm"
          color="gray"
          label="BRAKE"
        >
          <ChevronDown className="w-6 h-6 text-white" />
        </ControlButton>
      </div>

      {/* Top right - Pause button */}
      <div className="fixed top-4 right-4 z-50 pointer-events-auto">
        <button
          className="w-10 h-10 rounded-lg bg-slate-900/60 border border-slate-500/50 backdrop-blur-sm flex items-center justify-center active:bg-slate-700/60"
          onTouchStart={(e) => { e.preventDefault(); handlePause(); }}
          style={{ touchAction: 'none' }}
        >
          <Pause className="w-5 h-5 text-white/70" />
        </button>
      </div>
    </>
  );
};

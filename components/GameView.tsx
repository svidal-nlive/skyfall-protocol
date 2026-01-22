import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { ProgressManager } from '../game/ProgressManager';

export const GameView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (!engineRef.current) {
      engineRef.current = new GameEngine(canvasRef.current);
      engineRef.current.start();
    }

    // Set up keyboard shortcut for wave clear (Ctrl+K in dev mode)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // Only allow wave clear when dev mode is enabled
        if (engineRef.current && ProgressManager.isDevMode()) {
          engineRef.current.clearCurrentWave();
        }
      }
    };

    // Listen for dev-clear-wave event (from button click)
    const handleDevClearWave = () => {
      if (engineRef.current) {
        engineRef.current.clearCurrentWave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dev-clear-wave', handleDevClearWave);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dev-clear-wave', handleDevClearWave);
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full outline-none"
      tabIndex={0}
      style={{ touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

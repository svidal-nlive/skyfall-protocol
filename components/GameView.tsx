import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';

export const GameView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (!engineRef.current) {
      engineRef.current = new GameEngine(canvasRef.current);
      engineRef.current.start();
    }

    return () => {
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

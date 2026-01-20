import React, { useEffect, useState, useRef } from 'react';

interface RadarBlip {
  id: string;
  x: number;           // Relative X position (-1 to 1)
  z: number;           // Relative Z position (-1 to 1)
  type: 'enemy' | 'poi' | 'beacon';
  state?: 'patrol' | 'engagement' | 'retreat' | 'destroyed';
  threatLevel?: number;
  isActive?: boolean;
}

interface BeaconRadarData {
  x: number;
  z: number;
  active: boolean;
}

interface RadarState {
  blips: RadarBlip[];
  playerHeading: number;  // Radians
  radarRange: number;     // Units
  beacon?: BeaconRadarData;
}

const RadarHUD: React.FC = () => {
  const [radarState, setRadarState] = useState<RadarState>({
    blips: [],
    playerHeading: 0,
    radarRange: 300,
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const handleRadarUpdate = (e: CustomEvent) => {
      setRadarState(e.detail);
    };

    window.addEventListener('radar-update', handleRadarUpdate as EventListener);
    return () => {
      window.removeEventListener('radar-update', handleRadarUpdate as EventListener);
    };
  }, []);

  // Canvas-based radar for smooth rotation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = (size / 2) - 8;

    const draw = () => {
      // Clear
      ctx.clearRect(0, 0, size, size);

      // Save context for rotation
      ctx.save();
      ctx.translate(center, center);
      
      // Rotate radar with player heading (radar rotates, not blips)
      // This keeps "forward" always at the top
      ctx.rotate(-radarState.playerHeading);

      // Draw background
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw range rings
      const rings = [0.33, 0.66, 1.0];
      rings.forEach(ring => {
        ctx.beginPath();
        ctx.arc(0, 0, radius * ring, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw cardinal lines
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      
      // Vertical line (forward/back)
      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.lineTo(0, radius);
      ctx.stroke();
      
      // Horizontal line (left/right)
      ctx.beginPath();
      ctx.moveTo(-radius, 0);
      ctx.lineTo(radius, 0);
      ctx.stroke();

      // Draw blips
      radarState.blips.forEach((blip: RadarBlip) => {
        const blipX = blip.x * radius;
        const blipZ = blip.z * radius;

        if (blip.type === 'beacon') {
          // Beacon - pulsing diamond with glow
          const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
          const blipSize = 6 + pulse * 2;
          
          ctx.save();
          ctx.translate(blipX, blipZ);
          ctx.rotate(Math.PI / 4); // Diamond shape
          
          // Outer glow
          ctx.beginPath();
          ctx.rect(-blipSize - 2, -blipSize - 2, (blipSize + 2) * 2, (blipSize + 2) * 2);
          ctx.fillStyle = `rgba(0, 255, 255, ${0.1 + pulse * 0.15})`;
          ctx.fill();
          
          // Main diamond
          ctx.beginPath();
          ctx.rect(-blipSize / 2, -blipSize / 2, blipSize, blipSize);
          ctx.fillStyle = `rgba(0, 255, 255, ${0.6 + pulse * 0.4})`;
          ctx.fill();
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.restore();
        } else if (blip.type === 'poi') {
          // POI - circle outline
          ctx.beginPath();
          ctx.arc(blipX, blipZ, 8, 0, Math.PI * 2);
          ctx.strokeStyle = blip.isActive 
            ? 'rgba(255, 165, 0, 0.8)'  // Orange for active
            : 'rgba(100, 100, 100, 0.5)'; // Gray for inactive
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Threat indicator (dots inside)
          if (blip.threatLevel && blip.threatLevel > 0) {
            const dots = Math.min(blip.threatLevel, 4);
            for (let i = 0; i < dots; i++) {
              const angle = (i / dots) * Math.PI * 2 - Math.PI / 2;
              const dotX = blipX + Math.cos(angle) * 4;
              const dotY = blipZ + Math.sin(angle) * 4;
              ctx.beginPath();
              ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
              ctx.fillStyle = blip.isActive ? 'rgba(255, 165, 0, 0.8)' : 'rgba(100, 100, 100, 0.5)';
              ctx.fill();
            }
          }
        } else {
          // Enemy blip - diamond shape
          const blipSize = 4;
          
          // Color based on state
          let color = '#00ff00'; // Default green (patrol)
          switch (blip.state) {
            case 'engagement':
              color = '#ff0000'; // Red
              break;
            case 'retreat':
              color = '#ffff00'; // Yellow
              break;
            case 'patrol':
              color = '#00ff00'; // Green
              break;
            case 'destroyed':
              color = '#666666'; // Gray
              break;
          }

          ctx.save();
          ctx.translate(blipX, blipZ);
          ctx.rotate(Math.PI / 4); // Rotate to make diamond
          
          ctx.beginPath();
          ctx.rect(-blipSize / 2, -blipSize / 2, blipSize, blipSize);
          ctx.fillStyle = color;
          ctx.fill();
          
          // Pulsing effect for engaging enemies
          if (blip.state === 'engagement') {
            const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
            ctx.beginPath();
            ctx.rect(-blipSize, -blipSize, blipSize * 2, blipSize * 2);
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + pulse * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          
          ctx.restore();
        }
      });

      ctx.restore();

      // Draw player triangle (always at center, pointing up)
      ctx.save();
      ctx.translate(center, center);
      
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-4, 4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fillStyle = '#00ffff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();

      // Draw "N" indicator (North) - rotates with radar
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(-radarState.playerHeading);
      
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText('N', 0, -radius + 12);
      
      ctx.restore();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [radarState]);

  return (
    <div className="fixed bottom-20 left-4 z-40 pointer-events-none">
      {/* Radar Container */}
      <div className="relative">
        {/* Canvas Radar */}
        <canvas
          ref={canvasRef}
          width={140}
          height={140}
          className="rounded-full"
          style={{ 
            filter: 'drop-shadow(0 0 4px rgba(0, 255, 255, 0.3))'
          }}
        />
        
        {/* Range Label */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-cyan-500 font-mono">
          {radarState.radarRange}m
        </div>
        
        {/* Corner Decorations */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-cyan-500/50" />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t border-r border-cyan-500/50" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b border-l border-cyan-500/50" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-cyan-500/50" />
      </div>
      
      {/* Legend */}
      <div className="mt-3 bg-black/40 rounded px-2 py-1 text-[9px] font-mono">
        <div className="flex items-center gap-2">
          <span className="text-green-400">◆</span>
          <span className="text-cyan-600">PTL</span>
          <span className="text-red-400">◆</span>
          <span className="text-cyan-600">ENG</span>
          <span className="text-yellow-400">◆</span>
          <span className="text-cyan-600">RTR</span>
        </div>
      </div>
    </div>
  );
};

export default RadarHUD;

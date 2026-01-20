/**
 * PerformanceOverlay - FPS counter and performance metrics display
 * 
 * Features:
 * - FPS counter with graph
 * - Frame time display
 * - Memory usage (when available)
 * - Particle count
 * - Draw calls estimate
 * - Toggle visibility with ~ key
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  memoryUsed?: number;
  memoryTotal?: number;
  particleCount: number;
  drawCalls: number;
}

interface PerformanceOverlayProps {
  isEnabled?: boolean;
}

export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({ 
  isEnabled: propEnabled = false 
}) => {
  const [isVisible, setIsVisible] = useState(propEnabled);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    avgFps: 60,
    minFps: 60,
    maxFps: 60,
    particleCount: 0,
    drawCalls: 0,
  });
  
  // FPS history for graph
  const [fpsHistory, setFpsHistory] = useState<number[]>(new Array(60).fill(60));
  
  // Refs for frame timing
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const lastSecondRef = useRef(performance.now());
  
  // Toggle with ~ key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Listen for performance metrics from game engine
  useEffect(() => {
    const handlePerformanceUpdate = (e: CustomEvent) => {
      setMetrics(prev => ({
        ...prev,
        particleCount: e.detail.particleCount ?? prev.particleCount,
        drawCalls: e.detail.drawCalls ?? prev.drawCalls,
      }));
    };
    
    window.addEventListener('performance-update', handlePerformanceUpdate as EventListener);
    return () => window.removeEventListener('performance-update', handlePerformanceUpdate as EventListener);
  }, []);
  
  // FPS calculation loop
  useEffect(() => {
    if (!isVisible) return;
    
    let animationFrameId: number;
    
    const measureFrame = () => {
      const now = performance.now();
      const frameTime = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      
      // Track frame time
      frameTimesRef.current.push(frameTime);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }
      
      frameCountRef.current++;
      
      // Update metrics every second
      if (now - lastSecondRef.current >= 1000) {
        const fps = frameCountRef.current;
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const instantFps = 1000 / avgFrameTime;
        
        // Calculate min/max from frame times
        const minFrameTime = Math.min(...frameTimesRef.current);
        const maxFrameTime = Math.max(...frameTimesRef.current);
        
        // Memory info (Chrome only)
        let memoryUsed: number | undefined;
        let memoryTotal: number | undefined;
        if ('memory' in performance) {
          const memory = (performance as Performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
          memoryUsed = memory.usedJSHeapSize / 1048576; // MB
          memoryTotal = memory.totalJSHeapSize / 1048576; // MB
        }
        
        setMetrics(prev => ({
          ...prev,
          fps,
          frameTime: avgFrameTime,
          avgFps: instantFps,
          minFps: 1000 / maxFrameTime,
          maxFps: 1000 / minFrameTime,
          memoryUsed,
          memoryTotal,
        }));
        
        // Update FPS history
        setFpsHistory(prev => {
          const newHistory = [...prev.slice(1), fps];
          return newHistory;
        });
        
        frameCountRef.current = 0;
        lastSecondRef.current = now;
      }
      
      animationFrameId = requestAnimationFrame(measureFrame);
    };
    
    animationFrameId = requestAnimationFrame(measureFrame);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  // Color based on FPS
  const getFpsColor = (fps: number): string => {
    if (fps >= 55) return '#4ade80'; // Green
    if (fps >= 30) return '#fbbf24'; // Yellow
    return '#f87171'; // Red
  };
  
  // Max FPS for graph scaling
  const maxGraphFps = Math.max(70, ...fpsHistory);
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '8px',
        left: '8px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        border: '1px solid rgba(100, 100, 100, 0.5)',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#e0e0e0',
        zIndex: 10000,
        minWidth: '180px',
        pointerEvents: 'none',
      }}
    >
      {/* FPS Display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>FPS:</span>
        <span style={{ color: getFpsColor(metrics.fps), fontWeight: 'bold', fontSize: '14px' }}>
          {metrics.fps}
        </span>
      </div>
      
      {/* Frame Time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span>Frame:</span>
        <span style={{ color: metrics.frameTime > 20 ? '#fbbf24' : '#e0e0e0' }}>
          {metrics.frameTime.toFixed(2)}ms
        </span>
      </div>
      
      {/* Min/Max FPS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', opacity: 0.7 }}>
        <span>Min/Max:</span>
        <span>
          {metrics.minFps.toFixed(0)} / {metrics.maxFps.toFixed(0)}
        </span>
      </div>
      
      {/* Memory (if available) */}
      {metrics.memoryUsed !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', opacity: 0.7 }}>
          <span>Memory:</span>
          <span>{metrics.memoryUsed.toFixed(1)}MB</span>
        </div>
      )}
      
      {/* Particle Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', opacity: 0.7 }}>
        <span>Particles:</span>
        <span>{metrics.particleCount}</span>
      </div>
      
      {/* FPS Graph */}
      <div 
        style={{
          marginTop: '8px',
          height: '30px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '1px',
          padding: '2px',
        }}
      >
        {fpsHistory.map((fps, index) => {
          const height = (fps / maxGraphFps) * 26;
          return (
            <div
              key={index}
              style={{
                width: '2px',
                height: `${Math.max(1, height)}px`,
                backgroundColor: getFpsColor(fps),
                opacity: 0.8,
              }}
            />
          );
        })}
      </div>
      
      {/* 60 FPS line indicator */}
      <div 
        style={{ 
          position: 'relative',
          top: '-' + ((60 / maxGraphFps) * 26 + 4) + 'px',
          left: '2px',
          width: 'calc(100% - 8px)',
          height: '1px',
          backgroundColor: 'rgba(74, 222, 128, 0.3)',
          pointerEvents: 'none',
        }} 
      />
      
      {/* Toggle hint */}
      <div 
        style={{ 
          marginTop: '4px', 
          fontSize: '9px', 
          opacity: 0.5, 
          textAlign: 'center' 
        }}
      >
        Press ~ to toggle
      </div>
    </div>
  );
};

export default PerformanceOverlay;

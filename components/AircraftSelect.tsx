/**
 * AircraftSelect - Aircraft selection screen component
 * 
 * Features:
 * - Carousel display of aircraft with navigation arrows
 * - Wide screens: carousel on left, viewer on right
 * - Narrow screens: carousel on top, viewer below
 * - All buttons and details always visible
 * - Locked aircraft shown with requirements
 * - 3D rotating preview of selected aircraft
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { 
  PlayerAircraftConfig, 
  PLAYER_AIRCRAFT,
  getUnlockRequirementText,
} from '../game/data/playerAircraftConfigs';
import { createPlayerAircraftMesh } from '../game/models/PlayerAircraftModels';
import { ProgressManager } from '../game/ProgressManager';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

interface AircraftSelectProps {
  onSelect: (aircraftId: string) => void;
  onBack: () => void;
  onOpenUpgrades?: () => void;
  onLaunch?: () => void;
}

/**
 * Star rating display component
 */
const StarRating: React.FC<{ value: number; max?: number; label: string; compact?: boolean }> = ({ 
  value, 
  max = 5, 
  label,
  compact = false
}) => {
  const stars = [];
  for (let i = 0; i < max; i++) {
    stars.push(
      <span key={i} style={{ color: i < value ? '#ffcc00' : '#333333', fontSize: compact ? '10px' : '12px' }}>
        ★
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: compact ? '2px' : '4px' }}>
      <span style={{ color: '#888888', fontSize: compact ? '10px' : '12px' }}>{label}</span>
      <span style={{ letterSpacing: '1px' }}>{stars}</span>
    </div>
  );
};

/**
 * Carousel Aircraft Card - Compact card for carousel display
 */
const CarouselCard: React.FC<{
  config: PlayerAircraftConfig;
  unlocked: boolean;
  selected: boolean;
  onClick: () => void;
  isNarrow: boolean;
}> = ({ config, unlocked, selected, onClick, isNarrow }) => {
  const cardStyle: React.CSSProperties = {
    minWidth: isNarrow ? '130px' : '155px',
    maxWidth: isNarrow ? '130px' : '155px',
    padding: isNarrow ? '10px' : '12px',
    background: selected 
      ? 'linear-gradient(135deg, rgba(68, 136, 255, 0.4), rgba(68, 136, 255, 0.15))'
      : unlocked 
        ? 'rgba(40, 40, 50, 0.95)'
        : 'rgba(30, 30, 35, 0.8)',
    border: selected 
      ? '2px solid #4488ff' 
      : unlocked 
        ? '1px solid #444455' 
        : '1px solid #333344',
    borderRadius: '8px',
    cursor: unlocked ? 'pointer' : 'not-allowed',
    opacity: unlocked ? 1 : 0.6,
    transition: 'all 0.2s ease',
    position: 'relative',
    flexShrink: 0,
    boxShadow: selected ? '0 0 20px rgba(68, 136, 255, 0.3)' : 'none',
  };

  const colorPreviewStyle: React.CSSProperties = {
    width: isNarrow ? '28px' : '34px',
    height: isNarrow ? '28px' : '34px',
    background: `#${config.color.toString(16).padStart(6, '0')}`,
    borderRadius: '4px',
    marginBottom: '6px',
    boxShadow: `0 0 8px #${config.emissiveColor.toString(16).padStart(6, '0')}`,
  };

  return (
    <div style={cardStyle} onClick={unlocked ? onClick : undefined}>
      {/* Lock overlay */}
      {!unlocked && (
        <div style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          fontSize: '14px',
        }}>
          🔒
        </div>
      )}
      
      {/* Color preview */}
      <div style={colorPreviewStyle} />
      
      {/* Aircraft name */}
      <h3 style={{ 
        margin: '0 0 6px 0', 
        fontSize: isNarrow ? '10px' : '11px', 
        color: unlocked ? '#ffffff' : '#888888',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {config.name}
      </h3>
      
      {/* Stats */}
      <StarRating label="SPD" value={config.speed} compact />
      <StarRating label="AGI" value={config.agility} compact />
      <StarRating label="ARM" value={config.armor} compact />
      
      {/* Special ability */}
      {config.specialAbility !== 'none' && (
        <div style={{
          marginTop: '6px',
          padding: '3px 6px',
          background: 'rgba(255, 170, 0, 0.2)',
          borderRadius: '3px',
          fontSize: '8px',
          color: '#ffaa00',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          ⚡ {config.specialAbility.replace(/([A-Z])/g, ' $1').trim()}
        </div>
      )}
    </div>
  );
};

/**
 * Navigation Arrow Button
 */
const NavArrow: React.FC<{
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
}> = ({ direction, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '36px',
      height: '36px',
      background: disabled ? 'rgba(40, 40, 50, 0.5)' : 'rgba(68, 136, 255, 0.2)',
      border: disabled ? '1px solid #333' : '1px solid #4488ff',
      borderRadius: '50%',
      color: disabled ? '#444' : '#4488ff',
      fontSize: '18px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      flexShrink: 0,
    }}
  >
    {direction === 'left' ? '‹' : '›'}
  </button>
);

/**
 * Main aircraft selection component
 */
export const AircraftSelect: React.FC<AircraftSelectProps> = ({ onSelect, onBack, onOpenUpgrades, onLaunch }) => {
  const { isMobile } = useDeviceDetection();
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 900);
  const [selectedId, setSelectedId] = useState<string>(
    ProgressManager.getSelectedAircraftId()
  );
  const [aircraftList, setAircraftList] = useState<Array<{
    config: PlayerAircraftConfig;
    unlocked: boolean;
  }>>([]);
  const [confirmedId, setConfirmedId] = useState<string | null>(
    ProgressManager.getSelectedAircraftId()
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number>(0);
  
  // Track screen width for layout
  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth < 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Load aircraft list
  useEffect(() => {
    setAircraftList(ProgressManager.getAllAircraftWithStatus());
  }, []);
  
  // Scroll selected aircraft into view
  useEffect(() => {
    if (!carouselRef.current) return;
    const selectedIndex = aircraftList.findIndex(a => a.config.id === selectedId);
    if (selectedIndex >= 0) {
      const cards = carouselRef.current.children;
      if (cards[selectedIndex]) {
        (cards[selectedIndex] as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedId, aircraftList]);
  
  // Handle resize for preview
  useEffect(() => {
    const handleResize = () => {
      if (!previewRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = previewRef.current.clientWidth;
      const height = previewRef.current.clientHeight;
      if (width === 0 || height === 0) return;
      
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };
    
    const timer = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isNarrow]);
  
  // Setup 3D preview
  useEffect(() => {
    if (!previewRef.current) return;
    
    const container = previewRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 6, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404050, 0.5);
    scene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(10, 10, 10);
    scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.5);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);
    
    const rimLight = new THREE.DirectionalLight(0xff8844, 0.3);
    rimLight.position.set(0, -5, -10);
    scene.add(rimLight);
    
    // Grid floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x222233, 0x111122);
    gridHelper.position.y = -5;
    scene.add(gridHelper);
    
    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.008;
      }
      renderer.render(scene, camera);
    };
    animate();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);
  
  // Update preview mesh when selection changes
  useEffect(() => {
    if (!sceneRef.current) return;
    
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current = null;
    }
    
    const aircraft = aircraftList.find(a => a.config.id === selectedId);
    if (!aircraft) return;
    
    const mesh = createPlayerAircraftMesh(aircraft.config);
    mesh.rotation.x = 0.1;
    sceneRef.current.add(mesh);
    meshRef.current = mesh;
  }, [selectedId, aircraftList]);
  
  // Handle selection
  const handleCardClick = useCallback((id: string) => {
    setSelectedId(id);
  }, []);
  
  // Carousel navigation
  const navigateCarousel = useCallback((direction: 'prev' | 'next') => {
    const currentIndex = aircraftList.findIndex(a => a.config.id === selectedId);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    // Find next unlocked aircraft
    while (newIndex >= 0 && newIndex < aircraftList.length) {
      if (aircraftList[newIndex].unlocked) {
        setSelectedId(aircraftList[newIndex].config.id);
        return;
      }
      newIndex += direction === 'next' ? 1 : -1;
    }
  }, [aircraftList, selectedId]);
  
  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (ProgressManager.selectAircraft(selectedId)) {
      setConfirmedId(selectedId);
      setShowConfirmation(true);
      onSelect(selectedId);
      
      // Hide confirmation after 2 seconds
      setTimeout(() => {
        setShowConfirmation(false);
      }, 2000);
    }
  }, [selectedId, onSelect]);
  
  // Check if current selection is the confirmed/active aircraft
  const isCurrentlySelected = confirmedId === selectedId || 
    (!confirmedId && ProgressManager.getSelectedAircraftId() === selectedId);
  
  // Get selected aircraft details
  const selectedAircraft = aircraftList.find(a => a.config.id === selectedId);
  const selectedIndex = aircraftList.findIndex(a => a.config.id === selectedId);
  const canGoPrev = selectedIndex > 0 && aircraftList.slice(0, selectedIndex).some(a => a.unlocked);
  const canGoNext = selectedIndex < aircraftList.length - 1 && aircraftList.slice(selectedIndex + 1).some(a => a.unlocked);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(180deg, #0a0a15 0%, #151525 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Orbitron", "Rajdhani", sans-serif',
      color: '#ffffff',
      overflow: 'hidden',
    }}>
      {/* Animation styles */}
      <style>{`
        @keyframes confirmPulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.05); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes confirmFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -60%) scale(0.95); }
        }
      `}</style>
      
      {/* Confirmation Toast */}
      {showConfirmation && selectedAircraft && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100,
          padding: isNarrow ? '16px 28px' : '20px 40px',
          background: 'linear-gradient(135deg, rgba(0, 200, 100, 0.95), rgba(0, 150, 80, 0.95))',
          border: '2px solid #00ff88',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(0, 255, 136, 0.6), 0 8px 32px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          animation: 'confirmPulse 0.3s ease-out forwards',
        }}>
          <div style={{ fontSize: isNarrow ? '24px' : '32px', marginBottom: '8px' }}>✓</div>
          <div style={{ 
            fontSize: isNarrow ? '16px' : '20px', 
            fontWeight: 'bold',
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            {selectedAircraft.config.name}
          </div>
          <div style={{ 
            fontSize: isNarrow ? '11px' : '13px', 
            color: 'rgba(255,255,255,0.8)',
            marginTop: '4px',
          }}>
            SELECTED FOR COMBAT
          </div>
        </div>
      )}
      
      {/* Header */}
      <div style={{
        padding: isNarrow ? '10px 16px' : '16px 32px',
        borderBottom: '1px solid #333344',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <button
          style={{
            padding: isNarrow ? '8px 16px' : '10px 24px',
            fontSize: isNarrow ? '12px' : '14px',
            fontWeight: 'bold',
            background: 'transparent',
            border: '1px solid #666666',
            borderRadius: '4px',
            color: '#888888',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
          onClick={onBack}
        >
          ← Back
        </button>
        
        <h1 style={{ 
          margin: 0, 
          fontSize: isNarrow ? '16px' : '24px', 
          letterSpacing: '3px',
          color: '#4488ff',
        }}>
          AIRCRAFT GARAGE
        </h1>
        
        <div style={{ color: '#888888', fontSize: isNarrow ? '10px' : '13px' }}>
          Points: <span style={{ color: '#ffcc00' }}>
            {ProgressManager.getCareerPoints().toLocaleString()}
          </span>
        </div>
      </div>
      
      {/* Main Content - Different layout based on screen width */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isNarrow ? 'column' : 'row',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Carousel Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: isNarrow ? '10px 12px' : '16px',
          background: 'rgba(10, 10, 20, 0.5)',
          borderBottom: isNarrow ? '1px solid #333344' : 'none',
          borderRight: isNarrow ? 'none' : '1px solid #333344',
          flexShrink: 0,
          width: isNarrow ? '100%' : 'auto',
          maxWidth: isNarrow ? '100%' : '200px',
          flexDirection: isNarrow ? 'row' : 'column',
          overflowX: isNarrow ? 'hidden' : 'visible',
          overflowY: isNarrow ? 'visible' : 'auto',
        }}>
          {/* Prev Arrow */}
          <NavArrow 
            direction="left"
            onClick={() => navigateCarousel('prev')} 
            disabled={!canGoPrev}
          />
          
          {/* Carousel Cards */}
          <div 
            ref={carouselRef}
            style={{
              display: 'flex',
              flexDirection: isNarrow ? 'row' : 'column',
              gap: '8px',
              overflowX: isNarrow ? 'auto' : 'visible',
              overflowY: isNarrow ? 'visible' : 'auto',
              padding: '4px',
              scrollBehavior: 'smooth',
              flex: isNarrow ? 1 : 'unset',
              maxHeight: isNarrow ? 'auto' : 'calc(100% - 100px)',
              scrollbarWidth: 'thin',
              scrollbarColor: '#4488ff #1a1a2a',
            }}
          >
            {aircraftList.map(({ config, unlocked }) => (
              <CarouselCard
                key={config.id}
                config={config}
                unlocked={unlocked}
                selected={config.id === selectedId}
                onClick={() => handleCardClick(config.id)}
                isNarrow={isNarrow}
              />
            ))}
          </div>
          
          {/* Next Arrow */}
          <NavArrow 
            direction="right"
            onClick={() => navigateCarousel('next')} 
            disabled={!canGoNext}
          />
        </div>
        
        {/* Preview & Details Section */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          {/* 3D Preview */}
          <div 
            ref={previewRef} 
            style={{
              flex: 1,
              minHeight: isNarrow ? '180px' : '250px',
              position: 'relative',
            }} 
          />
          
          {/* Details Panel - Always visible at bottom */}
          {selectedAircraft && (
            <div style={{
              padding: isNarrow ? '10px 14px' : '16px 24px',
              background: 'rgba(15, 15, 25, 0.95)',
              borderTop: '1px solid #333344',
              flexShrink: 0,
            }}>
              {/* Top row: Name and Select button */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '10px',
                gap: '12px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ 
                    margin: '0 0 2px 0', 
                    fontSize: isNarrow ? '15px' : '20px', 
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {selectedAircraft.config.name}
                  </h2>
                  <p style={{ 
                    margin: 0, 
                    color: '#888888', 
                    fontSize: isNarrow ? '10px' : '12px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {selectedAircraft.config.description}
                  </p>
                </div>
                
                {/* Select/Locked button */}
                <button
                  style={{
                    padding: isNarrow ? '8px 16px' : '10px 24px',
                    fontSize: isNarrow ? '12px' : '14px',
                    fontWeight: 'bold',
                    border: isCurrentlySelected ? '2px solid #00ff88' : 'none',
                    borderRadius: '4px',
                    cursor: selectedAircraft.unlocked ? 'pointer' : 'not-allowed',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    background: !selectedAircraft.unlocked 
                      ? '#333344'
                      : isCurrentlySelected
                        ? 'linear-gradient(135deg, #00cc66, #00aa55)'
                        : 'linear-gradient(135deg, #4488ff, #2266dd)',
                    color: selectedAircraft.unlocked ? '#ffffff' : '#666666',
                    boxShadow: isCurrentlySelected
                      ? '0 4px 20px rgba(0, 255, 136, 0.5)'
                      : selectedAircraft.unlocked 
                        ? '0 4px 16px rgba(68, 136, 255, 0.4)'
                        : 'none',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    transform: showConfirmation && isCurrentlySelected ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onClick={handleConfirm}
                  disabled={!selectedAircraft.unlocked}
                >
                  {!selectedAircraft.unlocked 
                    ? 'LOCKED' 
                    : isCurrentlySelected 
                      ? '✓ SELECTED' 
                      : 'SELECT'}
                </button>
              </div>
              
              {/* Stats row */}
              <div style={{ 
                display: 'flex', 
                gap: isNarrow ? '12px' : '20px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                {/* Weapon stats */}
                <div style={{ display: 'flex', gap: isNarrow ? '12px' : '16px' }}>
                  <div>
                    <span style={{ color: '#666666', fontSize: isNarrow ? '9px' : '10px' }}>Missiles</span>
                    <div style={{ fontSize: isNarrow ? '14px' : '16px', color: '#ff4444', fontWeight: 'bold' }}>
                      {selectedAircraft.config.missiles}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#666666', fontSize: isNarrow ? '9px' : '10px' }}>Cannon</span>
                    <div style={{ fontSize: isNarrow ? '14px' : '16px', color: '#ffaa00', fontWeight: 'bold' }}>
                      {(selectedAircraft.config.cannonDamage * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#666666', fontSize: isNarrow ? '9px' : '10px' }}>Rate</span>
                    <div style={{ fontSize: isNarrow ? '14px' : '16px', color: '#44ff44', fontWeight: 'bold' }}>
                      {(selectedAircraft.config.cannonFireRate * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                
                {/* Special ability */}
                {selectedAircraft.config.specialAbility !== 'none' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: 'rgba(255, 170, 0, 0.12)',
                    border: '1px solid rgba(255, 170, 0, 0.4)',
                    borderRadius: '4px',
                  }}>
                    <span style={{ color: '#ffaa00', fontSize: isNarrow ? '9px' : '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      ⚡ {selectedAircraft.config.specialAbility.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Action buttons row */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '12px',
                flexWrap: 'wrap',
              }}>
                {/* Upgrades button */}
                {onOpenUpgrades && (
                  <button
                    onClick={onOpenUpgrades}
                    style={{
                      padding: isNarrow ? '10px 16px' : '12px 20px',
                      fontSize: isNarrow ? '11px' : '13px',
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      background: 'linear-gradient(135deg, #ff8844, #dd6622)',
                      color: '#ffffff',
                      boxShadow: '0 2px 12px rgba(255, 136, 68, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flex: isNarrow ? '1' : 'unset',
                      justifyContent: 'center',
                    }}
                  >
                    ⚙️ UPGRADES
                  </button>
                )}
                
                {/* Launch button */}
                {onLaunch && (
                  <button
                    onClick={onLaunch}
                    style={{
                      padding: isNarrow ? '10px 16px' : '12px 24px',
                      fontSize: isNarrow ? '11px' : '13px',
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                      color: '#000000',
                      boxShadow: '0 2px 16px rgba(0, 255, 136, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flex: isNarrow ? '1' : 'unset',
                      justifyContent: 'center',
                    }}
                  >
                    🚀 LAUNCH
                  </button>
                )}
              </div>
              
              {/* Lock requirement if not unlocked */}
              {!selectedAircraft.unlocked && (
                <div style={{
                  marginTop: '10px',
                  padding: '6px 10px',
                  background: 'rgba(255, 50, 50, 0.1)',
                  border: '1px solid rgba(255, 100, 100, 0.3)',
                  borderRadius: '4px',
                  color: '#ff6666',
                  fontSize: isNarrow ? '10px' : '11px',
                }}>
                  🔐 {getUnlockRequirementText(selectedAircraft.config)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AircraftSelect;

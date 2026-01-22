/**
 * NebulaSystem - Glowing nebula clouds for cyberpunk atmosphere
 * 
 * Features:
 * - Multiple nebula layers with different colors (pink, purple, cyan)
 * - Particle-based glowing effects
 * - Parallax scrolling effect
 * - Animated nebula clouds for depth
 */

import * as THREE from 'three';

interface NebulaLayer {
  altitude: number;
  mesh: THREE.Points;
  opacity: number;
  scale: number;
  scrollSpeed: number;
  color: THREE.Color;
  particleCount: number;
}

interface NebulaConfig {
  enabled: boolean;
  layers: {
    altitude: number;
    opacity: number;
    scale: number;
    scrollSpeed: number;
    color: number;
    particleCount: number;
  }[];
}

const DEFAULT_CONFIG: NebulaConfig = {
  enabled: false, // Disabled - using NASA nebula texture instead
  layers: [
    // Mid-sky nebula - pink/magenta (above player's normal flight path)
    {
      altitude: 600,
      opacity: 0.15,
      scale: 5000,
      scrollSpeed: 0.001,
      color: 0xff3388,
      particleCount: 400,
    },
    // High nebula - deep purple
    {
      altitude: 1000,
      opacity: 0.12,
      scale: 6000,
      scrollSpeed: 0.0005,
      color: 0x8800aa,
      particleCount: 300,
    },
    // Very high nebula - soft violet glow
    {
      altitude: 1500,
      opacity: 0.1,
      scale: 8000,
      scrollSpeed: 0.0003,
      color: 0xcc44ff,
      particleCount: 250,
    },
  ],
};

export class NebulaSystem {
  private scene: THREE.Scene;
  private config: NebulaConfig;
  private nebulaLayers: NebulaLayer[] = [];
  private time: number = 0;
  
  // Reference for following camera
  private cameraPosition: THREE.Vector3 = new THREE.Vector3();
  
  constructor(scene: THREE.Scene, config: Partial<NebulaConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enabled) {
      this.createNebulaLayers();
    }
  }
  
  /**
   * Create nebula layers with glowing particles
   */
  private createNebulaLayers(): void {
    for (const layerConfig of this.config.layers) {
      const geometry = new THREE.BufferGeometry();
      
      const positions = new Float32Array(layerConfig.particleCount * 3);
      const colors = new Float32Array(layerConfig.particleCount * 3);
      const sizes = new Float32Array(layerConfig.particleCount);
      
      // Generate nebula particles in 3D space
      for (let i = 0; i < layerConfig.particleCount; i++) {
        // Random position in a large sphere around the player - spread very wide
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = layerConfig.scale * (0.8 + Math.random() * 1.2);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        // Keep particles well above the ground with wide spread
        positions[i * 3 + 1] = layerConfig.altitude + (Math.random() - 0.3) * 400;
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        
        // Color with some variation
        const color = new THREE.Color(layerConfig.color);
        const variation = 0.6 + Math.random() * 0.4;
        
        colors[i * 3] = color.r * variation;
        colors[i * 3 + 1] = color.g * variation;
        colors[i * 3 + 2] = color.b * variation;
        
        // Smaller particle sizes for more subtle effect
        sizes[i] = 1.5 + Math.random() * 3;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      // Create material with glow effect
      const material = new THREE.PointsMaterial({
        size: 2,
        sizeAttenuation: true,
        transparent: true,
        opacity: layerConfig.opacity * 0.4,  // Very subtle opacity
        vertexColors: true,
        fog: false,
        blending: THREE.AdditiveBlending,  // Additive blending for glow
      });
      
      const mesh = new THREE.Points(geometry, material);
      mesh.position.y = layerConfig.altitude;
      
      this.nebulaLayers.push({
        altitude: layerConfig.altitude,
        mesh,
        opacity: layerConfig.opacity,
        scale: layerConfig.scale,
        scrollSpeed: layerConfig.scrollSpeed,
        color: new THREE.Color(layerConfig.color),
        particleCount: layerConfig.particleCount,
      });
      
      this.scene.add(mesh);
    }
  }
  
  /**
   * Update nebula layers position and animation
   */
  public update(cameraPosition: THREE.Vector3, time: number): void {
    this.time = time;
    this.cameraPosition.copy(cameraPosition);
    
    // Update each nebula layer
    for (let i = 0; i < this.nebulaLayers.length; i++) {
      const layer = this.nebulaLayers[i];
      
      // Follow camera but with offset based on layer altitude
      layer.mesh.position.x = cameraPosition.x;
      layer.mesh.position.y = cameraPosition.y + layer.altitude;
      layer.mesh.position.z = cameraPosition.z;
      
      // Subtle floating animation
      const floatAmount = Math.sin(time * (0.1 + i * 0.05)) * 20;
      layer.mesh.position.y += floatAmount;
      
      // Gentle rotation for visual interest
      layer.mesh.rotation.x += layer.scrollSpeed * 0.01;
      layer.mesh.rotation.z += layer.scrollSpeed * 0.005;
      
      // Pulse opacity slightly
      const pulseAmount = 0.7 + Math.sin(time * (0.5 + i * 0.1)) * 0.3;
      (layer.mesh.material as THREE.PointsMaterial).opacity = layer.opacity * pulseAmount;
    }
  }
  
  /**
   * Dispose of nebula system
   */
  public dispose(): void {
    for (const layer of this.nebulaLayers) {
      layer.mesh.geometry.dispose();
      (layer.mesh.material as THREE.Material).dispose();
      this.scene.remove(layer.mesh);
    }
    this.nebulaLayers = [];
  }
}

let nebulaSystem: NebulaSystem | null = null;

export function initNebulaSystem(scene: THREE.Scene): NebulaSystem {
  if (nebulaSystem) {
    nebulaSystem.dispose();
  }
  nebulaSystem = new NebulaSystem(scene);
  return nebulaSystem;
}

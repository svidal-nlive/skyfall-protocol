/**
 * CloudSystem - Atmospheric cloud layers for visual depth
 * 
 * Features:
 * - Multiple cloud layers at different altitudes
 * - Parallax scrolling effect
 * - Procedural cloud textures
 * - Fog integration for atmosphere
 * - Performance-optimized sprite clouds
 */

import * as THREE from 'three';

interface CloudLayer {
  altitude: number;
  mesh: THREE.Mesh;
  opacity: number;
  scale: number;
  scrollSpeed: number;
}

interface CloudConfig {
  enabled: boolean;
  layers: {
    altitude: number;
    opacity: number;
    scale: number;
    scrollSpeed: number;
    color: number;
  }[];
}

const DEFAULT_CONFIG: CloudConfig = {
  enabled: true,
  layers: [
    // Low wispy clouds
    {
      altitude: 100,
      opacity: 0.15,
      scale: 2000,
      scrollSpeed: 0.002,
      color: 0x556677,
    },
    // Mid-level clouds
    {
      altitude: 300,
      opacity: 0.25,
      scale: 3000,
      scrollSpeed: 0.001,
      color: 0x445566,
    },
    // High cloud layer
    {
      altitude: 600,
      opacity: 0.3,
      scale: 4000,
      scrollSpeed: 0.0005,
      color: 0x334455,
    },
  ],
};

export class CloudSystem {
  private scene: THREE.Scene;
  private config: CloudConfig;
  private cloudLayers: CloudLayer[] = [];
  private cloudTexture: THREE.Texture | null = null;
  private time: number = 0;
  
  // Reference for following camera
  private cameraPosition: THREE.Vector3 = new THREE.Vector3();
  
  constructor(scene: THREE.Scene, config: Partial<CloudConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enabled) {
      this.createCloudTexture();
      this.createCloudLayers();
    }
  }
  
  /**
   * Create procedural cloud texture using canvas
   */
  private createCloudTexture(): void {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d')!;
    
    // Fill with base transparent
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, size, size);
    
    // Generate cloud-like noise pattern
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 40 + Math.random() * 100;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const alpha = 0.02 + Math.random() * 0.05;
      
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(0.4, `rgba(255, 255, 255, ${alpha * 0.6})`);
      gradient.addColorStop(0.7, `rgba(255, 255, 255, ${alpha * 0.2})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    
    // Add some sharper cloud puffs
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 20 + Math.random() * 40;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    this.cloudTexture = new THREE.CanvasTexture(canvas);
    this.cloudTexture.wrapS = THREE.RepeatWrapping;
    this.cloudTexture.wrapT = THREE.RepeatWrapping;
    this.cloudTexture.needsUpdate = true;
  }
  
  /**
   * Create cloud layer planes
   */
  private createCloudLayers(): void {
    if (!this.cloudTexture) return;
    
    for (const layerConfig of this.config.layers) {
      const geometry = new THREE.PlaneGeometry(layerConfig.scale, layerConfig.scale, 1, 1);
      
      const material = new THREE.MeshBasicMaterial({
        map: this.cloudTexture,
        color: layerConfig.color,
        transparent: true,
        opacity: layerConfig.opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2; // Horizontal plane
      mesh.position.y = layerConfig.altitude;
      mesh.renderOrder = -10; // Render behind most objects
      
      this.scene.add(mesh);
      
      this.cloudLayers.push({
        altitude: layerConfig.altitude,
        mesh,
        opacity: layerConfig.opacity,
        scale: layerConfig.scale,
        scrollSpeed: layerConfig.scrollSpeed,
      });
    }
  }
  
  /**
   * Update cloud positions and effects
   */
  public update(dt: number, playerPosition: THREE.Vector3): void {
    if (!this.config.enabled) return;
    
    this.time += dt;
    this.cameraPosition.copy(playerPosition);
    
    for (const layer of this.cloudLayers) {
      // Follow player horizontally
      layer.mesh.position.x = playerPosition.x;
      layer.mesh.position.z = playerPosition.z;
      
      // Scroll UV coordinates for movement effect
      const material = layer.mesh.material as THREE.MeshBasicMaterial;
      if (material.map) {
        material.map.offset.x = this.time * layer.scrollSpeed + playerPosition.x * 0.0001;
        material.map.offset.y = this.time * layer.scrollSpeed * 0.7 + playerPosition.z * 0.0001;
      }
      
      // Fade opacity based on player altitude relative to cloud layer
      const playerAltitude = playerPosition.y;
      const layerAltitude = layer.altitude;
      const altitudeDiff = Math.abs(playerAltitude - layerAltitude);
      
      // When very close to cloud layer, reduce opacity (flying through)
      if (altitudeDiff < 50) {
        const fadeStart = 50;
        const fadeAmount = 1 - (fadeStart - altitudeDiff) / fadeStart;
        material.opacity = layer.opacity * fadeAmount;
      } else if (playerAltitude > layerAltitude + 100) {
        // Above clouds - more visible
        material.opacity = layer.opacity * 1.2;
      } else if (playerAltitude < layerAltitude - 100) {
        // Below clouds - slightly dimmer
        material.opacity = layer.opacity * 0.8;
      } else {
        material.opacity = layer.opacity;
      }
    }
  }
  
  /**
   * Set cloud layer visibility
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    for (const layer of this.cloudLayers) {
      layer.mesh.visible = enabled;
    }
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    for (const layer of this.cloudLayers) {
      this.scene.remove(layer.mesh);
      layer.mesh.geometry.dispose();
      (layer.mesh.material as THREE.Material).dispose();
    }
    
    this.cloudLayers = [];
    
    if (this.cloudTexture) {
      this.cloudTexture.dispose();
    }
  }
}

// Singleton for global access
export let cloudSystem: CloudSystem | null = null;

export function initCloudSystem(scene: THREE.Scene): CloudSystem {
  cloudSystem = new CloudSystem(scene);
  return cloudSystem;
}

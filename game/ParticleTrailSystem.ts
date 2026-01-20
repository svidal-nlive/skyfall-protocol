/**
 * ParticleTrailSystem - GPU-efficient particle trails for engine exhaust and missile smoke
 * 
 * Features:
 * - Object pooling for performance
 * - Buffer geometry for efficient GPU rendering
 * - Configurable trail types (engine, missile, cannon)
 * - Automatic fade and cleanup
 */

import * as THREE from 'three';

export type TrailType = 'engine' | 'missile' | 'spark' | 'smoke';

interface TrailParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  type: TrailType;
}

interface TrailEmitter {
  id: string;
  type: TrailType;
  getPosition: () => THREE.Vector3;
  getVelocity: () => THREE.Vector3;
  isActive: () => boolean;
  intensity: number;
}

// Trail type configurations
const TRAIL_CONFIG: Record<TrailType, {
  particlesPerSecond: number;
  particleLife: number;
  baseSize: number;
  sizeDecay: number;
  speed: number;
  spread: number;
  colors: number[];
  gravity: number;
}> = {
  engine: {
    particlesPerSecond: 60,
    particleLife: 0.4,
    baseSize: 1.5,
    sizeDecay: 0.5,
    speed: 20,
    spread: 0.3,
    colors: [0xff6600, 0xffaa00, 0xffcc44, 0x88ccff],
    gravity: 0,
  },
  missile: {
    particlesPerSecond: 80,
    particleLife: 1.2,
    baseSize: 1.8,
    sizeDecay: 0.3,
    speed: 5,
    spread: 0.6,
    colors: [0xffffff, 0xcccccc, 0x999999, 0x666666],
    gravity: 2,
  },
  spark: {
    particlesPerSecond: 100,
    particleLife: 0.2,
    baseSize: 0.8,
    sizeDecay: 0.8,
    speed: 80,
    spread: 1.0,
    colors: [0xffff00, 0xffaa00, 0xff6600],
    gravity: 30,
  },
  smoke: {
    particlesPerSecond: 30,
    particleLife: 2.0,
    baseSize: 3.0,
    sizeDecay: -0.5, // Grows over time
    speed: 3,
    spread: 0.4,
    colors: [0x444444, 0x333333, 0x222222],
    gravity: -2, // Floats up
  },
};

export class ParticleTrailSystem {
  private scene: THREE.Scene;
  
  // Particle pool
  private particles: TrailParticle[] = [];
  private readonly MAX_PARTICLES = 2000;
  
  // Emitters
  private emitters: Map<string, TrailEmitter> = new Map();
  private emitterTimers: Map<string, number> = new Map();
  
  // Three.js objects
  private particleMesh: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  
  // Buffers
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  
  // Sprite texture for soft particles
  private particleTexture: THREE.Texture;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Create circular gradient texture for soft particles
    this.particleTexture = this.createParticleTexture();
    
    // Initialize buffers
    this.positions = new Float32Array(this.MAX_PARTICLES * 3);
    this.colors = new Float32Array(this.MAX_PARTICLES * 3);
    this.sizes = new Float32Array(this.MAX_PARTICLES);
    
    // Create buffer geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    
    // Create material with custom vertex colors
    this.material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.particleTexture,
      sizeAttenuation: true,
    });
    
    // Create points mesh
    this.particleMesh = new THREE.Points(this.geometry, this.material);
    this.particleMesh.frustumCulled = false; // Particles can be spread out
    this.scene.add(this.particleMesh);
  }
  
  /**
   * Create a circular gradient texture for soft particles
   */
  private createParticleTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  /**
   * Register an emitter (e.g., player engine, missile)
   */
  public addEmitter(
    id: string,
    type: TrailType,
    getPosition: () => THREE.Vector3,
    getVelocity: () => THREE.Vector3,
    isActive: () => boolean,
    intensity: number = 1.0
  ): void {
    this.emitters.set(id, {
      id,
      type,
      getPosition,
      getVelocity,
      isActive,
      intensity,
    });
    this.emitterTimers.set(id, 0);
  }
  
  /**
   * Remove an emitter
   */
  public removeEmitter(id: string): void {
    this.emitters.delete(id);
    this.emitterTimers.delete(id);
  }
  
  /**
   * Update emitter intensity (for throttle-based effects)
   */
  public setEmitterIntensity(id: string, intensity: number): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.intensity = intensity;
    }
  }
  
  /**
   * Emit a burst of particles at a position (for explosions, impacts)
   */
  public emitBurst(
    position: THREE.Vector3,
    type: TrailType,
    count: number,
    baseVelocity?: THREE.Vector3
  ): void {
    const config = TRAIL_CONFIG[type];
    
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.MAX_PARTICLES) break;
      
      // Random velocity spread
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * config.spread * config.speed * 2,
        (Math.random() - 0.5) * config.spread * config.speed * 2,
        (Math.random() - 0.5) * config.spread * config.speed * 2
      );
      
      // Add base velocity if provided
      if (baseVelocity) {
        velocity.add(baseVelocity.clone().multiplyScalar(0.3));
      }
      
      // Random color from palette
      const colorHex = config.colors[Math.floor(Math.random() * config.colors.length)];
      
      this.particles.push({
        position: position.clone(),
        velocity,
        color: new THREE.Color(colorHex),
        size: config.baseSize * (0.5 + Math.random() * 0.5),
        life: config.particleLife * (0.5 + Math.random() * 0.5),
        maxLife: config.particleLife * (0.5 + Math.random() * 0.5),
        type,
      });
    }
  }
  
  /**
   * Main update loop
   */
  public update(dt: number): void {
    // Update emitters - spawn new particles
    this.updateEmitters(dt);
    
    // Update existing particles
    this.updateParticles(dt);
    
    // Update GPU buffers
    this.updateBuffers();
  }
  
  /**
   * Update emitters and spawn particles
   */
  private updateEmitters(dt: number): void {
    for (const [id, emitter] of this.emitters) {
      if (!emitter.isActive()) continue;
      
      const config = TRAIL_CONFIG[emitter.type];
      const spawnRate = config.particlesPerSecond * emitter.intensity;
      
      if (spawnRate <= 0) continue;
      
      // Accumulate time
      let timer = (this.emitterTimers.get(id) || 0) + dt;
      const spawnInterval = 1 / spawnRate;
      
      // Spawn particles based on time
      while (timer >= spawnInterval && this.particles.length < this.MAX_PARTICLES) {
        timer -= spawnInterval;
        
        const position = emitter.getPosition().clone();
        const baseVelocity = emitter.getVelocity();
        
        // Add random spread
        const spread = config.spread;
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * spread * config.speed,
          (Math.random() - 0.5) * spread * config.speed,
          (Math.random() - 0.5) * spread * config.speed
        );
        
        // Add opposite of emitter velocity for trailing effect
        velocity.add(baseVelocity.clone().multiplyScalar(-0.3));
        
        // Random color from palette
        const colorIndex = Math.floor(Math.random() * config.colors.length);
        const colorHex = config.colors[colorIndex];
        
        this.particles.push({
          position,
          velocity,
          color: new THREE.Color(colorHex),
          size: config.baseSize * emitter.intensity,
          life: config.particleLife,
          maxLife: config.particleLife,
          type: emitter.type,
        });
      }
      
      this.emitterTimers.set(id, timer);
    }
  }
  
  /**
   * Update particle physics
   */
  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      const config = TRAIL_CONFIG[particle.type];
      
      // Update life
      particle.life -= dt;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Apply gravity
      particle.velocity.y -= config.gravity * dt;
      
      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(dt));
      
      // Apply drag
      particle.velocity.multiplyScalar(1 - dt * 2);
      
      // Update size based on life ratio and decay
      const lifeRatio = particle.life / particle.maxLife;
      if (config.sizeDecay > 0) {
        particle.size = config.baseSize * lifeRatio * (1 - config.sizeDecay * (1 - lifeRatio));
      } else {
        // Negative decay means it grows
        particle.size = config.baseSize * (1 + (1 - lifeRatio) * Math.abs(config.sizeDecay));
      }
      
      // Fade color
      particle.color.multiplyScalar(1 - dt * 0.5);
    }
  }
  
  /**
   * Update GPU buffers with current particle data
   */
  private updateBuffers(): void {
    // Reset all to zero first (hides unused particles)
    this.positions.fill(0);
    this.colors.fill(0);
    this.sizes.fill(0);
    
    // Update with active particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const i3 = i * 3;
      
      this.positions[i3] = particle.position.x;
      this.positions[i3 + 1] = particle.position.y;
      this.positions[i3 + 2] = particle.position.z;
      
      this.colors[i3] = particle.color.r;
      this.colors[i3 + 1] = particle.color.g;
      this.colors[i3 + 2] = particle.color.b;
      
      this.sizes[i] = particle.size;
    }
    
    // Mark buffers as needing update
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    
    // Update draw range to only render active particles
    this.geometry.setDrawRange(0, this.particles.length);
  }
  
  /**
   * Get particle count for debug
   */
  public getParticleCount(): number {
    return this.particles.length;
  }
  
  /**
   * Clear all particles
   */
  public clear(): void {
    this.particles = [];
    this.emitters.clear();
    this.emitterTimers.clear();
    this.updateBuffers();
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.clear();
    
    if (this.particleMesh) {
      this.scene.remove(this.particleMesh);
    }
    
    this.geometry.dispose();
    this.material.dispose();
    this.particleTexture.dispose();
  }
}

// Singleton for global access
export let particleTrailSystem: ParticleTrailSystem | null = null;

export function initParticleTrailSystem(scene: THREE.Scene): ParticleTrailSystem {
  particleTrailSystem = new ParticleTrailSystem(scene);
  return particleTrailSystem;
}

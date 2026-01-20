/**
 * ExplosionManager - Handles all destruction effects
 * 
 * Features:
 * - Voxel debris explosions
 * - Expanding shockwave
 * - Smoke particles
 * - Screen shake events
 * - Integration with ParticleTrailSystem for smoke/sparks
 * - Secondary explosions for larger blasts
 * - Impact sparks for hits
 */

import * as THREE from 'three';
import { particleTrailSystem } from './ParticleTrailSystem';

interface Debris {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationVelocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

interface Explosion {
  core: THREE.Mesh;
  shockwave: THREE.Mesh;
  debris: Debris[];
  position: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  hasSecondaryExplosion?: boolean;
  secondaryTimer?: number;
}

export class ExplosionManager {
  private scene: THREE.Scene;
  private explosions: Explosion[] = [];
  
  // Pooled geometries
  private debrisGeometry: THREE.BoxGeometry;
  
  // Configuration
  private readonly MAX_EXPLOSIONS = 25;
  private readonly DEBRIS_COUNT = 16; // More debris
  private readonly EXPLOSION_DURATION = 1.8;
  private readonly DEBRIS_SPEED = 90;
  
  // Secondary explosion timing
  private readonly SECONDARY_EXPLOSION_CHANCE = 0.4;
  private readonly SECONDARY_DELAY_MIN = 0.2;
  private readonly SECONDARY_DELAY_MAX = 0.5;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.debrisGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  }
  
  /**
   * Create explosion at position
   */
  public createExplosion(position: THREE.Vector3, size: number = 1.0) {
    // Limit active explosions
    if (this.explosions.length >= this.MAX_EXPLOSIONS) {
      this.removeOldestExplosion();
    }
    
    // Create explosion core (bright flash)
    const coreGeo = new THREE.SphereGeometry(2 * size, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 1.0,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(position);
    this.scene.add(core);
    
    // Create shockwave ring
    const ringGeo = new THREE.RingGeometry(1, 3 * size, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const shockwave = new THREE.Mesh(ringGeo, ringMat);
    shockwave.position.copy(position);
    // Random orientation
    shockwave.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    this.scene.add(shockwave);
    
    // Create debris particles
    const debris: Debris[] = [];
    for (let i = 0; i < this.DEBRIS_COUNT; i++) {
      const debrisMat = new THREE.MeshBasicMaterial({
        color: this.getDebrisColor(),
        transparent: true,
        opacity: 1.0,
      });
      
      const debrisMesh = new THREE.Mesh(this.debrisGeometry, debrisMat);
      debrisMesh.position.copy(position);
      debrisMesh.scale.setScalar(0.5 + Math.random() * 0.8);
      
      // Random velocity outward
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.3) * 2, // Slightly upward bias
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(this.DEBRIS_SPEED * (0.5 + Math.random() * 0.5));
      
      const rotationVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      
      this.scene.add(debrisMesh);
      
      debris.push({
        mesh: debrisMesh,
        velocity,
        rotationVelocity,
        lifetime: 0,
        maxLifetime: this.EXPLOSION_DURATION * (0.6 + Math.random() * 0.4),
      });
    }
    
    // Determine if this explosion should have secondary explosions
    const hasSecondary = size >= 1.0 && Math.random() < this.SECONDARY_EXPLOSION_CHANCE;
    const secondaryDelay = this.SECONDARY_DELAY_MIN + Math.random() * (this.SECONDARY_DELAY_MAX - this.SECONDARY_DELAY_MIN);
    
    const explosion: Explosion = {
      core,
      shockwave,
      debris,
      position: position.clone(),
      lifetime: 0,
      maxLifetime: this.EXPLOSION_DURATION,
      hasSecondaryExplosion: hasSecondary,
      secondaryTimer: hasSecondary ? secondaryDelay : undefined,
    };
    
    this.explosions.push(explosion);
    
    // Emit smoke and spark particles via ParticleTrailSystem
    if (particleTrailSystem) {
      // Fire burst
      particleTrailSystem.emitBurst(position, 'spark', Math.floor(15 * size));
      // Smoke cloud
      particleTrailSystem.emitBurst(position, 'smoke', Math.floor(8 * size));
    }
    
    // Dispatch screen shake event
    window.dispatchEvent(new CustomEvent('screen-shake', {
      detail: { intensity: 0.5 * size, duration: 0.3 }
    }));
    
    console.log(`[EXPLOSION] Created at ${position.x.toFixed(0)}, ${position.y.toFixed(0)}, ${position.z.toFixed(0)}`);
  }
  
  /**
   * Create impact sparks at position (for bullet/missile hits)
   */
  public createImpactSparks(position: THREE.Vector3, normal?: THREE.Vector3): void {
    if (particleTrailSystem) {
      // Emit sparks in direction of impact normal or random
      const baseVelocity = normal?.clone().multiplyScalar(30) || new THREE.Vector3();
      particleTrailSystem.emitBurst(position, 'spark', 8, baseVelocity);
    }
    
    // Small flash at impact point
    const flashGeo = new THREE.SphereGeometry(0.5, 6, 6);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffff88,
      transparent: true,
      opacity: 1.0,
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(position);
    this.scene.add(flash);
    
    // Remove flash after brief moment
    setTimeout(() => {
      this.scene.remove(flash);
      flashGeo.dispose();
      flashMat.dispose();
    }, 50);
  }
  
  /**
   * Get random debris color (fire/metal tones)
   */
  private getDebrisColor(): number {
    const colors = [
      0xff4400, // Orange
      0xff6600, // Light orange
      0xff2200, // Red-orange
      0x884400, // Brown (burnt metal)
      0x666666, // Gray (metal)
      0xffcc00, // Yellow
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Remove oldest explosion to make room
   */
  private removeOldestExplosion() {
    if (this.explosions.length > 0) {
      this.disposeExplosion(this.explosions[0]);
      this.explosions.shift();
    }
  }
  
  /**
   * Update all explosions
   */
  public update(dt: number) {
    const toRemove: number[] = [];
    const secondaryExplosions: { position: THREE.Vector3; size: number }[] = [];
    
    for (let i = 0; i < this.explosions.length; i++) {
      const explosion = this.explosions[i];
      explosion.lifetime += dt;
      
      // Check for secondary explosion
      if (explosion.hasSecondaryExplosion && explosion.secondaryTimer !== undefined) {
        explosion.secondaryTimer -= dt;
        if (explosion.secondaryTimer <= 0) {
          explosion.hasSecondaryExplosion = false;
          // Queue secondary explosion at offset position
          const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 10
          );
          secondaryExplosions.push({
            position: explosion.position.clone().add(offset),
            size: 0.6 + Math.random() * 0.4, // Smaller secondary
          });
        }
      }
      
      const progress = explosion.lifetime / explosion.maxLifetime;
      
      // Update core (flash and fade)
      const coreMat = explosion.core.material as THREE.MeshBasicMaterial;
      if (progress < 0.1) {
        // Initial flash
        explosion.core.scale.setScalar(1 + progress * 20);
        coreMat.color.setHex(0xffffff);
      } else {
        // Fade out
        const fadeProgress = (progress - 0.1) / 0.9;
        coreMat.opacity = Math.max(0, 1 - fadeProgress * 2);
        coreMat.color.setHex(0xff4400);
        explosion.core.scale.setScalar(3 + fadeProgress * 5);
      }
      
      // Update shockwave (expand and fade)
      const ringMat = explosion.shockwave.material as THREE.MeshBasicMaterial;
      explosion.shockwave.scale.setScalar(1 + progress * 15);
      ringMat.opacity = Math.max(0, 0.8 - progress);
      
      // Update debris
      for (const debris of explosion.debris) {
        debris.lifetime += dt;
        const debrisProgress = debris.lifetime / debris.maxLifetime;
        
        // Apply velocity with gravity
        debris.mesh.position.add(debris.velocity.clone().multiplyScalar(dt));
        debris.velocity.y -= 30 * dt; // Gravity
        
        // Apply rotation
        debris.mesh.rotation.x += debris.rotationVelocity.x * dt;
        debris.mesh.rotation.y += debris.rotationVelocity.y * dt;
        debris.mesh.rotation.z += debris.rotationVelocity.z * dt;
        
        // Fade out
        const debrisMat = debris.mesh.material as THREE.MeshBasicMaterial;
        debrisMat.opacity = Math.max(0, 1 - debrisProgress);
        
        // Shrink slightly
        debris.mesh.scale.multiplyScalar(0.995);
      }
      
      // Mark for removal when done
      if (explosion.lifetime >= explosion.maxLifetime) {
        toRemove.push(i);
      }
    }
    
    // Remove completed explosions (reverse order to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.disposeExplosion(this.explosions[toRemove[i]]);
      this.explosions.splice(toRemove[i], 1);
    }
    
    // Create queued secondary explosions (outside main loop to avoid mutation issues)
    for (const secondary of secondaryExplosions) {
      this.createExplosion(secondary.position, secondary.size);
    }
  }
  
  /**
   * Dispose explosion resources
   */
  private disposeExplosion(explosion: Explosion) {
    // Remove core
    this.scene.remove(explosion.core);
    explosion.core.geometry.dispose();
    (explosion.core.material as THREE.Material).dispose();
    
    // Remove shockwave
    this.scene.remove(explosion.shockwave);
    explosion.shockwave.geometry.dispose();
    (explosion.shockwave.material as THREE.Material).dispose();
    
    // Remove debris
    for (const debris of explosion.debris) {
      this.scene.remove(debris.mesh);
      (debris.mesh.material as THREE.Material).dispose();
      // Don't dispose geometry - it's pooled
    }
  }
  
  /**
   * Dispose all resources
   */
  public dispose() {
    for (const explosion of this.explosions) {
      this.disposeExplosion(explosion);
    }
    this.explosions = [];
    this.debrisGeometry.dispose();
  }
}

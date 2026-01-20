/**
 * CameraEffects - Enhanced camera effects for game juice
 * 
 * Features:
 * - Multi-layer screen shake (trauma-based system)
 * - Dynamic FOV during boost/damage
 * - Chromatic aberration on damage
 * - Hit flash (screen flash on damage)
 * - Kill cam slowdown signal
 * - Smooth transitions and easing
 */

import * as THREE from 'three';

// Shake types with different characteristics
export enum ShakeType {
  DAMAGE = 'DAMAGE',        // Hard, snappy shake
  EXPLOSION = 'EXPLOSION',  // Rumbling, decaying shake
  BOOST = 'BOOST',          // Subtle, continuous vibration
  IMPACT = 'IMPACT',        // Quick punch
}

interface ShakeInstance {
  type: ShakeType;
  trauma: number;         // 0-1 intensity (trauma-based system)
  decay: number;          // How fast trauma decays
  frequency: number;      // Shake frequency
  timer: number;          // Time accumulator for Perlin-like noise
}

interface CameraEffectsConfig {
  baseFov: number;
  boostFovIncrease: number;
  damageFovPulse: number;
  maxTrauma: number;
  traumaDecayRate: number;
}

const DEFAULT_CONFIG: CameraEffectsConfig = {
  baseFov: 65,
  boostFovIncrease: 15,
  damageFovPulse: 8,
  maxTrauma: 1.0,
  traumaDecayRate: 1.5,
};

// Shake type configurations
const SHAKE_CONFIG: Record<ShakeType, { decay: number; frequency: number; amplitude: number }> = {
  [ShakeType.DAMAGE]: {
    decay: 3.0,
    frequency: 25,
    amplitude: 1.0,
  },
  [ShakeType.EXPLOSION]: {
    decay: 2.0,
    frequency: 15,
    amplitude: 0.8,
  },
  [ShakeType.BOOST]: {
    decay: 10.0, // Fast decay so it needs continuous refresh
    frequency: 30,
    amplitude: 0.15,
  },
  [ShakeType.IMPACT]: {
    decay: 8.0,
    frequency: 40,
    amplitude: 0.5,
  },
};

export class CameraEffects {
  private camera: THREE.PerspectiveCamera | null = null;
  private config: CameraEffectsConfig;
  
  // Shake state
  private shakes: ShakeInstance[] = [];
  private totalTrauma: number = 0;
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();
  private shakeRotation: THREE.Euler = new THREE.Euler();
  private shakeTimer: number = 0;
  
  // FOV state
  private currentFov: number;
  private targetFov: number;
  private fovVelocity: number = 0;
  
  // Effects state
  private hitFlashIntensity: number = 0;
  private killSlowmoActive: boolean = false;
  private killSlowmoTimer: number = 0;
  private killSlowmoDuration: number = 0.3;
  
  // Damage effect state
  private damageVignetteIntensity: number = 0;
  private chromaticAberration: number = 0;
  
  constructor(config: Partial<CameraEffectsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentFov = this.config.baseFov;
    this.targetFov = this.config.baseFov;
  }
  
  /**
   * Set camera reference
   */
  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }
  
  /**
   * Add screen shake (trauma-based)
   * @param type Type of shake effect
   * @param intensity 0-1 intensity multiplier
   */
  public addShake(type: ShakeType, intensity: number = 1.0): void {
    const config = SHAKE_CONFIG[type];
    const trauma = Math.min(intensity * config.amplitude, 1.0);
    
    // Find existing shake of same type or create new
    let shake = this.shakes.find(s => s.type === type);
    
    if (shake) {
      // Add to existing trauma (capped)
      shake.trauma = Math.min(shake.trauma + trauma * 0.5, this.config.maxTrauma);
    } else {
      // Create new shake instance
      this.shakes.push({
        type,
        trauma,
        decay: config.decay,
        frequency: config.frequency,
        timer: 0,
      });
    }
  }
  
  /**
   * Trigger damage effects (shake + vignette + FOV pulse)
   * @param intensity Damage intensity (0-1)
   */
  public onDamage(intensity: number = 0.5): void {
    // Add damage shake
    this.addShake(ShakeType.DAMAGE, intensity);
    
    // Trigger hit flash
    this.hitFlashIntensity = Math.min(0.6 * intensity + 0.2, 0.8);
    
    // Damage vignette
    this.damageVignetteIntensity = Math.min(this.damageVignetteIntensity + intensity * 0.5, 1.0);
    
    // Chromatic aberration
    this.chromaticAberration = Math.min(intensity * 2, 1.5);
    
    // FOV pulse (zoom out briefly)
    this.targetFov = this.config.baseFov + this.config.damageFovPulse;
  }
  
  /**
   * Trigger explosion shake
   * @param distance Distance to explosion (affects intensity)
   * @param size Explosion size multiplier
   */
  public onExplosion(distance: number, size: number = 1.0): void {
    // Intensity falls off with distance
    const maxDistance = 200;
    const distanceFactor = Math.max(0, 1 - distance / maxDistance);
    const intensity = distanceFactor * size;
    
    if (intensity > 0.05) {
      this.addShake(ShakeType.EXPLOSION, intensity);
    }
  }
  
  /**
   * Set boost shake (continuous while boosting)
   * @param active Whether boost is active
   * @param speedFactor Speed factor (0-1)
   */
  public setBoostShake(active: boolean, speedFactor: number = 1.0): void {
    if (active) {
      // Continuous small shake while boosting
      this.addShake(ShakeType.BOOST, speedFactor * 0.5);
    }
  }
  
  /**
   * Trigger brief slowmo on kill
   */
  public triggerKillSlowmo(): void {
    this.killSlowmoActive = true;
    this.killSlowmoTimer = 0;
  }
  
  /**
   * Set target FOV (for speed-based effects)
   * @param fov Target FOV
   */
  public setTargetFov(fov: number): void {
    this.targetFov = fov;
  }
  
  /**
   * Update camera effects
   * @param dt Delta time
   * @returns Time scale (for slowmo)
   */
  public update(dt: number): number {
    this.shakeTimer += dt;
    
    // Update shakes and calculate total trauma
    this.updateShakes(dt);
    
    // Calculate shake offset from trauma
    this.calculateShakeOffset();
    
    // Update FOV
    this.updateFov(dt);
    
    // Decay effects
    this.updateEffectsDecay(dt);
    
    // Update kill slowmo
    let timeScale = 1.0;
    if (this.killSlowmoActive) {
      this.killSlowmoTimer += dt;
      
      // Ease in and out of slowmo
      const progress = this.killSlowmoTimer / this.killSlowmoDuration;
      if (progress < 1.0) {
        // Slow down to 30% speed at peak
        const curve = Math.sin(progress * Math.PI);
        timeScale = 1.0 - (curve * 0.7);
      } else {
        this.killSlowmoActive = false;
      }
    }
    
    // Apply FOV to camera
    if (this.camera) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }
    
    // Dispatch effects for UI overlay
    this.dispatchEffectsState();
    
    return timeScale;
  }
  
  /**
   * Update shake instances
   */
  private updateShakes(dt: number): void {
    this.totalTrauma = 0;
    
    for (let i = this.shakes.length - 1; i >= 0; i--) {
      const shake = this.shakes[i];
      
      // Update timer
      shake.timer += dt;
      
      // Decay trauma
      shake.trauma -= shake.decay * dt;
      
      // Remove if trauma depleted
      if (shake.trauma <= 0) {
        this.shakes.splice(i, 1);
        continue;
      }
      
      // Accumulate trauma
      this.totalTrauma = Math.min(this.totalTrauma + shake.trauma, this.config.maxTrauma);
    }
  }
  
  /**
   * Calculate shake offset using Perlin-like noise
   */
  private calculateShakeOffset(): void {
    if (this.totalTrauma <= 0) {
      this.shakeOffset.set(0, 0, 0);
      this.shakeRotation.set(0, 0, 0);
      return;
    }
    
    // Trauma squared for more dramatic high-trauma shakes
    const shake = this.totalTrauma * this.totalTrauma;
    
    // Use multiple sine waves for pseudo-random shake
    const t = this.shakeTimer;
    const offsetX = Math.sin(t * 31.7) * 0.5 + Math.sin(t * 17.3) * 0.3 + Math.sin(t * 47.1) * 0.2;
    const offsetY = Math.sin(t * 29.3) * 0.5 + Math.sin(t * 19.7) * 0.3 + Math.sin(t * 43.9) * 0.2;
    const offsetZ = Math.sin(t * 23.1) * 0.3 + Math.sin(t * 41.7) * 0.2;
    
    // Scale by shake intensity
    const maxOffset = 0.5;
    this.shakeOffset.set(
      offsetX * shake * maxOffset,
      offsetY * shake * maxOffset,
      offsetZ * shake * maxOffset * 0.3
    );
    
    // Rotational shake (subtle)
    const maxRotation = 0.02;
    this.shakeRotation.set(
      offsetY * shake * maxRotation,
      offsetX * shake * maxRotation * 0.5,
      (offsetX + offsetY) * shake * maxRotation * 0.3
    );
  }
  
  /**
   * Update FOV smoothly
   */
  private updateFov(dt: number): void {
    // Smooth FOV transition (spring-damper system)
    const stiffness = 5;
    const damping = 3;
    
    const fovDiff = this.targetFov - this.currentFov;
    this.fovVelocity += fovDiff * stiffness * dt;
    this.fovVelocity *= Math.exp(-damping * dt);
    this.currentFov += this.fovVelocity;
    
    // Return to base FOV
    this.targetFov = THREE.MathUtils.lerp(this.targetFov, this.config.baseFov, dt * 2);
  }
  
  /**
   * Decay visual effects
   */
  private updateEffectsDecay(dt: number): void {
    // Decay hit flash
    this.hitFlashIntensity = Math.max(0, this.hitFlashIntensity - dt * 8);
    
    // Decay damage vignette
    this.damageVignetteIntensity = Math.max(0, this.damageVignetteIntensity - dt * 1.5);
    
    // Decay chromatic aberration
    this.chromaticAberration = Math.max(0, this.chromaticAberration - dt * 3);
  }
  
  /**
   * Dispatch effects state for UI overlay
   */
  private dispatchEffectsState(): void {
    window.dispatchEvent(new CustomEvent('camera-effects-update', {
      detail: {
        hitFlash: this.hitFlashIntensity,
        vignette: this.damageVignetteIntensity,
        chromaticAberration: this.chromaticAberration,
        shake: this.totalTrauma,
      }
    }));
  }
  
  /**
   * Get shake offset to apply to camera position
   */
  public getShakeOffset(): THREE.Vector3 {
    return this.shakeOffset.clone();
  }
  
  /**
   * Get shake rotation to apply to camera
   */
  public getShakeRotation(): THREE.Euler {
    return this.shakeRotation.clone();
  }
  
  /**
   * Get current hit flash intensity (for UI overlay)
   */
  public getHitFlashIntensity(): number {
    return this.hitFlashIntensity;
  }
  
  /**
   * Get vignette intensity
   */
  public getVignetteIntensity(): number {
    return this.damageVignetteIntensity;
  }
  
  /**
   * Get current FOV
   */
  public getCurrentFov(): number {
    return this.currentFov;
  }
  
  /**
   * Reset all effects
   */
  public reset(): void {
    this.shakes = [];
    this.totalTrauma = 0;
    this.shakeOffset.set(0, 0, 0);
    this.shakeRotation.set(0, 0, 0);
    this.hitFlashIntensity = 0;
    this.damageVignetteIntensity = 0;
    this.chromaticAberration = 0;
    this.killSlowmoActive = false;
    this.currentFov = this.config.baseFov;
    this.targetFov = this.config.baseFov;
    this.fovVelocity = 0;
  }
}

// Singleton instance
export const cameraEffects = new CameraEffects();

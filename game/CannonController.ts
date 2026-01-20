import * as THREE from 'three';
import { Lock } from './TargetingController';

/**
 * Cannon projectile in flight
 */
interface CannonProjectile {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  isActive: boolean;
}

/**
 * CannonController - High-rate-of-fire gun with weak homing
 * 
 * Features:
 * - Unlimited ammo (energy weapon style)
 * - High fire rate (~10 rounds/second)
 * - Weak homing when primary target is in reticle
 * - Pooled projectiles for performance
 * - Tracer-style visual effect
 * - Configurable damage and fire rate multipliers
 */
export class CannonController {
  // Configuration (base values, modified by aircraft config)
  public FIRE_RATE = 0.1;                       // Seconds between shots
  public readonly PROJECTILE_SPEED = 400;       // Units/second (fast!)
  public readonly PROJECTILE_LIFETIME = 2.0;    // Seconds
  public PROJECTILE_DAMAGE = 5;                 // Per hit (modifiable)
  public readonly POOL_SIZE = 50;               // Max concurrent projectiles
  public readonly HOMING_STRENGTH = 0.8;        // Weak homing factor (0-1)
  public readonly HOMING_RANGE = 150;           // Max distance for homing
  public readonly SPREAD = 0.02;                // Base spread (radians)
  
  // Multipliers from aircraft config
  private damageMultiplier = 1.0;
  private fireRateMultiplier = 1.0;

  // State
  private projectilePool: CannonProjectile[] = [];
  private activeProjectiles: CannonProjectile[] = [];
  private lastFireTime: number = 0;
  private isFiring: boolean = false;
  private muzzleFlashIntensity: number = 0;

  // References
  private scene: THREE.Scene | null = null;

  constructor(damageMultiplier: number = 1.0, fireRateMultiplier: number = 1.0) {
    this.damageMultiplier = damageMultiplier;
    this.fireRateMultiplier = fireRateMultiplier;
    
    // Apply multipliers
    this.PROJECTILE_DAMAGE = Math.round(5 * damageMultiplier);
    this.FIRE_RATE = 0.1 / fireRateMultiplier;
    
    this.initializePool();
  }
  
  /**
   * Apply aircraft config multipliers
   */
  public applyConfig(damageMultiplier: number, fireRateMultiplier: number): void {
    this.damageMultiplier = damageMultiplier;
    this.fireRateMultiplier = fireRateMultiplier;
    this.PROJECTILE_DAMAGE = Math.round(5 * damageMultiplier);
    this.FIRE_RATE = 0.1 / fireRateMultiplier;
  }
  
  /**
   * Get current damage per hit
   */
  public getDamage(): number {
    return this.PROJECTILE_DAMAGE;
  }

  /**
   * Initialize projectile pool
   */
  private initializePool() {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const projectile = this.createProjectile();
      projectile.isActive = false;
      projectile.mesh.visible = false;
      this.projectilePool.push(projectile);
    }
  }

  /**
   * Create a single projectile
   */
  private createProjectile(): CannonProjectile {
    // Tracer-style elongated projectile
    const geometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6);
    geometry.rotateX(Math.PI / 2); // Point forward
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);

    return {
      mesh,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      lifetime: 0,
      isActive: false,
    };
  }

  /**
   * Set scene reference
   */
  public setScene(scene: THREE.Scene) {
    this.scene = scene;
    // Add all pool meshes to scene
    for (const proj of this.projectilePool) {
      scene.add(proj.mesh);
    }
  }

  /**
   * Set firing state
   */
  public setFiring(firing: boolean) {
    this.isFiring = firing;
  }

  /**
   * Main update loop
   */
  public update(
    dt: number,
    currentTime: number,
    playerPosition: THREE.Vector3,
    playerQuaternion: THREE.Quaternion,
    primaryTarget: Lock | null,
    targets: Map<string, { position: THREE.Vector3; velocity: THREE.Vector3; isAlive: boolean }>
  ) {
    // Fire if holding trigger
    if (this.isFiring) {
      this.tryFire(currentTime, playerPosition, playerQuaternion, primaryTarget);
    }

    // Update muzzle flash decay
    this.muzzleFlashIntensity = Math.max(0, this.muzzleFlashIntensity - dt * 10);

    // Update active projectiles
    this.updateProjectiles(dt, targets);
  }

  /**
   * Attempt to fire a projectile
   */
  private tryFire(
    currentTime: number,
    playerPosition: THREE.Vector3,
    playerQuaternion: THREE.Quaternion,
    primaryTarget: Lock | null
  ): boolean {
    // Check fire rate
    if (currentTime - this.lastFireTime < this.FIRE_RATE) {
      return false;
    }

    // Get inactive projectile from pool
    const projectile = this.projectilePool.find(p => !p.isActive);
    if (!projectile) {
      return false; // Pool exhausted
    }

    this.lastFireTime = currentTime;
    this.muzzleFlashIntensity = 1;

    // Calculate muzzle position (nose of jet)
    const muzzleOffset = new THREE.Vector3(0, -0.3, -5).applyQuaternion(playerQuaternion);
    const muzzlePos = playerPosition.clone().add(muzzleOffset);

    // Base direction (forward)
    let direction = new THREE.Vector3(0, 0, -1).applyQuaternion(playerQuaternion);

    // Add slight spread
    direction.x += (Math.random() - 0.5) * this.SPREAD;
    direction.y += (Math.random() - 0.5) * this.SPREAD;
    direction.normalize();

    // Apply weak homing if target in reticle
    if (primaryTarget && primaryTarget.inReticle) {
      const targetPos = primaryTarget.target.position;
      const distance = muzzlePos.distanceTo(targetPos);
      
      if (distance < this.HOMING_RANGE) {
        // Calculate lead point
        const timeToTarget = distance / this.PROJECTILE_SPEED;
        const leadPoint = targetPos.clone().add(
          primaryTarget.target.velocity.clone().multiplyScalar(timeToTarget * 0.5)
        );

        // Direction to lead point
        const toTarget = new THREE.Vector3().subVectors(leadPoint, muzzlePos).normalize();
        
        // Blend toward target (weak homing)
        direction.lerp(toTarget, this.HOMING_STRENGTH * 0.3); // Only 30% blend
        direction.normalize();
      }
    }

    // Activate projectile
    projectile.isActive = true;
    projectile.mesh.visible = true;
    projectile.position.copy(muzzlePos);
    projectile.velocity.copy(direction.multiplyScalar(this.PROJECTILE_SPEED));
    projectile.lifetime = 0;
    projectile.mesh.position.copy(muzzlePos);

    // Orient mesh to velocity
    const lookTarget = muzzlePos.clone().add(projectile.velocity);
    projectile.mesh.lookAt(lookTarget);

    // Add to active list for tracking
    if (!this.activeProjectiles.includes(projectile)) {
      this.activeProjectiles.push(projectile);
    }

    // Dispatch muzzle flash event for effects
    window.dispatchEvent(new CustomEvent('cannon-fire', {
      detail: { position: muzzlePos.clone() }
    }));

    return true;
  }

  /**
   * Update all active projectiles
   */
  private updateProjectiles(
    dt: number,
    targets: Map<string, { position: THREE.Vector3; velocity: THREE.Vector3; isAlive: boolean }>
  ) {
    for (const projectile of this.activeProjectiles) {
      if (!projectile.isActive) continue;

      // Update lifetime
      projectile.lifetime += dt;
      if (projectile.lifetime >= this.PROJECTILE_LIFETIME) {
        this.deactivateProjectile(projectile);
        continue;
      }

      // Move projectile
      const movement = projectile.velocity.clone().multiplyScalar(dt);
      projectile.position.add(movement);
      projectile.mesh.position.copy(projectile.position);

      // Stretch based on speed for tracer effect
      const speed = projectile.velocity.length();
      projectile.mesh.scale.z = 1 + (speed / this.PROJECTILE_SPEED) * 2;

      // Fade out near end of life
      const mat = projectile.mesh.material as THREE.MeshBasicMaterial;
      const lifeRatio = projectile.lifetime / this.PROJECTILE_LIFETIME;
      mat.opacity = 0.9 * (1 - lifeRatio * 0.5);

      // Check hits on targets
      for (const [targetId, targetData] of targets) {
        if (!targetData.isAlive) continue;

        const dist = projectile.position.distanceTo(targetData.position);
        if (dist < 5) { // Hit radius
          this.onHit(projectile, targetId, targetData.position);
          break;
        }
      }
    }

    // Clean up inactive from active list
    this.activeProjectiles = this.activeProjectiles.filter(p => p.isActive);
  }

  /**
   * Handle projectile hit
   */
  private onHit(projectile: CannonProjectile, targetId: string, hitPosition: THREE.Vector3) {
    this.deactivateProjectile(projectile);

    // Dispatch hit event
    window.dispatchEvent(new CustomEvent('cannon-hit', {
      detail: {
        targetId,
        damage: this.PROJECTILE_DAMAGE,
        position: hitPosition.clone(),
      }
    }));

    // Small hit spark effect
    this.createHitSpark(hitPosition);
  }

  /**
   * Create hit spark effect
   */
  private createHitSpark(position: THREE.Vector3) {
    if (!this.scene) return;

    const sparkGeo = new THREE.SphereGeometry(0.3, 4, 4);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 1,
    });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    spark.position.copy(position);
    this.scene.add(spark);

    // Quick fade
    let opacity = 1;
    const fade = () => {
      opacity -= 0.15;
      sparkMat.opacity = opacity;
      spark.scale.multiplyScalar(1.2);

      if (opacity > 0) {
        requestAnimationFrame(fade);
      } else {
        this.scene?.remove(spark);
        sparkGeo.dispose();
        sparkMat.dispose();
      }
    };
    fade();
  }

  /**
   * Deactivate a projectile (return to pool)
   */
  private deactivateProjectile(projectile: CannonProjectile) {
    projectile.isActive = false;
    projectile.mesh.visible = false;
  }

  // ============ Public Getters ============

  /**
   * Get muzzle flash intensity (0-1)
   */
  public getMuzzleFlashIntensity(): number {
    return this.muzzleFlashIntensity;
  }

  /**
   * Get active projectile count
   */
  public getActiveCount(): number {
    return this.activeProjectiles.length;
  }

  /**
   * Get firing state
   */
  public isFiringCannon(): boolean {
    return this.isFiring;
  }

  /**
   * Get HUD info
   */
  public getHUDInfo() {
    return {
      isFiring: this.isFiring,
      activeProjectiles: this.getActiveCount(),
      muzzleFlash: this.muzzleFlashIntensity,
    };
  }

  /**
   * Apply upgrade modifiers (Phase 10)
   * @param damageMultiplier - Damage multiplier from upgrades
   * @param homingMultiplier - Homing strength multiplier from upgrades
   */
  public applyUpgrades(damageMultiplier: number, homingMultiplier: number): void {
    // Stack with aircraft config multiplier
    const totalDamage = this.damageMultiplier * damageMultiplier;
    this.PROJECTILE_DAMAGE = Math.round(5 * totalDamage);
    
    console.log(`[CANNON] Upgrades applied: ${this.PROJECTILE_DAMAGE} damage/hit (${(totalDamage * 100).toFixed(0)}%)`);
  }

  /**
   * Update aircraft config when player changes aircraft
   * @param damageMultiplier - New base damage multiplier from aircraft
   * @param fireRateMultiplier - New base fire rate multiplier from aircraft
   */
  public updateAircraftConfig(damageMultiplier: number, fireRateMultiplier: number): void {
    this.damageMultiplier = damageMultiplier;
    this.fireRateMultiplier = fireRateMultiplier;
    
    // Apply new multipliers
    this.PROJECTILE_DAMAGE = Math.round(5 * damageMultiplier);
    this.FIRE_RATE = 0.1 / fireRateMultiplier;
    
    console.log(`[CANNON] Aircraft config updated: ${this.PROJECTILE_DAMAGE} damage, ${(1 / this.FIRE_RATE).toFixed(1)} rounds/sec`);
  }

  /**
   * Dispose resources
   */
  public dispose() {
    for (const proj of this.projectilePool) {
      if (this.scene) {
        this.scene.remove(proj.mesh);
      }
      proj.mesh.geometry.dispose();
      (proj.mesh.material as THREE.Material).dispose();
    }
    this.projectilePool = [];
    this.activeProjectiles = [];
  }
}

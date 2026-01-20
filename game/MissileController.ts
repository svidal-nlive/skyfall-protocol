import * as THREE from 'three';
import { Lock } from './TargetingController';

/**
 * Missile slot state
 */
export interface MissileSlot {
  isReady: boolean;
  cooldownTimer: number;    // 0 = ready, >0 = reloading
  cooldownDuration: number; // Total time to reload
}

/**
 * Active missile in flight
 */
export interface ActiveMissile {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetId: string | null;
  lifetime: number;
  maxLifetime: number;
  isActive: boolean;
  hasDetonated: boolean;
}

/**
 * MissileController - Regenerative missile system
 * 
 * Features:
 * - Configurable missile slots with individual cooldowns
 * - Regeneration time based on aircraft config
 * - Fires at locked targets (prioritizes primary)
 * - Homing missiles with lead pursuit
 */
export class MissileController {
  // Configuration (can be modified by aircraft config)
  public MAX_MISSILES = 6;
  public COOLDOWN_TIME = 4.0;                 // Seconds per slot reload
  public readonly MISSILE_SPEED = 180;        // Units/second
  public readonly MISSILE_TURN_RATE = 3.0;    // Radians/second
  public readonly MISSILE_LIFETIME = 8.0;     // Seconds before self-destruct
  public readonly MISSILE_DAMAGE = 50;
  public readonly FIRE_RATE = 0.3;            // Min seconds between launches

  // State
  private slots: MissileSlot[] = [];
  private activeMissiles: ActiveMissile[] = [];
  private lastFireTime: number = 0;
  private missileIdCounter: number = 0;

  // References
  private scene: THREE.Scene | null = null;

  constructor(maxMissiles: number = 6, cooldownTime: number = 4.0) {
    this.MAX_MISSILES = maxMissiles;
    this.COOLDOWN_TIME = cooldownTime;
    
    // Initialize all slots as ready
    for (let i = 0; i < this.MAX_MISSILES; i++) {
      this.slots.push({
        isReady: true,
        cooldownTimer: 0,
        cooldownDuration: this.COOLDOWN_TIME,
      });
    }
  }

  /**
   * Set scene reference for adding missile meshes
   */
  public setScene(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Main update loop
   */
  public update(
    dt: number,
    playerPosition: THREE.Vector3,
    playerQuaternion: THREE.Quaternion,
    targets: Map<string, { position: THREE.Vector3; velocity: THREE.Vector3; isAlive: boolean }>
  ) {
    // Update slot cooldowns
    this.updateSlotCooldowns(dt);

    // Update active missiles
    this.updateActiveMissiles(dt, targets);
  }

  /**
   * Update missile slot regeneration
   */
  private updateSlotCooldowns(dt: number) {
    for (const slot of this.slots) {
      if (!slot.isReady) {
        slot.cooldownTimer -= dt;
        if (slot.cooldownTimer <= 0) {
          slot.isReady = true;
          slot.cooldownTimer = 0;
          console.log('[MISSILES] Slot reloaded');
        }
      }
    }
  }

  /**
   * Update all active missiles
   */
  private updateActiveMissiles(
    dt: number,
    targets: Map<string, { position: THREE.Vector3; velocity: THREE.Vector3; isAlive: boolean }>
  ) {
    for (const missile of this.activeMissiles) {
      if (!missile.isActive) continue;

      // Update lifetime
      missile.lifetime += dt;
      if (missile.lifetime >= missile.maxLifetime) {
        this.detonateMissile(missile, 'timeout');
        continue;
      }

      // Get target if we have one
      let targetData = missile.targetId ? targets.get(missile.targetId) : null;
      
      // If target is dead or gone, missile continues straight
      if (targetData && !targetData.isAlive) {
        targetData = null;
        missile.targetId = null;
      }

      // Homing behavior
      if (targetData) {
        this.applyHoming(missile, targetData, dt);
      }

      // Move missile
      const movement = missile.velocity.clone().multiplyScalar(dt);
      missile.position.add(movement);
      missile.mesh.position.copy(missile.position);

      // Orient missile to velocity
      if (missile.velocity.lengthSq() > 0.001) {
        const lookTarget = missile.position.clone().add(missile.velocity);
        missile.mesh.lookAt(lookTarget);
      }

      // Update trail effect
      this.updateMissileTrail(missile, dt);

      // Check for target proximity hit
      if (targetData) {
        const distToTarget = missile.position.distanceTo(targetData.position);
        if (distToTarget < 8) { // Hit radius
          this.detonateMissile(missile, 'hit');
        }
      }
    }

    // Clean up detonated missiles
    this.cleanupMissiles();
  }

  /**
   * Apply homing steering toward target
   */
  private applyHoming(
    missile: ActiveMissile,
    target: { position: THREE.Vector3; velocity: THREE.Vector3 },
    dt: number
  ) {
    // Calculate lead point (predict where target will be)
    const distance = missile.position.distanceTo(target.position);
    const timeToImpact = distance / this.MISSILE_SPEED;
    const leadPoint = target.position.clone().add(
      target.velocity.clone().multiplyScalar(timeToImpact * 0.8) // 80% lead
    );

    // Direction to lead point
    const toTarget = new THREE.Vector3().subVectors(leadPoint, missile.position).normalize();
    
    // Current direction
    const currentDir = missile.velocity.clone().normalize();

    // Interpolate toward target direction
    const newDir = currentDir.lerp(toTarget, this.MISSILE_TURN_RATE * dt);
    newDir.normalize();

    // Apply new velocity
    missile.velocity.copy(newDir.multiplyScalar(this.MISSILE_SPEED));
  }

  /**
   * Fire a missile at a target
   */
  public fire(
    playerPosition: THREE.Vector3,
    playerQuaternion: THREE.Quaternion,
    lock: Lock | null,
    currentTime: number
  ): boolean {
    // Check fire rate
    if (currentTime - this.lastFireTime < this.FIRE_RATE) {
      return false;
    }

    // Find ready slot
    const readySlot = this.slots.find(s => s.isReady);
    if (!readySlot) {
      console.log('[MISSILES] No missiles available');
      return false;
    }

    // Use slot
    readySlot.isReady = false;
    readySlot.cooldownTimer = this.COOLDOWN_TIME;
    this.lastFireTime = currentTime;

    // Calculate launch position (from under wings)
    const launchOffset = new THREE.Vector3(
      (Math.random() > 0.5 ? 3 : -3), // Alternate sides
      -1,
      -2
    ).applyQuaternion(playerQuaternion);
    const launchPos = playerPosition.clone().add(launchOffset);

    // Initial velocity (forward from player)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerQuaternion);
    const initialVelocity = forward.multiplyScalar(this.MISSILE_SPEED);

    // Create missile
    const missile = this.createMissile(
      launchPos,
      initialVelocity,
      lock?.target.id || null
    );

    this.activeMissiles.push(missile);
    console.log(`[MISSILES] Fired missile ${missile.id} at ${lock?.target.id || 'no target'}`);

    return true;
  }

  /**
   * Create a missile entity with mesh
   */
  private createMissile(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    targetId: string | null
  ): ActiveMissile {
    const id = `missile-${++this.missileIdCounter}`;

    // Create missile mesh
    const group = new THREE.Group();

    // Body (cylinder)
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.2, 2, 8);
    const bodyMat = new THREE.MeshPhongMaterial({ 
      color: 0xcccccc,
      emissive: 0x222222,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Nose cone
    const noseGeo = new THREE.ConeGeometry(0.15, 0.5, 8);
    const noseMat = new THREE.MeshPhongMaterial({ 
      color: 0xff3333,
      emissive: 0x331111,
    });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -1.25;
    group.add(nose);

    // Fins (4)
    const finGeo = new THREE.BoxGeometry(0.02, 0.4, 0.3);
    const finMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.position.z = 0.8;
      fin.rotation.z = (Math.PI / 2) * i;
      fin.position.x = Math.cos((Math.PI / 2) * i) * 0.25;
      fin.position.y = Math.sin((Math.PI / 2) * i) * 0.25;
      group.add(fin);
    }

    // Engine glow
    const glowGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ 
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = 1.2;
    glow.name = 'engineGlow';
    group.add(glow);

    // Trail particles (simple line for now)
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(30 * 3); // 30 points
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineBasicMaterial({ 
      color: 0xff4400,
      transparent: true,
      opacity: 0.6,
    });
    const trail = new THREE.Line(trailGeo, trailMat);
    trail.name = 'trail';
    trail.frustumCulled = false;
    group.add(trail);

    group.position.copy(position);

    if (this.scene) {
      this.scene.add(group);
    }

    return {
      id,
      mesh: group,
      position: position.clone(),
      velocity: velocity.clone(),
      targetId,
      lifetime: 0,
      maxLifetime: this.MISSILE_LIFETIME,
      isActive: true,
      hasDetonated: false,
    };
  }

  /**
   * Update missile trail effect
   */
  private updateMissileTrail(missile: ActiveMissile, dt: number) {
    const trail = missile.mesh.getObjectByName('trail') as THREE.Line;
    if (!trail) return;

    const positions = (trail.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    
    // Shift positions back
    for (let i = positions.length - 3; i >= 3; i -= 3) {
      positions[i] = positions[i - 3];
      positions[i + 1] = positions[i - 3 + 1];
      positions[i + 2] = positions[i - 3 + 2];
    }

    // Set first position to current
    const localPos = missile.mesh.worldToLocal(missile.position.clone());
    positions[0] = 0;
    positions[1] = 0;
    positions[2] = 1.5; // Behind missile

    trail.geometry.attributes.position.needsUpdate = true;

    // Animate engine glow
    const glow = missile.mesh.getObjectByName('engineGlow') as THREE.Mesh;
    if (glow) {
      const scale = 0.8 + Math.sin(missile.lifetime * 30) * 0.2;
      glow.scale.setScalar(scale);
    }
  }

  /**
   * Detonate a missile
   */
  private detonateMissile(missile: ActiveMissile, reason: string) {
    if (missile.hasDetonated) return;
    
    missile.hasDetonated = true;
    missile.isActive = false;
    
    console.log(`[MISSILES] Missile ${missile.id} detonated: ${reason}`);

    // Create explosion effect
    this.createExplosion(missile.position);

    // Dispatch hit event if it was a successful hit
    if (reason === 'hit' && missile.targetId) {
      window.dispatchEvent(new CustomEvent('missile-hit', {
        detail: {
          targetId: missile.targetId,
          damage: this.MISSILE_DAMAGE,
          position: missile.position.clone(),
        }
      }));
    }
  }

  /**
   * Create explosion effect at position
   */
  private createExplosion(position: THREE.Vector3) {
    if (!this.scene) return;

    // Simple expanding sphere explosion
    const explosionGeo = new THREE.SphereGeometry(1, 16, 16);
    const explosionMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 1,
    });
    const explosion = new THREE.Mesh(explosionGeo, explosionMat);
    explosion.position.copy(position);
    this.scene.add(explosion);

    // Animate explosion
    let scale = 1;
    const animate = () => {
      scale += 0.5;
      explosionMat.opacity -= 0.05;
      explosion.scale.setScalar(scale);

      if (explosionMat.opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        this.scene?.remove(explosion);
        explosionGeo.dispose();
        explosionMat.dispose();
      }
    };
    animate();
  }

  /**
   * Clean up detonated missiles
   */
  private cleanupMissiles() {
    this.activeMissiles = this.activeMissiles.filter(missile => {
      if (!missile.isActive) {
        if (this.scene) {
          this.scene.remove(missile.mesh);
        }
        // Dispose geometry/materials
        missile.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        return false;
      }
      return true;
    });
  }

  // ============ Public Getters ============

  /**
   * Get number of ready missiles
   */
  public getReadyCount(): number {
    return this.slots.filter(s => s.isReady).length;
  }

  /**
   * Get all slot states
   */
  public getSlots(): MissileSlot[] {
    return [...this.slots];
  }

  /**
   * Get active missile count
   */
  public getActiveMissileCount(): number {
    return this.activeMissiles.filter(m => m.isActive).length;
  }

  /**
   * Get HUD info
   */
  public getHUDInfo() {
    return {
      readyCount: this.getReadyCount(),
      maxMissiles: this.MAX_MISSILES,
      slots: this.getSlots(),
      activeMissiles: this.getActiveMissileCount(),
    };
  }

  /**
   * Apply upgrade modifiers (Phase 10)
   * @param totalMissiles - New maximum missile count
   * @param reloadMultiplier - Reload speed multiplier (higher = faster)
   */
  public applyUpgrades(totalMissiles: number, reloadMultiplier: number): void {
    // Add new slots if capacity increased
    while (this.slots.length < totalMissiles) {
      this.slots.push({
        isReady: true,
        cooldownTimer: 0,
        cooldownDuration: this.COOLDOWN_TIME / reloadMultiplier,
      });
    }
    
    // Update max missiles
    this.MAX_MISSILES = totalMissiles;
    
    // Update cooldown duration for all slots
    const newCooldown = this.COOLDOWN_TIME / reloadMultiplier;
    for (const slot of this.slots) {
      slot.cooldownDuration = newCooldown;
    }
    
    console.log(`[MISSILES] Upgrades applied: ${totalMissiles} missiles, ${(this.COOLDOWN_TIME / reloadMultiplier).toFixed(1)}s reload`);
  }

  /**
   * Update aircraft config when player changes aircraft
   * @param missiles - New base missile count
   * @param reloadTime - New base reload time in seconds
   */
  public updateAircraftConfig(missiles: number, reloadTime: number): void {
    // Reset slots array with new configuration
    this.slots = [];
    this.MAX_MISSILES = missiles;
    this.COOLDOWN_TIME = reloadTime;
    
    // Initialize fresh slots
    for (let i = 0; i < missiles; i++) {
      this.slots.push({
        isReady: true,
        cooldownTimer: 0,
        cooldownDuration: reloadTime,
      });
    }
    
    console.log(`[MISSILES] Aircraft config updated: ${missiles} missiles, ${reloadTime}s reload`);
  }

  /**
   * Dispose resources
   */
  public dispose() {
    for (const missile of this.activeMissiles) {
      if (this.scene) {
        this.scene.remove(missile.mesh);
      }
    }
    this.activeMissiles = [];
  }
}

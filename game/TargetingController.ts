import * as THREE from 'three';

/**
 * Lock state for individual targets
 */
export enum LockState {
  NO_LOCK = 'NO_LOCK',
  TRACKING = 'TRACKING',
  LOCKED = 'LOCKED'
}

/**
 * Individual lock data for a single target
 */
export interface Lock {
  target: TargetableEntity;
  state: LockState;
  acquireTimer: number;      // 0 → LOCK_ACQUISITION_TIME
  hasLineOfSight: boolean;
  inRange: boolean;
  inReticle: boolean;
  isPrimary: boolean;        // Closest locked target (for cannon)
}

/**
 * Interface for any entity that can be targeted
 */
export interface TargetableEntity {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  isAlive: boolean;
  id: string;
}

/**
 * TargetingController - Multi-target lock-on system
 * 
 * Features:
 * - Up to 5 simultaneous locks
 * - 2-second lock acquisition (arcade feel)
 * - Instant lock break on LOS loss or range exit
 * - Lead point calculation for aim assist
 * - Primary target designation (closest locked)
 */
export class TargetingController {
  // Configuration
  public readonly MAX_LOCKS = 5;
  public readonly DETECTION_RANGE = 500;       // Units (increased from 300)
  public readonly BASE_LOCK_ACQUISITION_TIME = 0.6; // Base seconds (faster from 1.0)
  public LOCK_ACQUISITION_TIME = 0.6;          // Current (affected by upgrades)
  public readonly LOCK_CONE_ANGLE = 75;        // Degrees - wider forward arc (from 60)
  public readonly RETICLE_BOUNDS = { width: 0.35, height: 0.30 }; // % of screen (larger from 0.25/0.20)

  // Upgrade multipliers
  private lockSpeedMultiplier = 1.0;

  // State
  private locks: Map<string, Lock> = new Map();
  private primaryTargetId: string | null = null;
  
  // References
  private camera: THREE.Camera | null = null;
  private screenSize = { width: 1920, height: 1080 };

  constructor() {
    this.locks = new Map();
  }

  /**
   * Set camera reference for screen-space calculations
   */
  public setCamera(camera: THREE.Camera) {
    this.camera = camera;
  }

  /**
   * Update screen size for reticle calculations
   */
  public setScreenSize(width: number, height: number) {
    this.screenSize = { width, height };
  }

  /**
   * Main update loop - process all potential targets
   */
  public update(
    dt: number,
    playerPosition: THREE.Vector3,
    playerForward: THREE.Vector3,
    enemies: TargetableEntity[]
  ) {
    // Get alive enemies within detection range
    const validTargets = enemies.filter(e => 
      e.isAlive && 
      e.position.distanceTo(playerPosition) <= this.DETECTION_RANGE
    );

    // Sort by distance (closest first for lock priority)
    validTargets.sort((a, b) => 
      a.position.distanceTo(playerPosition) - b.position.distanceTo(playerPosition)
    );

    // Process each valid target
    for (const target of validTargets) {
      this.processTarget(dt, target, playerPosition, playerForward);
    }

    // Remove locks for dead or out-of-range enemies
    this.cleanupInvalidLocks(playerPosition, enemies);

    // Update primary target (closest locked)
    this.updatePrimaryTarget(playerPosition);
  }

  /**
   * Process a single target for lock acquisition/maintenance
   */
  private processTarget(
    dt: number,
    target: TargetableEntity,
    playerPosition: THREE.Vector3,
    playerForward: THREE.Vector3
  ) {
    const existingLock = this.locks.get(target.id);
    
    // Check targeting conditions
    const inRange = target.position.distanceTo(playerPosition) <= this.DETECTION_RANGE;
    const inCone = this.isInLockCone(target.position, playerPosition, playerForward);
    const inReticle = this.isInReticleBounds(target.position);
    const hasLOS = this.checkLineOfSight(playerPosition, target.position);

    if (existingLock) {
      // Update existing lock
      this.updateLock(existingLock, dt, inRange, inCone, inReticle, hasLOS);
    } else if (inReticle && inRange && hasLOS && this.locks.size < this.MAX_LOCKS) {
      // Create new lock (start tracking)
      this.createLock(target);
    }
  }

  /**
   * Create a new tracking lock on a target
   */
  private createLock(target: TargetableEntity) {
    const lock: Lock = {
      target,
      state: LockState.TRACKING,
      acquireTimer: 0,
      hasLineOfSight: true,
      inRange: true,
      inReticle: true,
      isPrimary: false
    };
    this.locks.set(target.id, lock);
    console.log(`[TARGETING] Started tracking: ${target.id}`);
  }

  /**
   * Update an existing lock's state
   */
  private updateLock(
    lock: Lock,
    dt: number,
    inRange: boolean,
    inCone: boolean,
    inReticle: boolean,
    hasLOS: boolean
  ) {
    lock.inRange = inRange;
    lock.inReticle = inReticle;
    lock.hasLineOfSight = hasLOS;

    // Check for lock break conditions
    if (!inRange || !hasLOS) {
      this.breakLock(lock.target.id, !inRange ? 'out of range' : 'LOS lost');
      return;
    }

    switch (lock.state) {
      case LockState.TRACKING:
        // Must stay in reticle to continue acquisition
        if (inReticle && hasLOS) {
          lock.acquireTimer += dt;
          if (lock.acquireTimer >= this.LOCK_ACQUISITION_TIME) {
            lock.state = LockState.LOCKED;
            lock.acquireTimer = this.LOCK_ACQUISITION_TIME;
            console.log(`[TARGETING] LOCKED: ${lock.target.id}`);
          }
        } else {
          // Decay timer if not in reticle (but don't break lock immediately)
          lock.acquireTimer = Math.max(0, lock.acquireTimer - dt * 2);
          if (lock.acquireTimer <= 0) {
            this.breakLock(lock.target.id, 'tracking timeout');
          }
        }
        break;

      case LockState.LOCKED:
        // Locked targets only break on range/LOS loss
        // They don't need to stay in reticle once locked
        break;
    }
  }

  /**
   * Break a specific lock
   */
  public breakLock(targetId: string, reason: string = 'manual') {
    if (this.locks.has(targetId)) {
      console.log(`[TARGETING] Lock broken (${reason}): ${targetId}`);
      this.locks.delete(targetId);
      if (this.primaryTargetId === targetId) {
        this.primaryTargetId = null;
      }
    }
  }

  /**
   * Break all locks
   */
  public breakAllLocks() {
    this.locks.clear();
    this.primaryTargetId = null;
  }

  /**
   * Remove locks for invalid targets
   */
  private cleanupInvalidLocks(playerPosition: THREE.Vector3, enemies: TargetableEntity[]) {
    const enemyIds = new Set(enemies.map(e => e.id));
    
    for (const [id, lock] of this.locks) {
      // Target no longer exists or is dead
      if (!enemyIds.has(id) || !lock.target.isAlive) {
        this.breakLock(id, 'target destroyed');
        continue;
      }

      // Target out of range
      if (lock.target.position.distanceTo(playerPosition) > this.DETECTION_RANGE) {
        this.breakLock(id, 'out of range');
      }
    }
  }

  /**
   * Update which locked target is primary (closest)
   */
  private updatePrimaryTarget(playerPosition: THREE.Vector3) {
    let closestDist = Infinity;
    let closestId: string | null = null;

    for (const [id, lock] of this.locks) {
      if (lock.state === LockState.LOCKED) {
        const dist = lock.target.position.distanceTo(playerPosition);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
        }
        lock.isPrimary = false; // Reset, will set primary below
      }
    }

    this.primaryTargetId = closestId;
    if (closestId) {
      const primaryLock = this.locks.get(closestId);
      if (primaryLock) {
        primaryLock.isPrimary = true;
      }
    }
  }

  /**
   * Check if target is within the lock cone
   */
  private isInLockCone(
    targetPos: THREE.Vector3,
    playerPos: THREE.Vector3,
    playerForward: THREE.Vector3
  ): boolean {
    const toTarget = new THREE.Vector3().subVectors(targetPos, playerPos).normalize();
    const angle = Math.acos(toTarget.dot(playerForward)) * (180 / Math.PI);
    return angle <= this.LOCK_CONE_ANGLE / 2;
  }

  /**
   * Check if target is within reticle screen bounds
   */
  private isInReticleBounds(targetPos: THREE.Vector3): boolean {
    if (!this.camera) return false;

    // Project world position to screen
    const screenPos = targetPos.clone().project(this.camera);
    
    // Convert to normalized screen coords (-1 to 1 → 0 to 1)
    const nx = (screenPos.x + 1) / 2;
    const ny = (screenPos.y + 1) / 2;

    // Check if behind camera
    if (screenPos.z > 1) return false;

    // Check if within reticle bounds (centered)
    const halfWidth = this.RETICLE_BOUNDS.width / 2;
    const halfHeight = this.RETICLE_BOUNDS.height / 2;

    return (
      nx >= 0.5 - halfWidth &&
      nx <= 0.5 + halfWidth &&
      ny >= 0.5 - halfHeight &&
      ny <= 0.5 + halfHeight
    );
  }

  /**
   * Check line of sight (simplified - no terrain yet)
   */
  private checkLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    // TODO: Implement raycast against terrain/obstacles
    // For now, always return true
    return true;
  }

  // ============ Public Getters ============

  /**
   * Get all current locks
   */
  public getLocks(): Lock[] {
    return Array.from(this.locks.values());
  }

  /**
   * Get only fully locked targets
   */
  public getLockedTargets(): Lock[] {
    return this.getLocks().filter(l => l.state === LockState.LOCKED);
  }

  /**
   * Get tracking (not yet locked) targets
   */
  public getTrackingTargets(): Lock[] {
    return this.getLocks().filter(l => l.state === LockState.TRACKING);
  }

  /**
   * Get the primary target (closest locked)
   */
  public getPrimaryTarget(): Lock | null {
    if (!this.primaryTargetId) return null;
    return this.locks.get(this.primaryTargetId) || null;
  }

  /**
   * Get secondary locked targets (all except primary)
   */
  public getSecondaryTargets(): Lock[] {
    return this.getLockedTargets().filter(l => !l.isPrimary);
  }

  /**
   * Check if a specific target is locked
   */
  public isTargetLocked(targetId: string): boolean {
    const lock = this.locks.get(targetId);
    return lock?.state === LockState.LOCKED || false;
  }

  /**
   * Get number of available lock slots
   */
  public getAvailableLockSlots(): number {
    return this.MAX_LOCKS - this.locks.size;
  }

  /**
   * Calculate lead point for a target (where to aim)
   */
  public calculateLeadPoint(
    target: TargetableEntity,
    playerPosition: THREE.Vector3,
    projectileSpeed: number
  ): THREE.Vector3 {
    const distance = target.position.distanceTo(playerPosition);
    const timeToImpact = distance / projectileSpeed;
    
    // Lead point = current position + velocity * time
    return new THREE.Vector3()
      .copy(target.position)
      .add(target.velocity.clone().multiplyScalar(timeToImpact));
  }

  /**
   * Get targeting info for HUD display
   */
  public getHUDInfo(): {
    lockCount: number;
    maxLocks: number;
    primaryTarget: Lock | null;
    allLocks: Lock[];
    hasAnyLock: boolean;
  } {
    return {
      lockCount: this.locks.size,
      maxLocks: this.MAX_LOCKS,
      primaryTarget: this.getPrimaryTarget(),
      allLocks: this.getLocks(),
      hasAnyLock: this.locks.size > 0
    };
  }

  /**
   * Apply upgrade modifiers (Phase 10)
   * @param lockSpeedMultiplier - Lock speed multiplier (higher = faster lock)
   */
  public applyUpgrades(lockSpeedMultiplier: number): void {
    this.lockSpeedMultiplier = lockSpeedMultiplier;
    this.LOCK_ACQUISITION_TIME = this.BASE_LOCK_ACQUISITION_TIME / lockSpeedMultiplier;
    
    console.log(`[TARGETING] Upgrades applied: ${this.LOCK_ACQUISITION_TIME.toFixed(2)}s lock time`);
  }
}

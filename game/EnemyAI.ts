import * as THREE from 'three';
import { TargetableEntity } from './TargetingController';
import { 
  AircraftConfig, 
  getEffectiveHealth, 
  getEffectiveSpeed, 
  getEffectiveTurnRate,
  getEffectiveDamage 
} from './types/AircraftConfig';
import { VIPER_CONFIG } from './data/enemyAircraftConfigs';
import { createEnemyMesh, applyCloakEffect, removeCloakEffect, updateEngineGlow } from './models/EnemyModels';

/**
 * AI State enum
 */
export enum AIState {
  PATROL = 'PATROL',
  ENGAGEMENT = 'ENGAGEMENT',
  RETREAT = 'RETREAT',
  DESTROYED = 'DESTROYED'
}

/**
 * POI (Point of Interest) definition
 */
export interface POI {
  id: string;
  position: THREE.Vector3;
  radius: number;           // Territory radius
  threatLevel: number;      // 1-5 difficulty
  name: string;
}

/**
 * Legacy EnemyConfig interface for backwards compatibility
 * @deprecated Use AircraftConfig instead
 */
export interface EnemyConfig {
  maxHealth: number;
  speed: number;
  turnRate: number;
  attackRange: number;
  detectionRange: number;
  retreatHealthThreshold: number;  // % health to trigger retreat
  fireRate: number;
  damage: number;
}

/**
 * EnemyAI - State-based enemy aircraft AI
 * 
 * Now config-driven using AircraftConfig for different enemy types.
 * 
 * States:
 * - PATROL: Circle around POI, scan for player
 * - ENGAGEMENT: Pursue and attack player
 * - RETREAT: Flee when damaged, try to escape
 * - DESTROYED: Dead, pending cleanup
 */
export class EnemyAI implements TargetableEntity {
  // Identity
  public readonly id: string;
  public readonly aircraftConfig: AircraftConfig;
  
  // TargetableEntity interface
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public health: number;
  public maxHealth: number;
  public isAlive: boolean;

  // Derived stats from config
  private effectiveSpeed: number;
  private effectiveTurnRate: number;
  private effectiveDamage: number;
  
  // State machine
  public state: AIState = AIState.PATROL;
  private stateTimer: number = 0;
  public lastStateChange: number = 0;

  // Movement
  private quaternion: THREE.Quaternion;
  private targetPosition: THREE.Vector3;
  private currentSpeed: number;

  // Patrol state
  public assignedPOI: POI | null = null;
  private patrolAngle: number = 0;
  private patrolHeight: number = 0;
  private patrolRadius: number = 50;

  // Combat state
  private lastFireTime: number = 0;
  private targetPlayer: { position: THREE.Vector3; velocity: THREE.Vector3 } | null = null;
  private engagementTimer: number = 0;
  private attackRunTimer: number = 0;
  private isOnAttackRun: boolean = false;

  // Retreat state
  private retreatDirection: THREE.Vector3 = new THREE.Vector3();
  private retreatTimer: number = 0;

  // Special abilities
  private isCloaked: boolean = false;
  private cloakTimer: number = 0;
  private readonly CLOAK_DURATION = 2.0; // seconds

  // Visual
  public mesh: THREE.Group;

  constructor(
    id: string, 
    position: THREE.Vector3, 
    poi: POI | null = null, 
    config: AircraftConfig = VIPER_CONFIG
  ) {
    this.id = id;
    this.aircraftConfig = config;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    
    // Calculate effective stats from config
    this.maxHealth = getEffectiveHealth(config);
    this.health = this.maxHealth;
    this.effectiveSpeed = getEffectiveSpeed(config);
    this.effectiveTurnRate = getEffectiveTurnRate(config);
    this.effectiveDamage = getEffectiveDamage(config);
    
    this.isAlive = true;

    this.quaternion = new THREE.Quaternion();
    this.targetPosition = position.clone();
    this.currentSpeed = this.effectiveSpeed;

    this.assignedPOI = poi;
    this.patrolAngle = Math.random() * Math.PI * 2;
    this.patrolHeight = position.y;
    this.patrolRadius = poi ? 30 + Math.random() * 40 : 50;

    // Create mesh using the model factory
    this.mesh = createEnemyMesh(config);
    this.mesh.position.copy(this.position);
  }

  /**
   * Main update loop
   */
  public update(
    dt: number, 
    elapsedTime: number,
    playerPosition: THREE.Vector3,
    playerVelocity: THREE.Vector3
  ) {
    if (!this.isAlive) return;

    this.stateTimer += dt;
    this.targetPlayer = { position: playerPosition, velocity: playerVelocity };

    // Update cloak if active
    this.updateCloak(dt);

    // State machine
    switch (this.state) {
      case AIState.PATROL:
        this.updatePatrol(dt, elapsedTime, playerPosition);
        break;
      case AIState.ENGAGEMENT:
        this.updateEngagement(dt, elapsedTime, playerPosition);
        break;
      case AIState.RETREAT:
        this.updateRetreat(dt, elapsedTime, playerPosition);
        break;
    }

    // Apply movement
    this.applyMovement(dt);

    // Update mesh
    this.mesh.position.copy(this.position);
    this.mesh.quaternion.copy(this.quaternion);

    // Update engine glow based on speed
    const speedRatio = this.currentSpeed / this.effectiveSpeed;
    updateEngineGlow(this.mesh, speedRatio);

    // Check for state transitions
    this.checkStateTransitions(playerPosition);
  }

  // ============ CLOAK ABILITY ============

  private updateCloak(dt: number) {
    if (!this.isCloaked) return;

    this.cloakTimer -= dt;
    
    // Update cloak visual
    const cloakIntensity = Math.min(1, this.cloakTimer / (this.CLOAK_DURATION * 0.5));
    applyCloakEffect(this.mesh, cloakIntensity);

    if (this.cloakTimer <= 0) {
      this.isCloaked = false;
      removeCloakEffect(this.mesh);
    }
  }

  private activateCloak() {
    if (this.aircraftConfig.specialAbility !== 'cloak') return;
    if (this.isCloaked) return;

    this.isCloaked = true;
    this.cloakTimer = this.CLOAK_DURATION;
    console.log(`[AI ${this.id}] Cloak activated!`);
  }

  // ============ PATROL STATE ============

  private updatePatrol(dt: number, elapsedTime: number, playerPosition: THREE.Vector3) {
    // Use config agility to determine patrol speed
    const patrolSpeedMod = 0.5 + this.aircraftConfig.agility * 0.1;
    
    if (!this.assignedPOI) {
      // No POI assigned (wave-spawned enemy) - actively search for player
      // Instead of circling aimlessly, fly toward the player's last known position
      const distToPlayer = this.position.distanceTo(playerPosition);
      
      // If player is within extended search range, fly toward them
      // This makes wave-spawned enemies always hunt the player
      if (distToPlayer < this.aircraftConfig.detectionRange * 3) {
        // Fly toward player with some offset for variety
        const searchAngle = elapsedTime * 0.2 + this.patrolAngle;
        const searchOffset = new THREE.Vector3(
          Math.cos(searchAngle) * 30,
          Math.sin(searchAngle * 0.5) * 15,
          Math.sin(searchAngle) * 30
        );
        this.targetPosition.copy(playerPosition).add(searchOffset);
        this.currentSpeed = this.effectiveSpeed * 0.85; // Faster when hunting
      } else {
        // Player is very far, fly in expanding search pattern toward last position
        this.patrolAngle += dt * 0.3 * patrolSpeedMod;
        this.targetPosition.set(
          playerPosition.x + Math.cos(this.patrolAngle) * 100,
          playerPosition.y + Math.sin(elapsedTime * 0.5) * 20,
          playerPosition.z + Math.sin(this.patrolAngle) * 100
        );
        this.currentSpeed = this.effectiveSpeed * 0.8;
      }
    } else {
      // Circle around POI (legacy POI-based behavior)
      this.patrolAngle += dt * 0.4 * patrolSpeedMod;
      const heightVariation = Math.sin(elapsedTime * 0.3 + this.patrolAngle) * 15;
      
      this.targetPosition.set(
        this.assignedPOI.position.x + Math.cos(this.patrolAngle) * this.patrolRadius,
        this.assignedPOI.position.y + heightVariation,
        this.assignedPOI.position.z + Math.sin(this.patrolAngle) * this.patrolRadius
      );
      this.currentSpeed = this.effectiveSpeed * 0.7; // Slower during patrol
    }
  }

  // ============ ENGAGEMENT STATE ============

  private updateEngagement(dt: number, elapsedTime: number, playerPosition: THREE.Vector3) {
    this.engagementTimer += dt;
    this.attackRunTimer += dt;

    const distToPlayer = this.position.distanceTo(playerPosition);

    // Attack run timing based on aggressiveness
    const attackRunDuration = 5 - this.aircraftConfig.aggressiveness * 2;
    
    // Decide attack pattern
    if (this.attackRunTimer > attackRunDuration) {
      // More aggressive = more attack runs
      this.isOnAttackRun = Math.random() < this.aircraftConfig.aggressiveness;
      this.attackRunTimer = 0;
    }

    if (this.isOnAttackRun && distToPlayer < this.aircraftConfig.engageRange) {
      // Direct attack run - fly toward player
      this.targetPosition.copy(playerPosition);
      this.currentSpeed = this.effectiveSpeed * 1.1; // Slight boost during attack (reduced from 1.2)

      // Try to fire
      this.tryFire(elapsedTime, playerPosition);
    } else {
      // Circling/repositioning - orbit around player
      // Agility affects orbit tightness - slowed down for easier tracking
      const orbitSpeedMod = 0.3 + this.aircraftConfig.agility * 0.05;
      const orbitAngle = elapsedTime * 0.5 * orbitSpeedMod + this.patrolAngle;
      const orbitRadius = 80 + (5 - this.aircraftConfig.agility) * 15 + Math.sin(elapsedTime * 0.3) * 15;
      const orbitHeight = playerPosition.y + Math.sin(elapsedTime * 0.2) * 15; // Reduced vertical bobbing

      this.targetPosition.set(
        playerPosition.x + Math.cos(orbitAngle) * orbitRadius,
        orbitHeight,
        playerPosition.z + Math.sin(orbitAngle) * orbitRadius
      );
      this.currentSpeed = this.effectiveSpeed * 0.85; // Slow down during orbit for easier tracking
    }
  }

  private tryFire(elapsedTime: number, playerPosition: THREE.Vector3) {
    const timeBetweenShots = 1 / this.aircraftConfig.fireRate;
    if (elapsedTime - this.lastFireTime < timeBetweenShots) return;

    const distToPlayer = this.position.distanceTo(playerPosition);
    if (distToPlayer > this.aircraftConfig.engageRange) return;

    // Check if player is roughly in front
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    const toPlayer = new THREE.Vector3().subVectors(playerPosition, this.position).normalize();
    const dot = forward.dot(toPlayer);

    if (dot > 0.7) { // Within ~45 degrees
      this.lastFireTime = elapsedTime;
      
      // Dispatch enemy fire event
      window.dispatchEvent(new CustomEvent('enemy-fire', {
        detail: {
          enemyId: this.id,
          enemyType: this.aircraftConfig.id,
          position: this.position.clone(),
          direction: toPlayer.clone(),
          damage: this.effectiveDamage,
          projectileSpeed: this.aircraftConfig.projectileSpeed,
        }
      }));
    }
  }

  // ============ RETREAT STATE ============

  private updateRetreat(dt: number, elapsedTime: number, playerPosition: THREE.Vector3) {
    this.retreatTimer += dt;

    // Flee away from player
    if (this.retreatTimer < 0.5 || this.retreatDirection.lengthSq() < 0.1) {
      // Calculate retreat direction (away from player, toward POI if possible)
      this.retreatDirection.subVectors(this.position, playerPosition).normalize();
      
      if (this.assignedPOI) {
        // Bias toward POI
        const toPOI = new THREE.Vector3().subVectors(this.assignedPOI.position, this.position).normalize();
        this.retreatDirection.lerp(toPOI, 0.3);
        this.retreatDirection.normalize();
      }

      // Add some vertical escape
      this.retreatDirection.y += 0.3;
      this.retreatDirection.normalize();
    }

    // Target position far in retreat direction
    this.targetPosition.copy(this.position).add(
      this.retreatDirection.clone().multiplyScalar(200)
    );

    // Fast retreat - scouts retreat faster
    const retreatSpeedMod = 1.2 + (this.aircraftConfig.speed - 3) * 0.1;
    this.currentSpeed = this.effectiveSpeed * retreatSpeedMod;

    // Check if safe to return to patrol
    const distToPlayer = this.position.distanceTo(playerPosition);
    if (distToPlayer > this.aircraftConfig.detectionRange * 1.5 && this.retreatTimer > 5) {
      this.changeState(AIState.PATROL);
    }
  }

  // ============ MOVEMENT ============

  private applyMovement(dt: number) {
    // Direction to target
    const toTarget = new THREE.Vector3().subVectors(this.targetPosition, this.position);
    const distance = toTarget.length();
    
    if (distance > 1) {
      toTarget.normalize();

      // Current forward direction
      const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);

      // Smoothly rotate toward target - agility affects turn rate
      const newForward = currentForward.lerp(toTarget, this.effectiveTurnRate * dt);
      newForward.normalize();

      // Update quaternion to face new direction
      const up = new THREE.Vector3(0, 1, 0);
      const matrix = new THREE.Matrix4().lookAt(
        this.position,
        this.position.clone().add(newForward),
        up
      );
      this.quaternion.setFromRotationMatrix(matrix);

      // Apply velocity
      this.velocity.copy(newForward).multiplyScalar(this.currentSpeed);
      this.position.add(this.velocity.clone().multiplyScalar(dt));

      // Add some banking based on turn rate
      const cross = new THREE.Vector3().crossVectors(currentForward, toTarget);
      const bankAngle = cross.y * 0.5;
      const bankQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        -bankAngle
      );
      this.quaternion.multiply(bankQuat);
    }
  }

  // ============ STATE TRANSITIONS ============

  private checkStateTransitions(playerPosition: THREE.Vector3) {
    const distToPlayer = this.position.distanceTo(playerPosition);
    const healthPercent = this.health / this.maxHealth;

    switch (this.state) {
      case AIState.PATROL:
        // Engage if player enters detection range
        // For wave-spawned enemies (no POI), use extended detection range to engage sooner
        const effectiveDetectionRange = this.assignedPOI 
          ? this.aircraftConfig.detectionRange 
          : this.aircraftConfig.detectionRange * 2.5; // Wave enemies detect player from further away
        if (distToPlayer < effectiveDetectionRange) {
          this.changeState(AIState.ENGAGEMENT);
        }
        break;

      case AIState.ENGAGEMENT:
        // Retreat if low health (based on config retreat threshold)
        if (healthPercent < this.aircraftConfig.retreatHealth) {
          this.changeState(AIState.RETREAT);
        }
        // Return to patrol only if player escapes FAR away (increased from 1.5x to 4x detection range)
        // For wave-spawned enemies (no POI), they should almost never disengage
        else if (distToPlayer > this.aircraftConfig.detectionRange * (this.assignedPOI ? 2 : 4)) {
          this.changeState(AIState.PATROL);
        }
        break;

      case AIState.RETREAT:
        // Already handled in updateRetreat
        break;
    }
  }

  private changeState(newState: AIState) {
    if (this.state === newState) return;

    console.log(`[AI ${this.id}] ${this.state} → ${newState}`);
    
    this.state = newState;
    this.stateTimer = 0;
    this.lastStateChange = performance.now();

    // State entry actions
    switch (newState) {
      case AIState.ENGAGEMENT:
        this.engagementTimer = 0;
        this.attackRunTimer = 0;
        this.isOnAttackRun = false;
        break;
      case AIState.RETREAT:
        this.retreatTimer = 0;
        this.retreatDirection.set(0, 0, 0);
        break;
      case AIState.PATROL:
        // Reset patrol angle for variety
        this.patrolAngle = Math.random() * Math.PI * 2;
        break;
    }
  }

  /**
   * Force enemy into engagement state (used for wave-spawned enemies)
   * This ensures enemies start combat-ready instead of in patrol mode
   */
  public forceEngagement(): void {
    if (this.state !== AIState.ENGAGEMENT) {
      console.log(`[AI ${this.id}] Forced into ENGAGEMENT mode`);
      this.changeState(AIState.ENGAGEMENT);
    }
  }

  // ============ DAMAGE ============

  public takeDamage(amount: number, source: string = 'unknown') {
    if (!this.isAlive) return;
    if (this.isCloaked) return; // Immune while cloaked

    this.health -= amount;
    console.log(`[AI ${this.id}] Took ${amount} damage from ${source}. HP: ${this.health}/${this.maxHealth}`);

    // Specter activates cloak when damaged
    if (this.aircraftConfig.specialAbility === 'cloak' && this.health > 0) {
      this.activateCloak();
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      this.state = AIState.DESTROYED;
      console.log(`[AI ${this.id}] ${this.aircraftConfig.name} DESTROYED!`);
      
      window.dispatchEvent(new CustomEvent('enemy-destroyed', {
        detail: {
          enemyId: this.id,
          enemyType: this.aircraftConfig.id,
          enemyName: this.aircraftConfig.name,
          enemyClass: this.aircraftConfig.class,
          basePoints: this.aircraftConfig.basePoints,
          position: this.position.clone(),
        }
      }));
    } else if (this.state === AIState.PATROL) {
      // Getting hit while patrolling triggers engagement
      this.changeState(AIState.ENGAGEMENT);
    }
  }

  // ============ UTILITY ============

  public getStateColor(): number {
    switch (this.state) {
      case AIState.PATROL: return 0x00ff00;    // Green
      case AIState.ENGAGEMENT: return 0xff0000; // Red
      case AIState.RETREAT: return 0xffff00;   // Yellow
      default: return 0x888888;
    }
  }

  public getStateName(): string {
    switch (this.state) {
      case AIState.PATROL: return 'patrol';
      case AIState.ENGAGEMENT: return 'engagement';
      case AIState.RETREAT: return 'retreat';
      case AIState.DESTROYED: return 'destroyed';
      default: return 'unknown';
    }
  }

  public getAircraftType(): string {
    return this.aircraftConfig.id;
  }

  public getAircraftClass(): string {
    return this.aircraftConfig.class;
  }

  public getBasePoints(): number {
    return this.aircraftConfig.basePoints;
  }

  public isCloakedActive(): boolean {
    return this.isCloaked;
  }

  public dispose() {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  /**
   * Apply difficulty scaling to this enemy
   * Call this after construction to scale health and damage based on wave
   */
  public applyDifficultyScaling(healthMultiplier: number, damageMultiplier: number): void {
    this.maxHealth = Math.ceil(this.maxHealth * healthMultiplier);
    this.health = this.maxHealth;
    this.effectiveDamage = Math.ceil(this.effectiveDamage * damageMultiplier);
    // Note: aggressiveness is read from config, could be scaled in combat logic
  }

  /**
   * Phase 16: Apply speed multiplier for endless mode
   */
  public applySpeedMultiplier(speedMultiplier: number): void {
    this.effectiveSpeed *= speedMultiplier;
    // Cap speed to prevent ridiculous values
    this.effectiveSpeed = Math.min(this.effectiveSpeed, 200);
  }
}

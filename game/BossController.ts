import * as THREE from 'three';
import { createCarrierDroneModel, createCommandShipModel, createSwarmQueenModel } from './models/BossModels';

// ============================================
// BOSS TYPES & CONFIGURATIONS
// ============================================

export type BossType = 'carrier-drone' | 'command-ship' | 'swarm-queen';

export interface BossPhase {
  name: string;
  healthThreshold: number; // Percentage (0-100) when this phase activates
  attackPattern: string;
  description: string;
}

export interface WeakPoint {
  id: string;
  name: string;
  position: THREE.Vector3; // Relative to boss center
  health: number;
  maxHealth: number;
  isExposed: boolean;
  damageMultiplier: number;
  mesh?: THREE.Mesh;
}

export interface BossConfig {
  type: BossType;
  name: string;
  title: string;
  maxHealth: number;
  phases: BossPhase[];
  weakPoints: Omit<WeakPoint, 'mesh'>[];
  minionSpawnRate: number; // Seconds between spawns
  minionTypes: string[];
  scoreValue: number;
  size: number; // Scale multiplier
  speed: number;
  rotationSpeed: number;
}

// ============================================
// BOSS CONFIGURATIONS
// ============================================

export const BOSS_CONFIGS: Record<BossType, BossConfig> = {
  'carrier-drone': {
    type: 'carrier-drone',
    name: 'CARRIER DRONE',
    title: 'Phantom Factory',
    maxHealth: 2000,
    phases: [
      {
        name: 'Phase 1: Swarm Deployment',
        healthThreshold: 100,
        attackPattern: 'spawn-phantoms',
        description: 'Continuously spawns Phantom drones',
      },
      {
        name: 'Phase 2: Missile Barrage',
        healthThreshold: 50,
        attackPattern: 'missile-barrage',
        description: 'Launches missile barrages while spawning',
      },
      {
        name: 'Phase 3: Desperate Defense',
        healthThreshold: 25,
        attackPattern: 'all-out',
        description: 'All weapons active, faster spawns',
      },
    ],
    weakPoints: [
      { id: 'engine-1', name: 'Engine Core 1', position: new THREE.Vector3(-15, 0, -10), health: 500, maxHealth: 500, isExposed: true, damageMultiplier: 2.0 },
      { id: 'engine-2', name: 'Engine Core 2', position: new THREE.Vector3(15, 0, -10), health: 500, maxHealth: 500, isExposed: true, damageMultiplier: 2.0 },
      { id: 'engine-3', name: 'Engine Core 3', position: new THREE.Vector3(-15, 0, 10), health: 500, maxHealth: 500, isExposed: true, damageMultiplier: 2.0 },
      { id: 'engine-4', name: 'Engine Core 4', position: new THREE.Vector3(15, 0, 10), health: 500, maxHealth: 500, isExposed: true, damageMultiplier: 2.0 },
    ],
    minionSpawnRate: 5,
    minionTypes: ['phantom'],
    scoreValue: 5000,
    size: 8,
    speed: 20,
    rotationSpeed: 0.2,
  },
  
  'command-ship': {
    type: 'command-ship',
    name: 'COMMAND SHIP',
    title: 'The Overseer',
    maxHealth: 3500,
    phases: [
      {
        name: 'Phase 1: Escort Protocol',
        healthThreshold: 100,
        attackPattern: 'deploy-wardens',
        description: 'Deploys Warden escorts for protection',
      },
      {
        name: 'Phase 2: Energy Beam',
        healthThreshold: 60,
        attackPattern: 'energy-beam',
        description: 'Fires devastating energy beam attacks',
      },
      {
        name: 'Phase 3: Shield Rotation',
        healthThreshold: 30,
        attackPattern: 'shield-rotation',
        description: 'Rotating shields expose the bridge',
      },
    ],
    weakPoints: [
      { id: 'bridge', name: 'Bridge', position: new THREE.Vector3(0, 8, 15), health: 1000, maxHealth: 1000, isExposed: false, damageMultiplier: 3.0 },
    ],
    minionSpawnRate: 8,
    minionTypes: ['warden', 'viper'],
    scoreValue: 10000,
    size: 12,
    speed: 15,
    rotationSpeed: 0.15,
  },
  
  'swarm-queen': {
    type: 'swarm-queen',
    name: 'THE SWARM QUEEN',
    title: 'Hive Mind',
    maxHealth: 5000,
    phases: [
      {
        name: 'Phase 1: Specter Guard',
        healthThreshold: 100,
        attackPattern: 'specter-swarm',
        description: 'Protected by elite Specter units',
      },
      {
        name: 'Phase 2: Drone Bombs',
        healthThreshold: 50,
        attackPattern: 'tracking-bombs',
        description: 'Launches tracking drone bombs',
      },
      {
        name: 'Phase 3: Core Exposed',
        healthThreshold: 25,
        attackPattern: 'desperate-assault',
        description: 'Core exposed, desperate attacks',
      },
    ],
    weakPoints: [
      { id: 'core', name: 'Queen Core', position: new THREE.Vector3(0, 0, 0), health: 2000, maxHealth: 2000, isExposed: false, damageMultiplier: 5.0 },
    ],
    minionSpawnRate: 4,
    minionTypes: ['specter', 'viper'],
    scoreValue: 25000,
    size: 15,
    speed: 10,
    rotationSpeed: 0.1,
  },
};

// ============================================
// BOSS STATE
// ============================================

export type BossState = 'spawning' | 'active' | 'phase-transition' | 'defeated' | 'despawning';

export interface BossInstance {
  config: BossConfig;
  health: number;
  maxHealth: number;
  currentPhase: number;
  state: BossState;
  weakPoints: WeakPoint[];
  position: THREE.Vector3;
  rotation: THREE.Euler;
  mesh: THREE.Group | null;
  lastMinionSpawn: number;
  lastAttack: number;
  phaseTransitionTime: number;
  targetPosition: THREE.Vector3;
  orbitAngle: number;
}

// ============================================
// BOSS CONTROLLER
// ============================================

export class BossController {
  private scene: THREE.Scene;
  private activeBoss: BossInstance | null = null;
  private playerPosition: THREE.Vector3 = new THREE.Vector3();
  private isEnabled: boolean = false;
  
  // Attack cooldowns
  private readonly MISSILE_COOLDOWN = 3000; // ms
  private readonly BEAM_COOLDOWN = 5000; // ms
  private readonly BOMB_COOLDOWN = 4000; // ms
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Listen for boss-related events
    window.addEventListener('spawn-boss', this.handleSpawnBoss as EventListener);
    window.addEventListener('boss-hit', this.handleBossHit as EventListener);
    window.addEventListener('player-position-update', this.handlePlayerPosition as EventListener);
  }
  
  // ============ SPAWNING ============
  
  private handleSpawnBoss = (e: CustomEvent) => {
    const { bossType, position } = e.detail as { bossType: BossType; position: THREE.Vector3 };
    this.spawnBoss(bossType, position);
  };
  
  public spawnBoss(type: BossType, position: THREE.Vector3): void {
    if (this.activeBoss) {
      console.warn('[BOSS] Cannot spawn - boss already active');
      return;
    }
    
    const config = BOSS_CONFIGS[type];
    if (!config) {
      console.error(`[BOSS] Unknown boss type: ${type}`);
      return;
    }
    
    console.log(`[BOSS] Spawning ${config.name} at`, position);
    
    // Create boss instance
    this.activeBoss = {
      config,
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      currentPhase: 0,
      state: 'spawning',
      weakPoints: config.weakPoints.map(wp => ({ ...wp, position: wp.position.clone() })),
      position: position.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      mesh: null,
      lastMinionSpawn: 0,
      lastAttack: 0,
      phaseTransitionTime: 0,
      targetPosition: position.clone(),
      orbitAngle: 0,
    };
    
    // Create 3D model
    this.createBossModel(type);
    
    // Enable controller
    this.isEnabled = true;
    
    // Dispatch boss spawned event
    window.dispatchEvent(new CustomEvent('boss-spawned', {
      detail: {
        type,
        name: config.name,
        title: config.title,
        health: config.maxHealth,
        maxHealth: config.maxHealth,
        phases: config.phases.length,
        currentPhase: 1,
      }
    }));
    
    // After spawn animation, become active
    setTimeout(() => {
      if (this.activeBoss) {
        this.activeBoss.state = 'active';
        console.log(`[BOSS] ${config.name} is now active!`);
      }
    }, 2000);
  }
  
  private createBossModel(type: BossType): void {
    if (!this.activeBoss) return;
    
    let model: THREE.Group;
    
    switch (type) {
      case 'carrier-drone':
        model = createCarrierDroneModel();
        break;
      case 'command-ship':
        model = createCommandShipModel();
        break;
      case 'swarm-queen':
        model = createSwarmQueenModel();
        break;
      default:
        model = this.createPlaceholderModel();
    }
    
    // Scale and position
    model.scale.setScalar(this.activeBoss.config.size);
    model.position.copy(this.activeBoss.position);
    
    // Add weak point markers
    this.activeBoss.weakPoints.forEach(wp => {
      const markerGeom = new THREE.SphereGeometry(0.5, 8, 8);
      const markerMat = new THREE.MeshBasicMaterial({
        color: wp.isExposed ? 0xff0000 : 0x444444,
        transparent: true,
        opacity: 0.8,
      });
      const marker = new THREE.Mesh(markerGeom, markerMat);
      marker.position.copy(wp.position);
      marker.name = `weakpoint-${wp.id}`;
      wp.mesh = marker;
      model.add(marker);
    });
    
    this.activeBoss.mesh = model;
    this.scene.add(model);
  }
  
  private createPlaceholderModel(): THREE.Group {
    const group = new THREE.Group();
    
    const geometry = new THREE.BoxGeometry(10, 5, 15);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0x440044,
      metalness: 0.8,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    
    return group;
  }
  
  // ============ DAMAGE HANDLING ============
  
  private handleBossHit = (e: CustomEvent) => {
    const { damage, hitPosition, weaponType } = e.detail as {
      damage: number;
      hitPosition: THREE.Vector3;
      weaponType: 'missile' | 'cannon';
    };
    
    this.takeDamage(damage, hitPosition, weaponType);
  };
  
  public takeDamage(baseDamage: number, hitPosition: THREE.Vector3, weaponType: string): void {
    if (!this.activeBoss || this.activeBoss.state !== 'active') return;
    
    let damage = baseDamage;
    let hitWeakPoint: WeakPoint | null = null;
    
    // Create hit explosion and play sound (moved from GameEngine)
    window.dispatchEvent(new CustomEvent('create-explosion', {
      detail: {
        position: hitPosition.clone(),
        scale: 0.5,
      }
    }));
    window.dispatchEvent(new CustomEvent('audio-play', {
      detail: { sound: 'enemy-hit' }
    }));
    
    // Check if we hit a weak point
    for (const wp of this.activeBoss.weakPoints) {
      if (!wp.isExposed || wp.health <= 0) continue;
      
      const wpWorldPos = wp.position.clone().add(this.activeBoss.position);
      const distance = hitPosition.distanceTo(wpWorldPos);
      
      if (distance < 5 * this.activeBoss.config.size) {
        // Hit the weak point!
        damage *= wp.damageMultiplier;
        hitWeakPoint = wp;
        break;
      }
    }
    
    // Apply damage
    if (hitWeakPoint) {
      hitWeakPoint.health -= damage;
      console.log(`[BOSS] Weak point ${hitWeakPoint.name} hit! HP: ${hitWeakPoint.health}/${hitWeakPoint.maxHealth}`);
      
      if (hitWeakPoint.health <= 0) {
        hitWeakPoint.health = 0;
        this.onWeakPointDestroyed(hitWeakPoint);
      }
      
      // Dispatch weak point hit event
      window.dispatchEvent(new CustomEvent('boss-weakpoint-hit', {
        detail: {
          weakPointId: hitWeakPoint.id,
          weakPointName: hitWeakPoint.name,
          damage,
          remainingHealth: hitWeakPoint.health,
          destroyed: hitWeakPoint.health <= 0,
        }
      }));
    }
    
    // Always apply some damage to main health
    const mainDamage = hitWeakPoint ? damage * 0.5 : damage;
    this.activeBoss.health -= mainDamage;
    
    console.log(`[BOSS] ${this.activeBoss.config.name} HP: ${Math.floor(this.activeBoss.health)}/${this.activeBoss.maxHealth}`);
    
    // Dispatch health update
    window.dispatchEvent(new CustomEvent('boss-health-update', {
      detail: {
        health: this.activeBoss.health,
        maxHealth: this.activeBoss.maxHealth,
        percentage: (this.activeBoss.health / this.activeBoss.maxHealth) * 100,
        currentPhase: this.activeBoss.currentPhase + 1,
      }
    }));
    
    // Check for phase transition
    this.checkPhaseTransition();
    
    // Check for defeat
    if (this.activeBoss.health <= 0) {
      this.onBossDefeated();
    }
  }
  
  private onWeakPointDestroyed(weakPoint: WeakPoint): void {
    console.log(`[BOSS] Weak point DESTROYED: ${weakPoint.name}`);
    
    // Visual feedback
    if (weakPoint.mesh) {
      weakPoint.mesh.visible = false;
    }
    
    // Explosion effect
    window.dispatchEvent(new CustomEvent('create-explosion', {
      detail: {
        position: weakPoint.position.clone().add(this.activeBoss!.position),
        scale: 3,
        color: 0xff4400,
      }
    }));
    
    // Check if all weak points destroyed (for Carrier Drone)
    if (this.activeBoss?.config.type === 'carrier-drone') {
      const allDestroyed = this.activeBoss.weakPoints.every(wp => wp.health <= 0);
      if (allDestroyed) {
        // Massive damage bonus
        this.activeBoss.health -= 500;
        console.log('[BOSS] All engine cores destroyed! Massive damage!');
      }
    }
  }
  
  private checkPhaseTransition(): void {
    if (!this.activeBoss) return;
    
    const healthPercent = (this.activeBoss.health / this.activeBoss.maxHealth) * 100;
    const phases = this.activeBoss.config.phases;
    
    // Find which phase we should be in
    for (let i = phases.length - 1; i >= 0; i--) {
      if (healthPercent <= phases[i].healthThreshold && i > this.activeBoss.currentPhase) {
        this.transitionToPhase(i);
        break;
      }
    }
  }
  
  private transitionToPhase(phaseIndex: number): void {
    if (!this.activeBoss) return;
    
    const phase = this.activeBoss.config.phases[phaseIndex];
    console.log(`[BOSS] Transitioning to ${phase.name}`);
    
    this.activeBoss.currentPhase = phaseIndex;
    this.activeBoss.state = 'phase-transition';
    this.activeBoss.phaseTransitionTime = Date.now();
    
    // Dispatch phase change event
    window.dispatchEvent(new CustomEvent('boss-phase-change', {
      detail: {
        phase: phaseIndex + 1,
        totalPhases: this.activeBoss.config.phases.length,
        phaseName: phase.name,
        description: phase.description,
      }
    }));
    
    // Expose weak points in later phases
    if (this.activeBoss.config.type === 'command-ship' && phaseIndex >= 2) {
      // Expose the bridge in phase 3
      const bridge = this.activeBoss.weakPoints.find(wp => wp.id === 'bridge');
      if (bridge) {
        bridge.isExposed = true;
        if (bridge.mesh) {
          (bridge.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
        }
        console.log('[BOSS] Bridge is now exposed!');
      }
    }
    
    if (this.activeBoss.config.type === 'swarm-queen' && phaseIndex >= 2) {
      // Expose the core in phase 3
      const core = this.activeBoss.weakPoints.find(wp => wp.id === 'core');
      if (core) {
        core.isExposed = true;
        if (core.mesh) {
          (core.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
        }
        console.log('[BOSS] Queen Core is now exposed!');
      }
    }
    
    // Resume active state after transition
    setTimeout(() => {
      if (this.activeBoss) {
        this.activeBoss.state = 'active';
      }
    }, 1500);
  }
  
  private onBossDefeated(): void {
    if (!this.activeBoss) return;
    
    console.log(`[BOSS] ${this.activeBoss.config.name} DEFEATED!`);
    this.activeBoss.state = 'defeated';
    this.activeBoss.health = 0;
    
    // Dispatch defeat event
    window.dispatchEvent(new CustomEvent('boss-defeated', {
      detail: {
        type: this.activeBoss.config.type,
        name: this.activeBoss.config.name,
        scoreValue: this.activeBoss.config.scoreValue,
      }
    }));
    
    // Create massive explosion
    window.dispatchEvent(new CustomEvent('create-explosion', {
      detail: {
        position: this.activeBoss.position.clone(),
        scale: this.activeBoss.config.size * 2,
        color: 0xff8800,
      }
    }));
    
    // Award score
    window.dispatchEvent(new CustomEvent('enemy-destroyed', {
      detail: {
        points: this.activeBoss.config.scoreValue,
        enemyType: this.activeBoss.config.type,
        position: this.activeBoss.position.clone(),
        isBoss: true,
      }
    }));
    
    // Clean up after explosion
    setTimeout(() => {
      this.despawnBoss();
    }, 3000);
  }
  
  private despawnBoss(): void {
    if (!this.activeBoss) return;
    
    if (this.activeBoss.mesh) {
      this.scene.remove(this.activeBoss.mesh);
      this.activeBoss.mesh = null;
    }
    
    this.activeBoss = null;
    this.isEnabled = false;
    
    console.log('[BOSS] Boss despawned');
  }
  
  // ============ UPDATE LOOP ============
  
  private handlePlayerPosition = (e: CustomEvent) => {
    const { position } = e.detail;
    this.playerPosition.copy(position);
  };
  
  public update(delta: number, playerPosition: THREE.Vector3): void {
    if (!this.activeBoss || !this.isEnabled) return;
    
    this.playerPosition.copy(playerPosition);
    
    switch (this.activeBoss.state) {
      case 'spawning':
        this.updateSpawning(delta);
        break;
      case 'active':
        this.updateActive(delta);
        break;
      case 'phase-transition':
        this.updatePhaseTransition(delta);
        break;
      case 'defeated':
        this.updateDefeated(delta);
        break;
    }
    
    // Update mesh position
    if (this.activeBoss.mesh) {
      this.activeBoss.mesh.position.copy(this.activeBoss.position);
      this.activeBoss.mesh.rotation.copy(this.activeBoss.rotation);
    }
  }
  
  private updateSpawning(delta: number): void {
    if (!this.activeBoss?.mesh) return;
    
    // Slow rotation during spawn
    this.activeBoss.rotation.y += delta * 0.5;
    
    // Pulsing effect
    const scale = this.activeBoss.config.size * (1 + Math.sin(Date.now() * 0.005) * 0.05);
    this.activeBoss.mesh.scale.setScalar(scale);
  }
  
  private updateActive(delta: number): void {
    if (!this.activeBoss) return;
    
    const now = Date.now();
    const config = this.activeBoss.config;
    const phase = config.phases[this.activeBoss.currentPhase];
    
    // Orbit around player
    this.activeBoss.orbitAngle += delta * config.rotationSpeed;
    const orbitRadius = 200 + this.activeBoss.currentPhase * 50; // Get closer in later phases
    
    this.activeBoss.targetPosition.set(
      this.playerPosition.x + Math.cos(this.activeBoss.orbitAngle) * orbitRadius,
      this.playerPosition.y + 30 + Math.sin(this.activeBoss.orbitAngle * 0.5) * 20,
      this.playerPosition.z + Math.sin(this.activeBoss.orbitAngle) * orbitRadius
    );
    
    // Smoothly move towards target
    this.activeBoss.position.lerp(this.activeBoss.targetPosition, delta * config.speed * 0.01);
    
    // Face the player
    const lookDir = new THREE.Vector3().subVectors(this.playerPosition, this.activeBoss.position);
    this.activeBoss.rotation.y = Math.atan2(lookDir.x, lookDir.z);
    
    // Spawn minions
    if (now - this.activeBoss.lastMinionSpawn > config.minionSpawnRate * 1000) {
      this.spawnMinions();
      this.activeBoss.lastMinionSpawn = now;
    }
    
    // Execute attack patterns
    this.executeAttackPattern(phase.attackPattern, now);
  }
  
  private updatePhaseTransition(delta: number): void {
    if (!this.activeBoss?.mesh) return;
    
    // Dramatic slow rotation
    this.activeBoss.rotation.y += delta * 2;
    
    // Flash effect
    const flash = Math.sin(Date.now() * 0.02) > 0;
    this.activeBoss.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat.emissive) {
          mat.emissive.setHex(flash ? 0xffffff : 0x440044);
        }
      }
    });
  }
  
  private updateDefeated(delta: number): void {
    if (!this.activeBoss?.mesh) return;
    
    // Spin and fall
    this.activeBoss.rotation.x += delta * 2;
    this.activeBoss.rotation.z += delta * 1.5;
    this.activeBoss.position.y -= delta * 50;
    
    // Shrink
    const currentScale = this.activeBoss.mesh.scale.x;
    this.activeBoss.mesh.scale.setScalar(Math.max(0.1, currentScale - delta * 2));
  }
  
  // ============ ATTACK PATTERNS ============
  
  private spawnMinions(): void {
    if (!this.activeBoss) return;
    
    const config = this.activeBoss.config;
    const minionType = config.minionTypes[Math.floor(Math.random() * config.minionTypes.length)];
    
    // Spawn position offset from boss
    const spawnOffset = new THREE.Vector3(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 50
    );
    const spawnPos = this.activeBoss.position.clone().add(spawnOffset);
    
    // Request minion spawn
    window.dispatchEvent(new CustomEvent('boss-spawn-minion', {
      detail: {
        type: minionType,
        position: spawnPos,
        bossType: config.type,
      }
    }));
    
    console.log(`[BOSS] Spawning ${minionType} minion`);
  }
  
  private executeAttackPattern(pattern: string, now: number): void {
    if (!this.activeBoss) return;
    
    switch (pattern) {
      case 'spawn-phantoms':
        // Just spawns minions, handled by spawnMinions
        break;
        
      case 'missile-barrage':
        if (now - this.activeBoss.lastAttack > this.MISSILE_COOLDOWN) {
          this.fireMissileBarrage();
          this.activeBoss.lastAttack = now;
        }
        break;
        
      case 'deploy-wardens':
        // Handled by minion spawning with warden type
        break;
        
      case 'energy-beam':
        if (now - this.activeBoss.lastAttack > this.BEAM_COOLDOWN) {
          this.fireEnergyBeam();
          this.activeBoss.lastAttack = now;
        }
        break;
        
      case 'shield-rotation':
        // Shield rotation is visual, weak point exposure handled in phase transition
        if (now - this.activeBoss.lastAttack > this.BEAM_COOLDOWN) {
          this.fireEnergyBeam();
          this.activeBoss.lastAttack = now;
        }
        break;
        
      case 'specter-swarm':
        // Handled by minion spawning with specter type
        break;
        
      case 'tracking-bombs':
        if (now - this.activeBoss.lastAttack > this.BOMB_COOLDOWN) {
          this.launchTrackingBombs();
          this.activeBoss.lastAttack = now;
        }
        break;
        
      case 'all-out':
      case 'desperate-assault':
        // Faster attacks in desperate phase
        if (now - this.activeBoss.lastAttack > this.MISSILE_COOLDOWN * 0.5) {
          this.fireMissileBarrage();
          this.activeBoss.lastAttack = now;
        }
        break;
    }
  }
  
  private fireMissileBarrage(): void {
    if (!this.activeBoss) return;
    
    console.log('[BOSS] Firing missile barrage!');
    
    // Fire multiple missiles at player
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (!this.activeBoss) return;
        
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10,
          0
        );
        const launchPos = this.activeBoss.position.clone().add(offset);
        
        window.dispatchEvent(new CustomEvent('boss-fire-missile', {
          detail: {
            position: launchPos,
            target: this.playerPosition.clone(),
            damage: 15,
            speed: 80,
          }
        }));
      }, i * 200);
    }
  }
  
  private fireEnergyBeam(): void {
    if (!this.activeBoss) return;
    
    console.log('[BOSS] Firing energy beam!');
    
    window.dispatchEvent(new CustomEvent('boss-fire-beam', {
      detail: {
        origin: this.activeBoss.position.clone(),
        target: this.playerPosition.clone(),
        damage: 30,
        duration: 1500,
      }
    }));
  }
  
  private launchTrackingBombs(): void {
    if (!this.activeBoss) return;
    
    console.log('[BOSS] Launching tracking bombs!');
    
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const offset = new THREE.Vector3(
        Math.cos(angle) * 30,
        0,
        Math.sin(angle) * 30
      );
      const launchPos = this.activeBoss.position.clone().add(offset);
      
      window.dispatchEvent(new CustomEvent('boss-launch-bomb', {
        detail: {
          position: launchPos,
          target: this.playerPosition.clone(),
          damage: 25,
          trackingSpeed: 0.02,
          lifetime: 8000,
        }
      }));
    }
  }
  
  // ============ PUBLIC GETTERS ============
  
  public getActiveBoss(): BossInstance | null {
    return this.activeBoss;
  }
  
  public isBossActive(): boolean {
    return this.activeBoss !== null && this.activeBoss.state !== 'defeated';
  }
  
  public getBossPosition(): THREE.Vector3 | null {
    return this.activeBoss?.position.clone() || null;
  }
  
  public getBossMesh(): THREE.Group | null {
    return this.activeBoss?.mesh || null;
  }
  
  // ============ CLEANUP ============
  
  public dispose(): void {
    window.removeEventListener('spawn-boss', this.handleSpawnBoss as EventListener);
    window.removeEventListener('boss-hit', this.handleBossHit as EventListener);
    window.removeEventListener('player-position-update', this.handlePlayerPosition as EventListener);
    
    this.despawnBoss();
  }
}

export default BossController;

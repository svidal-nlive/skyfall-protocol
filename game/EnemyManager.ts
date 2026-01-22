import * as THREE from 'three';
import { EnemyAI, AIState, POI } from './EnemyAI';
import { TargetableEntity } from './TargetingController';
import { AircraftConfig } from './types/AircraftConfig';
import { selectEnemyTypeForThreatLevel, VIPER_CONFIG } from './data/enemyAircraftConfigs';
import { Wave, WaveComposition, ENEMY_TYPE_CONFIGS } from './WaveManager';
import { difficultyScaler } from './DifficultyScaler';

/**
 * Encounter definition for POI-based spawning
 */
export interface Encounter {
  poiId: string;
  enemyCount: number;
  threatLevel: number;
  isActive: boolean;
  isCleared: boolean;
}

/**
 * EnemyManager - Manages all AI enemies and POI encounters
 * 
 * Features:
 * - POI-based territory system
 * - Mission encounters (not infinite waves)
 * - Enemy spawning and lifecycle
 * - Centralized update and cleanup
 */
export class EnemyManager {
  private scene: THREE.Scene;
  private enemies: EnemyAI[] = [];
  private pois: Map<string, POI> = new Map();
  private encounters: Map<string, Encounter> = new Map();
  private enemyIdCounter: number = 0;
  private frozen: boolean = false;  // Phase 8C: freeze enemies during cinematic
  private waveMode: boolean = false;  // When true, disable POI-based spawning (use wave spawning only)

  // Phase 16: Endless mode multipliers
  private endlessHealthMultiplier: number = 1;
  private endlessDamageMultiplier: number = 1;
  private endlessSpeedMultiplier: number = 1;

  // Configuration
  private readonly MAX_ENEMIES = 20;
  private readonly SPAWN_HEIGHT_VARIANCE = 30;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializePOIs();
    this.initializeEncounters();
  }

  /**
   * Phase 16: Set endless mode stat multipliers
   */
  setEndlessModeMultipliers(health: number, damage: number, speed: number) {
    this.endlessHealthMultiplier = health;
    this.endlessDamageMultiplier = damage;
    this.endlessSpeedMultiplier = speed;
    console.log(`[ENEMY MANAGER] Endless multipliers: HP ${health.toFixed(2)}x, DMG ${damage.toFixed(2)}x, SPD ${speed.toFixed(2)}x`);
  }

  /**
   * Initialize POI locations around the map
   */
  private initializePOIs() {
    // POIs spread around the origin
    const poiData: Omit<POI, 'id'>[] = [
      { position: new THREE.Vector3(0, 200, -200), radius: 100, threatLevel: 1, name: 'Forward Base' },
      { position: new THREE.Vector3(200, 180, -100), radius: 80, threatLevel: 2, name: 'East Outpost' },
      { position: new THREE.Vector3(-200, 220, -150), radius: 90, threatLevel: 2, name: 'West Ridge' },
      { position: new THREE.Vector3(100, 250, -400), radius: 120, threatLevel: 3, name: 'Mountain Pass' },
      { position: new THREE.Vector3(-150, 190, -350), radius: 100, threatLevel: 3, name: 'Valley Depot' },
      { position: new THREE.Vector3(0, 300, -600), radius: 150, threatLevel: 4, name: 'Command Center' },
    ];

    poiData.forEach((data, index) => {
      const poi: POI = {
        id: `poi-${index}`,
        ...data,
      };
      this.pois.set(poi.id, poi);
    });

    console.log(`[ENEMY MANAGER] Initialized ${this.pois.size} POIs`);
  }

  /**
   * Initialize encounters for each POI
   */
  private initializeEncounters() {
    for (const [poiId, poi] of this.pois) {
      const encounter: Encounter = {
        poiId,
        enemyCount: 2 + poi.threatLevel, // More enemies at higher threat POIs
        threatLevel: poi.threatLevel,
        isActive: false,
        isCleared: false,
      };
      this.encounters.set(poiId, encounter);
    }

    console.log(`[ENEMY MANAGER] Initialized ${this.encounters.size} encounters`);
  }

  /**
   * Spawn enemies for an encounter at a POI
   */
  public activateEncounter(poiId: string) {
    const encounter = this.encounters.get(poiId);
    const poi = this.pois.get(poiId);
    
    if (!encounter || !poi || encounter.isActive || encounter.isCleared) return;

    console.log(`[ENEMY MANAGER] Activating encounter at ${poi.name} (Threat Level: ${poi.threatLevel})`);
    encounter.isActive = true;

    // Spawn enemies around POI
    for (let i = 0; i < encounter.enemyCount; i++) {
      if (this.enemies.length >= this.MAX_ENEMIES) break;

      const angle = (Math.PI * 2 / encounter.enemyCount) * i + Math.random() * 0.5;
      const distance = poi.radius * 0.5 + Math.random() * poi.radius * 0.3;
      const height = poi.position.y + (Math.random() - 0.5) * this.SPAWN_HEIGHT_VARIANCE;

      const spawnPos = new THREE.Vector3(
        poi.position.x + Math.cos(angle) * distance,
        height,
        poi.position.z + Math.sin(angle) * distance
      );

      // Select enemy type based on threat level
      const aircraftConfig = selectEnemyTypeForThreatLevel(poi.threatLevel);
      
      const enemy = this.spawnEnemy(spawnPos, poi, aircraftConfig);
      if (enemy) {
        console.log(`[ENEMY MANAGER] Spawned ${aircraftConfig.name} (${enemy.id}) at ${poi.name}`);
      }
    }
  }

  /**
   * Spawn a single enemy
   */
  private spawnEnemy(
    position: THREE.Vector3, 
    poi: POI | null = null, 
    config: AircraftConfig = VIPER_CONFIG
  ): EnemyAI | null {
    if (this.enemies.length >= this.MAX_ENEMIES) return null;

    const id = `enemy-${++this.enemyIdCounter}`;
    const enemy = new EnemyAI(id, position, poi, config);
    
    this.enemies.push(enemy);
    this.scene.add(enemy.mesh);

    return enemy;
  }

  /**
   * Spawn initial test encounter
   */
  public spawnInitialEnemies() {
    // Activate the first encounter
    const firstPOI = this.pois.get('poi-0');
    if (firstPOI) {
      this.activateEncounter('poi-0');
    }

    // Also spawn a couple near the player for immediate action (varied types)
    const nearbyPositions = [
      new THREE.Vector3(50, 210, -80),
      new THREE.Vector3(-40, 195, -100),
      new THREE.Vector3(0, 230, -120),
    ];

    nearbyPositions.forEach((pos, index) => {
      // Spawn a mix: 2 Phantoms and 1 Viper for variety
      const threatLevel = index === 2 ? 2 : 1;
      const config = selectEnemyTypeForThreatLevel(threatLevel);
      this.spawnEnemy(pos, null, config);
    });

    console.log(`[ENEMY MANAGER] Spawned ${this.enemies.length} initial enemies`);
  }

  /**
   * Spawn enemies for a wave (Phase 8A wave-based spawning)
   * Enemies spawn in a spread formation ahead of the player
   * Phase 8D: Now applies difficulty scaling based on wave number
   */
  public spawnWave(wave: Wave, playerPosition: THREE.Vector3, playerDirection: THREE.Vector3) {
    // Clear any existing enemies first
    this.clearAllEnemies();

    console.log(`[ENEMY MANAGER] Spawning Wave ${wave.id}: ${wave.name}`);

    // Update difficulty scaler for this wave
    difficultyScaler.setWave(wave.id, wave.act);
    const modifiers = difficultyScaler.getModifiers();

    // Calculate spawn center (ahead of player)
    const spawnDistance = 300; // meters ahead
    const spawnCenter = new THREE.Vector3()
      .copy(playerDirection)
      .normalize()
      .multiplyScalar(spawnDistance)
      .add(playerPosition);
    spawnCenter.y = playerPosition.y; // Keep at player altitude

    // Spawn each enemy type in the composition
    let enemyIndex = 0;
    for (const comp of wave.composition) {
      const config = ENEMY_TYPE_CONFIGS[comp.type];
      
      for (let i = 0; i < comp.count; i++) {
        // Calculate spawn position in a spread pattern
        const angle = (enemyIndex / this.getTotalEnemyCount(wave)) * Math.PI * 2;
        const spreadRadius = 50 + Math.random() * 100; // 50-150m spread
        const heightVariance = (Math.random() - 0.5) * 60; // ±30m height

        const spawnPos = new THREE.Vector3(
          spawnCenter.x + Math.cos(angle) * spreadRadius,
          spawnCenter.y + heightVariance + 20, // Slightly above player
          spawnCenter.z + Math.sin(angle) * spreadRadius
        );

        const enemy = this.spawnEnemy(spawnPos, null, config);
        
        // Apply difficulty scaling to the spawned enemy
        if (enemy) {
          // Phase 16: Apply endless mode multipliers on top of wave difficulty
          const finalHealthMult = modifiers.healthMultiplier * this.endlessHealthMultiplier;
          const finalDamageMult = modifiers.damageMultiplier * this.endlessDamageMultiplier;
          enemy.applyDifficultyScaling(finalHealthMult, finalDamageMult);
          
          // Apply speed multiplier for endless mode
          if (this.endlessSpeedMultiplier > 1) {
            enemy.applySpeedMultiplier(this.endlessSpeedMultiplier);
          }
          
          // Force wave-spawned enemies into ENGAGEMENT mode immediately
          // This ensures they actively hunt the player instead of patrolling
          enemy.forceEngagement();
        }
        
        enemyIndex++;
      }
    }

    const scalingInfo = difficultyScaler.getScalingInfo();
    const endlessInfo = this.endlessHealthMultiplier > 1 
      ? ` [Endless: HP×${this.endlessHealthMultiplier.toFixed(1)}, DMG×${this.endlessDamageMultiplier.toFixed(1)}, SPD×${this.endlessSpeedMultiplier.toFixed(1)}]` 
      : '';
    console.log(`[ENEMY MANAGER] Wave ${wave.id} spawned: ${this.enemies.length} enemies (HP: ${scalingInfo.health}, DMG: ${scalingInfo.damage})${endlessInfo}`);
  }

  /**
   * Spawn boss minions at a specific position (Phase 12)
   * These are weaker 'phantom' type enemies (weakest tier)
   */
  public spawnBossMinion(position: THREE.Vector3, targetPosition: THREE.Vector3): EnemyAI | null {
    // Use PHANTOM config for boss minions (weakest enemy type)
    const config = ENEMY_TYPE_CONFIGS['phantom'];
    if (!config) {
      console.warn('[ENEMY MANAGER] Phantom config not found for boss minion');
      return null;
    }
    
    const enemy = this.spawnEnemy(position, null, config);
    if (enemy) {
      // Apply reduced stats for minions (they're weaker than normal)
      enemy.applyDifficultyScaling(0.5, 0.5);
      // Force engagement mode for boss minions
      enemy.forceEngagement();
      console.log(`[ENEMY MANAGER] Spawned boss minion at ${position.x.toFixed(0)}, ${position.y.toFixed(0)}, ${position.z.toFixed(0)}`);
    }
    return enemy;
  }

  /**
   * Get total enemy count from wave composition
   */
  private getTotalEnemyCount(wave: Wave): number {
    return wave.composition.reduce((sum, c) => sum + c.count, 0);
  }

  /**
   * Clear all enemies from the scene
   */
  public clearAllEnemies() {
    for (const enemy of this.enemies) {
      this.scene.remove(enemy.mesh);
      enemy.dispose();
    }
    this.enemies = [];
    this.enemyIdCounter = 0;
    console.log('[ENEMY MANAGER] Cleared all enemies');
  }

  /**
   * Set frozen state (Phase 8C: freeze during cinematic)
   */
  public setFrozen(frozen: boolean): void {
    this.frozen = frozen;
    console.log(`[ENEMY MANAGER] Frozen: ${frozen}`);
  }

  /**
   * Check if enemies are frozen
   */
  public isFrozen(): boolean {
    return this.frozen;
  }

  /**
   * Enable wave mode (disables POI-based spawning for free flight experience)
   */
  public setWaveMode(enabled: boolean): void {
    this.waveMode = enabled;
    console.log(`[ENEMY MANAGER] Wave mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Check if wave mode is active
   */
  public isWaveMode(): boolean {
    return this.waveMode;
  }

  /**
   * Main update loop
   */
  public update(dt: number, elapsedTime: number, playerPosition: THREE.Vector3, playerVelocity: THREE.Vector3) {
    // Skip enemy updates if frozen (during cinematic)
    if (this.frozen) {
      return;
    }

    // Update all enemies
    for (const enemy of this.enemies) {
      enemy.update(dt, elapsedTime, playerPosition, playerVelocity);
    }

    // Only check POI activation when NOT in wave mode (free roam/sandbox)
    if (!this.waveMode) {
      // Check for POI activation based on player proximity
      this.checkEncounterActivation(playerPosition);

      // Check for encounter completion
      this.checkEncounterCompletion();
    }

    // Cleanup destroyed enemies
    this.cleanupDestroyedEnemies();
  }

  /**
   * Activate encounters when player gets close
   * Only used in non-wave mode (sandbox/free roam)
   */
  private checkEncounterActivation(playerPosition: THREE.Vector3) {
    // Skip if in wave mode - enemies spawn via wave system only
    if (this.waveMode) return;

    for (const [poiId, poi] of this.pois) {
      const encounter = this.encounters.get(poiId);
      if (!encounter || encounter.isActive || encounter.isCleared) continue;

      const distToPlayer = poi.position.distanceTo(playerPosition);
      const activationRange = poi.radius * 1.5;

      if (distToPlayer < activationRange) {
        this.activateEncounter(poiId);
      }
    }
  }

  /**
   * Check if encounters are completed
   */
  private checkEncounterCompletion() {
    for (const [poiId, encounter] of this.encounters) {
      if (!encounter.isActive || encounter.isCleared) continue;

      // Count alive enemies for this POI
      const poi = this.pois.get(poiId);
      if (!poi) continue;

      const aliveAtPOI = this.enemies.filter(
        e => e.isAlive && e.assignedPOI?.id === poiId
      ).length;

      if (aliveAtPOI === 0) {
        encounter.isCleared = true;
        encounter.isActive = false;
        console.log(`[ENEMY MANAGER] Encounter cleared: ${poi.name}`);

        window.dispatchEvent(new CustomEvent('encounter-cleared', {
          detail: { poiId, poiName: poi.name }
        }));
      }
    }
  }

  /**
   * Remove destroyed enemies
   */
  private cleanupDestroyedEnemies() {
    this.enemies = this.enemies.filter(enemy => {
      if (!enemy.isAlive && enemy.state === AIState.DESTROYED) {
        // Keep mesh visible briefly for death effect
        const timeSinceDeath = performance.now() - enemy.lastStateChange;
        if (timeSinceDeath > 2000) {
          this.scene.remove(enemy.mesh);
          enemy.dispose();
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Get all targetable enemies
   */
  public getTargetableEnemies(): TargetableEntity[] {
    return this.enemies.filter(e => e.isAlive);
  }

  /**
   * Get enemy by ID
   */
  public getEnemyById(id: string): EnemyAI | undefined {
    return this.enemies.find(e => e.id === id);
  }

  /**
   * Apply damage to an enemy
   */
  public damageEnemy(enemyId: string, damage: number, source: string) {
    const enemy = this.getEnemyById(enemyId);
    if (enemy) {
      enemy.takeDamage(damage, source);
    }
  }

  /**
   * Get all POIs
   */
  public getPOIs(): POI[] {
    return Array.from(this.pois.values());
  }

  /**
   * Get encounter status
   */
  public getEncounterStatus(): { poi: POI; encounter: Encounter }[] {
    const status: { poi: POI; encounter: Encounter }[] = [];
    for (const [poiId, encounter] of this.encounters) {
      const poi = this.pois.get(poiId);
      if (poi) {
        status.push({ poi, encounter });
      }
    }
    return status;
  }

  /**
   * Get enemy count
   */
  public getEnemyCount(): { alive: number; total: number } {
    return {
      alive: this.enemies.filter(e => e.isAlive).length,
      total: this.enemies.length,
    };
  }

  /**
   * Get enemy state by ID
   */
  public getEnemyState(enemyId: string): string {
    const enemy = this.getEnemyById(enemyId);
    if (enemy) {
      return enemy.getStateName();
    }
    return 'unknown';
  }

  /**
   * Get encounter by POI ID
   */
  public getEncounterByPOI(poiId: string): Encounter | undefined {
    return this.encounters.get(poiId);
  }

  /**
   * Get HUD info
   */
  public getHUDInfo() {
    return {
      enemyCount: this.getEnemyCount(),
      encounters: this.getEncounterStatus(),
    };
  }

  /**
   * Dispose all resources
   */
  public dispose() {
    for (const enemy of this.enemies) {
      this.scene.remove(enemy.mesh);
      enemy.dispose();
    }
    this.enemies = [];
  }
}

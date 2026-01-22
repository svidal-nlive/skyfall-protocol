/**
 * WaveManager - Manages wave-based gameplay progression
 * 
 * Phase 8A: Basic wave flow
 * - Wave definitions for all 15 waves
 * - State machine: COMBAT → WAVE_COMPLETE → INTERMISSION → COMBAT
 * - Enemy spawning from wave composition
 * - Wave complete detection
 * 
 * Phase 16: Endless mode support
 * - Infinite procedurally generated waves
 * - Integration with EndlessModeManager
 */

import { AircraftConfig } from './types/AircraftConfig';
import { PHANTOM_CONFIG, VIPER_CONFIG, WARDEN_CONFIG, SPECTER_CONFIG } from './data/enemyAircraftConfigs';
import { endlessModeManager, EndlessWave } from './EndlessModeManager';

// ============ Types ============

export type EnemyType = 'phantom' | 'viper' | 'warden' | 'specter';

export interface WaveComposition {
  type: EnemyType;
  count: number;
}

export interface Wave {
  id: number;
  act: number;
  name: string;
  composition: WaveComposition[];
  isBoss: boolean;
  bossType?: string;
  // Phase 8B will add: beaconDistance, timeLimit
}

export enum WaveState {
  PRE_GAME = 'PRE_GAME',           // Before first wave
  COMBAT = 'COMBAT',               // Active combat
  WAVE_COMPLETE = 'WAVE_COMPLETE', // All enemies destroyed, showing message
  INTERMISSION = 'INTERMISSION',   // Delay before next wave
  BEACON_ACTIVE = 'BEACON_ACTIVE', // Player flying to beacon
  CINEMATIC = 'CINEMATIC',         // Showing enemy entry cinematic
  TIMEOUT = 'TIMEOUT',             // Timer expired, return to hangar
  GAME_COMPLETE = 'GAME_COMPLETE', // All waves finished
}

// ============ Wave Definitions ============

const WAVE_DEFINITIONS: Wave[] = [
  // === ACT 1: First Contact (Waves 1-5) ===
  {
    id: 1,
    act: 1,
    name: 'First Contact',
    composition: [
      { type: 'phantom', count: 3 },
    ],
    isBoss: false,
  },
  {
    id: 2,
    act: 1,
    name: 'Scout Patrol',
    composition: [
      { type: 'phantom', count: 5 },
      { type: 'viper', count: 2 },
    ],
    isBoss: false,
  },
  {
    id: 3,
    act: 1,
    name: 'Viper Squadron',
    composition: [
      { type: 'viper', count: 4 },
      { type: 'phantom', count: 2 },
    ],
    isBoss: false,
  },
  {
    id: 4,
    act: 1,
    name: 'Heavy Escort',
    composition: [
      { type: 'viper', count: 6 },
      { type: 'warden', count: 1 },
    ],
    isBoss: false,
  },
  {
    id: 5,
    act: 1,
    name: 'Carrier Assault',
    composition: [
      { type: 'phantom', count: 4 },
      { type: 'viper', count: 2 },
      { type: 'warden', count: 2 },
    ],
    isBoss: true,
    bossType: 'Carrier Drone',
  },

  // === ACT 2: Escalation (Waves 6-10) ===
  {
    id: 6,
    act: 2,
    name: 'Heavy Patrol',
    composition: [
      { type: 'viper', count: 4 },
      { type: 'warden', count: 3 },
    ],
    isBoss: false,
  },
  {
    id: 7,
    act: 2,
    name: 'Phantom Swarm',
    composition: [
      { type: 'phantom', count: 8 },
    ],
    isBoss: false,
  },
  {
    id: 8,
    act: 2,
    name: 'Mixed Assault',
    composition: [
      { type: 'warden', count: 2 },
      { type: 'viper', count: 4 },
      { type: 'specter', count: 1 },
    ],
    isBoss: false,
  },
  {
    id: 9,
    act: 2,
    name: 'Elite Strike',
    composition: [
      { type: 'specter', count: 3 },
      { type: 'warden', count: 2 },
    ],
    isBoss: false,
  },
  {
    id: 10,
    act: 2,
    name: 'Command Ship',
    composition: [
      { type: 'specter', count: 2 },
      { type: 'viper', count: 4 },
      { type: 'warden', count: 3 },
    ],
    isBoss: true,
    bossType: 'Command Ship',
  },

  // === ACT 3: Skyfall Protocol (Waves 11-15) ===
  {
    id: 11,
    act: 3,
    name: 'Elite Vanguard',
    composition: [
      { type: 'specter', count: 4 },
      { type: 'warden', count: 4 },
    ],
    isBoss: false,
  },
  {
    id: 12,
    act: 3,
    name: 'Viper Armada',
    composition: [
      { type: 'viper', count: 10 },
      { type: 'specter', count: 2 },
    ],
    isBoss: false,
  },
  {
    id: 13,
    act: 3,
    name: 'Full Assault',
    composition: [
      { type: 'specter', count: 4 },
      { type: 'viper', count: 4 },
      { type: 'warden', count: 2 },
    ],
    isBoss: false,
  },
  {
    id: 14,
    act: 3,
    name: 'Specter Legion',
    composition: [
      { type: 'specter', count: 6 },
    ],
    isBoss: false,
  },
  {
    id: 15,
    act: 3,
    name: 'The Swarm Queen',
    composition: [
      { type: 'specter', count: 4 },
      { type: 'warden', count: 4 },
      { type: 'viper', count: 6 },
      { type: 'phantom', count: 6 },
    ],
    isBoss: true,
    bossType: 'The Swarm Queen',
  },
];

// ============ Enemy Type to Config Map ============

export const ENEMY_TYPE_CONFIGS: Record<EnemyType, AircraftConfig> = {
  phantom: PHANTOM_CONFIG,
  viper: VIPER_CONFIG,
  warden: WARDEN_CONFIG,
  specter: SPECTER_CONFIG,
};

// ============ WaveManager Class ============

export class WaveManager {
  private currentWaveIndex: number = 0;
  private state: WaveState = WaveState.PRE_GAME;
  private stateStartTime: number = 0;
  private enemiesRemaining: number = 0;
  private totalEnemiesInWave: number = 0;

  // Timer control (Phase 8D enhancement)
  // Timer only active after completing a wave in current session
  private timerEnabled: boolean = false;

  // Endless mode (Phase 16)
  private endlessMode: boolean = false;
  private endlessWaveNumber: number = 0;
  private endlessCurrentWave: Wave | null = null;

  // Timing
  private readonly WAVE_COMPLETE_DISPLAY_TIME = 2.0; // seconds
  private readonly INTERMISSION_TIME = 3.0; // seconds before next wave

  // Callbacks
  private onWaveStart?: (wave: Wave) => void;
  private onWaveComplete?: (wave: Wave, nextWave: Wave | null) => void;
  private onStateChange?: (state: WaveState) => void;
  private onGameComplete?: () => void;
  private onBeaconSpawn?: (waveNumber: number) => void;
  private onTimeout?: () => void;

  constructor() {
    console.log('[WAVE MANAGER] Initialized with', WAVE_DEFINITIONS.length, 'waves');
  }

  // ============ Callback Setters ============

  public setOnWaveStart(callback: (wave: Wave) => void) {
    this.onWaveStart = callback;
  }

  public setOnWaveComplete(callback: (wave: Wave, nextWave: Wave | null) => void) {
    this.onWaveComplete = callback;
  }

  public setOnStateChange(callback: (state: WaveState) => void) {
    this.onStateChange = callback;
  }

  public setOnGameComplete(callback: () => void) {
    this.onGameComplete = callback;
  }

  public setOnBeaconSpawn(callback: (waveNumber: number) => void) {
    this.onBeaconSpawn = callback;
  }

  public setOnTimeout(callback: () => void) {
    this.onTimeout = callback;
  }

  // ============ State Management ============

  private setState(newState: WaveState) {
    if (this.state === newState) return;

    console.log(`[WAVE MANAGER] State: ${this.state} → ${newState}`);
    this.state = newState;
    this.stateStartTime = performance.now() / 1000;

    this.onStateChange?.(newState);

    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('wave-state-change', {
      detail: { state: newState }
    }));
  }

  public getState(): WaveState {
    return this.state;
  }

  // ============ Wave Accessors ============

  public getCurrentWave(): Wave | null {
    if (this.currentWaveIndex < 0 || this.currentWaveIndex >= WAVE_DEFINITIONS.length) {
      return null;
    }
    return WAVE_DEFINITIONS[this.currentWaveIndex];
  }

  public getNextWave(): Wave | null {
    const nextIndex = this.currentWaveIndex + 1;
    if (nextIndex >= WAVE_DEFINITIONS.length) {
      return null;
    }
    return WAVE_DEFINITIONS[nextIndex];
  }

  public getWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  public getTotalWaves(): number {
    return WAVE_DEFINITIONS.length;
  }

  public getCurrentAct(): number {
    const wave = this.getCurrentWave();
    return wave ? wave.act : 1;
  }

  // ============ Enemy Count ============

  public getEnemiesRemaining(): number {
    return this.enemiesRemaining;
  }

  public getTotalEnemiesInWave(): number {
    return this.totalEnemiesInWave;
  }

  public setEnemiesRemaining(count: number) {
    this.enemiesRemaining = count;
  }

  public registerEnemyKill() {
    if (this.enemiesRemaining > 0) {
      this.enemiesRemaining--;
      console.log(`[WAVE MANAGER] Enemy killed. Remaining: ${this.enemiesRemaining}`);
    }
  }

  // ============ Game Flow ============

  /**
   * Start the wave system from the beginning
   */
  public startGame() {
    this.currentWaveIndex = 0;
    this.timerEnabled = false;  // Fresh start = no timer (free flight to first beacon)
    this.setState(WaveState.PRE_GAME);
    
    // Spawn beacon for first wave (free flight, no time limit)
    this.spawnBeacon();
  }

  /**
   * Continue mission from hangar/menu (timer disabled)
   */
  public continueGame() {
    this.timerEnabled = false;  // Continuing = no timer until wave completes
    console.log('[WAVE MANAGER] Continuing game - timer disabled for free flight');
    this.spawnBeacon();
  }

  /**
   * Start the current wave
   */
  public startCurrentWave() {
    const wave = this.getCurrentWave();
    if (!wave) {
      console.error('[WAVE MANAGER] No wave to start');
      return;
    }

    // Calculate total enemies
    this.totalEnemiesInWave = wave.composition.reduce((sum, c) => sum + c.count, 0);
    this.enemiesRemaining = this.totalEnemiesInWave;

    console.log(`[WAVE MANAGER] Starting Wave ${wave.id}: ${wave.name} (${this.totalEnemiesInWave} enemies)`);

    this.setState(WaveState.COMBAT);
    this.onWaveStart?.(wave);

    // Dispatch event for spawning
    window.dispatchEvent(new CustomEvent('wave-start', {
      detail: { wave }
    }));
    
    // Phase 12: Spawn boss for boss waves
    if (wave.isBoss) {
      let bossType: 'carrier-drone' | 'command-ship' | 'swarm-queen';
      
      switch (wave.id) {
        case 5:
          bossType = 'carrier-drone';
          break;
        case 10:
          bossType = 'command-ship';
          break;
        case 15:
          bossType = 'swarm-queen';
          break;
        default:
          console.warn(`[WAVE MANAGER] Unknown boss wave: ${wave.id}`);
          return;
      }
      
      console.log(`[WAVE MANAGER] Spawning boss: ${bossType} for wave ${wave.id}`);
      
      // Add 1 to enemy count for the boss
      this.totalEnemiesInWave++;
      this.enemiesRemaining++;
      
      window.dispatchEvent(new CustomEvent('spawn-boss', {
        detail: { bossType, waveId: wave.id }
      }));
    }
  }

  /**
   * Update loop - check for state transitions
   */
  public update(dt: number, elapsedTime: number) {
    const now = performance.now() / 1000;
    const timeInState = now - this.stateStartTime;

    switch (this.state) {
      case WaveState.COMBAT:
        // Check if all enemies are destroyed
        if (this.enemiesRemaining <= 0) {
          if (this.endlessMode) {
            this.onEndlessWaveCleared();
          } else {
            this.onWaveCleared();
          }
        }
        break;

      case WaveState.WAVE_COMPLETE:
        // Wait for message display time
        if (timeInState >= this.WAVE_COMPLETE_DISPLAY_TIME) {
          this.setState(WaveState.INTERMISSION);
        }
        break;

      case WaveState.INTERMISSION:
        // Wait for intermission, then start next wave
        if (timeInState >= this.INTERMISSION_TIME) {
          if (this.endlessMode) {
            this.advanceToNextEndlessWave();
          } else {
            this.advanceToNextWave();
          }
        }
        break;
    }
  }

  /**
   * Called when all enemies in current wave are destroyed
   */
  private onWaveCleared() {
    const wave = this.getCurrentWave();
    const nextWave = this.getNextWave();

    console.log(`[WAVE MANAGER] Wave ${wave?.id} cleared!`);

    // Enable timer for next wave (completing a wave in session = timer on)
    this.timerEnabled = true;
    console.log('[WAVE MANAGER] Timer now ENABLED for next beacon');

    this.setState(WaveState.WAVE_COMPLETE);
    this.onWaveComplete?.(wave!, nextWave);

    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('wave-complete', {
      detail: { wave, nextWave }
    }));

    // Award wave completion bonus
    const waveBonus = wave ? 100 * wave.id : 100;
    window.dispatchEvent(new CustomEvent('score-add', {
      detail: { points: waveBonus, reason: 'Wave Complete' }
    }));

    // Check for act completion (boss waves: 5, 10, 15)
    if (wave?.isBoss) {
      console.log(`[WAVE MANAGER] Boss wave ${wave.id} cleared! Act ${wave.act} complete!`);
      window.dispatchEvent(new CustomEvent('act-complete', {
        detail: { act: wave.act, waveId: wave.id }
      }));
    }
  }

  /**
   * Advance to the next wave
   */
  public advanceToNextWave() {
    this.currentWaveIndex++;

    if (this.currentWaveIndex >= WAVE_DEFINITIONS.length) {
      // All waves complete!
      this.setState(WaveState.GAME_COMPLETE);
      this.onGameComplete?.();

      window.dispatchEvent(new CustomEvent('game-complete', {
        detail: { totalWaves: WAVE_DEFINITIONS.length }
      }));

      console.log('[WAVE MANAGER] All waves complete! Game finished.');
      return;
    }

    // Phase 8B: Spawn beacon for next wave navigation
    this.spawnBeacon();
  }

  /**
   * Spawn beacon for player to fly to
   */
  private spawnBeacon() {
    const waveNumber = this.getWaveNumber();
    console.log(`[WAVE MANAGER] Spawning beacon for Wave ${waveNumber}, timer: ${this.timerEnabled ? 'ENABLED' : 'DISABLED (free flight)'}`);
    
    this.setState(WaveState.BEACON_ACTIVE);
    this.onBeaconSpawn?.(waveNumber);

    // Dispatch event for GameEngine to create beacon
    window.dispatchEvent(new CustomEvent('beacon-request-spawn', {
      detail: { 
        waveNumber,
        timerEnabled: this.timerEnabled  // Pass timer state to beacon
      }
    }));
  }

  /**
   * Check if timer is currently enabled
   */
  public isTimerEnabled(): boolean {
    return this.timerEnabled;
  }

  /**
   * Called when player reaches beacon
   */
  public onBeaconReached() {
    console.log('[WAVE MANAGER] Beacon reached, starting cinematic');
    this.startCinematic();
  }

  /**
   * Start the wave entry cinematic
   */
  private startCinematic() {
    // For endless mode, use the endless wave
    const wave = this.endlessMode ? this.endlessCurrentWave : this.getCurrentWave();
    
    if (this.endlessMode) {
      // In endless mode, generate the next wave first if not already done
      if (!this.endlessCurrentWave) {
        const endlessWave = endlessModeManager.generateNextWave();
        this.endlessCurrentWave = endlessWave;
        this.endlessWaveNumber = endlessWave.id;
      }
    }
    
    const displayWave = this.endlessMode ? this.endlessCurrentWave : this.getCurrentWave();
    
    if (!displayWave) {
      console.error('[WAVE MANAGER] No wave for cinematic');
      return;
    }

    console.log(`[WAVE MANAGER] Starting cinematic for Wave ${displayWave.id}`);
    this.setState(WaveState.CINEMATIC);

    // Dispatch event for GameEngine to handle cinematic
    window.dispatchEvent(new CustomEvent('cinematic-request', {
      detail: { 
        wave: displayWave,
        isEndless: this.endlessMode
      }
    }));
  }

  /**
   * Called when cinematic completes (or is skipped)
   */
  public onCinematicComplete() {
    console.log('[WAVE MANAGER] Cinematic complete, starting combat');
    if (this.endlessMode) {
      this.startNextEndlessWave();
    } else {
      this.startCurrentWave();
    }
  }

  /**
   * Called when beacon timer expires
   */
  public onBeaconTimeout() {
    console.log('[WAVE MANAGER] Beacon timeout!');
    this.setState(WaveState.TIMEOUT);
    this.onTimeout?.();

    // Dispatch timeout event for UI/game state
    window.dispatchEvent(new CustomEvent('wave-timeout', {
      detail: { waveNumber: this.getWaveNumber() }
    }));
  }

  /**
   * Resume from timeout (continue mission from hangar)
   */
  public resumeFromTimeout() {
    console.log('[WAVE MANAGER] Resuming from timeout - timer disabled');
    this.timerEnabled = false;  // Resuming = no timer (free flight)
    // Re-spawn beacon for current wave
    this.spawnBeacon();
  }

  // ============ Endless Mode (Phase 16) ============

  /**
   * Check if currently in endless mode
   */
  public isEndlessMode(): boolean {
    return this.endlessMode;
  }

  /**
   * Start endless mode
   */
  public startEndlessMode(aircraftId: string) {
    console.log('[WAVE MANAGER] Starting endless mode');
    this.endlessMode = true;
    this.endlessWaveNumber = 0;
    this.endlessCurrentWave = null;
    this.timerEnabled = false;
    
    // Initialize endless mode manager
    endlessModeManager.startEndlessMode(aircraftId);
    
    this.setState(WaveState.PRE_GAME);
    
    // Spawn first beacon
    this.spawnEndlessBeacon();
  }

  /**
   * Spawn beacon for endless mode
   */
  private spawnEndlessBeacon() {
    const nextWaveNumber = this.endlessWaveNumber + 1;
    console.log(`[WAVE MANAGER] Spawning endless beacon for Wave ${nextWaveNumber}`);
    
    this.setState(WaveState.BEACON_ACTIVE);
    this.onBeaconSpawn?.(nextWaveNumber);

    window.dispatchEvent(new CustomEvent('beacon-request-spawn', {
      detail: { 
        waveNumber: nextWaveNumber,
        timerEnabled: this.timerEnabled,
        isEndless: true
      }
    }));
  }

  /**
   * Start the next endless wave
   */
  public startNextEndlessWave() {
    // Generate the next wave
    const endlessWave = endlessModeManager.generateNextWave();
    this.endlessCurrentWave = endlessWave;
    this.endlessWaveNumber = endlessWave.id;

    // Calculate total enemies
    this.totalEnemiesInWave = endlessWave.composition.reduce((sum, c) => sum + c.count, 0);
    this.enemiesRemaining = this.totalEnemiesInWave;

    console.log(`[WAVE MANAGER] Starting Endless Wave ${this.endlessWaveNumber}: ${endlessWave.name} (${this.totalEnemiesInWave} enemies)`);

    this.setState(WaveState.COMBAT);
    this.onWaveStart?.(endlessWave);

    // Dispatch event for spawning
    window.dispatchEvent(new CustomEvent('wave-start', {
      detail: { 
        wave: endlessWave,
        isEndless: true,
        modifier: endlessWave.modifier,
        difficultyMultiplier: endlessWave.difficultyMultiplier
      }
    }));

    // Spawn boss for boss waves
    if (endlessWave.isBoss && endlessWave.bossType) {
      console.log(`[WAVE MANAGER] Spawning endless boss: ${endlessWave.bossType}`);
      
      this.totalEnemiesInWave++;
      this.enemiesRemaining++;
      
      window.dispatchEvent(new CustomEvent('spawn-boss', {
        detail: { 
          bossType: endlessWave.bossType, 
          waveId: this.endlessWaveNumber,
          isEndless: true,
          healthMultiplier: endlessModeManager.getEnemyHealthMultiplier()
        }
      }));
    }

    // Dispatch modifier notification for HUD
    if (endlessWave.modifier !== 'none') {
      window.dispatchEvent(new CustomEvent('endless-modifier', {
        detail: { 
          modifier: endlessWave.modifier,
          name: endlessModeManager.getModifierInfo(endlessWave.modifier).name,
          description: endlessWave.modifierDescription
        }
      }));
    }
  }

  /**
   * Handle endless wave completion
   */
  private onEndlessWaveCleared() {
    console.log(`[WAVE MANAGER] Endless Wave ${this.endlessWaveNumber} cleared!`);

    // Enable timer for subsequent waves
    this.timerEnabled = true;

    this.setState(WaveState.WAVE_COMPLETE);
    this.onWaveComplete?.(this.endlessCurrentWave!, null);

    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('wave-complete', {
      detail: { 
        wave: this.endlessCurrentWave, 
        nextWave: null,
        isEndless: true,
        waveNumber: this.endlessWaveNumber
      }
    }));

    // Award wave completion bonus (scales with difficulty)
    const waveBonus = Math.floor(100 * this.endlessWaveNumber * endlessModeManager.getEnemyStatMultiplier());
    window.dispatchEvent(new CustomEvent('score-add', {
      detail: { points: waveBonus, reason: 'Endless Wave Complete' }
    }));
  }

  /**
   * Advance to next endless wave
   */
  private advanceToNextEndlessWave() {
    // Spawn beacon for next wave
    this.spawnEndlessBeacon();
  }

  /**
   * Get current endless wave number
   */
  public getEndlessWaveNumber(): number {
    return this.endlessWaveNumber;
  }

  /**
   * Get current endless wave data
   */
  public getEndlessWave(): EndlessWave | null {
    return this.endlessCurrentWave as EndlessWave | null;
  }

  /**
   * Reset the wave manager
   */
  public reset() {
    this.currentWaveIndex = 0;
    this.state = WaveState.PRE_GAME;
    this.stateStartTime = 0;
    this.enemiesRemaining = 0;
    this.totalEnemiesInWave = 0;
    this.timerEnabled = false;  // Reset timer state
    this.endlessMode = false;
    this.endlessCurrentWave = null;
  }

  /**
   * Restore wave manager state from a saved game
   * @param waveNumber The wave number to restore to (1-indexed)
   * @param gameMode The game mode (CAMPAIGN or ENDLESS)
   */
  public restoreFromSave(waveNumber: number, gameMode: string) {
    // Set the wave index (waveNumber is 1-indexed, index is 0-indexed)
    this.currentWaveIndex = Math.max(0, waveNumber - 1);
    
    // Set mode
    this.endlessMode = gameMode === 'ENDLESS';
    if (this.endlessMode) {
      this.endlessWaveNumber = waveNumber;
    }
    
    // Reset state for resuming - timer disabled for free flight to beacon
    this.state = WaveState.PRE_GAME;
    this.stateStartTime = 0;
    this.enemiesRemaining = 0;
    this.totalEnemiesInWave = 0;
    this.timerEnabled = false;
    
    console.log(`[WAVE MANAGER] Restored to Wave ${waveNumber} (${gameMode} mode)`);
  }

  // ============ HUD Data ============

  public getHUDData() {
    const wave = this.endlessMode ? this.endlessCurrentWave : this.getCurrentWave();
    return {
      waveNumber: this.endlessMode ? this.endlessWaveNumber : this.getWaveNumber(),
      totalWaves: this.endlessMode ? Infinity : this.getTotalWaves(),
      waveName: wave?.name || '',
      act: this.endlessMode ? Math.ceil(this.endlessWaveNumber / 5) : this.getCurrentAct(),
      enemiesRemaining: this.enemiesRemaining,
      totalEnemies: this.totalEnemiesInWave,
      state: this.state,
      isBoss: wave?.isBoss || false,
      bossType: wave?.bossType,
      isEndless: this.endlessMode,
      endlessModifier: this.endlessMode && this.endlessCurrentWave 
        ? (this.endlessCurrentWave as any).modifier 
        : null,
    };
  }
}

// ============ Singleton Export ============

export const waveManager = new WaveManager();

import * as THREE from 'three';
import { PlayerJet } from './PlayerJet';
import { FlightController, ControlStyle } from './FlightController';
import { InfinityGrid } from './InfinityGrid';
import { TargetingController, TargetableEntity, Lock, LockState } from './TargetingController';
import { MissileController } from './MissileController';
import { CannonController } from './CannonController';
import { EnemyManager } from './EnemyManager';
import { ExplosionManager } from './ExplosionManager';
import { ScoreManager } from './ScoreManager';
import { ProgressManager } from './ProgressManager';
import { PlayerAircraftConfig, getPlayerEffectiveHealth } from './data/playerAircraftConfigs';
import { waveManager, WaveState, Wave } from './WaveManager';
import { waypointBeacon } from './WaypointBeacon';
import { waveCinematicController } from './WaveCinematicController';
import { PlayerHealthManager } from './PlayerHealthManager';
import { EnemyProjectileManager } from './EnemyProjectileManager';
import { currencyManager } from './CurrencyManager';
import { upgradeManager } from './UpgradeManager';
import { BossController, BossType } from './BossController';
import { audioManager } from './AudioManager';
import { storyManager } from './StoryManager';
// Phase 15: Polish & Effects
import { ParticleTrailSystem, initParticleTrailSystem, particleTrailSystem } from './ParticleTrailSystem';
import { cameraEffects, ShakeType } from './CameraEffects';
import { NebulaSystem, initNebulaSystem } from './NebulaSystem';
import { SpaceSkybox, initSpaceSkybox } from './SpaceSkybox';
import { MoonMountains, initMoonMountains } from './MoonMountains';
// Phase 16: Endless Mode
import { endlessModeManager } from './EndlessModeManager';
// Game persistence
import { saveGameState, loadGameState, isLoggedIn } from '../src/services/api';

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

// Export targeting types for HUD components
export type { Lock, TargetableEntity };
export { LockState };

/**
 * GameEngine - Streamlined flight experience with infinite grid
 */
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private elapsedTime: number = 0;

  private isRunning: boolean = false;
  private isPaused: boolean = false;  // Phase 8D: Pause during beacon
  public gameState: GameState = GameState.MENU;

  // Systems
  private infinityGrid: InfinityGrid;
  private playerJet: PlayerJet;
  private flightController: FlightController;
  private targetingController: TargetingController;
  private missileController: MissileController;
  private cannonController: CannonController;
  private enemyManager: EnemyManager;
  private explosionManager: ExplosionManager;
  private scoreManager: ScoreManager;
  private playerHealthManager: PlayerHealthManager;
  private enemyProjectileManager: EnemyProjectileManager;
  private bossController: BossController;
  
  // Phase 15: Polish & Effects Systems
  private particleTrailSystem: ParticleTrailSystem | null = null;
  private nebulaSystemInstance: NebulaSystem | null = null;
  private spaceSkybox: SpaceSkybox | null = null;
  private moonMountains: MoonMountains | null = null;
  private timeScale: number = 1.0; // For slow-motion effects
  
  // Effects
  private speedLines: THREE.Group;
  private skyMesh: THREE.Mesh | null = null;
  private activeFog: THREE.Fog | null = null;
  
  // Wave progression tracking
  private nextWaveAfterComplete: Wave | null = null;

  // Camera State
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();
  private shakeIntensity: number = 0;
  private baseFov: number = 65;
  private orbitAngle: number = 0;

  // Atmospheric Settings - Cyberpunk palette with dark ground
  private readonly ATMOSPHERE = {
    horizon: new THREE.Color(0x0a0018),  // Very dark purple-blue for ground transition
    zenith: new THREE.Color(0x050010),   // Near black with slight purple tint
    fogNear: 300,
    fogFar: 6000,  // Increased from 3000 to allow visibility at greater distances
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    
    // Enable tone mapping for better bloom/glow effects
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Initialize Camera
    this.camera = new THREE.PerspectiveCamera(this.baseFov, window.innerWidth / window.innerHeight, 0.1, 15000);
    
    // Initialize Scene
    this.scene = new THREE.Scene();
    
    // Setup Environment
    this.setupEnvironment();

    // Setup Speed Lines
    this.speedLines = new THREE.Group();
    this.setupSpeedEffect();

    // Setup Infinity Grid with moon surface styling
    this.infinityGrid = new InfinityGrid();
    this.scene.add(this.infinityGrid.mesh); // Re-enabled with moon styling

    // Setup Player with selected aircraft config
    const selectedAircraft = ProgressManager.getSelectedAircraft();
    this.flightController = new FlightController(true, selectedAircraft);
    this.playerJet = new PlayerJet(selectedAircraft.id);
    this.scene.add(this.playerJet.mesh);

    // Setup Targeting System
    this.targetingController = new TargetingController();
    this.targetingController.setCamera(this.camera);
    this.targetingController.setScreenSize(window.innerWidth, window.innerHeight);

    // Setup Weapons Systems with aircraft config
    const aircraftConfig = ProgressManager.getSelectedAircraft();
    this.missileController = new MissileController(
      aircraftConfig.missiles,
      aircraftConfig.missileReloadTime
    );
    this.missileController.setScene(this.scene);
    
    this.cannonController = new CannonController(
      aircraftConfig.cannonDamage,
      aircraftConfig.cannonFireRate
    );
    this.cannonController.setScene(this.scene);

    // Setup Enemy AI System
    this.enemyManager = new EnemyManager(this.scene);

    // Setup Effects System
    this.explosionManager = new ExplosionManager(this.scene);
    
    // Phase 15: Initialize particle and effects systems
    this.particleTrailSystem = initParticleTrailSystem(this.scene);
    this.nebulaSystemInstance = initNebulaSystem(this.scene);
    this.spaceSkybox = initSpaceSkybox(this.scene);
    // Mountains disabled for flat grass terrain
    // this.moonMountains = initMoonMountains(this.scene);
    cameraEffects.setCamera(this.camera);
    
    // Setup engine trail emitter for player jet
    this.setupPlayerEngineTrails();
    
    // Setup Waypoint Beacon (Phase 8B)
    this.scene.add(waypointBeacon.getMesh());
    this.setupBeaconCallbacks();
    
    // Setup Score System
    this.scoreManager = new ScoreManager();

    // Setup Player Health System (Phase 9)
    this.playerHealthManager = new PlayerHealthManager(aircraftConfig);
    this.playerHealthManager.setOnDeath((position) => {
      this.onPlayerDeath(position);
    });
    
    // Setup Enemy Projectile System (Phase 9)
    this.enemyProjectileManager = new EnemyProjectileManager();
    this.enemyProjectileManager.setScene(this.scene);

    // Setup Boss Controller (Phase 12)
    this.bossController = new BossController(this.scene);

    // Initial spawn
    this.resetPlayer();

    // Bind handlers
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('game-input', this.handleGameInput as EventListener);
    window.addEventListener('game-settings', this.handleGameSettings as EventListener);
    window.addEventListener('game-action', this.handleGameAction as EventListener);
    window.addEventListener('keydown', this.handleWeaponKeyDown);
    window.addEventListener('keyup', this.handleWeaponKeyUp);
    window.addEventListener('missile-hit', this.handleMissileHit as EventListener);
    window.addEventListener('cannon-hit', this.handleCannonHit as EventListener);
    window.addEventListener('enemy-destroyed', this.handleEnemyDestroyed as EventListener);
    window.addEventListener('screen-shake', this.handleScreenShake as EventListener);
    window.addEventListener('create-explosion', this.handleCreateExplosion as EventListener);
    window.addEventListener('wave-start', this.handleWaveStart as EventListener);
    window.addEventListener('beacon-request-spawn', this.handleBeaconSpawnRequest as EventListener);
    window.addEventListener('cinematic-request', this.handleCinematicRequest as EventListener);
    window.addEventListener('cinematic-complete', this.handleCinematicComplete as EventListener);
    window.addEventListener('cinematic-skip', this.handleCinematicSkip as EventListener);
    window.addEventListener('act-complete', this.handleActComplete as EventListener);
    window.addEventListener('game-pause', this.handleGamePause as EventListener);
    window.addEventListener('player-hit', this.handlePlayerHit as EventListener);
    window.addEventListener('wave-complete', this.handleWaveComplete as EventListener);
    window.addEventListener('upgrade-shop-closed', this.handleShopClosed as EventListener);
    window.addEventListener('briefing-complete', this.handleBriefingComplete as EventListener);
    window.addEventListener('game-restore', this.handleGameRestore as EventListener);
    
    // Boss event listeners (Phase 12) - Note: boss-hit is handled by BossController directly
    window.addEventListener('spawn-boss', this.handleSpawnBoss as EventListener);
    window.addEventListener('boss-defeated', this.handleBossDefeated as EventListener);
    window.addEventListener('boss-spawn-minion', this.handleBossMinionSpawn as EventListener);
    
    this.setGameState(GameState.MENU);
  }

  private handleGameAction = (e: CustomEvent) => {
    const action = e.detail.action;
    const mode = e.detail.mode; // 'campaign' or 'endless'
    
    if (action === 'start') {
      if (mode === 'endless') {
        // Phase 16: Start endless mode
        const aircraftId = e.detail.aircraftId || ProgressManager.getSelectedAircraftId();
        this.startEndlessMode(aircraftId);
      } else {
        // Campaign mode (default)
        this.startGame();
      }
    } else if (action === 'restart') {
      if (waveManager.isEndlessMode()) {
        const aircraftId = ProgressManager.getSelectedAircraftId();
        this.startEndlessMode(aircraftId);
      } else {
        this.startGame();
      }
    } else if (action === 'hangar') {
      this.returnToHangar();
    } else if (action === 'quit') {
      this.quitToMenu();
    }
  };

  // Phase 16: Start Endless Mode
  private startEndlessMode(aircraftId: string) {
    console.log('[GAME ENGINE] Starting endless mode with aircraft:', aircraftId);
    
    // Reset game state
    this.setGameState(GameState.PLAYING);
    
    // Initialize player with selected aircraft
    const aircraft = ProgressManager.getSelectedAircraft();
    
    // Reset health using the aircraft config
    this.playerHealthManager.reset(aircraft);
    
    // Reset score for endless run
    this.scoreManager.reset();
    
    // Reset wave manager for endless
    waveManager.reset();
    waveManager.startEndlessMode(aircraftId);
    
    // Dispatch endless mode start event
    window.dispatchEvent(new CustomEvent('endless-mode-start', { 
      detail: { aircraftId } 
    }));
  }

  /**
   * Restore game from saved state
   */
  private handleGameRestore = (e: CustomEvent) => {
    const save = e.detail;
    
    console.log('[GAME ENGINE] Restoring game from save:', save);
    
    // Load the save data and restore game state
    try {
      // Reset player with selected aircraft
      this.resetPlayer();
      
      // Clear any existing enemies
      this.enemyManager.clearAllEnemies();
      
      // Enable wave mode
      this.enemyManager.setWaveMode(true);
      
      // Clear enemy projectiles
      this.enemyProjectileManager.clearAll();
      
      // Reset currency and upgrades first (before restoring saved values)
      currencyManager.reset();
      upgradeManager.reset();
      
      // Restore wave number and mode
      waveManager.reset();
      waveManager.restoreFromSave(save.wave_number, save.game_mode);
      
      // Restore player health
      if (save.player_health !== undefined) {
        this.playerHealthManager.setHealth(parseFloat(save.player_health));
      }
      
      // Restore score
      if (save.current_score) {
        this.scoreManager.addScore(parseInt(save.current_score));
      }
      
      // Restore scrap currency
      if (save.scrap_currency) {
        currencyManager.addScrap(parseInt(save.scrap_currency));
      }
      
      // Restore upgrades
      if (save.upgrades_state) {
        const upgrades = typeof save.upgrades_state === 'string' 
          ? JSON.parse(save.upgrades_state) 
          : save.upgrades_state;
        
        for (const [upgradeId, level] of Object.entries(upgrades)) {
          // Restore upgrade levels by purchasing them
          for (let i = 0; i < (level as number); i++) {
            upgradeManager.purchase(upgradeId);
          }
        }
      }
      
      // Apply upgrade modifiers to systems
      this.applyUpgradeModifiers();
      
      // Start the wave manager in continue mode (spawns beacon, no timer)
      waveManager.continueGame();
      
      // Start audio
      audioManager.playMusic('combat');
      audioManager.startEngine();
      
      // Set game state to playing
      this.setGameState(GameState.PLAYING);
      
      // Show briefing for current wave
      const briefing = storyManager.getBriefing(save.wave_number);
      if (briefing) {
        window.dispatchEvent(new CustomEvent('show-briefing', {
          detail: { waveNumber: save.wave_number }
        }));
      }
      
      console.log('[GAME ENGINE] Game restored successfully');
    } catch (error) {
      console.error('[GAME ENGINE] Failed to restore game:', error);
      this.startGame();
    }
  };

  private handleGameInput = (e: CustomEvent) => {
    const { type, ...data } = e.detail;
    
    switch(type) {
      case 'stick':
        this.flightController.setAnalogInput(data.roll, data.pitch);
        break;
      
      case 'fire-primary':
        // Touch control for cannon (primary weapon)
        if (this.gameState === GameState.PLAYING) {
          this.cannonController.setFiring(data.pressed);
        }
        break;
      
      case 'fire-secondary':
        // Touch control for missiles (secondary weapon)
        if (this.gameState === GameState.PLAYING && data.pressed) {
          const primaryTarget = this.targetingController.getPrimaryTarget();
          const fired = this.missileController.fire(
            this.flightController.position,
            this.flightController.quaternion,
            primaryTarget,
            this.elapsedTime
          );
          if (fired) {
            audioManager.play('missile-launch');
          }
        }
        break;
      
      case 'throttle-up':
        // Touch control for afterburner/boost
        if (this.gameState === GameState.PLAYING) {
          this.flightController.setAfterburner(data.pressed);
        }
        break;
      
      case 'throttle-down':
        // Touch control for air brake
        if (this.gameState === GameState.PLAYING) {
          this.flightController.setAirBrake(data.pressed);
        }
        break;
      
      case 'pause':
        // Touch control for pause
        if (this.gameState === GameState.PLAYING) {
          window.dispatchEvent(new CustomEvent('game-pause', { detail: { paused: true } }));
        }
        break;
    }
  };

  private handleGameSettings = (e: CustomEvent) => {
    if (e.detail?.style) {
      this.flightController.setControlStyle(e.detail.style as ControlStyle);
    }
  };

  // ============ Weapon Input Handlers ============

  private handleWeaponKeyDown = (e: KeyboardEvent) => {
    if (this.gameState !== GameState.PLAYING) return;

    switch (e.code) {
      case 'Space':
        // Fire missile at primary target
        e.preventDefault();
        const primaryTarget = this.targetingController.getPrimaryTarget();
        const fired = this.missileController.fire(
          this.flightController.position,
          this.flightController.quaternion,
          primaryTarget,
          this.elapsedTime
        );
        if (fired) {
          audioManager.play('missile-launch');
        }
        break;
      
      case 'MouseLeft':
      case 'KeyF':
        // Hold to fire cannon
        this.cannonController.setFiring(true);
        break;
    }
  };

  private handleWeaponKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'MouseLeft':
      case 'KeyF':
        this.cannonController.setFiring(false);
        break;
    }
  };

  private handleMissileHit = (e: CustomEvent) => {
    const { targetId, damage } = e.detail;
    this.applyDamageToTarget(targetId, damage, 'missile');
  };

  private handleCannonHit = (e: CustomEvent) => {
    const { targetId, damage } = e.detail;
    this.applyDamageToTarget(targetId, damage, 'cannon');
  };

  private handleEnemyDestroyed = (e: CustomEvent) => {
    const { position } = e.detail;
    // Create explosion at enemy position
    this.explosionManager.createExplosion(
      new THREE.Vector3(position.x, position.y, position.z),
      1.5 // Larger explosion for enemy destruction
    );
    
    // Play explosion sound
    audioManager.play('explosion-medium');
    
    // Phase 15: Trigger brief slowmo on kill for dramatic effect
    cameraEffects.triggerKillSlowmo();
    
    // Register kill with wave manager
    waveManager.registerEnemyKill();
    
    // Update wave HUD
    this.dispatchWaveState();
  };

  private handleScreenShake = (e: CustomEvent) => {
    const { intensity } = e.detail;
    // Add to current shake intensity (legacy)
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    // Phase 15: Also trigger new camera effects shake
    cameraEffects.addShake(ShakeType.EXPLOSION, intensity);
  };

  private handleCreateExplosion = (e: CustomEvent) => {
    const { position, scale = 1.0 } = e.detail;
    if (position) {
      this.explosionManager.createExplosion(
        position instanceof THREE.Vector3 ? position : new THREE.Vector3(position.x, position.y, position.z),
        scale
      );
    }
  };

  // ============ Player Health Handlers (Phase 9) ============

  private handlePlayerHit = (e: CustomEvent) => {
    const { damage, source } = e.detail;
    this.playerHealthManager.takeDamage(damage, source);
    
    // Phase 15: Trigger damage effects
    const maxHealth = this.playerHealthManager.getMaxHealth();
    const damageIntensity = Math.min(damage / (maxHealth * 0.3), 1.0);
    cameraEffects.onDamage(damageIntensity);
    
    // Play hit sound
    audioManager.play('player-hit');
  };

  private onPlayerDeath = (position: THREE.Vector3) => {
    console.log('[GAME ENGINE] Player destroyed!');
    
    // Create large explosion at player position
    this.explosionManager.createExplosion(position, 3.0);
    
    // Play large explosion sound
    audioManager.play('explosion-large');
    
    // Play defeat music
    audioManager.playMusic('defeat');
    
    // Store game stats for game over screen
    const scoreState = this.scoreManager.getState();
    const currentWave = waveManager.getCurrentWave();
    (window as unknown as { gameStats: { waveReached: number; score: number; kills: number; accuracy: number } }).gameStats = {
      waveReached: currentWave?.id || 1,
      score: scoreState.score,
      kills: scoreState.kills,
      accuracy: 0, // Accuracy tracking can be added later
    };
    
    // Clear projectiles
    this.enemyProjectileManager.clearAll();
    
    // Set game over state
    this.setGameState(GameState.GAME_OVER);
  };

  private handleWaveStart = (e: CustomEvent) => {
    const { wave, isEndless, difficultyMultiplier } = e.detail as { 
      wave: Wave; 
      isEndless?: boolean; 
      difficultyMultiplier?: number;
    };
    
    // Get player direction for spawning enemies ahead
    const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.flightController.quaternion);
    
    // For endless mode, pass difficulty multipliers to enemy manager
    if (isEndless && difficultyMultiplier) {
      this.enemyManager.setEndlessModeMultipliers(
        endlessModeManager.getEnemyHealthMultiplier(),
        endlessModeManager.getEnemyDamageMultiplier(),
        endlessModeManager.getEnemySpeedMultiplier()
      );
    } else {
      // Reset multipliers for campaign mode
      this.enemyManager.setEndlessModeMultipliers(1, 1, 1);
    }
    
    // Spawn enemies for this wave
    this.enemyManager.spawnWave(wave, this.flightController.position, playerForward);
    
    // Update wave HUD
    this.dispatchWaveState();
  };

  private handleBeaconSpawnRequest = (e: CustomEvent) => {
    const { waveNumber, timerEnabled = true } = e.detail;
    
    // Get player direction for beacon placement
    const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.flightController.quaternion);
    
    // Spawn beacon ahead of player (with or without timer)
    waypointBeacon.spawn(this.flightController.position, playerForward, waveNumber, timerEnabled);
    
    // Update wave HUD
    this.dispatchWaveState();
  };

  private setupBeaconCallbacks() {
    // When player reaches beacon, notify wave manager
    waypointBeacon.setOnActivated(() => {
      waveManager.onBeaconReached();
    });

    // When beacon times out, notify wave manager
    waypointBeacon.setOnTimeout(() => {
      waveManager.onBeaconTimeout();
    });
  }

  // ============ Phase 15: Engine Trail Setup ============
  
  private setupPlayerEngineTrails() {
    // Engine particle trails disabled - using afterburner glow only
    // The afterburner glow on the jet model provides sufficient visual feedback
    return;
  }
  
  /**
   * Update engine trail intensity based on throttle
   * Note: Engine trails disabled, but keeping method for potential future use
   */
  private updateEngineTrailIntensity() {
    // Engine particle trails disabled - method kept for future use
    return;
  }

  // ============ Cinematic Handlers (Phase 8C) ============

  private handleCinematicRequest = (e: CustomEvent) => {
    const { wave } = e.detail as { wave: Wave };
    
    console.log(`[GAME ENGINE] Starting cinematic for Wave ${wave.id}`);
    
    // Start the cinematic controller
    waveCinematicController.start(
      wave,
      this.flightController.position.clone(),
      this.flightController.quaternion.clone(),
      this.camera
    );
    
    // Freeze enemies (spawn but don't move)
    this.enemyManager.setFrozen(true);
  };

  private handleCinematicComplete = () => {
    console.log('[GAME ENGINE] Cinematic complete');
    
    // Unfreeze enemies
    this.enemyManager.setFrozen(false);
    
    // Notify wave manager
    waveManager.onCinematicComplete();
    
    // Update wave HUD
    this.dispatchWaveState();
  };

  private handleCinematicSkip = () => {
    console.log('[GAME ENGINE] Cinematic skipped');
    waveCinematicController.skip();
  };

  private handleActComplete = (e: CustomEvent) => {
    const { act, waveId } = e.detail;
    console.log(`[GAME ENGINE] Act ${act} complete! (Wave ${waveId})`);
    
    // Update progress manager
    ProgressManager.completeAct(act);
    
    // Log unlock status
    console.log(`[GAME ENGINE] Acts completed: ${ProgressManager.getProgress().completedActs}`);
  };

  private handleGamePause = (e: CustomEvent) => {
    const { paused } = e.detail;
    this.isPaused = paused;
    console.log(`[GAME ENGINE] Game ${paused ? 'paused' : 'resumed'}`);
  };

  // ============ Wave Complete & Shop Handlers (Phase 10) ============

  private handleWaveComplete = (e: CustomEvent) => {
    const { wave, nextWave } = e.detail as { wave: Wave; nextWave: Wave | null };
    
    console.log(`[GAME ENGINE] Wave ${wave.id} complete!`);
    
    // Store next wave for use when shop closes
    this.nextWaveAfterComplete = nextWave;
    
    // Play wave complete fanfare
    audioManager.play('wave-complete');
    
    // Award scrap bonus for wave completion
    currencyManager.onWaveComplete(wave.id, wave.isBoss);
    
    // If there's a next wave and not returning to hangar, open the shop
    if (nextWave) {
      // Brief delay to let wave complete message show
      setTimeout(() => {
        this.openUpgradeShop(nextWave.id);
      }, 2500);
    }
  };

  private handleShopClosed = () => {
    console.log('[GAME ENGINE] Upgrade shop closed');
    
    // Apply any purchased upgrades
    this.applyUpgradeModifiers();
    
    // Apply emergency repair healing if purchased
    const healing = upgradeManager.consumeHealing();
    if (healing > 0) {
      this.playerHealthManager.heal(healing);
      console.log(`[GAME ENGINE] Applied ${healing}% emergency repair`);
    }
    
    // Use the nextWave that was stored when the current wave completed
    // This ensures we show briefing for the correct next wave
    if (this.nextWaveAfterComplete) {
      const nextWaveNumber = this.nextWaveAfterComplete.id;
      console.log(`[GAME ENGINE] Showing briefing for wave ${nextWaveNumber}`);
      
      // Advance to next wave in WaveManager to update currentWaveIndex
      // This is critical because when the player reaches the beacon and the cinematic completes,
      // startCurrentWave() will use getCurrentWave() which needs to return the correct wave
      waveManager.advanceToNextWave();
      
      // Save game state after advancing to next wave
      this.saveLiveGameState();
      
      // Show briefing for next wave before resuming
      window.dispatchEvent(new CustomEvent('show-briefing', {
        detail: { waveNumber: nextWaveNumber }
      }));
    } else {
      // Fallback if nextWave wasn't stored (shouldn't happen)
      console.warn('[GAME ENGINE] No nextWave stored, using current wave');
      const currentWave = waveManager?.getCurrentWave();
      const waveNumber = currentWave?.id || 1;
      
      // Save game state
      this.saveLiveGameState();
      
      window.dispatchEvent(new CustomEvent('show-briefing', {
        detail: { waveNumber }
      }));
    }
  };

  private handleBriefingComplete = (e: CustomEvent) => {
    const { waveNumber } = e.detail as { waveNumber: number };
    console.log(`[GAME ENGINE] Briefing complete for wave ${waveNumber}`);
    
    // Resume the game - beacon will spawn for the wave
    this.isPaused = false;
  };

  // ============ Boss Event Handlers (Phase 12) ============

  private handleSpawnBoss = (e: CustomEvent) => {
    const { bossType, waveId } = e.detail as { bossType: BossType; waveId: number };
    console.log(`[GAME ENGINE] Spawning boss: ${bossType} for wave ${waveId}`);
    
    // Get player position and forward direction for boss spawn
    const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.flightController.quaternion);
    const spawnPosition = this.flightController.position.clone()
      .add(playerForward.multiplyScalar(800)); // Spawn boss 800 units ahead
    
    this.bossController.spawnBoss(bossType, spawnPosition);
    
    // Play boss spawn sound and switch to boss music
    audioManager.play('boss-spawn');
    audioManager.fadeToMusic('boss', 2000);
  };

  // NOTE: Boss hit handling is done by BossController.takeDamage() directly
  // No duplicate handler needed here

  private handleBossDefeated = (e: CustomEvent) => {
    const { bossType, scoreValue, position } = e.detail as { 
      bossType: BossType; 
      scoreValue: number; 
      position: THREE.Vector3;
    };
    
    console.log(`[GAME ENGINE] Boss defeated: ${bossType}, score: ${scoreValue}`);
    
    // Play boss defeated sound
    audioManager.play('boss-defeated');
    
    // Create massive explosion at boss position
    this.explosionManager.createExplosion(position, 5.0);
    
    // Play massive explosion
    audioManager.play('explosion-large');
    
    // Additional smaller explosions around the boss
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 50
        );
        this.explosionManager.createExplosion(position.clone().add(offset), 2.0);
      }, i * 150);
    }
    
    // Award score through score manager
    this.scoreManager.addScore(scoreValue, `Boss ${bossType} defeated`);
    
    // Award bonus scrap for boss kill
    currencyManager.addScrap(scoreValue / 10); // 10% of score as scrap
    
    // Register wave complete (boss wave complete)
    waveManager.registerEnemyKill();
    
    // Dispatch screen shake for dramatic effect
    window.dispatchEvent(new CustomEvent('screen-shake', {
      detail: { intensity: 1.5 }
    }));
  };

  private handleBossMinionSpawn = (e: CustomEvent) => {
    const { position, count } = e.detail as { position: THREE.Vector3; count: number };
    
    console.log(`[GAME ENGINE] Boss spawning ${count} minions`);
    
    // Create minion spawn effect
    this.explosionManager.createExplosion(position, 0.8);
    
    // Spawn minion enemies through enemy manager
    for (let i = 0; i < count; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40
      );
      const spawnPos = position.clone().add(offset);
      this.enemyManager.spawnBossMinion(spawnPos, this.flightController.position);
    }
  };

  private openUpgradeShop(nextWaveNumber: number) {
    console.log(`[GAME ENGINE] Opening upgrade shop before Wave ${nextWaveNumber}`);
    this.isPaused = true;
    
    window.dispatchEvent(new CustomEvent('upgrade-shop-open', {
      detail: { waveNumber: nextWaveNumber }
    }));
  };

  /**
   * Apply upgrade modifiers to game systems (Phase 10)
   */
  private applyUpgradeModifiers() {
    const modifiers = upgradeManager.getModifiers();
    
    // Apply to missile controller
    const aircraftConfig = ProgressManager.getSelectedAircraft();
    const totalMissiles = aircraftConfig.missiles + modifiers.missileCapacity;
    const reloadMultiplier = modifiers.missileReloadSpeed;
    this.missileController.applyUpgrades(totalMissiles, reloadMultiplier);
    
    // Apply to cannon controller
    this.cannonController.applyUpgrades(modifiers.cannonDamage, modifiers.homingStrength);
    
    // Apply to targeting controller
    this.targetingController.applyUpgrades(modifiers.lockSpeed);
    
    // Apply health bonuses
    const healthBonus = modifiers.maxHealthBonus / 100; // Convert percentage to multiplier
    const shieldCharges = modifiers.shieldCharges;
    this.playerHealthManager.applyUpgrades(healthBonus, shieldCharges);
    
    console.log(`[GAME ENGINE] Applied upgrade modifiers:`, modifiers);
  }

  private applyDamageToTarget(targetId: string, damage: number, source: string) {
    this.enemyManager.damageEnemy(targetId, damage, source);
  }

  private setGameState(state: GameState) {
    this.gameState = state;
    window.dispatchEvent(new CustomEvent('game-state-change', { 
      detail: { state: this.gameState }
    }));
  }

  public startGame() {
    this.resetPlayer();
    
    // Clear any existing enemies and reset wave manager
    this.enemyManager.clearAllEnemies();
    waveManager.reset();
    
    // Enable wave mode - disables POI-based spawning for clean free flight to beacon
    this.enemyManager.setWaveMode(true);
    
    // Reset player health (Phase 9)
    const aircraftConfig = ProgressManager.getSelectedAircraft();
    this.playerHealthManager.reset(aircraftConfig);
    
    // Clear enemy projectiles (Phase 9)
    this.enemyProjectileManager.clearAll();
    
    // Reset currency and upgrades for new run (Phase 10)
    currencyManager.reset();
    upgradeManager.reset();
    
    // Apply any upgrade modifiers to systems
    this.applyUpgradeModifiers();
    
    // Start wave system (Phase 8A: immediate spawn, no beacon)
    waveManager.startGame();
    
    // Start combat music and engine sound (Phase 13)
    audioManager.playMusic('combat');
    audioManager.startEngine();
    
    this.setGameState(GameState.PLAYING);
  }

  /**
   * Return to hangar (from game over or pause menu)
   */
  public returnToHangar() {
    // Save game state before clearing
    this.saveLiveGameState();
    
    // Clear enemies and projectiles
    this.enemyManager.clearAllEnemies();
    this.enemyProjectileManager.clearAll();
    waveManager.reset();
    
    // Disable wave mode when returning to menu
    this.enemyManager.setWaveMode(false);
    
    // Reset player
    this.resetPlayer();
    const aircraftConfig = ProgressManager.getSelectedAircraft();
    this.playerHealthManager.reset(aircraftConfig);
    
    // Stop combat audio and return to menu music (Phase 13)
    audioManager.stopEngine();
    audioManager.playMusic('menu');
    
    // Return to menu
    this.setGameState(GameState.MENU);
  }

  /**
   * Dev mode: Instantly clear all enemies in current wave and open shop
   * Used for testing persistence and wave progression
   * Only works when dev mode is enabled
   */
  public clearCurrentWave() {
    // Check if dev mode is enabled
    if (!ProgressManager.isDevMode()) {
      console.warn('[GAME ENGINE] Clear wave blocked - dev mode is OFF');
      return;
    }
    
    console.log('[GAME ENGINE] Dev mode: Clearing current wave instantly');
    
    // Get all targetable enemies
    const enemies = this.enemyManager.getTargetableEnemies();
    
    if (enemies.length === 0) {
      console.warn('[GAME ENGINE] No active enemies to clear');
      return;
    }
    
    // Kill each enemy (they will dispatch enemy-destroyed events which trigger point gains)
    for (const enemy of enemies) {
      this.enemyManager.damageEnemy(enemy.id, 999999, 'wave-clear-dev');
    }
    
    // Play completion audio
    audioManager.play('wave-complete');
    
    // Small delay to let destruction events process
    setTimeout(() => {
      // Get current and next wave info
      const currentWave = waveManager.getCurrentWave();
      const nextWave = waveManager.getNextWave();
      
      if (!currentWave) {
        console.warn('[GAME ENGINE] No current wave to clear');
        return;
      }
      
      console.log(`[GAME ENGINE] Wave ${currentWave.id} cleared by dev mode`);
      
      // Award completion bonus
      currencyManager.onWaveComplete(currentWave.id, currentWave.isBoss);
      
      // If there's a next wave, open shop
      if (nextWave) {
        this.nextWaveAfterComplete = nextWave;
        this.openUpgradeShop(nextWave.id);
      } else {
        console.log('[GAME ENGINE] No next wave - game complete');
      }
    }, 100);
  }

  /**
   * Quit mission and return to main menu (full reset)
   */
  public quitToMenu() {
    console.log('[GAME ENGINE] Quitting mission to main menu');
    
    // End endless mode if active
    window.dispatchEvent(new CustomEvent('endless-mode-end'));
    
    // Use returnToHangar for the actual reset
    this.returnToHangar();
  }

  /**
   * Dispatch wave state to WaveHUD
   */
  private dispatchWaveState() {
    const hudData = waveManager.getHUDData();
    window.dispatchEvent(new CustomEvent('wave-hud-update', {
      detail: hudData
    }));
  }

  private resetPlayer() {
    // Get the currently selected aircraft
    const aircraftConfig = ProgressManager.getSelectedAircraft();
    
    // Rebuild player jet with new aircraft model
    this.rebuildPlayerJet(aircraftConfig);
    
    // Update flight controller with new aircraft config
    this.flightController.updateAircraftConfig(aircraftConfig);
    
    // Update weapon systems with new aircraft config
    this.missileController.updateAircraftConfig(aircraftConfig.missiles, aircraftConfig.missileReloadTime);
    this.cannonController.updateAircraftConfig(aircraftConfig.cannonDamage, aircraftConfig.cannonFireRate);
    
    // Reset position
    const pos = new THREE.Vector3(0, 200, 0);
    this.flightController.reset(pos);
    
    // Reset Camera
    const jetQuat = this.playerJet.mesh.quaternion;
    const offset = new THREE.Vector3(0, 3.5, 9.0).applyQuaternion(jetQuat);
    this.camera.position.copy(pos).add(offset);
    
    const lookOffset = new THREE.Vector3(0, 0, -30).applyQuaternion(jetQuat);
    this.currentLookAt.copy(pos).add(lookOffset);
    this.camera.lookAt(this.currentLookAt);
    
    console.log(`[GAME ENGINE] Player reset with aircraft: ${aircraftConfig.name}`);
  }
  
  /**
   * Rebuild the player jet mesh with a new aircraft configuration
   */
  private rebuildPlayerJet(aircraftConfig: PlayerAircraftConfig) {
    // Remove old jet from scene
    if (this.playerJet && this.playerJet.mesh) {
      this.scene.remove(this.playerJet.mesh);
    }
    
    // Create new jet with selected aircraft
    this.playerJet = new PlayerJet(aircraftConfig.id);
    this.scene.add(this.playerJet.mesh);
    
    // Re-setup engine trails for new jet
    this.setupPlayerEngineTrails();
  }

  private setupEnvironment() {
    const horizonColor = this.ATMOSPHERE.horizon;
    const zenithColor = this.ATMOSPHERE.zenith;
    
    this.scene.background = new THREE.Color(0x6699cc); // Daytime sky blue background

    this.activeFog = new THREE.Fog(new THREE.Color(0x88aacc), this.ATMOSPHERE.fogNear, this.ATMOSPHERE.fogFar);
    this.scene.fog = this.activeFog;
    
    // Disable moon mountains (removed for flat terrain)
    // Mountains are not initialized - terrain is flat grass

    // Ambient Light - Lower intensity for space environment
    const ambientLight = new THREE.AmbientLight(0x6644ff, 0.3);
    this.scene.add(ambientLight);

    // Directional Light (Sun-like) - Subtle magenta tint
    const sunLight = new THREE.DirectionalLight(0xff88ff, 0.6);
    sunLight.position.set(100, 300, -100);
    this.scene.add(sunLight);

    // Point lights for subtle neon accent
    const pointLight1 = new THREE.PointLight(0x00ffff, 0.4, 1000);
    pointLight1.position.set(0, 100, -100);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 0.3, 800);
    pointLight2.position.set(100, 200, 100);
    this.scene.add(pointLight2);

    // Space skybox is initialized via initSpaceSkybox() in constructor
    // Add enhanced stars with glow
    this.createCyberpunkStars();
  }

  // NOTE: createNebulaSkyDome and createProceduralSky removed - now using SpaceSkybox

  private createCyberpunkStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 8000 + Math.random() * 1500;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Mix of bright white, cyan, and magenta stars
      const colorType = Math.random();
      if (colorType < 0.5) {
        // White stars
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else if (colorType < 0.75) {
        // Cyan stars
        colors[i * 3] = 0.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else {
        // Magenta stars
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.0;
        colors[i * 3 + 2] = 1.0;
      }
      
      sizes[i] = 1 + Math.random() * 3;
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    const starMaterial = new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      fog: false
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  }

  private setupSpeedEffect() {
    const lineGeo = new THREE.BoxGeometry(0.1, 0.1, 3);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.0 });
    
    for (let i = 0; i < 40; i++) {
      const mesh = new THREE.Mesh(lineGeo, lineMat.clone());
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 25;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = -Math.random() * 100;
      mesh.position.set(x, y, z);
      this.speedLines.add(mesh);
    }
    
    this.camera.add(this.speedLines);
    this.scene.add(this.camera);
  }

  private updateSpeedEffect(dt: number, speed: number, maxSpeed: number) {
    const speedRatio = THREE.MathUtils.clamp(speed / maxSpeed, 0, 1);
    const visible = speedRatio > 0.5;
    
    this.speedLines.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;

      if (!visible) {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, dt * 5);
        return;
      }

      const moveSpeed = speed * 1.5;
      mesh.position.z += moveSpeed * dt;

      if (mesh.position.z > 5) {
        mesh.position.z = -80 - Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 25;
        mesh.position.x = Math.cos(angle) * radius;
        mesh.position.y = Math.sin(angle) * radius;
      }

      mesh.scale.z = 1 + speedRatio * 12;
      const targetOpacity = (speedRatio - 0.5) * 1.0;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, dt * 5);
      
      // Cyan color shift based on speed
      const hue = 0.5 + speedRatio * 0.1;
      mat.color.setHSL(hue, 1.0, 0.6);
    });
  }

  private handleResize = () => {
    if (!this.canvas) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    
    // Update targeting controller screen size
    this.targetingController.setScreenSize(width, height);
  };

  /**
   * Dispatch targeting state to HUD components via custom event
   */
  private dispatchTargetingState() {
    const hudInfo = this.targetingController.getHUDInfo();
    
    // Calculate screen positions for each lock
    const lockScreenPositions = hudInfo.allLocks.map(lock => {
      const screenPos = lock.target.position.clone().project(this.camera);
      return {
        lock,
        screenX: (screenPos.x + 1) / 2 * window.innerWidth,
        screenY: (1 - (screenPos.y + 1) / 2) * window.innerHeight, // Flip Y
        isVisible: screenPos.z < 1, // In front of camera
      };
    });

    window.dispatchEvent(new CustomEvent('targeting-update', {
      detail: {
        lockCount: hudInfo.lockCount,
        maxLocks: hudInfo.maxLocks,
        primaryTarget: hudInfo.primaryTarget,
        allLocks: hudInfo.allLocks,
        hasAnyLock: hudInfo.hasAnyLock,
        lockScreenPositions,
      }
    }));
  }

  /**
   * Dispatch weapons state to HUD components via custom event
   */
  private dispatchWeaponsState() {
    const missileInfo = this.missileController.getHUDInfo();
    const cannonInfo = this.cannonController.getHUDInfo();

    window.dispatchEvent(new CustomEvent('weapons-update', {
      detail: {
        missiles: missileInfo,
        cannon: cannonInfo,
      }
    }));
  }

  /**
   * Dispatch throttle state to ThrottleHUD component
   */
  private dispatchThrottleState() {
    const throttle = this.flightController.throttle;
    const speed = this.flightController.speed;
    const energy = this.flightController.energy;
    const maxEnergy = this.flightController.MAX_ENERGY;
    
    window.dispatchEvent(new CustomEvent('throttle-update', {
      detail: {
        throttle,           // 0-1 throttle value
        throttlePercent: Math.round(throttle * 100),  // 0-100%
        speed: Math.round(speed),
        energy,
        maxEnergy,
        isBoosting: throttle > 0.5,  // Boost range
      }
    }));
  }

  /**
   * Dispatch enemy state to HUD components via custom event
   */
  private dispatchEnemyState() {
    const enemyInfo = this.enemyManager.getHUDInfo();

    window.dispatchEvent(new CustomEvent('enemy-update', {
      detail: enemyInfo
    }));
  }

  /**
   * Dispatch radar data to RadarHUD
   */
  private dispatchRadarState() {
    const RADAR_RANGE = 300;
    const playerPos = this.flightController.position;
    const playerHeading = this.getPlayerHeading();
    
    const blips: Array<{
      id: string;
      x: number;
      z: number;
      type: 'enemy' | 'beacon';
      state?: string;
    }> = [];
    
    // Add enemy blips
    const enemies = this.enemyManager.getTargetableEnemies();
    for (const enemy of enemies) {
      const relX = (enemy.position.x - playerPos.x) / RADAR_RANGE;
      const relZ = (enemy.position.z - playerPos.z) / RADAR_RANGE;
      
      // Only show if within range
      const dist = Math.sqrt(relX * relX + relZ * relZ);
      if (dist <= 1.0) {
        blips.push({
          id: enemy.id,
          x: relX,
          z: relZ,
          type: 'enemy',
          state: this.enemyManager.getEnemyState(enemy.id),
        });
      }
    }

    // Add beacon blip if active (Phase 8B)
    if (waypointBeacon.isActive()) {
      const beaconPos = waypointBeacon.getPosition();
      const relX = (beaconPos.x - playerPos.x) / RADAR_RANGE;
      const relZ = (beaconPos.z - playerPos.z) / RADAR_RANGE;
      
      // Clamp to edge of radar if far away
      const dist = Math.sqrt(relX * relX + relZ * relZ);
      const clampedDist = Math.min(dist, 0.95);
      const scale = dist > 0 ? clampedDist / dist : 1;
      
      blips.push({
        id: 'beacon',
        x: relX * scale,
        z: relZ * scale,
        type: 'beacon',
      });
    }
    
    window.dispatchEvent(new CustomEvent('radar-update', {
      detail: {
        blips,
        playerHeading,
        radarRange: RADAR_RANGE,
      }
    }));

    // Also dispatch enemy compass for navigation aid
    this.dispatchEnemyCompass(enemies, playerPos, playerHeading);
  }

  /**
   * Dispatch nearest enemy compass data for navigation aid
   */
  private dispatchEnemyCompass(
    enemies: { id: string; position: THREE.Vector3; velocity: THREE.Vector3; isAlive: boolean }[],
    playerPos: THREE.Vector3,
    playerHeading: number
  ) {
    if (enemies.length === 0) {
      window.dispatchEvent(new CustomEvent('enemy-compass', { detail: null }));
      return;
    }

    // Find nearest enemy
    let nearestEnemy: typeof enemies[0] | null = null;
    let nearestDistance = Infinity;

    for (const enemy of enemies) {
      const dx = enemy.position.x - playerPos.x;
      const dz = enemy.position.z - playerPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }

    if (!nearestEnemy) {
      window.dispatchEvent(new CustomEvent('enemy-compass', { detail: null }));
      return;
    }

    // Calculate bearing relative to player heading
    const dx = nearestEnemy.position.x - playerPos.x;
    const dz = nearestEnemy.position.z - playerPos.z;
    const worldAngle = Math.atan2(dx, -dz); // Angle in world space
    const relativeBearing = worldAngle - playerHeading; // Relative to player heading

    // Check if enemy is on screen (within ~60 degree FOV)
    const normalizedBearing = ((relativeBearing % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    const isOnScreen = Math.abs(normalizedBearing) < (Math.PI / 3); // ~60 degree FOV

    window.dispatchEvent(new CustomEvent('enemy-compass', {
      detail: {
        distance: nearestDistance,
        bearing: relativeBearing,
        state: this.enemyManager.getEnemyState(nearestEnemy.id) || 'unknown',
        isOnScreen,
      }
    }));
  }
  
  /**
   * Get player heading in radians (Y-axis rotation)
   */
  private getPlayerHeading(): number {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.flightController.quaternion);
    return Math.atan2(forward.x, -forward.z);
  }

  private updateCamera(dt: number) {
    if (this.gameState === GameState.MENU) {
      // Orbit Camera for Menu
      this.orbitAngle += dt * 0.2;
      const dist = 50;
      const x = Math.sin(this.orbitAngle) * dist;
      const z = Math.cos(this.orbitAngle) * dist;
      const y = 20 + Math.sin(this.orbitAngle * 0.5) * 5;
      
      const target = this.playerJet.mesh.position.clone();
      
      this.camera.position.set(target.x + x, target.y + y, target.z + z);
      this.camera.lookAt(target);
      return;
    }

    const speed = this.flightController.speed;
    const isBoosting = this.flightController.isBoosting();
    const isEvading = this.flightController.isEvading();
    const maxSpeed = 120;

    // FOV effect - slight zoom during evasive maneuver for drama
    const speedFactor = THREE.MathUtils.clamp(speed / maxSpeed, 0, 1);
    let targetFov = this.baseFov + (speedFactor * 20) + (isBoosting ? 12 : 0);
    if (isEvading) targetFov += 8; // FOV bump during barrel roll
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 2.0);
    this.camera.updateProjectionMatrix();

    // Camera Shake - reduced during evasive for smoothness
    let targetShake = 0;
    if (isBoosting && !isEvading) targetShake += 0.3;
    if (speed < 25) targetShake += THREE.MathUtils.clamp((25 - speed) / 10, 0, 1) * 0.5;

    this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, targetShake, dt * 5.0);
    const shakeOffset = new THREE.Vector3(
      (Math.random() - 0.5) * this.shakeIntensity,
      (Math.random() - 0.5) * this.shakeIntensity,
      (Math.random() - 0.5) * this.shakeIntensity
    );

    // Chase Camera
    const jetPos = this.playerJet.mesh.position;
    const jetQuat = this.playerJet.mesh.quaternion;

    // During barrel roll, camera stays stable - don't follow the roll
    let cameraFollowQuat = jetQuat.clone();
    if (isEvading) {
      // Extract euler angles and ignore roll entirely during barrel roll
      const euler = new THREE.Euler().setFromQuaternion(jetQuat, 'YXZ');
      euler.z = 0; // Camera stays level during barrel roll
      cameraFollowQuat.setFromEuler(euler);
    }

    // Camera offset: closer for larger jet view, higher to push jet down on screen
    const offsetVector = new THREE.Vector3(0, 4.5, 6.0).applyQuaternion(cameraFollowQuat);
    const desiredPosition = jetPos.clone().add(offsetVector).add(shakeOffset);
    
    // Slower camera position follow during evasive for smoothness
    const posLerpSpeed = isEvading ? 4.0 : 8.0;
    this.camera.position.lerp(desiredPosition, 1.0 - Math.exp(-posLerpSpeed * dt));

    // LookAt - look ahead of jet, camera height pushes jet to lower screen
    let desiredLookAt: THREE.Vector3;
    
    if (isEvading) {
      // During barrel roll: look ahead in stable direction
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraFollowQuat);
      desiredLookAt = jetPos.clone().add(forward.multiplyScalar(30)).add(new THREE.Vector3(0, -2, 0));
    } else {
      // Normal flight: look ahead, slight downward angle
      const lookOffset = new THREE.Vector3(0, -1, -25).applyQuaternion(jetQuat);
      desiredLookAt = jetPos.clone().add(lookOffset);
    }
    
    // Smooth look lerp
    const lookLerpSpeed = isEvading ? 5.0 : 8.0;
    this.currentLookAt.lerp(desiredLookAt, 1.0 - Math.exp(-lookLerpSpeed * dt));
    this.camera.lookAt(this.currentLookAt);

    // Roll the camera with the jet - but not during evasive maneuver
    const jetUp = new THREE.Vector3(0, 1, 0).applyQuaternion(jetQuat);
    const worldUp = new THREE.Vector3(0, 1, 0);
    // During evasive, keep camera completely level
    const rollBlend = isEvading ? 0.0 : 0.5;
    const blendedUp = worldUp.clone().lerp(jetUp, rollBlend).normalize();
    // Faster up vector lerp during evasive to stay stable
    const upLerpSpeed = isEvading ? 8.0 : 4.0;
    this.camera.up.lerp(blendedUp, 1.0 - Math.exp(-upLerpSpeed * dt));
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
    console.log('Game Engine Initialized');
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animationFrameId = requestAnimationFrame(this.loop);

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    // Clamp dt
    dt = Math.min(dt, 0.1);
    this.elapsedTime += dt;

    // Update Systems
    if (this.gameState === GameState.PLAYING) {
      // Check if paused (Phase 8D)
      if (this.isPaused) {
        // Still render but don't update game logic
        this.renderer.render(this.scene, this.camera);
        // Don't schedule another frame here - it's already scheduled at the top of loop()
        return;
      }
      
      // Check if in cinematic state
      const inCinematic = waveCinematicController.isPlaying();
      
      // Only update player controls if not in cinematic
      if (!inCinematic) {
        this.flightController.update(dt);
      }
      
      // Update wave manager (Phase 8A)
      waveManager.update(dt, this.elapsedTime);
      
      // Update beacon (Phase 8B)
      waypointBeacon.update(dt, this.flightController.position);
      
      // Update cinematic controller (Phase 8C)
      if (inCinematic) {
        waveCinematicController.update(dt);
      }
      
      // Update enemy AI (frozen check is inside EnemyManager)
      this.enemyManager.update(
        dt,
        this.elapsedTime,
        this.flightController.position,
        this.flightController.velocity
      );
      
      // Dispatch wave state for HUD (update enemy counts)
      this.dispatchWaveState();
      
      // Get targetable enemies from manager
      const enemies = this.enemyManager.getTargetableEnemies();
      
      // Update targeting system
      const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.flightController.quaternion);
      this.targetingController.update(
        dt,
        this.flightController.position,
        playerForward,
        enemies
      );
      
      // Build target map for weapons
      const targetMap = new Map<string, { position: THREE.Vector3; velocity: THREE.Vector3; isAlive: boolean }>();
      for (const enemy of enemies) {
        targetMap.set(enemy.id, {
          position: enemy.position,
          velocity: enemy.velocity,
          isAlive: enemy.isAlive,
        });
      }

      // Update missile controller
      this.missileController.update(
        dt,
        this.flightController.position,
        this.flightController.quaternion,
        targetMap
      );

      // Update cannon controller
      this.cannonController.update(
        dt,
        this.elapsedTime,
        this.flightController.position,
        this.flightController.quaternion,
        this.targetingController.getPrimaryTarget(),
        targetMap
      );
      
      // Dispatch targeting state for HUD
      this.dispatchTargetingState();
      
      // Dispatch weapons state for HUD
      this.dispatchWeaponsState();
      
      // Dispatch throttle state for HUD
      this.dispatchThrottleState();
      
      // Dispatch enemy state for HUD
      this.dispatchEnemyState();
      
      // Dispatch radar state for RadarHUD
      this.dispatchRadarState();
      
      // Update explosion effects
      this.explosionManager.update(dt);
      
      // Update score manager (for combo timer)
      this.scoreManager.update(dt);
      
      // Update player health (Phase 9)
      this.playerHealthManager.update(dt, this.flightController.position);
      
      // Update enemy projectiles (Phase 9)
      this.enemyProjectileManager.update(dt, this.flightController.position);
      
      // Update boss controller (Phase 12)
      this.bossController.update(dt, this.flightController.position);
      
      // Phase 15: Update particle trail system
      if (this.particleTrailSystem) {
        this.particleTrailSystem.update(dt);
        this.updateEngineTrailIntensity();
        
        // Dispatch performance metrics
        window.dispatchEvent(new CustomEvent('performance-update', {
          detail: { particleCount: this.particleTrailSystem.getParticleCount() }
        }));
      }
      
      // Phase 15: Update camera effects (returns time scale for slowmo)
      const effectsTimeScale = cameraEffects.update(dt);
      this.timeScale = THREE.MathUtils.lerp(this.timeScale, effectsTimeScale, 0.1);
      
      // Phase 15: Apply boost shake
      if (this.flightController.isBoosting()) {
        cameraEffects.setBoostShake(true, this.flightController.speed / 120);
      }
    }

    // Sync jet with controller
    this.playerJet.mesh.position.copy(this.flightController.position);
    this.playerJet.mesh.quaternion.copy(this.flightController.quaternion);
    this.playerJet.update(dt, this.flightController.getInputState(), this.flightController.throttle);

    // Update Grid
    this.infinityGrid.update(this.flightController.position, this.elapsedTime);

    // Update Sky position
    if (this.skyMesh) {
      this.skyMesh.position.copy(this.flightController.position);
      // Animate sky shader time for nebula effect
      const skyMaterial = this.skyMesh.material as THREE.ShaderMaterial;
      if (skyMaterial.uniforms && skyMaterial.uniforms.time) {
        skyMaterial.uniforms.time.value += dt;
      }
    }
    
    // Phase 15: Update nebula system
    if (this.nebulaSystemInstance) {
      this.nebulaSystemInstance.update(this.flightController.position, this.elapsedTime);
    }
    
    // Update space skybox (follows camera for seamless sky)
    if (this.spaceSkybox) {
      this.spaceSkybox.update(this.elapsedTime, this.flightController.position);
    }
    
    // Update moon mountains (loads chunks as player moves)
    if (this.moonMountains) {
      this.moonMountains.update(this.flightController.position);
    }

    // Update Camera (skip if cinematic is controlling camera)
    if (!waveCinematicController.isPlaying()) {
      this.updateCamera(dt);
    }

    // Update Speed Effect
    this.updateSpeedEffect(dt, this.flightController.speed, 120);

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Save current game state to database if logged in
   */
  private saveLiveGameState() {
    if (!isLoggedIn()) {
      return; // Not logged in, skip database save
    }

    try {
      const currentWave = waveManager.getCurrentWave();
      const upgrades: Record<string, number> = {};
      
      // Collect all purchased upgrades
      const allUpgradeIds = ['cannon_damage', 'missile_capacity', 'missile_speed', 'missile_tracking',
        'health_increase', 'armor_upgrade', 'afterburner_efficiency', 'cooling_system',
        'emergency_repair', 'radar_upgrade'];
      
      for (const upgradeId of allUpgradeIds) {
        const level = upgradeManager.getUpgradeLevel(upgradeId);
        if (level > 0) {
          upgrades[upgradeId] = level;
        }
      }

      const scoreState = this.scoreManager.getState();
      
      const saveData = {
        waveNumber: currentWave?.id || 1,
        actNumber: currentWave?.act || 1,
        gameMode: waveManager.isEndlessMode() ? 'ENDLESS' : 'CAMPAIGN',
        isPaused: this.isPaused,
        playerHealth: this.playerHealthManager.getHealth(),
        playerMaxHealth: this.playerHealthManager.getMaxHealth(),
        playerPosition: {
          x: this.flightController.position.x,
          y: this.flightController.position.y,
          z: this.flightController.position.z,
        },
        currentScore: scoreState.score,
        currentCombo: scoreState.combo,
        scrapCurrency: currencyManager.getScrap(),
        upgradesState: upgrades,
        enemiesState: [], // Could be populated with enemy positions/states for advanced restoration
        waveElapsedTime: this.elapsedTime,
        totalFlightTime: ProgressManager.getProgress().totalFlightTime,
      };

      saveGameState(saveData).catch((error) => {
        console.warn('[GAME ENGINE] Failed to save game state:', error);
      });
    } catch (error) {
      console.warn('[GAME ENGINE] Error preparing game save:', error);
    }
  };

  public dispose() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleWeaponKeyDown);
    window.removeEventListener('keyup', this.handleWeaponKeyUp);
    window.removeEventListener('missile-hit', this.handleMissileHit as EventListener);
    window.removeEventListener('cannon-hit', this.handleCannonHit as EventListener);
    window.removeEventListener('enemy-destroyed', this.handleEnemyDestroyed as EventListener);
    window.removeEventListener('screen-shake', this.handleScreenShake as EventListener);
    window.removeEventListener('create-explosion', this.handleCreateExplosion as EventListener);
    window.removeEventListener('beacon-request-spawn', this.handleBeaconSpawnRequest as EventListener);
    window.removeEventListener('cinematic-request', this.handleCinematicRequest as EventListener);
    window.removeEventListener('cinematic-complete', this.handleCinematicComplete as EventListener);
    window.removeEventListener('cinematic-skip', this.handleCinematicSkip as EventListener);
    window.removeEventListener('act-complete', this.handleActComplete as EventListener);
    window.removeEventListener('game-pause', this.handleGamePause as EventListener);
    window.removeEventListener('player-hit', this.handlePlayerHit as EventListener);
    window.removeEventListener('briefing-complete', this.handleBriefingComplete as EventListener);
    
    // Remove boss event listeners (Phase 12) - Note: boss-hit is handled by BossController
    window.removeEventListener('spawn-boss', this.handleSpawnBoss as EventListener);
    window.removeEventListener('boss-defeated', this.handleBossDefeated as EventListener);
    window.removeEventListener('boss-spawn-minion', this.handleBossMinionSpawn as EventListener);
    
    this.flightController.dispose();
    this.playerJet.dispose();
    this.infinityGrid.dispose();
    this.missileController.dispose();
    this.cannonController.dispose();
    this.enemyManager.dispose();
    this.explosionManager.dispose();
    this.scoreManager.dispose();
    this.enemyProjectileManager.dispose();
    this.bossController.dispose();
    audioManager.dispose();
    waypointBeacon.dispose();
    
    // Phase 15: Dispose effects systems
    if (this.particleTrailSystem) {
      this.particleTrailSystem.dispose();
    }
    if (this.nebulaSystemInstance) {
      this.nebulaSystemInstance.dispose();
    }
    cameraEffects.reset();
    
    this.renderer.dispose();
    
    console.log('Disposing Game Engine');
  }
}

/**
 * EndlessModeManager - Manages infinite wave mode after campaign completion
 * 
 * Phase 16: Endless Mode
 * - Procedural wave generation with scaling difficulty
 * - Wave modifiers for variety
 * - Boss every 5 waves
 * - Local leaderboard with top 10 runs
 * - Exponential enemy stat scaling
 */

import { EnemyType, WaveComposition, Wave } from './WaveManager';

// ============ Types ============

export type WaveModifier = 
  | 'none'
  | 'phantom_swarm'   // Extra phantoms, faster spawns
  | 'warden_wall'     // Heavy warden focus
  | 'specter_ambush'  // Elite specters with cloak
  | 'viper_blitz'     // Fast vipers, aggressive
  | 'mixed_assault'   // Balanced all types
  | 'elite_guard'     // All specter + warden
  | 'speed_demons'    // Phantom + viper only, fast
  | 'iron_fortress';  // All wardens, reduced count

export interface EndlessWave extends Wave {
  modifier: WaveModifier;
  difficultyMultiplier: number;
  modifierDescription: string;
}

export interface EndlessRun {
  id: string;
  date: string;
  waveReached: number;
  score: number;
  kills: number;
  duration: number; // seconds
  aircraftUsed: string;
}

export interface EndlessLeaderboard {
  runs: EndlessRun[];
  bestWave: number;
  bestScore: number;
}

// ============ Constants ============

const STORAGE_KEY = 'skyfall-protocol-endless-leaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

// Base enemy counts for endless waves
const BASE_ENEMY_COUNTS: Record<EnemyType, number> = {
  phantom: 3,
  viper: 2,
  warden: 1,
  specter: 0,
};

// Modifier configurations
const MODIFIER_CONFIGS: Record<WaveModifier, {
  name: string;
  description: string;
  composition: Partial<Record<EnemyType, number>>; // Multipliers
  extraEnemies: number;
}> = {
  none: {
    name: 'Standard Wave',
    description: 'Balanced enemy composition',
    composition: { phantom: 1, viper: 1, warden: 1, specter: 1 },
    extraEnemies: 0,
  },
  phantom_swarm: {
    name: 'Phantom Swarm',
    description: 'Waves of fast scout drones',
    composition: { phantom: 3, viper: 0.5, warden: 0, specter: 0 },
    extraEnemies: 4,
  },
  warden_wall: {
    name: 'Warden Wall',
    description: 'Heavy armored assault',
    composition: { phantom: 0, viper: 0.5, warden: 3, specter: 0.5 },
    extraEnemies: 2,
  },
  specter_ambush: {
    name: 'Specter Ambush',
    description: 'Elite cloaked hunters',
    composition: { phantom: 0, viper: 0, warden: 0.5, specter: 3 },
    extraEnemies: 3,
  },
  viper_blitz: {
    name: 'Viper Blitz',
    description: 'Aggressive fighter squadron',
    composition: { phantom: 0.5, viper: 3, warden: 0, specter: 0.5 },
    extraEnemies: 4,
  },
  mixed_assault: {
    name: 'Mixed Assault',
    description: 'All enemy types combined',
    composition: { phantom: 1.5, viper: 1.5, warden: 1.5, specter: 1.5 },
    extraEnemies: 6,
  },
  elite_guard: {
    name: 'Elite Guard',
    description: 'Specters with heavy escort',
    composition: { phantom: 0, viper: 0, warden: 2, specter: 2.5 },
    extraEnemies: 3,
  },
  speed_demons: {
    name: 'Speed Demons',
    description: 'Fast and agile attackers',
    composition: { phantom: 2, viper: 2, warden: 0, specter: 0 },
    extraEnemies: 5,
  },
  iron_fortress: {
    name: 'Iron Fortress',
    description: 'Maximum armor, minimum mercy',
    composition: { phantom: 0, viper: 0, warden: 4, specter: 0 },
    extraEnemies: 1,
  },
};

// Boss types for endless mode
const ENDLESS_BOSS_ROTATION: Array<'carrier-drone' | 'command-ship' | 'swarm-queen'> = [
  'carrier-drone',
  'command-ship',
  'swarm-queen',
];

// ============ EndlessModeManager Class ============

class EndlessModeManagerClass {
  private active: boolean = false;
  private currentWave: number = 0;
  private currentRun: Partial<EndlessRun> | null = null;
  private runStartTime: number = 0;
  private leaderboard: EndlessLeaderboard;
  
  // Difficulty scaling
  private readonly BASE_DIFFICULTY = 1.0;
  private readonly DIFFICULTY_SCALE_PER_WAVE = 0.08; // 8% per wave
  private readonly SHOP_HEAL_REDUCTION_PER_WAVE = 0.02; // 2% less healing per wave
  
  constructor() {
    this.leaderboard = this.loadLeaderboard();
    console.log('[ENDLESS MODE] Initialized with', this.leaderboard.runs.length, 'saved runs');
  }
  
  // ============ Leaderboard Persistence ============
  
  private loadLeaderboard(): EndlessLeaderboard {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load endless leaderboard:', e);
    }
    return { runs: [], bestWave: 0, bestScore: 0 };
  }
  
  private saveLeaderboard(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.leaderboard));
    } catch (e) {
      console.warn('Failed to save endless leaderboard:', e);
    }
  }
  
  // ============ Mode Management ============
  
  /**
   * Start a new endless mode run
   */
  startEndlessMode(aircraftId: string): void {
    this.active = true;
    this.currentWave = 0;
    this.runStartTime = Date.now();
    
    this.currentRun = {
      id: `endless-${Date.now()}`,
      date: new Date().toISOString(),
      waveReached: 0,
      score: 0,
      kills: 0,
      duration: 0,
      aircraftUsed: aircraftId,
    };
    
    console.log('[ENDLESS MODE] New run started with aircraft:', aircraftId);
    
    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('endless-mode-start', {
      detail: { aircraftId }
    }));
  }
  
  /**
   * End the current endless run
   */
  endRun(finalScore: number, totalKills: number): EndlessRun | null {
    if (!this.active || !this.currentRun) {
      return null;
    }
    
    const duration = (Date.now() - this.runStartTime) / 1000;
    
    const completedRun: EndlessRun = {
      id: this.currentRun.id || `endless-${Date.now()}`,
      date: this.currentRun.date || new Date().toISOString(),
      waveReached: this.currentWave,
      score: finalScore,
      kills: totalKills,
      duration,
      aircraftUsed: this.currentRun.aircraftUsed || 'falcon',
    };
    
    // Add to leaderboard
    this.addToLeaderboard(completedRun);
    
    // Reset state
    this.active = false;
    this.currentRun = null;
    
    console.log('[ENDLESS MODE] Run ended:', completedRun);
    
    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('endless-mode-end', {
      detail: { run: completedRun }
    }));
    
    return completedRun;
  }
  
  /**
   * Add a run to the leaderboard (sorted by wave, then score)
   */
  private addToLeaderboard(run: EndlessRun): void {
    this.leaderboard.runs.push(run);
    
    // Sort by wave reached (desc), then score (desc)
    this.leaderboard.runs.sort((a, b) => {
      if (b.waveReached !== a.waveReached) {
        return b.waveReached - a.waveReached;
      }
      return b.score - a.score;
    });
    
    // Keep only top entries
    if (this.leaderboard.runs.length > MAX_LEADERBOARD_ENTRIES) {
      this.leaderboard.runs = this.leaderboard.runs.slice(0, MAX_LEADERBOARD_ENTRIES);
    }
    
    // Update best records
    if (run.waveReached > this.leaderboard.bestWave) {
      this.leaderboard.bestWave = run.waveReached;
    }
    if (run.score > this.leaderboard.bestScore) {
      this.leaderboard.bestScore = run.score;
    }
    
    this.saveLeaderboard();
  }
  
  // ============ Wave Generation ============
  
  /**
   * Generate the next endless wave
   */
  generateNextWave(): EndlessWave {
    this.currentWave++;
    
    const isBossWave = this.currentWave % 5 === 0;
    const modifier = isBossWave ? 'none' : this.selectModifier();
    const difficultyMultiplier = this.calculateDifficulty();
    
    const composition = this.generateComposition(modifier, difficultyMultiplier);
    
    const wave: EndlessWave = {
      id: this.currentWave,
      act: Math.ceil(this.currentWave / 5), // "Acts" every 5 waves
      name: this.generateWaveName(modifier, isBossWave),
      composition,
      isBoss: isBossWave,
      bossType: isBossWave ? this.getBossForWave(this.currentWave) : undefined,
      modifier,
      difficultyMultiplier,
      modifierDescription: MODIFIER_CONFIGS[modifier].description,
    };
    
    // Update run tracking
    if (this.currentRun) {
      this.currentRun.waveReached = this.currentWave;
    }
    
    console.log(`[ENDLESS MODE] Generated Wave ${this.currentWave}:`, wave.name, 
      `(${composition.reduce((s, c) => s + c.count, 0)} enemies, ${difficultyMultiplier.toFixed(2)}x difficulty)`);
    
    return wave;
  }
  
  /**
   * Select a random modifier based on wave number
   */
  private selectModifier(): WaveModifier {
    const modifiers: WaveModifier[] = ['none', 'phantom_swarm', 'viper_blitz'];
    
    // Unlock more modifiers as waves progress
    if (this.currentWave >= 3) {
      modifiers.push('warden_wall', 'mixed_assault');
    }
    if (this.currentWave >= 6) {
      modifiers.push('specter_ambush', 'speed_demons');
    }
    if (this.currentWave >= 10) {
      modifiers.push('elite_guard', 'iron_fortress');
    }
    
    // Weight towards interesting modifiers after early waves
    if (this.currentWave > 3 && Math.random() < 0.7) {
      // 70% chance to get a non-standard modifier after wave 3
      const interestingModifiers = modifiers.filter(m => m !== 'none');
      if (interestingModifiers.length > 0) {
        return interestingModifiers[Math.floor(Math.random() * interestingModifiers.length)];
      }
    }
    
    return modifiers[Math.floor(Math.random() * modifiers.length)];
  }
  
  /**
   * Generate enemy composition based on modifier and difficulty
   */
  private generateComposition(modifier: WaveModifier, difficulty: number): WaveComposition[] {
    const config = MODIFIER_CONFIGS[modifier];
    const composition: WaveComposition[] = [];
    
    const enemyTypes: EnemyType[] = ['phantom', 'viper', 'warden', 'specter'];
    
    for (const type of enemyTypes) {
      const baseCount = BASE_ENEMY_COUNTS[type];
      const modifierMultiplier = config.composition[type] || 0;
      
      // Scale with difficulty and wave number
      const waveScale = 1 + (this.currentWave - 1) * 0.15; // 15% more per wave
      let count = Math.floor(baseCount * modifierMultiplier * waveScale * difficulty);
      
      // Add extra enemies from modifier
      if (modifierMultiplier > 1) {
        count += Math.floor(config.extraEnemies * (modifierMultiplier - 1) / 2);
      }
      
      // Specters unlock at wave 5+
      if (type === 'specter' && this.currentWave < 5) {
        count = 0;
      }
      
      // Cap individual type counts
      const maxCounts: Record<EnemyType, number> = {
        phantom: 12,
        viper: 10,
        warden: 6,
        specter: 5,
      };
      count = Math.min(count, maxCounts[type]);
      
      if (count > 0) {
        composition.push({ type, count });
      }
    }
    
    // Ensure at least some enemies
    if (composition.length === 0 || composition.reduce((s, c) => s + c.count, 0) < 2) {
      composition.push({ type: 'phantom', count: 3 + this.currentWave });
    }
    
    return composition;
  }
  
  /**
   * Calculate difficulty multiplier for current wave
   */
  private calculateDifficulty(): number {
    // Exponential scaling: each wave is 8% harder
    return this.BASE_DIFFICULTY * Math.pow(1 + this.DIFFICULTY_SCALE_PER_WAVE, this.currentWave - 1);
  }
  
  /**
   * Get boss type for a boss wave (rotates through all 3)
   */
  private getBossForWave(waveNumber: number): string {
    const bossIndex = Math.floor((waveNumber / 5) - 1) % ENDLESS_BOSS_ROTATION.length;
    return ENDLESS_BOSS_ROTATION[bossIndex];
  }
  
  /**
   * Generate a wave name
   */
  private generateWaveName(modifier: WaveModifier, isBoss: boolean): string {
    if (isBoss) {
      const bossNames = [
        'Carrier Return',
        'Command Assault',
        'Queen\'s Fury',
        'Drone Armada',
        'Fleet Vanguard',
        'The Swarm Rises',
      ];
      return bossNames[Math.floor(this.currentWave / 5 - 1) % bossNames.length];
    }
    
    return MODIFIER_CONFIGS[modifier].name;
  }
  
  // ============ Difficulty Modifiers ============
  
  /**
   * Get stat multiplier for enemy scaling
   */
  getEnemyStatMultiplier(): number {
    if (!this.active) return 1;
    return this.calculateDifficulty();
  }
  
  /**
   * Get health multiplier for enemies
   */
  getEnemyHealthMultiplier(): number {
    if (!this.active) return 1;
    // Health scales slightly slower than overall difficulty
    return 1 + (this.calculateDifficulty() - 1) * 0.7;
  }
  
  /**
   * Get damage multiplier for enemies
   */
  getEnemyDamageMultiplier(): number {
    if (!this.active) return 1;
    // Damage scales slightly slower
    return 1 + (this.calculateDifficulty() - 1) * 0.5;
  }
  
  /**
   * Get speed multiplier for enemies
   */
  getEnemySpeedMultiplier(): number {
    if (!this.active) return 1;
    // Speed caps at 1.5x
    return Math.min(1.5, 1 + (this.calculateDifficulty() - 1) * 0.3);
  }
  
  /**
   * Get shop healing efficiency (decreases over time)
   */
  getShopHealingMultiplier(): number {
    if (!this.active) return 1;
    // Healing decreases by 2% per wave, minimum 50%
    return Math.max(0.5, 1 - this.currentWave * this.SHOP_HEAL_REDUCTION_PER_WAVE);
  }
  
  /**
   * Get spawn delay multiplier (spawns get faster)
   */
  getSpawnDelayMultiplier(): number {
    if (!this.active) return 1;
    // Spawns speed up, minimum 0.5x delay
    return Math.max(0.5, 1 - this.currentWave * 0.03);
  }
  
  // ============ Getters ============
  
  isActive(): boolean {
    return this.active;
  }
  
  getCurrentWave(): number {
    return this.currentWave;
  }
  
  getBestWave(): number {
    return this.leaderboard.bestWave;
  }
  
  getBestScore(): number {
    return this.leaderboard.bestScore;
  }
  
  getLeaderboard(): EndlessRun[] {
    return [...this.leaderboard.runs];
  }
  
  getCurrentModifier(): WaveModifier | null {
    return null; // Set by wave generation
  }
  
  getModifierInfo(modifier: WaveModifier): { name: string; description: string } {
    const config = MODIFIER_CONFIGS[modifier];
    return { name: config.name, description: config.description };
  }
  
  /**
   * Get HUD data for endless mode
   */
  getHUDData() {
    return {
      active: this.active,
      currentWave: this.currentWave,
      bestWave: this.leaderboard.bestWave,
      bestScore: this.leaderboard.bestScore,
      difficultyMultiplier: this.calculateDifficulty(),
      healingMultiplier: this.getShopHealingMultiplier(),
    };
  }
  
  /**
   * Reset endless mode state
   */
  reset(): void {
    this.active = false;
    this.currentWave = 0;
    this.currentRun = null;
    this.runStartTime = 0;
  }
  
  /**
   * Clear leaderboard (debug/reset)
   */
  clearLeaderboard(): void {
    this.leaderboard = { runs: [], bestWave: 0, bestScore: 0 };
    this.saveLeaderboard();
    console.log('[ENDLESS MODE] Leaderboard cleared');
  }
}

// ============ Singleton Export ============

export const endlessModeManager = new EndlessModeManagerClass();


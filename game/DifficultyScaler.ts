/**
 * DifficultyScaler - Manages difficulty scaling for waves
 * 
 * Phase 8D: Boss Waves & Polish
 * 
 * Scales:
 * - Enemy health: +10% per wave
 * - Enemy damage: +5% per wave
 * - AI aggression: Increases in later acts
 */

// ============ Scaling Constants ============

const HEALTH_SCALE_PER_WAVE = 0.05;  // +5% per wave (reduced from 10%)
const DAMAGE_SCALE_PER_WAVE = 0.03;  // +3% per wave (reduced from 5%)
const BASE_WAVE = 1;                  // First wave has no scaling

// Aggression modifiers by act (applied to base aggressiveness)
const ACT_AGGRESSION_MODIFIERS: Record<number, number> = {
  1: 0.8,   // Act 1: Reduced base aggression
  2: 1.0,   // Act 2: Normal aggression
  3: 1.2,   // Act 3: Slightly more aggressive
};

// ============ Difficulty Modifiers Interface ============

export interface DifficultyModifiers {
  healthMultiplier: number;
  damageMultiplier: number;
  aggressionMultiplier: number;
  waveNumber: number;
  actNumber: number;
}

// ============ DifficultyScaler Class ============

class DifficultyScaler {
  private currentWave: number = 1;
  private currentAct: number = 1;

  constructor() {
    console.log('[DIFFICULTY] Scaler initialized');
  }

  /**
   * Set the current wave and act for scaling calculations
   */
  public setWave(waveNumber: number, actNumber: number = 1): void {
    this.currentWave = waveNumber;
    this.currentAct = actNumber;
    console.log(`[DIFFICULTY] Wave ${waveNumber} (Act ${actNumber}) - Health: ${this.getHealthMultiplier().toFixed(2)}x, Damage: ${this.getDamageMultiplier().toFixed(2)}x`);
  }

  /**
   * Get health multiplier for current wave
   * Wave 1: 1.0x, Wave 5: 1.4x, Wave 10: 1.9x, Wave 15: 2.4x
   */
  public getHealthMultiplier(): number {
    const wavesAboveBase = this.currentWave - BASE_WAVE;
    return 1 + (wavesAboveBase * HEALTH_SCALE_PER_WAVE);
  }

  /**
   * Get damage multiplier for current wave
   * Wave 1: 1.0x, Wave 5: 1.2x, Wave 10: 1.45x, Wave 15: 1.7x
   */
  public getDamageMultiplier(): number {
    const wavesAboveBase = this.currentWave - BASE_WAVE;
    return 1 + (wavesAboveBase * DAMAGE_SCALE_PER_WAVE);
  }

  /**
   * Get aggression multiplier based on current act
   */
  public getAggressionMultiplier(): number {
    return ACT_AGGRESSION_MODIFIERS[this.currentAct] || 1.0;
  }

  /**
   * Get all difficulty modifiers for current wave
   */
  public getModifiers(): DifficultyModifiers {
    return {
      healthMultiplier: this.getHealthMultiplier(),
      damageMultiplier: this.getDamageMultiplier(),
      aggressionMultiplier: this.getAggressionMultiplier(),
      waveNumber: this.currentWave,
      actNumber: this.currentAct,
    };
  }

  /**
   * Apply health scaling to a base health value
   */
  public scaleHealth(baseHealth: number): number {
    return Math.ceil(baseHealth * this.getHealthMultiplier());
  }

  /**
   * Apply damage scaling to a base damage value
   */
  public scaleDamage(baseDamage: number): number {
    return Math.ceil(baseDamage * this.getDamageMultiplier());
  }

  /**
   * Apply aggression scaling to a base aggressiveness value
   */
  public scaleAggression(baseAggression: number): number {
    return Math.min(1.0, baseAggression * this.getAggressionMultiplier());
  }

  /**
   * Get current wave number
   */
  public getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Get current act number
   */
  public getCurrentAct(): number {
    return this.currentAct;
  }

  /**
   * Reset to wave 1
   */
  public reset(): void {
    this.currentWave = 1;
    this.currentAct = 1;
  }

  /**
   * Get scaling preview for HUD display
   */
  public getScalingInfo(): { health: string; damage: string; act: number } {
    const healthPercent = Math.round((this.getHealthMultiplier() - 1) * 100);
    const damagePercent = Math.round((this.getDamageMultiplier() - 1) * 100);
    
    return {
      health: healthPercent > 0 ? `+${healthPercent}%` : '0%',
      damage: damagePercent > 0 ? `+${damagePercent}%` : '0%',
      act: this.currentAct,
    };
  }
}

// ============ Singleton Export ============

export const difficultyScaler = new DifficultyScaler();

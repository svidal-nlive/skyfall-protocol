/**
 * CurrencyManager - Manages scrap currency for the upgrade system
 * 
 * Phase 10: Upgrade Shop & Currency
 * - Scrap earned from enemy kills (1 scrap = 10 points)
 * - Persists between waves within a run
 * - Resets on death/new run
 * - Tracks spending for upgrades
 */

import { ProgressManager } from './ProgressManager';

// ============ Types ============

export interface CurrencyState {
  scrap: number;
  totalEarned: number;
  totalSpent: number;
}

export interface ScrapEarnedEvent {
  amount: number;
  source: string;
  enemyType?: string;
}

// ============ Constants ============

const POINTS_TO_SCRAP_RATIO = 10; // 10 points = 1 scrap

// Bonus scrap for specific achievements
const BONUS_SCRAP = {
  comboBonus: 5,        // Bonus for high combo
  waveComplete: 25,     // Bonus for completing a wave
  bossKill: 100,        // Bonus for killing a boss
  noHitWave: 50,        // Bonus for completing wave without taking damage
  actComplete: 150,     // Bonus for completing an act
};

// ============ CurrencyManager Class ============

export class CurrencyManager {
  private scrap: number = 0;
  private totalEarned: number = 0;
  private totalSpent: number = 0;
  
  // Track for no-hit bonus
  private damageTakenThisWave: boolean = false;

  constructor() {
    console.log('[CURRENCY] Manager initialized');
  }

  // ============ Scrap Earning ============

  /**
   * Award scrap from points (enemy kills)
   */
  public earnFromPoints(points: number, enemyType?: string): number {
    const scrapEarned = Math.floor(points / POINTS_TO_SCRAP_RATIO);
    
    if (scrapEarned > 0) {
      this.scrap += scrapEarned;
      this.totalEarned += scrapEarned;
      
      console.log(`[CURRENCY] +${scrapEarned} scrap from ${enemyType || 'kill'} (${points} points)`);
      
      // Dispatch event for UI
      this.dispatchScrapUpdate();
      this.dispatchScrapEarned(scrapEarned, 'kill', enemyType);
    }
    
    return scrapEarned;
  }

  /**
   * Award bonus scrap for achievements
   */
  public earnBonus(bonusType: keyof typeof BONUS_SCRAP, multiplier: number = 1): number {
    const baseBonus = BONUS_SCRAP[bonusType];
    const scrapEarned = Math.floor(baseBonus * multiplier);
    
    this.scrap += scrapEarned;
    this.totalEarned += scrapEarned;
    
    console.log(`[CURRENCY] +${scrapEarned} scrap from ${bonusType}`);
    
    // Dispatch events
    this.dispatchScrapUpdate();
    this.dispatchScrapEarned(scrapEarned, bonusType);
    
    return scrapEarned;
  }

  /**
   * Direct scrap addition (for testing/cheats)
   */
  public addScrap(amount: number): void {
    this.scrap += amount;
    this.totalEarned += amount;
    this.dispatchScrapUpdate();
  }

  // ============ Scrap Spending ============

  /**
   * Check if player can afford a purchase
   */
  public canAfford(cost: number): boolean {
    // Dev mode = infinite scrap
    if (ProgressManager.isDevMode()) return true;
    return this.scrap >= cost;
  }

  /**
   * Spend scrap on an upgrade
   * Returns true if successful, false if insufficient funds
   */
  public spend(cost: number): boolean {
    if (!this.canAfford(cost)) {
      console.log(`[CURRENCY] Cannot afford ${cost} scrap (have: ${this.scrap})`);
      return false;
    }
    
    // In dev mode, don't actually deduct scrap
    if (!ProgressManager.isDevMode()) {
      this.scrap -= cost;
      this.totalSpent += cost;
    }
    
    console.log(`[CURRENCY] Spent ${cost} scrap (remaining: ${this.scrap})${ProgressManager.isDevMode() ? ' [DEV MODE]' : ''}`);
    
    this.dispatchScrapUpdate();
    return true;
  }

  /**
   * Refund scrap (for upgrade downgrades or cancellations)
   */
  public refund(amount: number): void {
    this.scrap += amount;
    this.totalSpent -= amount;
    
    console.log(`[CURRENCY] Refunded ${amount} scrap`);
    this.dispatchScrapUpdate();
  }

  // ============ Wave Management ============

  /**
   * Called when a wave completes - awards wave completion bonus
   */
  public onWaveComplete(waveNumber: number, isBoss: boolean): void {
    // Base wave completion bonus
    const waveMultiplier = 1 + (waveNumber * 0.1); // +10% per wave
    this.earnBonus('waveComplete', waveMultiplier);
    
    // No-hit bonus
    if (!this.damageTakenThisWave) {
      this.earnBonus('noHitWave');
    }
    
    // Boss kill bonus
    if (isBoss) {
      this.earnBonus('bossKill');
    }
    
    // Reset wave tracking
    this.damageTakenThisWave = false;
  }

  /**
   * Called when an act is completed
   */
  public onActComplete(actNumber: number): void {
    const actMultiplier = actNumber; // Act 1 = 1x, Act 2 = 2x, Act 3 = 3x
    this.earnBonus('actComplete', actMultiplier);
  }

  /**
   * Called when player takes damage
   */
  public onPlayerDamaged(): void {
    this.damageTakenThisWave = true;
  }

  /**
   * Called when a high combo is achieved
   */
  public onHighCombo(comboLevel: number): void {
    if (comboLevel >= 5) {
      const multiplier = Math.floor(comboLevel / 5); // Bonus at 5, 10, etc.
      this.earnBonus('comboBonus', multiplier);
    }
  }

  // ============ State Management ============

  /**
   * Get current currency state
   */
  public getState(): CurrencyState {
    return {
      scrap: this.getScrap(), // Use getter to respect dev mode
      totalEarned: this.totalEarned,
      totalSpent: this.totalSpent,
    };
  }

  /**
   * Get current scrap amount
   */
  public getScrap(): number {
    // Dev mode shows "infinite" scrap (very high number)
    if (ProgressManager.isDevMode()) return 99999;
    return this.scrap;
  }

  /**
   * Reset currency for new run
   */
  public reset(): void {
    this.scrap = 0;
    this.totalEarned = 0;
    this.totalSpent = 0;
    this.damageTakenThisWave = false;
    
    console.log('[CURRENCY] Reset for new run');
    this.dispatchScrapUpdate();
  }

  // ============ Event Dispatching ============

  private dispatchScrapUpdate(): void {
    window.dispatchEvent(new CustomEvent('scrap-update', {
      detail: this.getState()
    }));
  }

  private dispatchScrapEarned(amount: number, source: string, enemyType?: string): void {
    window.dispatchEvent(new CustomEvent('scrap-earned', {
      detail: { amount, source, enemyType } as ScrapEarnedEvent
    }));
  }
}

// ============ Singleton Export ============

export const currencyManager = new CurrencyManager();

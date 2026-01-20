/**
 * ScoreManager - Handles scoring, combos, and kill tracking
 * 
 * Features:
 * - Type-based points for kills (from AircraftConfig)
 * - Combo multiplier for rapid kills
 * - Kill streak tracking
 * - Enemy type kill statistics
 * - High score persistence
 * - Scrap currency integration (Phase 10)
 */

import { currencyManager } from './CurrencyManager';
import { upgradeManager } from './UpgradeManager';

export interface KillData {
  enemyId: string;
  enemyType: string;
  enemyName: string;
  enemyClass: string;
  position: { x: number; y: number; z: number };
  points: number;
  combo: number;
  timestamp: number;
}

export interface KillStats {
  phantom: number;
  viper: number;
  warden: number;
  specter: number;
}

export interface ScoreState {
  score: number;
  combo: number;
  comboTimer: number;
  kills: number;
  killStreak: number;
  highScore: number;
  recentKill: KillData | null;
  killStats: KillStats;
}

export class ScoreManager {
  private score: number = 0;
  private combo: number = 0;
  private comboTimer: number = 0;
  private kills: number = 0;
  private killStreak: number = 0;
  private highScore: number = 0;
  private recentKill: KillData | null = null;
  private killStats: KillStats = { phantom: 0, viper: 0, warden: 0, specter: 0 };
  
  // Configuration
  private readonly BASE_COMBO_WINDOW = 3.0;  // Base seconds to maintain combo
  private readonly MAX_COMBO = 10;
  private readonly COMBO_MULTIPLIER = 0.5;   // Each combo level adds 50% points
  private readonly ELITE_BONUS = 1.25;       // 25% bonus for elite kills
  
  constructor() {
    this.loadHighScore();
    this.setupEventListeners();
  }

  /**
   * Get current combo window (affected by upgrades)
   */
  private getComboWindow(): number {
    const modifiers = upgradeManager.getModifiers();
    return this.BASE_COMBO_WINDOW + modifiers.comboWindow;
  }
  
  private setupEventListeners() {
    window.addEventListener('enemy-destroyed', this.handleEnemyDestroyed as EventListener);
  }
  
  private handleEnemyDestroyed = (e: CustomEvent) => {
    const { enemyId, enemyType, enemyName, enemyClass, basePoints, position } = e.detail;
    this.registerKill(enemyId, enemyType, enemyName, enemyClass, basePoints, position);
  };
  
  /**
   * Register a kill and calculate points
   */
  public registerKill(
    enemyId: string, 
    enemyType: string = 'viper',
    enemyName: string = 'Enemy',
    enemyClass: string = 'fighter',
    basePoints: number = 100,
    position: { x: number; y: number; z: number }
  ) {
    // Increase combo
    this.combo = Math.min(this.combo + 1, this.MAX_COMBO);
    this.comboTimer = this.getComboWindow();
    
    // Calculate points with combo multiplier
    const comboMultiplier = 1 + (this.combo - 1) * this.COMBO_MULTIPLIER;
    
    // Elite bonus for elite class enemies
    const eliteBonus = enemyClass === 'elite' ? this.ELITE_BONUS : 1.0;
    
    const points = Math.floor(basePoints * comboMultiplier * eliteBonus);
    
    // Add to score
    this.score += points;
    this.kills++;
    this.killStreak++;
    
    // Track kills by type
    if (enemyType in this.killStats) {
      this.killStats[enemyType as keyof KillStats]++;
    }
    
    // Track recent kill for HUD
    this.recentKill = {
      enemyId,
      enemyType,
      enemyName,
      enemyClass,
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
      points,
      combo: this.combo,
      timestamp: Date.now(),
    };
    
    // Award scrap currency (Phase 10)
    currencyManager.earnFromPoints(points, enemyType);
    
    // Check for high combo bonus
    if (this.combo >= 5 && this.combo % 5 === 0) {
      currencyManager.onHighCombo(this.combo);
    }
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
    
    // Dispatch score update event
    this.dispatchScoreUpdate();
    
    console.log(`[SCORE] +${points} (${this.combo}x combo) ${enemyName} | Total: ${this.score}`);
  }
  
  /**
   * Add score directly (for boss kills, wave bonuses, etc.)
   * Does not affect combo or kill tracking
   */
  public addScore(points: number, reason?: string) {
    this.score += points;
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
    
    // Dispatch score update event
    this.dispatchScoreUpdate();
    
    console.log(`[SCORE] +${points} ${reason || 'bonus'} | Total: ${this.score}`);
  }
  
  /**
   * Update combo timer
   */
  public update(dt: number) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboTimer = 0;
        this.combo = 0;
        this.killStreak = 0;
        this.dispatchScoreUpdate();
      }
    }
    
    // Clear recent kill after display time
    if (this.recentKill && Date.now() - this.recentKill.timestamp > 2000) {
      this.recentKill = null;
      this.dispatchScoreUpdate();
    }
  }
  
  /**
   * Dispatch score state to HUD
   */
  private dispatchScoreUpdate() {
    window.dispatchEvent(new CustomEvent('score-update', {
      detail: this.getState()
    }));
  }
  
  /**
   * Get current state
   */
  public getState(): ScoreState {
    return {
      score: this.score,
      combo: this.combo,
      comboTimer: this.comboTimer,
      kills: this.kills,
      killStreak: this.killStreak,
      highScore: this.highScore,
      recentKill: this.recentKill,
      killStats: { ...this.killStats },
    };
  }
  
  /**
   * Reset score for new game
   */
  public reset() {
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.kills = 0;
    this.killStreak = 0;
    this.recentKill = null;
    this.killStats = { phantom: 0, viper: 0, warden: 0, specter: 0 };
    this.dispatchScoreUpdate();
  }
  
  /**
   * Load high score from localStorage
   */
  private loadHighScore() {
    try {
      const saved = localStorage.getItem('voxel-ace-highscore');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch (e) {
      console.warn('Could not load high score');
    }
  }
  
  /**
   * Save high score to localStorage
   */
  private saveHighScore() {
    try {
      localStorage.setItem('voxel-ace-highscore', this.highScore.toString());
    } catch (e) {
      console.warn('Could not save high score');
    }
  }
  
  /**
   * Cleanup
   */
  public dispose() {
    window.removeEventListener('enemy-destroyed', this.handleEnemyDestroyed as EventListener);
  }
}

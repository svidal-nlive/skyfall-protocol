/**
 * ProgressManager - Handles player progression and unlocks
 * 
 * Tracks:
 * - Career points (persistent score across all sessions)
 * - Completed acts (1, 2, 3)
 * - Campaign completion
 * - Selected aircraft
 * - High scores
 * 
 * All data persisted to localStorage
 */

import { 
  PlayerAircraftConfig, 
  PLAYER_AIRCRAFT, 
  isAircraftUnlocked,
  getDefaultPlayerAircraft,
  getPlayerAircraftById 
} from './data/playerAircraftConfigs';

const STORAGE_KEY = 'skyfall-protocol-progress';

/**
 * Player progress data structure
 */
export interface PlayerProgress {
  // Career progression
  careerPoints: number;
  totalKills: number;
  totalDeaths: number;
  totalFlightTime: number; // seconds
  
  // Campaign progression
  completedActs: number[];
  campaignComplete: boolean;
  highestWave: number;
  
  // Endless mode (Phase 16)
  endlessUnlocked: boolean;
  endlessBestWave: number;
  endlessBestScore: number;
  endlessTotalRuns: number;
  
  // Aircraft
  selectedAircraftId: string;
  
  // High scores
  highScore: number;
  bestCombo: number;
  
  // Statistics by enemy type
  killsByType: {
    phantom: number;
    viper: number;
    warden: number;
    specter: number;
  };
  
  // Achievements (future expansion)
  achievements: string[];
  
  // Session tracking
  lastPlayedDate: string;
  totalSessions: number;
}

/**
 * Default progress for new players
 */
const DEFAULT_PROGRESS: PlayerProgress = {
  careerPoints: 0,
  totalKills: 0,
  totalDeaths: 0,
  totalFlightTime: 0,
  
  completedActs: [],
  campaignComplete: false,
  highestWave: 0,
  
  // Endless mode defaults
  endlessUnlocked: false,
  endlessBestWave: 0,
  endlessBestScore: 0,
  endlessTotalRuns: 0,
  
  selectedAircraftId: 'falcon',
  
  highScore: 0,
  bestCombo: 0,
  
  killsByType: {
    phantom: 0,
    viper: 0,
    warden: 0,
    specter: 0,
  },
  
  achievements: [],
  
  lastPlayedDate: new Date().toISOString(),
  totalSessions: 0,
};

/**
 * ProgressManager singleton class
 */
class ProgressManagerClass {
  private progress: PlayerProgress;
  private sessionStartTime: number = 0;
  private sessionKills: number = 0;
  private sessionPoints: number = 0;
  
  // Dev mode flag - unlocks all content for testing
  private _devMode: boolean = false;
  
  constructor() {
    this.progress = this.loadProgress();
    this.startSession();
    // Check localStorage for dev mode persistence
    try {
      this._devMode = localStorage.getItem('skyfall-dev-mode') === 'true';
    } catch (e) {
      this._devMode = false;
    }
  }
  
  // ============================================================================
  // DEV MODE
  // ============================================================================
  
  /**
   * Check if dev mode is active
   */
  isDevMode(): boolean {
    return this._devMode;
  }
  
  /**
   * Toggle dev mode on/off
   */
  toggleDevMode(): boolean {
    this._devMode = !this._devMode;
    try {
      localStorage.setItem('skyfall-dev-mode', this._devMode.toString());
    } catch (e) {
      console.warn('Failed to persist dev mode state');
    }
    console.log(`[PROGRESS] Dev mode ${this._devMode ? 'ENABLED' : 'DISABLED'}`);
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('dev-mode-change', { 
      detail: { enabled: this._devMode } 
    }));
    
    return this._devMode;
  }
  
  /**
   * Set dev mode explicitly
   */
  setDevMode(enabled: boolean): void {
    this._devMode = enabled;
    try {
      localStorage.setItem('skyfall-dev-mode', enabled.toString());
    } catch (e) {
      console.warn('Failed to persist dev mode state');
    }
    console.log(`[PROGRESS] Dev mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
    
    window.dispatchEvent(new CustomEvent('dev-mode-change', { 
      detail: { enabled } 
    }));
  }
  
  /**
   * Load progress from localStorage
   */
  private loadProgress(): PlayerProgress {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PlayerProgress>;
        // Merge with defaults to handle version upgrades
        return { ...DEFAULT_PROGRESS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load progress, using defaults:', e);
    }
    return { ...DEFAULT_PROGRESS };
  }
  
  /**
   * Save progress to localStorage
   */
  private saveProgress(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }
  
  /**
   * Start a new game session
   */
  private startSession(): void {
    this.sessionStartTime = Date.now();
    this.sessionKills = 0;
    this.sessionPoints = 0;
    this.progress.totalSessions++;
    this.progress.lastPlayedDate = new Date().toISOString();
    this.saveProgress();
  }
  
  // ============================================================================
  // GETTERS
  // ============================================================================
  
  /**
   * Get current progress data
   */
  getProgress(): PlayerProgress {
    return { ...this.progress };
  }
  
  /**
   * Get career points
   */
  getCareerPoints(): number {
    return this.progress.careerPoints;
  }
  
  /**
   * Get completed acts
   */
  getCompletedActs(): number[] {
    return [...this.progress.completedActs];
  }
  
  /**
   * Check if campaign is complete
   */
  isCampaignComplete(): boolean {
    return this.progress.campaignComplete;
  }
  
  /**
   * Get high score
   */
  getHighScore(): number {
    return this.progress.highScore;
  }
  
  /**
   * Get highest wave reached
   */
  getHighestWave(): number {
    return this.progress.highestWave;
  }
  
  /**
   * Get selected aircraft config
   */
  getSelectedAircraft(): PlayerAircraftConfig {
    const aircraft = getPlayerAircraftById(this.progress.selectedAircraftId);
    if (aircraft && this.isAircraftUnlocked(aircraft)) {
      return aircraft;
    }
    return getDefaultPlayerAircraft();
  }
  
  /**
   * Get selected aircraft ID
   */
  getSelectedAircraftId(): string {
    return this.progress.selectedAircraftId;
  }
  
  // ============================================================================
  // AIRCRAFT UNLOCKS
  // ============================================================================
  
  /**
   * Check if a specific aircraft is unlocked
   */
  isAircraftUnlocked(config: PlayerAircraftConfig): boolean {
    // Dev mode unlocks all aircraft
    if (this._devMode) return true;
    
    return isAircraftUnlocked(config, {
      careerPoints: this.progress.careerPoints,
      completedActs: this.progress.completedActs,
      campaignComplete: this.progress.campaignComplete,
    });
  }
  
  /**
   * Get all unlocked aircraft
   */
  getUnlockedAircraft(): PlayerAircraftConfig[] {
    return PLAYER_AIRCRAFT.filter(a => this.isAircraftUnlocked(a));
  }
  
  /**
   * Get all aircraft with unlock status
   */
  getAllAircraftWithStatus(): Array<{ config: PlayerAircraftConfig; unlocked: boolean }> {
    return PLAYER_AIRCRAFT.map(config => ({
      config,
      unlocked: this.isAircraftUnlocked(config),
    }));
  }
  
  /**
   * Select an aircraft (must be unlocked, or dev mode active)
   */
  selectAircraft(aircraftId: string): boolean {
    const aircraft = getPlayerAircraftById(aircraftId);
    // Dev mode bypasses unlock requirements
    if (aircraft && (this._devMode || this.isAircraftUnlocked(aircraft))) {
      this.progress.selectedAircraftId = aircraftId;
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  // ============================================================================
  // SCORE & PROGRESSION
  // ============================================================================
  
  /**
   * Add points to career total
   */
  addCareerPoints(points: number): void {
    this.progress.careerPoints += points;
    this.sessionPoints += points;
    this.saveProgress();
  }
  
  /**
   * Register a kill
   */
  registerKill(enemyType: string): void {
    this.progress.totalKills++;
    this.sessionKills++;
    
    // Track by type
    const type = enemyType.toLowerCase() as keyof typeof this.progress.killsByType;
    if (type in this.progress.killsByType) {
      this.progress.killsByType[type]++;
    }
    
    this.saveProgress();
  }
  
  /**
   * Register a death
   */
  registerDeath(): void {
    this.progress.totalDeaths++;
    this.saveProgress();
  }
  
  /**
   * Update high score if current score is higher
   */
  updateHighScore(score: number): boolean {
    if (score > this.progress.highScore) {
      this.progress.highScore = score;
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  /**
   * Update best combo if current combo is higher
   */
  updateBestCombo(combo: number): boolean {
    if (combo > this.progress.bestCombo) {
      this.progress.bestCombo = combo;
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  /**
   * Update highest wave if current wave is higher
   */
  updateHighestWave(wave: number): boolean {
    if (wave > this.progress.highestWave) {
      this.progress.highestWave = wave;
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  // ============================================================================
  // ACT COMPLETION
  // ============================================================================
  
  /**
   * Mark an act as completed
   */
  completeAct(actNumber: number): void {
    if (!this.progress.completedActs.includes(actNumber)) {
      this.progress.completedActs.push(actNumber);
      this.progress.completedActs.sort((a, b) => a - b);
      
      // Check for campaign completion (all 3 acts)
      if (this.progress.completedActs.length >= 3) {
        this.progress.campaignComplete = true;
      }
      
      this.saveProgress();
    }
  }
  
  /**
   * Check if a specific act is completed
   */
  isActCompleted(actNumber: number): boolean {
    return this.progress.completedActs.includes(actNumber);
  }
  
  // ============================================================================
  // ENDLESS MODE (Phase 16)
  // ============================================================================
  
  /**
   * Check if endless mode is unlocked (requires campaign completion)
   */
  isEndlessUnlocked(): boolean {
    // Dev mode unlocks endless
    if (this._devMode) return true;
    
    // Auto-unlock if campaign is complete
    if (this.progress.campaignComplete && !this.progress.endlessUnlocked) {
      this.progress.endlessUnlocked = true;
      this.saveProgress();
    }
    return this.progress.endlessUnlocked;
  }
  
  /**
   * Manually unlock endless mode (for testing or achievements)
   */
  unlockEndlessMode(): void {
    this.progress.endlessUnlocked = true;
    this.saveProgress();
  }
  
  /**
   * Get endless mode best wave
   */
  getEndlessBestWave(): number {
    return this.progress.endlessBestWave;
  }
  
  /**
   * Get endless mode best score
   */
  getEndlessBestScore(): number {
    return this.progress.endlessBestScore;
  }
  
  /**
   * Get total endless runs
   */
  getEndlessTotalRuns(): number {
    return this.progress.endlessTotalRuns;
  }
  
  /**
   * Record an endless run completion
   */
  recordEndlessRun(waveReached: number, score: number): { newBestWave: boolean; newBestScore: boolean } {
    this.progress.endlessTotalRuns++;
    
    const newBestWave = waveReached > this.progress.endlessBestWave;
    const newBestScore = score > this.progress.endlessBestScore;
    
    if (newBestWave) {
      this.progress.endlessBestWave = waveReached;
    }
    if (newBestScore) {
      this.progress.endlessBestScore = score;
    }
    
    this.saveProgress();
    
    return { newBestWave, newBestScore };
  }
  
  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================
  
  /**
   * Update flight time (called periodically during gameplay)
   */
  updateFlightTime(deltaSeconds: number): void {
    this.progress.totalFlightTime += deltaSeconds;
    // Save less frequently to reduce writes
    if (Math.floor(this.progress.totalFlightTime) % 30 === 0) {
      this.saveProgress();
    }
  }
  
  /**
   * End current session and save
   */
  endSession(): void {
    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000;
    this.progress.totalFlightTime += sessionDuration;
    this.saveProgress();
  }
  
  /**
   * Get session statistics
   */
  getSessionStats(): { kills: number; points: number; duration: number } {
    return {
      kills: this.sessionKills,
      points: this.sessionPoints,
      duration: (Date.now() - this.sessionStartTime) / 1000,
    };
  }
  
  // ============================================================================
  // ACHIEVEMENTS
  // ============================================================================
  
  /**
   * Unlock an achievement
   */
  unlockAchievement(achievementId: string): boolean {
    if (!this.progress.achievements.includes(achievementId)) {
      this.progress.achievements.push(achievementId);
      this.saveProgress();
      return true;
    }
    return false;
  }
  
  /**
   * Check if an achievement is unlocked
   */
  hasAchievement(achievementId: string): boolean {
    return this.progress.achievements.includes(achievementId);
  }
  
  // ============================================================================
  // RESET
  // ============================================================================
  
  /**
   * Reset all progress (use with caution!)
   */
  resetProgress(): void {
    this.progress = { ...DEFAULT_PROGRESS };
    this.progress.lastPlayedDate = new Date().toISOString();
    this.saveProgress();
  }
  
  /**
   * Reset session-only data (for new game)
   */
  resetSession(): void {
    this.sessionStartTime = Date.now();
    this.sessionKills = 0;
    this.sessionPoints = 0;
  }
}

// Singleton instance
export const ProgressManager = new ProgressManagerClass();

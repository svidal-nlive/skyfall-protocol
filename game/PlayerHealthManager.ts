import * as THREE from 'three';
import { PlayerAircraftConfig, getPlayerEffectiveHealth } from './data/playerAircraftConfigs';

/**
 * Damage source types for analytics and effects
 */
export type DamageSource = 'projectile' | 'collision' | 'missile' | 'laser';

/**
 * Health state for HUD display
 */
export interface PlayerHealthState {
  health: number;
  maxHealth: number;
  healthPercent: number;
  isLowHealth: boolean;       // Below 30%
  isCriticalHealth: boolean;  // Below 15%
  isInvulnerable: boolean;
  recentDamage: number;       // Damage taken in last 2 seconds
  lastDamageTime: number;
}

/**
 * PlayerHealthManager - Manages player health, damage, and death
 * 
 * Features:
 * - Health based on aircraft armor stat
 * - Invulnerability frames after taking damage
 * - Death sequence and game over triggering
 * - Health regeneration (optional, disabled by default)
 * - Damage flash effects
 */
export class PlayerHealthManager {
  // Core health state
  private health: number;
  private maxHealth: number;
  private isAlive: boolean = true;
  
  // Invulnerability
  private isInvulnerable: boolean = false;
  private invulnerabilityTimer: number = 0;
  private readonly INVULNERABILITY_DURATION = 1.0; // seconds
  
  // Damage tracking
  private recentDamage: number = 0;
  private damageDecayTimer: number = 0;
  private lastDamageTime: number = 0;
  private readonly DAMAGE_DECAY_TIME = 2.0; // seconds to decay damage display
  
  // Health thresholds
  private readonly LOW_HEALTH_THRESHOLD = 0.30;
  private readonly CRITICAL_HEALTH_THRESHOLD = 0.15;
  
  // Regeneration (optional)
  private regenEnabled: boolean = false;
  private regenRate: number = 5; // HP per second
  private regenDelay: number = 5; // Seconds after damage before regen starts
  
  // Death state
  private deathPosition: THREE.Vector3 = new THREE.Vector3();
  
  // Callbacks
  private onDamage: ((damage: number, source: DamageSource) => void) | null = null;
  private onDeath: ((position: THREE.Vector3) => void) | null = null;
  private onHealthChange: ((state: PlayerHealthState) => void) | null = null;

  constructor(config: PlayerAircraftConfig) {
    this.maxHealth = getPlayerEffectiveHealth(config);
    this.health = this.maxHealth;
    console.log(`[PLAYER HEALTH] Initialized with ${this.maxHealth} HP`);
  }

  /**
   * Set callback for damage events
   */
  public setOnDamage(callback: (damage: number, source: DamageSource) => void) {
    this.onDamage = callback;
  }

  /**
   * Set callback for death event
   */
  public setOnDeath(callback: (position: THREE.Vector3) => void) {
    this.onDeath = callback;
  }

  /**
   * Set callback for health change events (for HUD updates)
   */
  public setOnHealthChange(callback: (state: PlayerHealthState) => void) {
    this.onHealthChange = callback;
  }

  /**
   * Update health system
   */
  public update(dt: number, playerPosition: THREE.Vector3): void {
    if (!this.isAlive) return;

    // Update invulnerability timer
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= dt;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        console.log('[PLAYER HEALTH] Invulnerability ended');
      }
    }

    // Decay recent damage display
    if (this.recentDamage > 0) {
      this.damageDecayTimer += dt;
      if (this.damageDecayTimer >= this.DAMAGE_DECAY_TIME) {
        this.recentDamage = 0;
        this.damageDecayTimer = 0;
      }
    }

    // Health regeneration (if enabled)
    if (this.regenEnabled && this.health < this.maxHealth) {
      const timeSinceDamage = Date.now() / 1000 - this.lastDamageTime;
      if (timeSinceDamage >= this.regenDelay) {
        this.health = Math.min(this.maxHealth, this.health + this.regenRate * dt);
        this.dispatchHealthState();
      }
    }

    // Store current position for death
    this.deathPosition.copy(playerPosition);
  }

  /**
   * Take damage from a source
   * Returns actual damage taken (may be 0 if invulnerable)
   */
  public takeDamage(damage: number, source: DamageSource): number {
    if (!this.isAlive) return 0;
    
    // Check invulnerability
    if (this.isInvulnerable) {
      console.log('[PLAYER HEALTH] Damage blocked (invulnerable)');
      return 0;
    }

    // Apply damage
    const actualDamage = Math.min(damage, this.health);
    this.health -= actualDamage;
    this.recentDamage += actualDamage;
    this.damageDecayTimer = 0;
    this.lastDamageTime = Date.now() / 1000;

    console.log(`[PLAYER HEALTH] Took ${actualDamage} damage from ${source}. Health: ${this.health}/${this.maxHealth}`);

    // Trigger damage callback
    if (this.onDamage) {
      this.onDamage(actualDamage, source);
    }

    // Start invulnerability
    this.isInvulnerable = true;
    this.invulnerabilityTimer = this.INVULNERABILITY_DURATION;

    // Dispatch damage event for screen effects
    window.dispatchEvent(new CustomEvent('player-damage', {
      detail: {
        damage: actualDamage,
        source,
        healthPercent: this.health / this.maxHealth,
        isCritical: this.health / this.maxHealth < this.CRITICAL_HEALTH_THRESHOLD,
      }
    }));

    // Dispatch health state update
    this.dispatchHealthState();

    // Check for death
    if (this.health <= 0) {
      this.die();
    }

    return actualDamage;
  }

  /**
   * Handle player death
   */
  private die(): void {
    if (!this.isAlive) return;
    
    this.isAlive = false;
    console.log('[PLAYER HEALTH] Player destroyed!');

    // Dispatch death event
    window.dispatchEvent(new CustomEvent('player-death', {
      detail: {
        position: this.deathPosition.clone(),
      }
    }));

    // Trigger callback
    if (this.onDeath) {
      this.onDeath(this.deathPosition);
    }
  }

  /**
   * Dispatch health state for HUD
   */
  private dispatchHealthState(): void {
    const state = this.getHealthState();
    
    window.dispatchEvent(new CustomEvent('player-health-update', {
      detail: state
    }));

    if (this.onHealthChange) {
      this.onHealthChange(state);
    }
  }

  /**
   * Get current health state
   */
  public getHealthState(): PlayerHealthState {
    const healthPercent = this.health / this.maxHealth;
    return {
      health: Math.ceil(this.health),
      maxHealth: this.maxHealth,
      healthPercent,
      isLowHealth: healthPercent < this.LOW_HEALTH_THRESHOLD,
      isCriticalHealth: healthPercent < this.CRITICAL_HEALTH_THRESHOLD,
      isInvulnerable: this.isInvulnerable,
      recentDamage: this.recentDamage,
      lastDamageTime: this.lastDamageTime,
    };
  }

  /**
   * Reset health to full (for game restart)
   */
  public reset(config?: PlayerAircraftConfig): void {
    if (config) {
      this.maxHealth = getPlayerEffectiveHealth(config);
    }
    this.health = this.maxHealth;
    this.isAlive = true;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.recentDamage = 0;
    this.damageDecayTimer = 0;
    
    console.log(`[PLAYER HEALTH] Reset to ${this.health}/${this.maxHealth} HP`);
    this.dispatchHealthState();
  }

  /**
   * Heal the player
   * @param amount - Amount to heal (if > 1) or percentage (if <= 1, treated as decimal percentage)
   */
  public heal(amount: number): void {
    if (!this.isAlive) return;
    
    // If amount is <= 1, treat it as a percentage (e.g., 0.5 = 50%)
    // If amount is > 1 but <= 100 and looks like a percentage, convert it
    let healAmount = amount;
    if (amount > 0 && amount <= 100) {
      // Check if this looks like a percentage value
      if (amount <= 1) {
        healAmount = Math.floor(this.maxHealth * amount);
      } else if (amount <= 100 && amount === Math.floor(amount)) {
        // Looks like a percentage (whole number 1-100)
        healAmount = Math.floor(this.maxHealth * (amount / 100));
      }
    }
    
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + healAmount);
    const actualHeal = this.health - oldHealth;
    
    if (actualHeal > 0) {
      console.log(`[PLAYER HEALTH] Healed ${actualHeal}. Health: ${this.health}/${this.maxHealth}`);
      
      window.dispatchEvent(new CustomEvent('player-heal', {
        detail: { amount: actualHeal }
      }));
      
      this.dispatchHealthState();
    }
  }

  /**
   * Set health to a specific value (used for restoring from save)
   * @param value - The health value to set
   */
  public setHealth(value: number): void {
    this.health = Math.max(0, Math.min(this.maxHealth, value));
    this.isAlive = this.health > 0;
    console.log(`[PLAYER HEALTH] Set to ${this.health}/${this.maxHealth}`);
    this.dispatchHealthState();
  }

  /**
   * Enable or disable health regeneration
   */
  public setRegeneration(enabled: boolean, rate: number = 5, delay: number = 5): void {
    this.regenEnabled = enabled;
    this.regenRate = rate;
    this.regenDelay = delay;
  }

  /**
   * Check if player is alive
   */
  public getIsAlive(): boolean {
    return this.isAlive;
  }

  /**
   * Check if currently invulnerable
   */
  public getIsInvulnerable(): boolean {
    return this.isInvulnerable;
  }

  /**
   * Get current health
   */
  public getHealth(): number {
    return this.health;
  }

  /**
   * Get max health
   */
  public getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Force invulnerability (for special abilities)
   */
  public setInvulnerable(duration: number): void {
    this.isInvulnerable = true;
    this.invulnerabilityTimer = Math.max(this.invulnerabilityTimer, duration);
  }

  /**
   * Apply upgrade modifiers (Phase 10)
   * @param healthBonus - Additional health as multiplier (0.25 = +25%)
   * @param shieldCharges - Number of shield charges to absorb hits
   */
  public applyUpgrades(healthBonus: number, shieldCharges: number): void {
    // Calculate new max health with bonus
    const bonusHealth = Math.floor(this.maxHealth * healthBonus);
    const newMaxHealth = this.maxHealth + bonusHealth;
    
    // Scale current health proportionally
    const healthRatio = this.health / this.maxHealth;
    this.maxHealth = newMaxHealth;
    this.health = Math.floor(newMaxHealth * healthRatio);
    
    // TODO: Implement shield charges in damage system
    // For now, shields add to health directly (simplified)
    if (shieldCharges > 0) {
      const shieldHP = shieldCharges * 25; // Each shield = 25 HP
      this.maxHealth += shieldHP;
      this.health += shieldHP;
    }
    
    console.log(`[PLAYER HEALTH] Upgrades applied: ${this.maxHealth} max HP (+${bonusHealth} armor, +${shieldCharges} shields)`);
    this.dispatchHealthState();
  }
}

/**
 * AircraftConfig - Configuration interface for all aircraft (enemy and player)
 * 
 * This provides a unified configuration system for aircraft stats,
 * behavior parameters, and visual properties.
 */

/**
 * Aircraft class categories
 */
export type AircraftClass = 'scout' | 'fighter' | 'heavy' | 'elite';

/**
 * Special abilities that aircraft can have
 */
export type SpecialAbility = 
  | 'cloak'          // Brief invisibility when damaged
  | 'afterburner'    // Speed boost
  | 'armorPlating'   // Damage reduction
  | 'dualLock'       // Lock two targets at once
  | 'emp'            // EMP burst attack
  | 'none';

/**
 * AircraftConfig interface
 * 
 * Stats use a 1-5 star rating system where each star = 20 points
 * e.g., speed: 5 = ★★★★★ = 100 effective speed units
 */
export interface AircraftConfig {
  // Identity
  id: string;
  name: string;
  class: AircraftClass;
  
  // Stats (1-5 rating, each = 20 points)
  speed: number;        // Max velocity multiplier
  agility: number;      // Turn rate multiplier
  armor: number;        // Max health multiplier
  firepower: number;    // Damage output multiplier
  
  // Visual
  color: number;        // Hex color for primary material
  accentColor: number;  // Hex color for secondary material
  emissiveColor: number;// Hex color for emissive glow
  scale: number;        // Size multiplier (1.0 = standard)
  
  // Behavior
  engageRange: number;      // Distance to start engaging player
  detectionRange: number;   // Distance to detect player
  retreatHealth: number;    // Health percentage to trigger retreat (0-1)
  aggressiveness: number;   // How often to attack run (0-1)
  
  // Combat
  fireRate: number;         // Shots per second
  projectileSpeed: number;  // Speed of projectiles
  damage: number;           // Damage per hit
  
  // Scoring
  basePoints: number;       // Points awarded for destroying
  
  // Special
  specialAbility: SpecialAbility;
  
  // Description for UI
  description: string;
}

/**
 * Base stats constants
 * These are multiplied by the 1-5 rating to get actual values
 */
export const BASE_STATS = {
  SPEED: 12,          // Base speed per star (60 = 5 stars)
  TURN_RATE: 0.4,     // Base turn rate per star
  HEALTH: 20,         // Base health per star (100 = 5 stars)
  DAMAGE: 4,          // Base damage per star
};

/**
 * Calculate actual stat value from star rating
 */
export function getStatValue(rating: number, baseStat: number): number {
  return rating * baseStat;
}

/**
 * Get effective health from armor rating
 */
export function getEffectiveHealth(config: AircraftConfig): number {
  return getStatValue(config.armor, BASE_STATS.HEALTH);
}

/**
 * Get effective speed from speed rating
 */
export function getEffectiveSpeed(config: AircraftConfig): number {
  return getStatValue(config.speed, BASE_STATS.SPEED);
}

/**
 * Get effective turn rate from agility rating
 */
export function getEffectiveTurnRate(config: AircraftConfig): number {
  return getStatValue(config.agility, BASE_STATS.TURN_RATE);
}

/**
 * Get effective damage from firepower rating
 */
export function getEffectiveDamage(config: AircraftConfig): number {
  return getStatValue(config.firepower, BASE_STATS.DAMAGE);
}

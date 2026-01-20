/**
 * Enemy Aircraft Configurations
 * 
 * Defines the 4 distinct enemy types for Skyfall Protocol.
 * Each is modeled after a real-world fighter jet:
 * - Phantom (Scout): JAS 39 Gripen - Fast, fragile, evasive
 * - Viper (Fighter): Dassault Rafale - Balanced, aggressive
 * - Warden (Heavy): Chengdu J-20 - Slow, tanky, punishing
 * - Specter (Elite): F-22 Raptor - All-around dangerous with stealth
 */

import { AircraftConfig } from '../types/AircraftConfig';

/**
 * PHANTOM - Scout Class (JAS 39 Gripen)
 * 
 * Modeled after the Swedish Gripen - small, single-engine, with canards.
 * Fast and nimble reconnaissance drones. They're fragile but hard to hit
 * due to their speed and evasive maneuvers. Often the first wave of an attack.
 * 
 * Threat Level: 1
 * Points: 75
 */
export const PHANTOM_CONFIG: AircraftConfig = {
  id: 'phantom',
  name: 'Phantom Scout',
  class: 'scout',
  
  // Stats: ★★★★ speed, ★★★ agility, ★ armor, ★ firepower (reduced for easier tracking)
  speed: 4,
  agility: 2,
  armor: 1,
  firepower: 1,
  
  // Visual - Cyan/teal color scheme, small
  color: 0x00dddd,
  accentColor: 0x88ffff,
  emissiveColor: 0x00aaaa,
  scale: 0.6,
  
  // Behavior - Quick to engage, quick to retreat
  engageRange: 150,
  detectionRange: 200,
  retreatHealth: 0.5,  // Retreats at 50% health
  aggressiveness: 0.2, // Low aggression, more predictable flight
  
  // Combat - Weak but fast
  fireRate: 2.0,
  projectileSpeed: 200,
  damage: 5,
  
  // Scoring
  basePoints: 75,
  
  // No special ability
  specialAbility: 'none',
  
  description: 'Fast reconnaissance drone. Hard to hit but fragile.',
};

/**
 * VIPER - Fighter Class (Dassault Rafale)
 * 
 * Modeled after the French Rafale - twin-engine, delta wing with canards.
 * The backbone of the enemy swarm. Balanced stats make them versatile
 * combatants. They fight aggressively and only retreat when critically damaged.
 * 
 * Threat Level: 2
 * Points: 100
 */
export const VIPER_CONFIG: AircraftConfig = {
  id: 'viper',
  name: 'Viper Fighter',
  class: 'fighter',
  
  // Stats: ★★★ speed, ★★ agility, ★★★ armor, ★★★ firepower (reduced agility for easier tracking)
  speed: 3,
  agility: 2,
  armor: 3,
  firepower: 3,
  
  // Visual - Red color scheme, medium size
  color: 0xdd2222,
  accentColor: 0xff4444,
  emissiveColor: 0xaa1111,
  scale: 0.8,
  
  // Behavior - Standard engagement
  engageRange: 200,
  detectionRange: 250,
  retreatHealth: 0.3,  // Retreats at 30% health
  aggressiveness: 0.4, // Reduced aggression for steadier flight paths
  
  // Combat - Balanced
  fireRate: 1.5,
  projectileSpeed: 180,
  damage: 12,
  
  // Scoring
  basePoints: 100,
  
  // No special ability
  specialAbility: 'none',
  
  description: 'Standard combat drone. Balanced and dangerous in groups.',
};

/**
 * WARDEN - Heavy Class (Chengdu J-20 Mighty Dragon)
 * 
 * Modeled after the Chinese J-20 - long fuselage, canards, canted twin tails.
 * Armored assault platforms. Slow and predictable but extremely durable.
 * Their heavy weapons deal significant damage. Prioritize or avoid.
 * 
 * Threat Level: 3
 * Points: 200
 */
export const WARDEN_CONFIG: AircraftConfig = {
  id: 'warden',
  name: 'Warden Heavy',
  class: 'heavy',
  
  // Stats: ★ speed, ★ agility, ★★★★★ armor, ★★★★ firepower
  speed: 1,
  agility: 1,
  armor: 4,
  firepower: 4,
  
  // Visual - Purple/violet color scheme, large
  color: 0x7722cc,
  accentColor: 0x9944ff,
  emissiveColor: 0x551199,
  scale: 1.2,
  
  // Behavior - Slow to engage, rarely retreats
  engageRange: 250,
  detectionRange: 300,
  retreatHealth: 0.2,  // Only retreats at 20% health
  aggressiveness: 0.5, // Reduced aggression for more predictable patterns
  
  // Combat - Heavy hitting
  fireRate: 0.8,
  projectileSpeed: 150,
  damage: 25,
  
  // Scoring
  basePoints: 200,
  
  // No special ability
  specialAbility: 'none',
  
  description: 'Heavy assault platform. Slow but extremely durable.',
};

/**
 * SPECTER - Elite Class (F-22 Raptor)
 * 
 * Modeled after the American F-22 - angular stealth, canted twin tails, trapezoidal wings.
 * Advanced stealth drones. Dangerous all-rounders with cloaking ability.
 * They briefly become invisible when damaged, making them tricky to destroy.
 * Priority targets.
 * 
 * Threat Level: 4
 * Points: 300
 */
export const SPECTER_CONFIG: AircraftConfig = {
  id: 'specter',
  name: 'Specter Elite',
  class: 'elite',
  
  // Stats: ★★★★ speed, ★★★ agility, ★★★★ armor, ★★★★ firepower (reduced agility)
  speed: 4,
  agility: 3,
  armor: 4,
  firepower: 4,
  
  // Visual - Magenta/pink color scheme, standard size
  color: 0xdd00dd,
  accentColor: 0xff44ff,
  emissiveColor: 0xaa00aa,
  scale: 1.0,
  
  // Behavior - Smart engagement, calculated retreats
  engageRange: 300,
  detectionRange: 350,
  retreatHealth: 0.15, // Only retreats at 15% health
  aggressiveness: 0.5, // Reduced aggression for more tracking windows
  
  // Combat - High performance
  fireRate: 1.8,
  projectileSpeed: 220,
  damage: 18,
  
  // Scoring
  basePoints: 300,
  
  // Special: Cloaks briefly when damaged
  specialAbility: 'cloak',
  
  description: 'Elite stealth drone. Cloaks when damaged. Priority target.',
};

/**
 * All enemy configs as a lookup map
 */
export const ENEMY_CONFIGS: Record<string, AircraftConfig> = {
  phantom: PHANTOM_CONFIG,
  viper: VIPER_CONFIG,
  warden: WARDEN_CONFIG,
  specter: SPECTER_CONFIG,
};

/**
 * Get enemy config by ID
 */
export function getEnemyConfig(id: string): AircraftConfig | undefined {
  return ENEMY_CONFIGS[id];
}

/**
 * Threat level to enemy type spawn weights
 * 
 * Each threat level has different probabilities for spawning enemy types
 * Values represent relative weights (not percentages)
 */
export const THREAT_SPAWN_WEIGHTS: Record<number, Record<string, number>> = {
  1: { phantom: 80, viper: 20, warden: 0, specter: 0 },
  2: { phantom: 40, viper: 50, warden: 10, specter: 0 },
  3: { phantom: 10, viper: 30, warden: 40, specter: 20 },
  4: { phantom: 0, viper: 10, warden: 30, specter: 60 },
};

/**
 * Select an enemy type based on threat level and random weights
 */
export function selectEnemyTypeForThreatLevel(threatLevel: number): AircraftConfig {
  const weights = THREAT_SPAWN_WEIGHTS[threatLevel] || THREAT_SPAWN_WEIGHTS[1];
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (const [type, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return ENEMY_CONFIGS[type];
    }
  }
  
  // Fallback to Viper
  return VIPER_CONFIG;
}

/**
 * Get all enemy types as array
 */
export function getAllEnemyConfigs(): AircraftConfig[] {
  return Object.values(ENEMY_CONFIGS);
}

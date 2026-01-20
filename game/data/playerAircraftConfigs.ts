/**
 * Player Aircraft Configurations
 * 
 * Defines the 5 playable aircraft in Skyfall Protocol.
 * Each aircraft has unique characteristics suited to different playstyles:
 * 
 * - Falcon (Starter): Balanced beginner-friendly aircraft
 * - Switchblade (Speed): High speed, low armor, hit-and-run tactics
 * - Ironclad (Tank): Heavy armor, powerful cannon, slow but durable
 * - Wraith (Stealth): Balanced with cloak ability for repositioning
 * - Archon (Elite): Endgame aircraft with dual-lock capability
 */

/**
 * Player Aircraft Configuration Interface
 */
export interface PlayerAircraftConfig {
  id: string;
  name: string;
  description: string;
  
  // Stats (1-5 stars)
  speed: number;
  agility: number;
  armor: number;
  
  // Weapons
  missiles: number;         // Max missile capacity
  missileReloadTime: number; // Seconds per missile
  cannonDamage: number;     // Damage multiplier (1.0 = base)
  cannonFireRate: number;   // Fire rate multiplier
  
  // Visual
  color: number;            // Primary color
  accentColor: number;      // Secondary color
  emissiveColor: number;    // Glow color
  
  // Special ability
  specialAbility: PlayerAbility;
  specialCooldown: number;  // Seconds
  specialDuration: number;  // Seconds (for duration-based abilities)
  
  // Unlock conditions
  unlockCondition: UnlockCondition;
}

export type PlayerAbility = 
  | 'none'
  | 'afterburner'    // Temporary speed boost
  | 'armorPlating'   // Temporary damage reduction
  | 'cloak'          // Brief invisibility
  | 'dualLock';      // Lock 2 targets at once

export type UnlockCondition = 
  | { type: 'default' }
  | { type: 'points'; value: number }
  | { type: 'act'; value: number }
  | { type: 'campaign' };

/**
 * Base stat multipliers for player aircraft
 */
export const PLAYER_BASE_STATS = {
  SPEED: 80,          // Base flight speed
  TURN_RATE: 2.0,     // Base turn rate
  MAX_HEALTH: 100,    // Base health
  CANNON_DAMAGE: 8,   // Base cannon damage per hit
  CANNON_FIRE_RATE: 10, // Rounds per second
};

/**
 * Calculate effective player speed from config
 */
export function getPlayerEffectiveSpeed(config: PlayerAircraftConfig): number {
  return PLAYER_BASE_STATS.SPEED * (0.6 + config.speed * 0.15);
}

/**
 * Calculate effective player turn rate from config
 */
export function getPlayerEffectiveTurnRate(config: PlayerAircraftConfig): number {
  return PLAYER_BASE_STATS.TURN_RATE * (0.6 + config.agility * 0.15);
}

/**
 * Calculate effective player health from config
 */
export function getPlayerEffectiveHealth(config: PlayerAircraftConfig): number {
  return PLAYER_BASE_STATS.MAX_HEALTH * (0.5 + config.armor * 0.2);
}

/**
 * Calculate effective cannon damage from config
 */
export function getPlayerEffectiveCannonDamage(config: PlayerAircraftConfig): number {
  return PLAYER_BASE_STATS.CANNON_DAMAGE * config.cannonDamage;
}

/**
 * Calculate effective cannon fire rate from config
 */
export function getPlayerEffectiveFireRate(config: PlayerAircraftConfig): number {
  return PLAYER_BASE_STATS.CANNON_FIRE_RATE * config.cannonFireRate;
}

// ============================================================================
// AIRCRAFT CONFIGURATIONS
// ============================================================================

/**
 * FALCON - Starter Aircraft (F-22 Raptor Inspired)
 * 
 * The default aircraft for new pilots. A modern stealth fighter that
 * handles predictably and forgives mistakes. No special abilities,
 * but solid all-around performance with sleek, angular design.
 */
export const FALCON_CONFIG: PlayerAircraftConfig = {
  id: 'falcon',
  name: 'F-22 Falcon',
  description: 'Balanced starter aircraft. Reliable and forgiving.',
  
  // Stats: Well-rounded
  speed: 3,
  agility: 3,
  armor: 2,
  
  // Weapons: Standard loadout
  missiles: 6,
  missileReloadTime: 4.0,
  cannonDamage: 1.0,
  cannonFireRate: 1.0,
  
  // Visual: Stealth blue-gray scheme (F-22 inspired)
  color: 0x6688aa,       // Blue-gray body
  accentColor: 0x445566, // Dark gray belly
  emissiveColor: 0x0099ff, // Metallic blue glow
  
  // No special ability
  specialAbility: 'none',
  specialCooldown: 0,
  specialDuration: 0,
  
  // Default unlocked
  unlockCondition: { type: 'default' },
};

/**
 * SWITCHBLADE - Speed Aircraft (F-16 / FA-50 Inspired)
 * 
 * A nimble interceptor built for speed. Fragile but extremely fast,
 * perfect for hit-and-run tactics. Compact, dart-like profile with
 * aggressive styling. The afterburner ability provides a massive
 * speed boost for escaping or closing distance.
 */
export const SWITCHBLADE_CONFIG: PlayerAircraftConfig = {
  id: 'switchblade',
  name: 'X-47 Switchblade',
  description: 'Lightning fast interceptor. Fragile but hard to catch.',
  
  // Stats: High speed, low armor
  speed: 5,
  agility: 4,
  armor: 1,
  
  // Weapons: Fewer missiles, faster cannon
  missiles: 4,
  missileReloadTime: 5.0,
  cannonDamage: 0.8,
  cannonFireRate: 1.3,
  
  // Visual: Aggressive matte black/crimson red scheme
  color: 0x1a1a1a,       // Matte black body
  accentColor: 0x2a2a2a, // Dark gray belly
  emissiveColor: 0xff3333, // Crimson red glow
  
  // Afterburner: 50% speed boost for 3 seconds
  specialAbility: 'afterburner',
  specialCooldown: 15.0,
  specialDuration: 3.0,
  
  // Unlock: 1000 career points
  unlockCondition: { type: 'points', value: 1000 },
};

/**
 * IRONCLAD - Tank Aircraft (A-10 Thunderbolt II Inspired)
 * 
 * A heavily armored attack craft designed to absorb punishment.
 * Slow and sluggish but nearly indestructible. The powerful cannon
 * makes up for reduced maneuverability. Bulky, boxy design with
 * twin widely-spaced engines and high-mounted wings.
 */
export const IRONCLAD_CONFIG: PlayerAircraftConfig = {
  id: 'ironclad',
  name: 'A-10 Ironclad',
  description: 'Heavy assault craft. Slow but nearly indestructible.',
  
  // Stats: High armor, low speed
  speed: 2,
  agility: 1,
  armor: 5,
  
  // Weapons: More missiles, powerful cannon
  missiles: 8,
  missileReloadTime: 3.5,
  cannonDamage: 1.5,
  cannonFireRate: 0.8,
  
  // Visual: Military olive/tan scheme (A-10 inspired)
  color: 0x5a6b4a,       // Olive drab body
  accentColor: 0x8b7355, // Tan/beige belly
  emissiveColor: 0x55aa55, // Green glow (military)
  
  // Armor Plating: 50% damage reduction for 4 seconds
  specialAbility: 'armorPlating',
  specialCooldown: 20.0,
  specialDuration: 4.0,
  
  // Unlock: Complete Act 1
  unlockCondition: { type: 'act', value: 1 },
};

/**
 * WRAITH - Stealth Reconnaissance Aircraft (SR-71 Blackbird Inspired)
 * 
 * An advanced stealth reconnaissance jet that can briefly become invisible.
 * Extremely long, slender fuselage with needle-sharp nose. Built for
 * speed and stealth with minimal wings. The cloak ability allows for
 * tactical repositioning and surprise attacks.
 */
export const WRAITH_CONFIG: PlayerAircraftConfig = {
  id: 'wraith',
  name: 'SR-71 Wraith',
  description: 'Stealth fighter with cloaking capability.',
  
  // Stats: Balanced with slight speed edge
  speed: 4,
  agility: 3,
  armor: 2,
  
  // Weapons: Standard loadout
  missiles: 5,
  missileReloadTime: 4.0,
  cannonDamage: 1.0,
  cannonFireRate: 1.0,
  
  // Visual: Matte black/deep purple stealth scheme (SR-71 inspired)
  color: 0x0a0a12,        // Near-black with purple tint
  accentColor: 0x1a1a28,  // Dark purple-gray underside
  emissiveColor: 0x7744ff, // Deep purple glow
  
  // Cloak: Invisible for 3 seconds, enemies lose lock
  specialAbility: 'cloak',
  specialCooldown: 18.0,
  specialDuration: 3.0,
  
  // Unlock: Complete Act 2
  unlockCondition: { type: 'act', value: 2 },
};

/**
 * ARCHON - Elite Advanced Experimental Fighter (F-14/Future Concept Hybrid)
 * 
 * The ultimate aircraft, reserved for those who have mastered the skies.
 * Sleek, modern fuselage with advanced shaping and variable-geometry styling.
 * Excellent stats across the board with the unique dual-lock ability
 * that allows locking two targets simultaneously per lock slot.
 */
export const ARCHON_CONFIG: PlayerAircraftConfig = {
  id: 'archon',
  name: 'XF-108 Archon',
  description: 'Elite craft with dual-lock targeting system.',
  
  // Stats: High across the board
  speed: 4,
  agility: 4,
  armor: 4,
  
  // Weapons: Premium loadout
  missiles: 8,
  missileReloadTime: 3.0,
  cannonDamage: 1.2,
  cannonFireRate: 1.1,
  
  // Visual: Dark blue-gray body with metallic gold accents
  color: 0x2a3444,        // Dark blue-gray body
  accentColor: 0x3a4454,  // Slightly lighter underside
  emissiveColor: 0xffaa00, // Metallic gold glow
  
  // Dual Lock: Lock 2 additional targets for 10 seconds
  specialAbility: 'dualLock',
  specialCooldown: 25.0,
  specialDuration: 10.0,
  
  // Unlock: Complete Campaign
  unlockCondition: { type: 'campaign' },
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All player aircraft configurations
 */
export const PLAYER_AIRCRAFT: PlayerAircraftConfig[] = [
  FALCON_CONFIG,
  SWITCHBLADE_CONFIG,
  IRONCLAD_CONFIG,
  WRAITH_CONFIG,
  ARCHON_CONFIG,
];

/**
 * Get aircraft config by ID
 */
export function getPlayerAircraftById(id: string): PlayerAircraftConfig | undefined {
  return PLAYER_AIRCRAFT.find(a => a.id === id);
}

/**
 * Get default aircraft config
 */
export function getDefaultPlayerAircraft(): PlayerAircraftConfig {
  return FALCON_CONFIG;
}

/**
 * Check if an aircraft is unlocked based on progress
 */
export function isAircraftUnlocked(
  config: PlayerAircraftConfig,
  progress: { careerPoints: number; completedActs: number[]; campaignComplete: boolean }
): boolean {
  const condition = config.unlockCondition;
  
  switch (condition.type) {
    case 'default':
      return true;
    case 'points':
      return progress.careerPoints >= condition.value;
    case 'act':
      return progress.completedActs.includes(condition.value);
    case 'campaign':
      return progress.campaignComplete;
    default:
      return false;
  }
}

/**
 * Get unlock requirement text for display
 */
export function getUnlockRequirementText(config: PlayerAircraftConfig): string {
  const condition = config.unlockCondition;
  
  switch (condition.type) {
    case 'default':
      return 'Available';
    case 'points':
      return `${condition.value.toLocaleString()} Career Points`;
    case 'act':
      return `Complete Act ${condition.value}`;
    case 'campaign':
      return 'Complete Campaign';
    default:
      return 'Locked';
  }
}

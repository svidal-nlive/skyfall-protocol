/**
 * UpgradeManager - Manages the upgrade shop and stat modifications
 * 
 * Phase 10: Upgrade Shop & Currency
 * - Upgrade definitions by category
 * - Purchase and level tracking
 * - Stat modifier calculations with diminishing returns
 * - Reset on new run
 */

import { currencyManager } from './CurrencyManager';

// ============ Types ============

export type UpgradeCategory = 'weapons' | 'defense' | 'systems' | 'special';

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  icon: string;           // Emoji icon for display
  baseCost: number;
  costMultiplier: number; // Cost increase per level
  maxLevel: number;
  effectPerLevel: number; // Base effect value
  effectUnit: string;     // Display unit (%, +, s)
  diminishingReturns: boolean;
}

export interface PurchasedUpgrade {
  id: string;
  level: number;
}

export interface UpgradeModifiers {
  // Weapons
  missileCapacity: number;      // Additional missiles
  missileReloadSpeed: number;   // Multiplier (1.0 = normal)
  cannonDamage: number;         // Multiplier (1.0 = normal)
  homingStrength: number;       // Multiplier (1.0 = normal)
  
  // Defense
  maxHealthBonus: number;       // Additional health points
  shieldCharges: number;        // Number of shield hits
  
  // Systems
  radarRange: number;           // Multiplier (1.0 = normal)
  lockSpeed: number;            // Multiplier (1.0 = normal, higher = faster)
  comboWindow: number;          // Additional seconds
  
  // Special (active abilities)
  hasEMP: boolean;
  hasDecoy: boolean;
  hasOvercharge: boolean;
}

// ============ Upgrade Definitions ============

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  // === WEAPONS ===
  {
    id: 'missile_capacity',
    name: 'Missile Capacity',
    description: 'Increase maximum missile payload',
    category: 'weapons',
    icon: '🚀',
    baseCost: 50,
    costMultiplier: 1.5,
    maxLevel: 3,
    effectPerLevel: 2,
    effectUnit: '+',
    diminishingReturns: false,
  },
  {
    id: 'reload_speed',
    name: 'Quick Reload',
    description: 'Faster missile regeneration',
    category: 'weapons',
    icon: '⚡',
    baseCost: 75,
    costMultiplier: 1.6,
    maxLevel: 3,
    effectPerLevel: 20,
    effectUnit: '%',
    diminishingReturns: true,
  },
  {
    id: 'cannon_damage',
    name: 'Cannon Boost',
    description: 'Increase cannon damage output',
    category: 'weapons',
    icon: '🔥',
    baseCost: 60,
    costMultiplier: 1.5,
    maxLevel: 4,
    effectPerLevel: 25,
    effectUnit: '%',
    diminishingReturns: true,
  },
  {
    id: 'homing_strength',
    name: 'Precision Guidance',
    description: 'Improved missile tracking',
    category: 'weapons',
    icon: '🎯',
    baseCost: 80,
    costMultiplier: 1.6,
    maxLevel: 3,
    effectPerLevel: 15,
    effectUnit: '%',
    diminishingReturns: true,
  },
  
  // === DEFENSE ===
  {
    id: 'armor_plating',
    name: 'Armor Plating',
    description: 'Increase maximum health',
    category: 'defense',
    icon: '🛡️',
    baseCost: 70,
    costMultiplier: 1.7,
    maxLevel: 4,
    effectPerLevel: 25,
    effectUnit: '%',
    diminishingReturns: true,
  },
  {
    id: 'shield_generator',
    name: 'Shield Generator',
    description: 'Absorb incoming hits',
    category: 'defense',
    icon: '💠',
    baseCost: 100,
    costMultiplier: 2.0,
    maxLevel: 3,
    effectPerLevel: 1,
    effectUnit: '+',
    diminishingReturns: false,
  },
  {
    id: 'emergency_repair',
    name: 'Emergency Repair',
    description: 'Restore health (one-time use)',
    category: 'defense',
    icon: '🔧',
    baseCost: 40,
    costMultiplier: 1.3,
    maxLevel: 5,
    effectPerLevel: 20,
    effectUnit: '%',
    diminishingReturns: false,
  },
  
  // === SYSTEMS ===
  {
    id: 'radar_range',
    name: 'Extended Radar',
    description: 'Increase radar detection range',
    category: 'systems',
    icon: '📡',
    baseCost: 50,
    costMultiplier: 1.4,
    maxLevel: 3,
    effectPerLevel: 30,
    effectUnit: '%',
    diminishingReturns: true,
  },
  {
    id: 'lock_speed',
    name: 'Fast Lock',
    description: 'Reduce target lock time',
    category: 'systems',
    icon: '🔒',
    baseCost: 65,
    costMultiplier: 1.5,
    maxLevel: 3,
    effectPerLevel: 20,
    effectUnit: '%',
    diminishingReturns: true,
  },
  {
    id: 'combo_extender',
    name: 'Combo Extender',
    description: 'Longer combo window',
    category: 'systems',
    icon: '⏱️',
    baseCost: 55,
    costMultiplier: 1.4,
    maxLevel: 3,
    effectPerLevel: 1,
    effectUnit: 's',
    diminishingReturns: false,
  },
  
  // === SPECIAL ===
  {
    id: 'emp_burst',
    name: 'EMP Burst',
    description: 'Stun nearby enemies (one use per wave)',
    category: 'special',
    icon: '⚡',
    baseCost: 120,
    costMultiplier: 1.0,
    maxLevel: 1,
    effectPerLevel: 1,
    effectUnit: '',
    diminishingReturns: false,
  },
  {
    id: 'decoy_flare',
    name: 'Decoy Flares',
    description: 'Distract enemy missiles',
    category: 'special',
    icon: '🎆',
    baseCost: 80,
    costMultiplier: 1.0,
    maxLevel: 1,
    effectPerLevel: 1,
    effectUnit: '',
    diminishingReturns: false,
  },
  {
    id: 'overcharge',
    name: 'Overcharge',
    description: 'Double damage for 5 seconds (one use per wave)',
    category: 'special',
    icon: '💥',
    baseCost: 100,
    costMultiplier: 1.0,
    maxLevel: 1,
    effectPerLevel: 1,
    effectUnit: '',
    diminishingReturns: false,
  },
];

// ============ UpgradeManager Class ============

export class UpgradeManager {
  private purchasedUpgrades: Map<string, number> = new Map();
  private pendingHealing: number = 0; // Accumulated heal percentage from Emergency Repair

  constructor() {
    console.log('[UPGRADES] Manager initialized with', UPGRADE_DEFINITIONS.length, 'upgrades');
  }

  // ============ Purchase System ============

  /**
   * Get the cost for the next level of an upgrade
   */
  public getUpgradeCost(upgradeId: string): number {
    const def = this.getDefinition(upgradeId);
    if (!def) return Infinity;
    
    const currentLevel = this.getUpgradeLevel(upgradeId);
    if (currentLevel >= def.maxLevel) return Infinity;
    
    return Math.floor(def.baseCost * Math.pow(def.costMultiplier, currentLevel));
  }

  /**
   * Get current level of an upgrade
   */
  public getUpgradeLevel(upgradeId: string): number {
    return this.purchasedUpgrades.get(upgradeId) || 0;
  }

  /**
   * Check if an upgrade can be purchased
   */
  public canPurchase(upgradeId: string): boolean {
    const def = this.getDefinition(upgradeId);
    if (!def) return false;
    
    const currentLevel = this.getUpgradeLevel(upgradeId);
    if (currentLevel >= def.maxLevel) return false;
    
    const cost = this.getUpgradeCost(upgradeId);
    return currencyManager.canAfford(cost);
  }

  /**
   * Purchase an upgrade
   */
  public purchase(upgradeId: string): boolean {
    const def = this.getDefinition(upgradeId);
    if (!def) {
      console.error(`[UPGRADES] Unknown upgrade: ${upgradeId}`);
      return false;
    }
    
    const currentLevel = this.getUpgradeLevel(upgradeId);
    if (currentLevel >= def.maxLevel) {
      console.log(`[UPGRADES] ${def.name} already at max level`);
      return false;
    }
    
    const cost = this.getUpgradeCost(upgradeId);
    if (!currencyManager.spend(cost)) {
      return false;
    }
    
    const newLevel = currentLevel + 1;
    this.purchasedUpgrades.set(upgradeId, newLevel);
    
    console.log(`[UPGRADES] Purchased ${def.name} level ${newLevel} for ${cost} scrap`);
    
    // Handle special upgrades
    if (upgradeId === 'emergency_repair') {
      this.pendingHealing += def.effectPerLevel;
    }
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('upgrade-purchased', {
      detail: { upgradeId, level: newLevel, cost }
    }));
    
    return true;
  }

  /**
   * Get upgrade definition
   */
  public getDefinition(upgradeId: string): UpgradeDefinition | undefined {
    return UPGRADE_DEFINITIONS.find(u => u.id === upgradeId);
  }

  /**
   * Get all upgrades by category
   */
  public getUpgradesByCategory(category: UpgradeCategory): UpgradeDefinition[] {
    return UPGRADE_DEFINITIONS.filter(u => u.category === category);
  }

  /**
   * Get all purchased upgrades
   */
  public getPurchasedUpgrades(): PurchasedUpgrade[] {
    const result: PurchasedUpgrade[] = [];
    for (const [id, level] of this.purchasedUpgrades) {
      if (level > 0) {
        result.push({ id, level });
      }
    }
    return result;
  }

  // ============ Modifier Calculations ============

  /**
   * Calculate effect value with optional diminishing returns
   */
  private calculateEffect(def: UpgradeDefinition, level: number): number {
    if (level === 0) return 0;
    
    if (def.diminishingReturns) {
      // Diminishing returns formula: each level gives less
      // Level 1: 100%, Level 2: 80%, Level 3: 60%, etc.
      let total = 0;
      for (let i = 1; i <= level; i++) {
        const diminish = 1 - (i - 1) * 0.2;
        total += def.effectPerLevel * Math.max(diminish, 0.4);
      }
      return total;
    }
    
    return def.effectPerLevel * level;
  }

  /**
   * Get all current modifiers
   */
  public getModifiers(): UpgradeModifiers {
    return {
      // Weapons
      missileCapacity: this.calculateEffect(
        this.getDefinition('missile_capacity')!,
        this.getUpgradeLevel('missile_capacity')
      ),
      missileReloadSpeed: 1 + (this.calculateEffect(
        this.getDefinition('reload_speed')!,
        this.getUpgradeLevel('reload_speed')
      ) / 100),
      cannonDamage: 1 + (this.calculateEffect(
        this.getDefinition('cannon_damage')!,
        this.getUpgradeLevel('cannon_damage')
      ) / 100),
      homingStrength: 1 + (this.calculateEffect(
        this.getDefinition('homing_strength')!,
        this.getUpgradeLevel('homing_strength')
      ) / 100),
      
      // Defense
      maxHealthBonus: this.calculateEffect(
        this.getDefinition('armor_plating')!,
        this.getUpgradeLevel('armor_plating')
      ),
      shieldCharges: this.calculateEffect(
        this.getDefinition('shield_generator')!,
        this.getUpgradeLevel('shield_generator')
      ),
      
      // Systems
      radarRange: 1 + (this.calculateEffect(
        this.getDefinition('radar_range')!,
        this.getUpgradeLevel('radar_range')
      ) / 100),
      lockSpeed: 1 + (this.calculateEffect(
        this.getDefinition('lock_speed')!,
        this.getUpgradeLevel('lock_speed')
      ) / 100),
      comboWindow: this.calculateEffect(
        this.getDefinition('combo_extender')!,
        this.getUpgradeLevel('combo_extender')
      ),
      
      // Special abilities
      hasEMP: this.getUpgradeLevel('emp_burst') > 0,
      hasDecoy: this.getUpgradeLevel('decoy_flare') > 0,
      hasOvercharge: this.getUpgradeLevel('overcharge') > 0,
    };
  }

  /**
   * Get a specific modifier value
   */
  public getModifier(stat: keyof UpgradeModifiers): number | boolean {
    return this.getModifiers()[stat];
  }

  // ============ Emergency Repair ============

  /**
   * Get pending healing percentage from Emergency Repair purchases
   */
  public getPendingHealing(): number {
    return this.pendingHealing;
  }

  /**
   * Consume pending healing (called when applied to player)
   */
  public consumeHealing(): number {
    const healing = this.pendingHealing;
    this.pendingHealing = 0;
    return healing;
  }

  // ============ State Management ============

  /**
   * Reset all upgrades for new run
   */
  public reset(): void {
    this.purchasedUpgrades.clear();
    this.pendingHealing = 0;
    console.log('[UPGRADES] Reset for new run');
    
    window.dispatchEvent(new CustomEvent('upgrades-reset', {}));
  }

  /**
   * Get total spent on upgrades this run
   */
  public getTotalSpent(): number {
    let total = 0;
    for (const def of UPGRADE_DEFINITIONS) {
      const level = this.getUpgradeLevel(def.id);
      for (let i = 0; i < level; i++) {
        total += Math.floor(def.baseCost * Math.pow(def.costMultiplier, i));
      }
    }
    return total;
  }

  /**
   * Get upgrade state for display
   */
  public getUpgradeState(upgradeId: string): {
    definition: UpgradeDefinition;
    currentLevel: number;
    nextCost: number;
    currentEffect: number;
    nextEffect: number;
    canPurchase: boolean;
    isMaxLevel: boolean;
  } | null {
    const def = this.getDefinition(upgradeId);
    if (!def) return null;
    
    const currentLevel = this.getUpgradeLevel(upgradeId);
    const isMaxLevel = currentLevel >= def.maxLevel;
    
    return {
      definition: def,
      currentLevel,
      nextCost: isMaxLevel ? 0 : this.getUpgradeCost(upgradeId),
      currentEffect: this.calculateEffect(def, currentLevel),
      nextEffect: isMaxLevel ? 0 : this.calculateEffect(def, currentLevel + 1),
      canPurchase: this.canPurchase(upgradeId),
      isMaxLevel,
    };
  }

  /**
   * Get all upgrade states for shop display
   */
  public getAllUpgradeStates(): ReturnType<typeof this.getUpgradeState>[] {
    return UPGRADE_DEFINITIONS.map(def => this.getUpgradeState(def.id)).filter(Boolean) as ReturnType<typeof this.getUpgradeState>[];
  }
}

// ============ Singleton Export ============

export const upgradeManager = new UpgradeManager();

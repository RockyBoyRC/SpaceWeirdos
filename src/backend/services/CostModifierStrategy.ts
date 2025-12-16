import {
  Weapon,
  Equipment,
  AttributeType,
  AttributeLevel,
  WarbandAbility
} from '../models/types.js';
import { CostConfig } from '../config/types.js';

/**
 * Strategy interface for applying warband ability-based cost modifiers
 */
export interface CostModifierStrategy {
  /**
   * Apply discount to weapon cost based on warband ability
   */
  applyWeaponDiscount(weapon: Weapon): number;

  /**
   * Apply discount to equipment cost based on warband ability
   */
  applyEquipmentDiscount(equipment: Equipment): number;

  /**
   * Apply discount to attribute cost based on warband ability
   */
  applyAttributeDiscount(attribute: AttributeType, level: AttributeLevel, baseCost: number): number;
}

/**
 * Default strategy with no modifiers
 */
export class DefaultCostStrategy implements CostModifierStrategy {
  constructor(private config: CostConfig) {
    // Config available for strategy implementations
    void this.config; // Suppress unused warning
  }

  applyWeaponDiscount(weapon: Weapon): number {
    return weapon.baseCost;
  }

  applyEquipmentDiscount(equipment: Equipment): number {
    return equipment.baseCost;
  }

  applyAttributeDiscount(_attribute: AttributeType, _level: AttributeLevel, baseCost: number): number {
    return baseCost;
  }
}

/**
 * Mutants warband ability cost strategy
 * - Speed attribute costs reduced by configured discount
 * - Specific close combat weapons (from configuration) cost reduced by configured discount
 */
export class MutantsCostStrategy implements CostModifierStrategy {
  constructor(private config: CostConfig) {}

  applyWeaponDiscount(weapon: Weapon): number {
    let cost = weapon.baseCost;

    // Type assertion needed: weapon.name is string but includes() expects readonly tuple type
    // Safe because we're just checking if the string is in the list
    if (weapon.type === 'close' && this.config.abilityWeaponLists.mutantWeapons.includes(weapon.name as any)) {
      cost -= this.config.discountValues.mutantDiscount;
    }

    return Math.max(0, cost);
  }

  applyEquipmentDiscount(equipment: Equipment): number {
    return equipment.baseCost;
  }

  applyAttributeDiscount(attribute: AttributeType, _level: AttributeLevel, baseCost: number): number {
    if (attribute === 'speed') {
      return Math.max(0, baseCost - this.config.discountValues.mutantDiscount);
    }
    return baseCost;
  }
}

/**
 * Heavily Armed warband ability cost strategy
 * - Ranged weapon costs reduced by configured discount
 */
export class HeavilyArmedCostStrategy implements CostModifierStrategy {
  constructor(private config: CostConfig) {}

  applyWeaponDiscount(weapon: Weapon): number {
    let cost = weapon.baseCost;

    if (weapon.type === 'ranged') {
      cost -= this.config.discountValues.heavilyArmedDiscount;
    }

    return Math.max(0, cost);
  }

  applyEquipmentDiscount(equipment: Equipment): number {
    return equipment.baseCost;
  }

  applyAttributeDiscount(_attribute: AttributeType, _level: AttributeLevel, baseCost: number): number {
    return baseCost;
  }
}

/**
 * Soldiers warband ability cost strategy
 * - Specific equipment (from configuration) costs set to 0
 */
export class SoldiersCostStrategy implements CostModifierStrategy {
  constructor(private config: CostConfig) {}

  applyWeaponDiscount(weapon: Weapon): number {
    return weapon.baseCost;
  }

  applyEquipmentDiscount(equipment: Equipment): number {
    // Type assertion needed: equipment.name is string but includes() expects readonly tuple type
    // Safe because we're just checking if the string is in the list
    if (this.config.abilityEquipmentLists.soldierFreeEquipment.includes(equipment.name as any)) {
      return 0;
    }
    return equipment.baseCost;
  }

  applyAttributeDiscount(_attribute: AttributeType, _level: AttributeLevel, baseCost: number): number {
    return baseCost;
  }
}

/**
 * Factory function to create the appropriate cost modifier strategy
 */
export function createCostModifierStrategy(ability: WarbandAbility | null, config: CostConfig): CostModifierStrategy {
  switch (ability) {
    case 'Mutants':
      return new MutantsCostStrategy(config);
    case 'Heavily Armed':
      return new HeavilyArmedCostStrategy(config);
    case 'Soldiers':
      return new SoldiersCostStrategy(config);
    default:
      return new DefaultCostStrategy(config);
  }
}

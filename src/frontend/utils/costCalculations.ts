/**
 * Frontend Cost Calculation Utilities
 * 
 * This module mirrors the backend CostModifierStrategy logic to provide
 * consistent cost calculations in the UI. These calculations must match
 * the backend exactly to ensure UI displays are accurate.
 * 
 * IMPORTANT: Any changes to backend CostModifierStrategy must be reflected here.
 */

import type { Weapon, Equipment, PsychicPower, WarbandAbility } from '../../backend/models/types';

/**
 * Discount values for warband ability modifiers
 * Must match DISCOUNT_VALUES in src/backend/constants/costs.ts
 */
const DISCOUNT_VALUES = {
  MUTANT_DISCOUNT: 1,
  HEAVILY_ARMED_DISCOUNT: 1,
} as const;

/**
 * Weapon lists affected by warband abilities
 * Must match ABILITY_WEAPON_LISTS in src/backend/constants/costs.ts
 */
const ABILITY_WEAPON_LISTS = {
  MUTANT_WEAPONS: ['Claws & Teeth', 'Horrible Claws & Teeth', 'Whip/Tail'] as const,
} as const;

/**
 * Equipment lists affected by warband abilities
 * Must match ABILITY_EQUIPMENT_LISTS in src/backend/constants/costs.ts
 */
const ABILITY_EQUIPMENT_LISTS = {
  SOLDIER_FREE_EQUIPMENT: ['Grenade', 'Heavy Armor', 'Medkit'] as const,
} as const;

/**
 * Calculate modified weapon cost based on warband ability
 * Mirrors backend CostModifierStrategy logic
 * 
 * @param weapon - The weapon to calculate cost for
 * @param ability - The warband ability that may modify the cost
 * @returns The modified weapon cost (minimum 0)
 */
export function calculateWeaponCost(weapon: Weapon, ability: WarbandAbility | null): number {
  let cost = weapon.baseCost;

  // Heavily Armed: All ranged weapons cost 1 less
  if (ability === 'Heavily Armed' && weapon.type === 'ranged') {
    cost -= DISCOUNT_VALUES.HEAVILY_ARMED_DISCOUNT;
  }

  // Mutants: Specific close combat weapons cost 1 less
  if (ability === 'Mutants' && weapon.type === 'close') {
    if (ABILITY_WEAPON_LISTS.MUTANT_WEAPONS.includes(weapon.name as any)) {
      cost -= DISCOUNT_VALUES.MUTANT_DISCOUNT;
    }
  }

  // Clamp to minimum of 0
  return Math.max(0, cost);
}

/**
 * Calculate modified equipment cost based on warband ability
 * Mirrors backend CostModifierStrategy logic
 * 
 * @param equipment - The equipment to calculate cost for
 * @param ability - The warband ability that may modify the cost
 * @returns The modified equipment cost (minimum 0)
 */
export function calculateEquipmentCost(equipment: Equipment, ability: WarbandAbility | null): number {
  // Soldiers: Specific equipment is free
  if (ability === 'Soldiers') {
    if (ABILITY_EQUIPMENT_LISTS.SOLDIER_FREE_EQUIPMENT.includes(equipment.name as any)) {
      return 0;
    }
  }

  return equipment.baseCost;
}

/**
 * Calculate psychic power cost based on warband ability
 * Currently no abilities modify psychic power costs, but pattern is established
 * for future extensibility
 * 
 * @param power - The psychic power to calculate cost for
 * @param ability - The warband ability that may modify the cost (currently unused but reserved for future abilities)
 * @returns The modified psychic power cost (minimum 0)
 */
export function calculatePsychicPowerCost(power: PsychicPower, _ability: WarbandAbility | null): number {
  // No current modifiers, but pattern is ready for future abilities
  // The _ability parameter is prefixed with underscore to indicate it's intentionally unused
  return power.cost;
}

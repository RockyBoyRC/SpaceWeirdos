import {
  Weirdo,
  Warband,
  Weapon,
  Equipment,
  PsychicPower,
  WarbandAbility,
  AttributeType,
  AttributeLevel,
  SpeedLevel,
  DiceLevel,
  FirepowerLevel
} from '../models/types';

/**
 * Cost Engine Service
 * Calculates point costs for weirdos and warbands with warband ability modifiers
 */
export class CostEngine {
  /**
   * Attribute cost lookup table
   */
  private static readonly ATTRIBUTE_COSTS = {
    speed: {
      1: 0,
      2: 1,
      3: 3
    },
    defense: {
      '2d6': 2,
      '2d8': 4,
      '2d10': 8
    },
    firepower: {
      'None': 0,
      '2d8': 2,
      '2d10': 4
    },
    prowess: {
      '2d6': 2,
      '2d8': 4,
      '2d10': 6
    },
    willpower: {
      '2d6': 2,
      '2d8': 4,
      '2d10': 6
    }
  };

  /**
   * Calculate the cost of a single attribute with warband ability modifiers
   */
  getAttributeCost(
    attribute: AttributeType,
    level: AttributeLevel,
    warbandAbility: WarbandAbility
  ): number {
    let baseCost = 0;

    // Look up base cost from table
    if (attribute === 'speed') {
      baseCost = CostEngine.ATTRIBUTE_COSTS.speed[level as SpeedLevel];
    } else if (attribute === 'defense') {
      baseCost = CostEngine.ATTRIBUTE_COSTS.defense[level as DiceLevel];
    } else if (attribute === 'firepower') {
      baseCost = CostEngine.ATTRIBUTE_COSTS.firepower[level as FirepowerLevel];
    } else if (attribute === 'prowess') {
      baseCost = CostEngine.ATTRIBUTE_COSTS.prowess[level as DiceLevel];
    } else if (attribute === 'willpower') {
      baseCost = CostEngine.ATTRIBUTE_COSTS.willpower[level as DiceLevel];
    }

    // Apply warband ability modifiers
    if (warbandAbility === 'Mutants' && attribute === 'speed') {
      baseCost -= 1;
    }

    // Clamp at minimum 0
    return Math.max(0, baseCost);
  }

  /**
   * Calculate the cost of a weapon with warband ability modifiers
   */
  getWeaponCost(weapon: Weapon, warbandAbility: WarbandAbility): number {
    let cost = weapon.baseCost;

    // Apply Heavily Armed modifier (reduces ranged weapon costs by 1)
    if (warbandAbility === 'Heavily Armed' && weapon.type === 'ranged') {
      cost -= 1;
    }

    // Apply Mutants modifier (reduces specific close combat weapon costs by 1)
    if (warbandAbility === 'Mutants' && weapon.type === 'close') {
      const mutantWeapons = ['Claws & Teeth', 'Horrible Claws & Teeth', 'Whip/Tail'];
      if (mutantWeapons.includes(weapon.name)) {
        cost -= 1;
      }
    }

    // Clamp at minimum 0
    return Math.max(0, cost);
  }

  /**
   * Calculate the cost of equipment with warband ability modifiers
   */
  getEquipmentCost(equipment: Equipment, warbandAbility: WarbandAbility): number {
    let cost = equipment.baseCost;

    // Apply Soldiers modifier (sets specific equipment costs to 0)
    if (warbandAbility === 'Soldiers') {
      const freeEquipment = ['Grenade', 'Heavy Armor', 'Medkit'];
      if (freeEquipment.includes(equipment.name)) {
        cost = 0;
      }
    }

    // Clamp at minimum 0 (redundant but explicit)
    return Math.max(0, cost);
  }

  /**
   * Calculate the cost of a psychic power (no modifiers)
   */
  getPsychicPowerCost(power: PsychicPower): number {
    return power.cost;
  }

  /**
   * Calculate the total cost of a weirdo
   */
  calculateWeirdoCost(weirdo: Weirdo, warbandAbility: WarbandAbility): number {
    let totalCost = 0;

    // Calculate attribute costs
    totalCost += this.getAttributeCost('speed', weirdo.attributes.speed, warbandAbility);
    totalCost += this.getAttributeCost('defense', weirdo.attributes.defense, warbandAbility);
    totalCost += this.getAttributeCost('firepower', weirdo.attributes.firepower, warbandAbility);
    totalCost += this.getAttributeCost('prowess', weirdo.attributes.prowess, warbandAbility);
    totalCost += this.getAttributeCost('willpower', weirdo.attributes.willpower, warbandAbility);

    // Calculate weapon costs
    for (const weapon of weirdo.closeCombatWeapons) {
      totalCost += this.getWeaponCost(weapon, warbandAbility);
    }
    for (const weapon of weirdo.rangedWeapons) {
      totalCost += this.getWeaponCost(weapon, warbandAbility);
    }

    // Calculate equipment costs
    for (const equip of weirdo.equipment) {
      totalCost += this.getEquipmentCost(equip, warbandAbility);
    }

    // Calculate psychic power costs
    for (const power of weirdo.psychicPowers) {
      totalCost += this.getPsychicPowerCost(power);
    }

    return totalCost;
  }

  /**
   * Calculate the total cost of a warband
   */
  calculateWarbandCost(warband: Warband): number {
    let totalCost = 0;

    for (const weirdo of warband.weirdos) {
      totalCost += this.calculateWeirdoCost(weirdo, warband.ability);
    }

    return totalCost;
  }
}

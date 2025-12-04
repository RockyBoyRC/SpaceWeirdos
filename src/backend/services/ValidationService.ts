import {
  Weirdo,
  Warband,
  ValidationError,
  ValidationResult,
  WarbandAbility
} from '../models/types';
import { CostEngine } from './CostEngine';

/**
 * Validation Service
 * Enforces all game rules and constraints
 */
export class ValidationService {
  private costEngine: CostEngine;

  constructor() {
    this.costEngine = new CostEngine();
  }

  /**
   * Validate warband name (non-empty string)
   */
  private validateWarbandName(name: string): ValidationError | null {
    if (!name || name.trim().length === 0) {
      return {
        field: 'name',
        message: 'Warband name is required',
        code: 'WARBAND_NAME_REQUIRED'
      };
    }
    return null;
  }

  /**
   * Validate point limit (75 or 125)
   */
  private validatePointLimit(pointLimit: number): ValidationError | null {
    if (pointLimit !== 75 && pointLimit !== 125) {
      return {
        field: 'pointLimit',
        message: 'Point limit must be 75 or 125',
        code: 'INVALID_POINT_LIMIT'
      };
    }
    return null;
  }

  /**
   * Validate warband ability (required selection)
   */
  private validateWarbandAbility(ability: WarbandAbility | null | undefined): ValidationError | null {
    if (!ability) {
      return {
        field: 'ability',
        message: 'Warband ability must be selected',
        code: 'WARBAND_ABILITY_REQUIRED'
      };
    }
    return null;
  }

  /**
   * Validate weirdo name (non-empty string)
   */
  private validateWeirdoName(weirdo: Weirdo): ValidationError | null {
    if (!weirdo.name || weirdo.name.trim().length === 0) {
      return {
        field: `weirdo.${weirdo.id}.name`,
        message: 'Weirdo name is required',
        code: 'WEIRDO_NAME_REQUIRED'
      };
    }
    return null;
  }

  /**
   * Validate attribute completeness (all 5 required)
   */
  private validateAttributeCompleteness(weirdo: Weirdo): ValidationError | null {
    const { attributes } = weirdo;
    
    if (!attributes) {
      return {
        field: `weirdo.${weirdo.id}.attributes`,
        message: 'All five attributes must be selected',
        code: 'ATTRIBUTES_INCOMPLETE'
      };
    }

    // Check each attribute is defined
    if (attributes.speed === null || attributes.speed === undefined) {
      return {
        field: `weirdo.${weirdo.id}.attributes.speed`,
        message: 'All five attributes must be selected',
        code: 'ATTRIBUTES_INCOMPLETE'
      };
    }
    if (!attributes.defense) {
      return {
        field: `weirdo.${weirdo.id}.attributes.defense`,
        message: 'All five attributes must be selected',
        code: 'ATTRIBUTES_INCOMPLETE'
      };
    }
    if (!attributes.firepower) {
      return {
        field: `weirdo.${weirdo.id}.attributes.firepower`,
        message: 'All five attributes must be selected',
        code: 'ATTRIBUTES_INCOMPLETE'
      };
    }
    if (!attributes.prowess) {
      return {
        field: `weirdo.${weirdo.id}.attributes.prowess`,
        message: 'All five attributes must be selected',
        code: 'ATTRIBUTES_INCOMPLETE'
      };
    }
    if (!attributes.willpower) {
      return {
        field: `weirdo.${weirdo.id}.attributes.willpower`,
        message: 'All five attributes must be selected',
        code: 'ATTRIBUTES_INCOMPLETE'
      };
    }

    return null;
  }

  /**
   * Validate close combat weapon requirement
   */
  private validateCloseCombatWeaponRequirement(weirdo: Weirdo): ValidationError | null {
    if (!weirdo.closeCombatWeapons || weirdo.closeCombatWeapons.length === 0) {
      return {
        field: `weirdo.${weirdo.id}.closeCombatWeapons`,
        message: 'At least one close combat weapon is required',
        code: 'CLOSE_COMBAT_WEAPON_REQUIRED'
      };
    }
    return null;
  }

  /**
   * Validate ranged weapon requirement (based on Firepower)
   */
  private validateRangedWeaponRequirement(weirdo: Weirdo): ValidationError | null {
    // Skip if attributes are not set (will be caught by attribute completeness check)
    if (!weirdo.attributes) {
      return null;
    }

    const firepower = weirdo.attributes.firepower;
    
    // Ranged weapon required if Firepower is 2d8 or 2d10
    if (firepower === '2d8' || firepower === '2d10') {
      if (!weirdo.rangedWeapons || weirdo.rangedWeapons.length === 0) {
        return {
          field: `weirdo.${weirdo.id}.rangedWeapons`,
          message: 'Ranged weapon required when Firepower is 2d8 or 2d10',
          code: 'RANGED_WEAPON_REQUIRED'
        };
      }
    }
    
    return null;
  }

  /**
   * Validate equipment limit (based on type and Cyborgs ability)
   */
  private validateEquipmentLimit(weirdo: Weirdo, warbandAbility: WarbandAbility): ValidationError | null {
    const equipmentCount = weirdo.equipment ? weirdo.equipment.length : 0;
    let maxEquipment = 0;

    if (weirdo.type === 'leader') {
      maxEquipment = warbandAbility === 'Cyborgs' ? 3 : 2;
    } else {
      maxEquipment = warbandAbility === 'Cyborgs' ? 2 : 1;
    }

    if (equipmentCount > maxEquipment) {
      return {
        field: `weirdo.${weirdo.id}.equipment`,
        message: `Equipment limit exceeded: ${weirdo.type} can have ${maxEquipment} items`,
        code: 'EQUIPMENT_LIMIT_EXCEEDED'
      };
    }

    return null;
  }

  /**
   * Validate trooper 20-point limit
   */
  private validateTrooperPointLimit(weirdo: Weirdo, warband: Warband): ValidationError | null {
    if (weirdo.type !== 'trooper') {
      return null;
    }

    const weirdoCost = this.costEngine.calculateWeirdoCost(weirdo, warband.ability);
    
    // Check if there's already a 21-25 point weirdo in the warband
    const has25PointWeirdo = warband.weirdos.some(w => {
      if (w.id === weirdo.id) return false; // Don't count the current weirdo
      const cost = this.costEngine.calculateWeirdoCost(w, warband.ability);
      return cost >= 21 && cost <= 25;
    });

    // If there's already a 21-25 point weirdo, this trooper must be <= 20
    if (has25PointWeirdo && weirdoCost > 20) {
      return {
        field: `weirdo.${weirdo.id}.totalCost`,
        message: `Trooper cost (${weirdoCost}) exceeds 20-point limit`,
        code: 'TROOPER_POINT_LIMIT_EXCEEDED'
      };
    }

    // If this is the potential 21-25 point weirdo, it must be <= 25
    if (weirdoCost > 25) {
      return {
        field: `weirdo.${weirdo.id}.totalCost`,
        message: `Trooper cost (${weirdoCost}) exceeds 25-point maximum`,
        code: 'TROOPER_POINT_LIMIT_EXCEEDED'
      };
    }

    return null;
  }

  /**
   * Validate 25-point weirdo limit (only one allowed)
   */
  private validate25PointWeirdoLimit(warband: Warband): ValidationError | null {
    const weirdosOver20 = warband.weirdos.filter(w => {
      const cost = this.costEngine.calculateWeirdoCost(w, warband.ability);
      return cost >= 21 && cost <= 25;
    });

    if (weirdosOver20.length > 1) {
      return {
        field: 'warband.weirdos',
        message: 'Only one weirdo may cost 21-25 points',
        code: 'MULTIPLE_25_POINT_WEIRDOS'
      };
    }

    return null;
  }

  /**
   * Validate warband point limit
   */
  private validateWarbandPointLimit(warband: Warband): ValidationError | null {
    const totalCost = this.costEngine.calculateWarbandCost(warband);

    if (totalCost > warband.pointLimit) {
      return {
        field: 'warband.totalCost',
        message: `Warband total cost (${totalCost}) exceeds point limit (${warband.pointLimit})`,
        code: 'WARBAND_POINT_LIMIT_EXCEEDED'
      };
    }

    return null;
  }

  /**
   * Validate leader trait (only for leaders)
   */
  private validateLeaderTrait(weirdo: Weirdo): ValidationError | null {
    if (weirdo.type === 'trooper' && weirdo.leaderTrait !== null) {
      return {
        field: `weirdo.${weirdo.id}.leaderTrait`,
        message: 'Leader trait can only be assigned to leaders',
        code: 'LEADER_TRAIT_INVALID'
      };
    }
    return null;
  }

  /**
   * Validate a single weirdo
   */
  validateWeirdo(weirdo: Weirdo, warband: Warband): ValidationError[] {
    const errors: ValidationError[] = [];

    const nameError = this.validateWeirdoName(weirdo);
    if (nameError) errors.push(nameError);

    const attributeError = this.validateAttributeCompleteness(weirdo);
    if (attributeError) errors.push(attributeError);

    const closeCombatError = this.validateCloseCombatWeaponRequirement(weirdo);
    if (closeCombatError) errors.push(closeCombatError);

    const rangedWeaponError = this.validateRangedWeaponRequirement(weirdo);
    if (rangedWeaponError) errors.push(rangedWeaponError);

    const equipmentError = this.validateEquipmentLimit(weirdo, warband.ability);
    if (equipmentError) errors.push(equipmentError);

    const trooperLimitError = this.validateTrooperPointLimit(weirdo, warband);
    if (trooperLimitError) errors.push(trooperLimitError);

    const leaderTraitError = this.validateLeaderTrait(weirdo);
    if (leaderTraitError) errors.push(leaderTraitError);

    return errors;
  }

  /**
   * Validate an entire warband
   */
  validateWarband(warband: Warband): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate warband-level fields
    const nameError = this.validateWarbandName(warband.name);
    if (nameError) errors.push(nameError);

    const pointLimitError = this.validatePointLimit(warband.pointLimit);
    if (pointLimitError) errors.push(pointLimitError);

    const abilityError = this.validateWarbandAbility(warband.ability);
    if (abilityError) errors.push(abilityError);

    // Validate each weirdo
    for (const weirdo of warband.weirdos) {
      const weirdoErrors = this.validateWeirdo(weirdo, warband);
      errors.push(...weirdoErrors);
    }

    // Validate warband-level constraints
    const limit25Error = this.validate25PointWeirdoLimit(warband);
    if (limit25Error) errors.push(limit25Error);

    const warbandLimitError = this.validateWarbandPointLimit(warband);
    if (warbandLimitError) errors.push(warbandLimitError);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate weapon requirements for a weirdo
   */
  validateWeaponRequirements(weirdo: Weirdo): ValidationError[] {
    const errors: ValidationError[] = [];

    const closeCombatError = this.validateCloseCombatWeaponRequirement(weirdo);
    if (closeCombatError) errors.push(closeCombatError);

    const rangedWeaponError = this.validateRangedWeaponRequirement(weirdo);
    if (rangedWeaponError) errors.push(rangedWeaponError);

    return errors;
  }

  /**
   * Validate equipment limits for a weirdo
   */
  validateEquipmentLimits(weirdo: Weirdo, warbandAbility: WarbandAbility): ValidationError | null {
    return this.validateEquipmentLimit(weirdo, warbandAbility);
  }

  /**
   * Validate weirdo point limit (public method)
   */
  validateWeirdoPointLimit(weirdo: Weirdo, warband: Warband): ValidationError | null {
    return this.validateTrooperPointLimit(weirdo, warband);
  }
}

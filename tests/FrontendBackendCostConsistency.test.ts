import { describe, it, expect, beforeAll } from 'vitest';
import { calculateWeaponCost, calculateEquipmentCost, calculatePsychicPowerCost } from '../src/frontend/utils/costCalculations';
import { CostEngine } from '../src/backend/services/CostEngine';
import type { Weapon, Equipment, PsychicPower, WarbandAbility } from '../src/backend/models/types';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Integration tests for frontend-backend cost calculation consistency
 * 
 * Verifies that frontend cost calculation utilities produce identical results
 * to backend CostEngine calculations for all warband abilities and item types.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */
describe('Frontend-Backend Cost Consistency', () => {
  let closeCombatWeapons: Weapon[];
  let rangedWeapons: Weapon[];
  let equipment: Equipment[];
  let psychicPowers: PsychicPower[];
  let costEngine: CostEngine;

  const warbandAbilities: (WarbandAbility | null)[] = [
    null,
    'Mutants',
    'Soldiers',
    'Heavily Armed',
    'Cyborgs'
  ];

  beforeAll(async () => {
    // Load game data from JSON files
    closeCombatWeapons = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'data', 'closeCombatWeapons.json'), 'utf-8')
    );
    rangedWeapons = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'data', 'rangedWeapons.json'), 'utf-8')
    );
    equipment = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'data', 'equipment.json'), 'utf-8')
    );
    psychicPowers = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'data', 'psychicPowers.json'), 'utf-8')
    );

    costEngine = new CostEngine();
  });

  /**
   * Test that frontend weapon cost calculations match backend for all abilities
   * Requirements: 2.1
   */
  describe('Weapon Cost Consistency', () => {
    it('should match backend calculations for close combat weapons with null ability', () => {
      for (const weapon of closeCombatWeapons) {
        const frontendCost = calculateWeaponCost(weapon, null);
        const backendCost = costEngine.getWeaponCost(weapon, null);
        
        expect(frontendCost).toBe(backendCost);
      }
    });

    it('should match backend calculations for close combat weapons with Mutants ability', () => {
      for (const weapon of closeCombatWeapons) {
        const frontendCost = calculateWeaponCost(weapon, 'Mutants');
        const backendCost = costEngine.getWeaponCost(weapon, 'Mutants');
        
        expect(frontendCost).toBe(backendCost);
      }
    });

    it('should match backend calculations for ranged weapons with null ability', () => {
      for (const weapon of rangedWeapons) {
        const frontendCost = calculateWeaponCost(weapon, null);
        const backendCost = costEngine.getWeaponCost(weapon, null);
        
        expect(frontendCost).toBe(backendCost);
      }
    });

    it('should match backend calculations for ranged weapons with Heavily Armed ability', () => {
      for (const weapon of rangedWeapons) {
        const frontendCost = calculateWeaponCost(weapon, 'Heavily Armed');
        const backendCost = costEngine.getWeaponCost(weapon, 'Heavily Armed');
        
        expect(frontendCost).toBe(backendCost);
      }
    });

    it('should match backend calculations for all weapons with all abilities', () => {
      const allWeapons = [...closeCombatWeapons, ...rangedWeapons];
      
      for (const ability of warbandAbilities) {
        for (const weapon of allWeapons) {
          const frontendCost = calculateWeaponCost(weapon, ability);
          const backendCost = costEngine.getWeaponCost(weapon, ability);
          
          expect(frontendCost).toBe(backendCost);
        }
      }
    });
  });

  /**
   * Test that frontend equipment cost calculations match backend for all abilities
   * Requirements: 2.2
   */
  describe('Equipment Cost Consistency', () => {
    it('should match backend calculations for equipment with null ability', () => {
      for (const equip of equipment) {
        const frontendCost = calculateEquipmentCost(equip, null);
        const backendCost = costEngine.getEquipmentCost(equip, null);
        
        expect(frontendCost).toBe(backendCost);
      }
    });

    it('should match backend calculations for equipment with Soldiers ability', () => {
      for (const equip of equipment) {
        const frontendCost = calculateEquipmentCost(equip, 'Soldiers');
        const backendCost = costEngine.getEquipmentCost(equip, 'Soldiers');
        
        expect(frontendCost).toBe(backendCost);
      }
    });

    it('should match backend calculations for all equipment with all abilities', () => {
      for (const ability of warbandAbilities) {
        for (const equip of equipment) {
          const frontendCost = calculateEquipmentCost(equip, ability);
          const backendCost = costEngine.getEquipmentCost(equip, ability);
          
          expect(frontendCost).toBe(backendCost);
        }
      }
    });
  });

  /**
   * Test that frontend psychic power cost calculations match backend for all abilities
   * Requirements: 2.3
   */
  describe('Psychic Power Cost Consistency', () => {
    it('should match backend calculations for psychic powers with null ability', () => {
      for (const power of psychicPowers) {
        const frontendCost = calculatePsychicPowerCost(power, null);
        const backendCost = costEngine.getPsychicPowerCost(power);
        
        expect(frontendCost).toBe(backendCost);
      }
    });

    it('should match backend calculations for all psychic powers with all abilities', () => {
      for (const ability of warbandAbilities) {
        for (const power of psychicPowers) {
          const frontendCost = calculatePsychicPowerCost(power, ability);
          const backendCost = costEngine.getPsychicPowerCost(power);
          
          expect(frontendCost).toBe(backendCost);
        }
      }
    });
  });

  /**
   * Test specific warband ability modifiers
   * Requirements: 2.1, 2.2, 2.5
   */
  describe('Specific Ability Modifiers', () => {
    it('should apply Mutants discount to specific close combat weapons', () => {
      const mutantWeapons = ['Claws & Teeth', 'Horrible Claws & Teeth', 'Whip/Tail'];
      
      for (const weaponName of mutantWeapons) {
        const weapon = closeCombatWeapons.find(w => w.name === weaponName);
        expect(weapon).toBeDefined();
        
        if (weapon) {
          const frontendCost = calculateWeaponCost(weapon, 'Mutants');
          const backendCost = costEngine.getWeaponCost(weapon, 'Mutants');
          
          // Both should apply 1 point discount
          expect(frontendCost).toBe(backendCost);
          expect(frontendCost).toBe(Math.max(0, weapon.baseCost - 1));
        }
      }
    });

    it('should apply Heavily Armed discount to all ranged weapons', () => {
      for (const weapon of rangedWeapons) {
        const frontendCost = calculateWeaponCost(weapon, 'Heavily Armed');
        const backendCost = costEngine.getWeaponCost(weapon, 'Heavily Armed');
        
        // Both should apply 1 point discount
        expect(frontendCost).toBe(backendCost);
        expect(frontendCost).toBe(Math.max(0, weapon.baseCost - 1));
      }
    });

    it('should make specific equipment free for Soldiers', () => {
      const soldierFreeEquipment = ['Grenade', 'Heavy Armor', 'Medkit'];
      
      for (const equipName of soldierFreeEquipment) {
        const equip = equipment.find(e => e.name === equipName);
        expect(equip).toBeDefined();
        
        if (equip) {
          const frontendCost = calculateEquipmentCost(equip, 'Soldiers');
          const backendCost = costEngine.getEquipmentCost(equip, 'Soldiers');
          
          // Both should return 0 cost
          expect(frontendCost).toBe(backendCost);
          expect(frontendCost).toBe(0);
        }
      }
    });

    it('should not modify costs for equipment not affected by Soldiers', () => {
      const nonFreeEquipment = equipment.filter(
        e => !['Grenade', 'Heavy Armor', 'Medkit'].includes(e.name)
      );
      
      for (const equip of nonFreeEquipment) {
        const frontendCost = calculateEquipmentCost(equip, 'Soldiers');
        const backendCost = costEngine.getEquipmentCost(equip, 'Soldiers');
        
        // Both should return base cost
        expect(frontendCost).toBe(backendCost);
        expect(frontendCost).toBe(equip.baseCost);
      }
    });

    it('should not modify costs for close combat weapons not affected by Mutants', () => {
      const nonMutantWeapons = closeCombatWeapons.filter(
        w => !['Claws & Teeth', 'Horrible Claws & Teeth', 'Whip/Tail'].includes(w.name)
      );
      
      for (const weapon of nonMutantWeapons) {
        const frontendCost = calculateWeaponCost(weapon, 'Mutants');
        const backendCost = costEngine.getWeaponCost(weapon, 'Mutants');
        
        // Both should return base cost
        expect(frontendCost).toBe(backendCost);
        expect(frontendCost).toBe(weapon.baseCost);
      }
    });
  });

  /**
   * Test cost clamping at 0 minimum
   * Requirements: 2.5
   */
  describe('Cost Clamping', () => {
    it('should never return negative costs for weapons', () => {
      const allWeapons = [...closeCombatWeapons, ...rangedWeapons];
      
      for (const ability of warbandAbilities) {
        for (const weapon of allWeapons) {
          const frontendCost = calculateWeaponCost(weapon, ability);
          const backendCost = costEngine.getWeaponCost(weapon, ability);
          
          expect(frontendCost).toBeGreaterThanOrEqual(0);
          expect(backendCost).toBeGreaterThanOrEqual(0);
          expect(frontendCost).toBe(backendCost);
        }
      }
    });

    it('should never return negative costs for equipment', () => {
      for (const ability of warbandAbilities) {
        for (const equip of equipment) {
          const frontendCost = calculateEquipmentCost(equip, ability);
          const backendCost = costEngine.getEquipmentCost(equip, ability);
          
          expect(frontendCost).toBeGreaterThanOrEqual(0);
          expect(backendCost).toBeGreaterThanOrEqual(0);
          expect(frontendCost).toBe(backendCost);
        }
      }
    });

    it('should never return negative costs for psychic powers', () => {
      for (const ability of warbandAbilities) {
        for (const power of psychicPowers) {
          const frontendCost = calculatePsychicPowerCost(power, ability);
          const backendCost = costEngine.getPsychicPowerCost(power);
          
          expect(frontendCost).toBeGreaterThanOrEqual(0);
          expect(backendCost).toBeGreaterThanOrEqual(0);
          expect(frontendCost).toBe(backendCost);
        }
      }
    });
  });
});

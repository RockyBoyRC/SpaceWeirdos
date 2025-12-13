import { describe, it, expect } from 'vitest';
import { CostEngine } from '../src/backend/services/CostEngine';
import type { DiceLevel, SpeedLevel, FirepowerLevel } from '../src/backend/models/types';

describe('Attribute Cost Accuracy - Bug Fix Verification', () => {
  const costEngine = new CostEngine();

  describe('Defense attribute cost calculations', () => {
    it('should increase cost by exactly 2 when defense changes from 2d6 to 2d8', () => {
      // Test the specific scenario mentioned in the bug report
      const cost2d6 = costEngine.getAttributeCost('defense', '2d6', null);
      const cost2d8 = costEngine.getAttributeCost('defense', '2d8', null);
      
      const costDifference = cost2d8 - cost2d6;
      
      expect(costDifference).toBe(2);
      expect(cost2d6).toBe(2); // From lookup table
      expect(cost2d8).toBe(4); // From lookup table
    });

    it('should increase cost by exactly 4 when defense changes from 2d8 to 2d10', () => {
      const cost2d8 = costEngine.getAttributeCost('defense', '2d8', null);
      const cost2d10 = costEngine.getAttributeCost('defense', '2d10', null);
      
      const costDifference = cost2d10 - cost2d8;
      
      expect(costDifference).toBe(4);
      expect(cost2d8).toBe(4); // From lookup table
      expect(cost2d10).toBe(8); // From lookup table
    });

    it('should increase cost by exactly 6 when defense changes from 2d6 to 2d10', () => {
      const cost2d6 = costEngine.getAttributeCost('defense', '2d6', null);
      const cost2d10 = costEngine.getAttributeCost('defense', '2d10', null);
      
      const costDifference = cost2d10 - cost2d6;
      
      expect(costDifference).toBe(6);
      expect(cost2d6).toBe(2); // From lookup table
      expect(cost2d10).toBe(8); // From lookup table
    });
  });

  describe('All attribute cost lookup table verification', () => {
    it('should use correct speed attribute costs', () => {
      expect(costEngine.getAttributeCost('speed', 1, null)).toBe(0);
      expect(costEngine.getAttributeCost('speed', 2, null)).toBe(1);
      expect(costEngine.getAttributeCost('speed', 3, null)).toBe(3);
    });

    it('should use correct defense attribute costs', () => {
      expect(costEngine.getAttributeCost('defense', '2d6', null)).toBe(2);
      expect(costEngine.getAttributeCost('defense', '2d8', null)).toBe(4);
      expect(costEngine.getAttributeCost('defense', '2d10', null)).toBe(8);
    });

    it('should use correct firepower attribute costs', () => {
      expect(costEngine.getAttributeCost('firepower', 'None', null)).toBe(0);
      expect(costEngine.getAttributeCost('firepower', '2d8', null)).toBe(2);
      expect(costEngine.getAttributeCost('firepower', '2d10', null)).toBe(4);
    });

    it('should use correct prowess attribute costs', () => {
      expect(costEngine.getAttributeCost('prowess', '2d6', null)).toBe(2);
      expect(costEngine.getAttributeCost('prowess', '2d8', null)).toBe(4);
      expect(costEngine.getAttributeCost('prowess', '2d10', null)).toBe(6);
    });

    it('should use correct willpower attribute costs', () => {
      expect(costEngine.getAttributeCost('willpower', '2d6', null)).toBe(2);
      expect(costEngine.getAttributeCost('willpower', '2d8', null)).toBe(4);
      expect(costEngine.getAttributeCost('willpower', '2d10', null)).toBe(6);
    });
  });

  describe('End-to-end cost calculation verification', () => {
    it('should calculate total weirdo cost correctly for the bug scenario', () => {
      // Create a minimal weirdo with defense 2d6
      const baseWeirdo = {
        id: 'test-weirdo',
        name: 'Test Weirdo',
        type: 'trooper' as const,
        attributes: {
          speed: 1 as SpeedLevel,
          defense: '2d6' as DiceLevel,
          firepower: 'None' as FirepowerLevel,
          prowess: '2d6' as DiceLevel,
          willpower: '2d6' as DiceLevel,
        },
        closeCombatWeapons: [{
          id: 'unarmed',
          name: 'Unarmed',
          type: 'close' as const,
          baseCost: 0,
          maxActions: 1,
          notes: 'Basic unarmed attack'
        }],
        rangedWeapons: [],
        equipment: [],
        psychicPowers: [],
        leaderTrait: null,
        notes: '',
        totalCost: 0
      };

      // Calculate cost with defense 2d6
      const costWith2d6 = costEngine.calculateWeirdoCost(baseWeirdo, null);

      // Calculate cost with defense 2d8
      const weirdoWith2d8 = {
        ...baseWeirdo,
        attributes: {
          ...baseWeirdo.attributes,
          defense: '2d8' as DiceLevel
        }
      };
      const costWith2d8 = costEngine.calculateWeirdoCost(weirdoWith2d8, null);

      // Verify the cost difference is exactly 2
      const costDifference = costWith2d8 - costWith2d6;
      expect(costDifference).toBe(2);

      // Expected costs based on lookup table:
      // Speed 1: 0, Defense 2d6: 2, Firepower None: 0, Prowess 2d6: 2, Willpower 2d6: 2, Unarmed: 0
      // Total with 2d6: 0 + 2 + 0 + 2 + 2 + 0 = 6
      expect(costWith2d6).toBe(6);

      // Total with 2d8: 0 + 4 + 0 + 2 + 2 + 0 = 8
      expect(costWith2d8).toBe(8);
    });
  });
});
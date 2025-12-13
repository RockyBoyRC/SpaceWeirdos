import { describe, it, expect } from 'vitest';
import { apiClient } from '../src/frontend/services/apiClient';
import type { Attributes } from '../src/backend/models/types';

describe('Real-Time Cost API Accuracy - Bug Fix Verification', () => {
  describe('Defense attribute cost calculations via API', () => {
    it('should increase cost by exactly 2 when defense changes from 2d6 to 2d8', async () => {
      // Base attributes with defense 2d6
      const baseAttributes: Attributes = {
        speed: 1,
        defense: '2d6',
        firepower: 'None',
        prowess: '2d6',
        willpower: '2d6',
      };

      // Attributes with defense 2d8
      const upgradedAttributes: Attributes = {
        ...baseAttributes,
        defense: '2d8',
      };

      // Calculate costs via API
      const baseCostResponse = await apiClient.calculateCostRealTime({
        weirdoType: 'trooper',
        attributes: baseAttributes,
        weapons: {
          close: ['Unarmed'],
          ranged: []
        },
        equipment: [],
        psychicPowers: [],
        warbandAbility: null,
      });

      const upgradedCostResponse = await apiClient.calculateCostRealTime({
        weirdoType: 'trooper',
        attributes: upgradedAttributes,
        weapons: {
          close: ['Unarmed'],
          ranged: []
        },
        equipment: [],
        psychicPowers: [],
        warbandAbility: null,
      });

      const costDifference = upgradedCostResponse.data.totalCost - baseCostResponse.data.totalCost;
      
      expect(costDifference).toBe(2);
      expect(baseCostResponse.data.totalCost).toBe(6); // Expected: 0+2+0+2+2+0 = 6
      expect(upgradedCostResponse.data.totalCost).toBe(8); // Expected: 0+4+0+2+2+0 = 8
    });

    it('should increase cost by exactly 4 when defense changes from 2d8 to 2d10', async () => {
      // Base attributes with defense 2d8
      const baseAttributes: Attributes = {
        speed: 1,
        defense: '2d8',
        firepower: 'None',
        prowess: '2d6',
        willpower: '2d6',
      };

      // Attributes with defense 2d10
      const upgradedAttributes: Attributes = {
        ...baseAttributes,
        defense: '2d10',
      };

      // Calculate costs via API
      const baseCostResponse = await apiClient.calculateCostRealTime({
        weirdoType: 'trooper',
        attributes: baseAttributes,
        weapons: {
          close: ['Unarmed'],
          ranged: []
        },
        equipment: [],
        psychicPowers: [],
        warbandAbility: null,
      });

      const upgradedCostResponse = await apiClient.calculateCostRealTime({
        weirdoType: 'trooper',
        attributes: upgradedAttributes,
        weapons: {
          close: ['Unarmed'],
          ranged: []
        },
        equipment: [],
        psychicPowers: [],
        warbandAbility: null,
      });

      const costDifference = upgradedCostResponse.data.totalCost - baseCostResponse.data.totalCost;
      
      expect(costDifference).toBe(4);
      expect(baseCostResponse.data.totalCost).toBe(8); // Expected: 0+4+0+2+2+0 = 8
      expect(upgradedCostResponse.data.totalCost).toBe(12); // Expected: 0+8+0+2+2+0 = 12
    });

    it('should provide accurate cost breakdown for defense attributes', async () => {
      const attributes: Attributes = {
        speed: 1,
        defense: '2d8',
        firepower: 'None',
        prowess: '2d6',
        willpower: '2d6',
      };

      const response = await apiClient.calculateCostRealTime({
        weirdoType: 'trooper',
        attributes: attributes,
        weapons: {
          close: ['Unarmed'],
          ranged: []
        },
        equipment: [],
        psychicPowers: [],
        warbandAbility: null,
      });

      // Verify breakdown shows correct attribute costs
      // Expected: Speed(0) + Defense(4) + Firepower(0) + Prowess(2) + Willpower(2) = 8
      expect(response.data.breakdown.attributes).toBe(8);
      expect(response.data.breakdown.weapons).toBe(0); // Unarmed is free
      expect(response.data.breakdown.equipment).toBe(0);
      expect(response.data.breakdown.psychicPowers).toBe(0);
      expect(response.data.totalCost).toBe(8);
    });
  });

  describe('Type compatibility verification', () => {
    it('should accept backend Attributes interface without type conversion errors', async () => {
      // This test verifies that the frontend can send the backend Attributes interface
      // directly without any type conversion issues
      const attributes: Attributes = {
        speed: 2,
        defense: '2d10',
        firepower: '2d8',
        prowess: '2d8',
        willpower: '2d10',
      };

      // This should not throw any type errors and should process successfully
      const response = await apiClient.calculateCostRealTime({
        weirdoType: 'leader',
        attributes: attributes,
        weapons: {
          close: ['Sword'],
          ranged: ['Pistol']
        },
        equipment: ['Heavy Armor'],
        psychicPowers: [],
        warbandAbility: null,
      });

      // Verify we get a valid response
      expect(response.data).toBeDefined();
      expect(response.data.totalCost).toBeGreaterThan(0);
      expect(response.data.breakdown).toBeDefined();
      expect(response.data.breakdown.attributes).toBeGreaterThan(0);
    });
  });
});
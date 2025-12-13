import { describe, it, expect } from 'vitest';
import { apiClient } from '../src/frontend/services/apiClient';
import type { Attributes } from '../src/backend/models/types';

describe('Bug Scenario Verification - Defense 2d6→2d8 Cost Increase', () => {
  it('should reproduce the bug scenario: defense 2d6→2d8 should increase cost by 2, not 6', async () => {
    // This test reproduces the exact scenario described in the bug report:
    // "adding 2 points of defense attribute incorrectly increases a weirdo cost from 6 to 12 instead of the expected 8"

    // Create a minimal weirdo configuration that should cost 6 points with defense 2d6
    const baseAttributes: Attributes = {
      speed: 1,        // Cost: 0
      defense: '2d6',  // Cost: 2
      firepower: 'None', // Cost: 0
      prowess: '2d6',  // Cost: 2
      willpower: '2d6', // Cost: 2
    };
    // Expected total: 0 + 2 + 0 + 2 + 2 = 6

    // Same weirdo but with defense upgraded to 2d8
    const upgradedAttributes: Attributes = {
      ...baseAttributes,
      defense: '2d8',  // Cost: 4 (should be +2 from 2d6)
    };
    // Expected total: 0 + 4 + 0 + 2 + 2 = 8

    // Calculate costs via the real-time API
    const baseCostResponse = await apiClient.calculateCostRealTime({
      weirdoType: 'trooper',
      attributes: baseAttributes,
      weapons: {
        close: ['Unarmed'], // Cost: 0
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
        close: ['Unarmed'], // Cost: 0
        ranged: []
      },
      equipment: [],
      psychicPowers: [],
      warbandAbility: null,
    });

    // Log the actual costs for debugging
    console.log('Base cost (defense 2d6):', baseCostResponse.data.totalCost);
    console.log('Upgraded cost (defense 2d8):', upgradedCostResponse.data.totalCost);
    console.log('Cost difference:', upgradedCostResponse.data.totalCost - baseCostResponse.data.totalCost);
    console.log('Base breakdown:', baseCostResponse.data.breakdown);
    console.log('Upgraded breakdown:', upgradedCostResponse.data.breakdown);

    // Verify the expected costs
    expect(baseCostResponse.data.totalCost).toBe(6);
    expect(upgradedCostResponse.data.totalCost).toBe(8);

    // Verify the cost difference is exactly 2, not 6
    const costDifference = upgradedCostResponse.data.totalCost - baseCostResponse.data.totalCost;
    expect(costDifference).toBe(2);

    // Additional verification: check that the bug scenario (6→12) does NOT occur
    expect(upgradedCostResponse.data.totalCost).not.toBe(12);
  });

  it('should verify attribute breakdown is accurate', async () => {
    const attributes: Attributes = {
      speed: 2,        // Cost: 1
      defense: '2d8',  // Cost: 4
      firepower: '2d8', // Cost: 2
      prowess: '2d8',  // Cost: 4
      willpower: '2d8', // Cost: 4
    };
    // Expected attribute total: 1 + 4 + 2 + 4 + 4 = 15

    const response = await apiClient.calculateCostRealTime({
      weirdoType: 'leader',
      attributes: attributes,
      weapons: {
        close: ['Unarmed'], // Cost: 0
        ranged: []
      },
      equipment: [],
      psychicPowers: [],
      warbandAbility: null,
    });

    console.log('Attribute breakdown test:');
    console.log('Total cost:', response.data.totalCost);
    console.log('Attribute cost:', response.data.breakdown.attributes);
    console.log('Full breakdown:', response.data.breakdown);

    // Verify the attribute breakdown matches expected calculation
    expect(response.data.breakdown.attributes).toBe(15);
    expect(response.data.totalCost).toBe(15); // Only attributes and free unarmed weapon
  });

  it('should verify all defense levels have correct costs', async () => {
    const testCases = [
      { defense: '2d6' as const, expectedAttributeCost: 6 }, // 0+2+0+2+2 = 6
      { defense: '2d8' as const, expectedAttributeCost: 8 }, // 0+4+0+2+2 = 8
      { defense: '2d10' as const, expectedAttributeCost: 12 }, // 0+8+0+2+2 = 12
    ];

    for (const testCase of testCases) {
      const attributes: Attributes = {
        speed: 1,
        defense: testCase.defense,
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

      console.log(`Defense ${testCase.defense}: total=${response.data.totalCost}, attributes=${response.data.breakdown.attributes}`);

      expect(response.data.breakdown.attributes).toBe(testCase.expectedAttributeCost);
      expect(response.data.totalCost).toBe(testCase.expectedAttributeCost);
    }
  });
});
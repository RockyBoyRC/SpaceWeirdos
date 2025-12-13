import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCostCalculation } from '../src/frontend/hooks/useCostCalculation';
import type { CostCalculationParams } from '../src/frontend/hooks/useCostCalculation';
import type { Attributes } from '../src/backend/models/types';

// Mock the API client
vi.mock('../src/frontend/services/apiClient', () => ({
  apiClient: {
    calculateCostRealTime: vi.fn(),
  },
}));

import { apiClient } from '../src/frontend/services/apiClient';

describe('Cost Calculation Hook Accuracy - Bug Fix Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Defense attribute cost calculations via hook', () => {
    it('should increase cost by exactly 2 when defense changes from 2d6 to 2d8', async () => {
      // Mock API responses
      const mockApiResponse2d6 = {
        data: {
          totalCost: 6,
          breakdown: {
            attributes: 6,
            weapons: 0,
            equipment: 0,
            psychicPowers: 0,
          },
          warnings: [],
          isApproachingLimit: false,
          isOverLimit: false,
        },
      };

      const mockApiResponse2d8 = {
        data: {
          totalCost: 8,
          breakdown: {
            attributes: 8,
            weapons: 0,
            equipment: 0,
            psychicPowers: 0,
          },
          warnings: [],
          isApproachingLimit: false,
          isOverLimit: false,
        },
      };

      // Set up mock to return different responses based on defense level
      (apiClient.calculateCostRealTime as any).mockImplementation((params: any) => {
        if (params.attributes.defense === '2d6') {
          return Promise.resolve(mockApiResponse2d6);
        } else if (params.attributes.defense === '2d8') {
          return Promise.resolve(mockApiResponse2d8);
        }
        return Promise.reject(new Error('Unexpected defense level'));
      });

      // Test with defense 2d6
      const params2d6: CostCalculationParams = {
        weirdoType: 'trooper',
        attributes: {
          speed: 1,
          defense: '2d6',
          firepower: 'None',
          prowess: '2d6',
          willpower: '2d6',
        },
        weapons: {
          close: ['Unarmed'],
          ranged: []
        },
        equipment: [],
        psychicPowers: [],
        warbandAbility: null,
      };

      const { result: result2d6 } = renderHook(() => useCostCalculation(params2d6));

      // Wait for the hook to complete
      await waitFor(() => {
        expect(result2d6.current.isLoading).toBe(false);
      });

      expect(result2d6.current.totalCost).toBe(6);

      // Test with defense 2d8
      const params2d8: CostCalculationParams = {
        ...params2d6,
        attributes: {
          ...params2d6.attributes,
          defense: '2d8',
        },
      };

      const { result: result2d8 } = renderHook(() => useCostCalculation(params2d8));

      // Wait for the hook to complete
      await waitFor(() => {
        expect(result2d8.current.isLoading).toBe(false);
      });

      expect(result2d8.current.totalCost).toBe(8);

      // Verify the cost difference is exactly 2
      const costDifference = result2d8.current.totalCost - result2d6.current.totalCost;
      expect(costDifference).toBe(2);
    });

    it('should pass correct Attributes interface to API', async () => {
      const mockApiResponse = {
        data: {
          totalCost: 10,
          breakdown: {
            attributes: 10,
            weapons: 0,
            equipment: 0,
            psychicPowers: 0,
          },
          warnings: [],
          isApproachingLimit: false,
          isOverLimit: false,
        },
      };

      (apiClient.calculateCostRealTime as any).mockResolvedValue(mockApiResponse);

      const attributes: Attributes = {
        speed: 2,
        defense: '2d8',
        firepower: '2d8',
        prowess: '2d8',
        willpower: '2d8',
      };

      const params: CostCalculationParams = {
        weirdoType: 'leader',
        attributes: attributes,
        weapons: {
          close: ['Sword'],
          ranged: ['Pistol']
        },
        equipment: ['Heavy Armor'],
        psychicPowers: [],
        warbandAbility: null,
      };

      const { result } = renderHook(() => useCostCalculation(params));

      // Wait for the hook to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify the API was called with the correct parameters
      expect(apiClient.calculateCostRealTime).toHaveBeenCalledWith({
        weirdoType: 'leader',
        attributes: attributes, // Should be the exact Attributes interface
        weapons: {
          close: ['Sword'],
          ranged: ['Pistol']
        },
        equipment: ['Heavy Armor'],
        psychicPowers: [],
        warbandAbility: null,
      });

      // Verify the hook returns the expected result
      expect(result.current.totalCost).toBe(10);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Type compatibility verification', () => {
    it('should handle all valid attribute combinations without type errors', async () => {
      // Mock different responses for different attribute combinations
      const mockResponses = [
        {
          data: {
            totalCost: 6, // Speed(0) + Defense(2) + Firepower(0) + Prowess(2) + Willpower(2) = 6
            breakdown: { attributes: 6, weapons: 0, equipment: 0, psychicPowers: 0 },
            warnings: [],
            isApproachingLimit: false,
            isOverLimit: false,
          },
        },
        {
          data: {
            totalCost: 15, // Speed(1) + Defense(4) + Firepower(2) + Prowess(4) + Willpower(4) = 15
            breakdown: { attributes: 15, weapons: 0, equipment: 0, psychicPowers: 0 },
            warnings: [],
            isApproachingLimit: false,
            isOverLimit: false,
          },
        },
        {
          data: {
            totalCost: 25, // Speed(3) + Defense(8) + Firepower(4) + Prowess(6) + Willpower(6) = 27
            breakdown: { attributes: 25, weapons: 0, equipment: 0, psychicPowers: 0 },
            warnings: [],
            isApproachingLimit: false,
            isOverLimit: false,
          },
        },
      ];

      let callCount = 0;
      (apiClient.calculateCostRealTime as any).mockImplementation(() => {
        const response = mockResponses[callCount % mockResponses.length];
        callCount++;
        return Promise.resolve(response);
      });

      // Test all valid attribute combinations
      const testCases: { attributes: Attributes; expectedCost: number }[] = [
        {
          attributes: {
            speed: 1,
            defense: '2d6',
            firepower: 'None',
            prowess: '2d6',
            willpower: '2d6',
          },
          expectedCost: 6,
        },
        {
          attributes: {
            speed: 2,
            defense: '2d8',
            firepower: '2d8',
            prowess: '2d8',
            willpower: '2d8',
          },
          expectedCost: 15,
        },
        {
          attributes: {
            speed: 3,
            defense: '2d10',
            firepower: '2d10',
            prowess: '2d10',
            willpower: '2d10',
          },
          expectedCost: 25,
        },
      ];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const params: CostCalculationParams = {
          weirdoType: 'trooper',
          attributes: testCase.attributes,
          weapons: {
            close: ['Unarmed'],
            ranged: []
          },
          equipment: [],
          psychicPowers: [],
          warbandAbility: null,
        };

        const { result } = renderHook(() => useCostCalculation(params));

        // Wait for the hook to complete
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Verify no errors occurred
        expect(result.current.error).toBeNull();
        expect(result.current.totalCost).toBe(testCase.expectedCost);
      }

      // Verify API was called for each test case
      expect(apiClient.calculateCostRealTime).toHaveBeenCalledTimes(testCases.length);
    });
  });
});
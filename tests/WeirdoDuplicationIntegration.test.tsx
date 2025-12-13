/**
 * Weirdo Duplication Integration Tests
 * 
 * Tests the integration between frontend components and the duplication API.
 * Verifies that the WarbandContext correctly handles duplication operations.
 * 
 * Requirements: 10.1-10.9
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WarbandProvider, useWarband } from '../src/frontend/contexts/WarbandContext';
import { apiClient } from '../src/frontend/services/apiClient';
import type { Weirdo, Warband } from '../src/backend/models/types';

// Mock the API client
vi.mock('../src/frontend/services/apiClient', () => ({
  apiClient: {
    duplicateWeirdo: vi.fn(),
    calculateCostRealTime: vi.fn(),
    validateWeirdo: vi.fn(),
  },
}));

const mockApiClient = apiClient as any;

// Test component that uses the warband context
function TestDuplicationComponent() {
  const { currentWarband, duplicateWeirdo, selectedWeirdoId } = useWarband();

  const handleDuplicate = async () => {
    if (currentWarband?.weirdos[0]) {
      await duplicateWeirdo(currentWarband.weirdos[0].id);
    }
  };

  return (
    <div>
      <div data-testid="warband-name">{currentWarband?.name || 'No warband'}</div>
      <div data-testid="weirdo-count">{currentWarband?.weirdos.length || 0}</div>
      <div data-testid="selected-weirdo">{selectedWeirdoId || 'None'}</div>
      <button onClick={handleDuplicate} data-testid="duplicate-button">
        Duplicate First Weirdo
      </button>
    </div>
  );
}

describe('Weirdo Duplication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful cost calculation
    mockApiClient.calculateCostRealTime.mockResolvedValue({
      data: {
        totalCost: 10,
        breakdown: {
          attributes: 5,
          weapons: 2,
          equipment: 2,
          psychicPowers: 1,
        },
        warnings: [],
        isApproachingLimit: false,
        isOverLimit: false,
        calculationTime: 50,
      },
    });

    // Mock successful validation
    mockApiClient.validateWeirdo.mockResolvedValue({
      valid: true,
      errors: [],
    });
  });

  it('should duplicate a weirdo and update the warband state', async () => {
    const originalWeirdo: Weirdo = {
      id: 'weirdo-1',
      name: 'Test Trooper',
      type: 'trooper',
      attributes: {
        speed: 2,
        defense: '1d6',
        firepower: 'None',
        prowess: '1d6',
        willpower: '2d6',
      },
      closeCombatWeapons: [],
      rangedWeapons: [],
      equipment: [],
      psychicPowers: [],
      leaderTrait: null,
      notes: '',
      totalCost: 10,
    };

    const duplicatedWeirdo: Weirdo = {
      id: 'weirdo-2',
      name: 'Test Trooper 1',
      type: 'trooper',
      attributes: originalWeirdo.attributes,
      closeCombatWeapons: [],
      rangedWeapons: [],
      equipment: [],
      psychicPowers: [],
      leaderTrait: null,
      notes: '',
      totalCost: 10,
    };

    const updatedWarband: Warband = {
      id: 'warband-1',
      name: 'Test Warband',
      ability: null,
      pointLimit: 125,
      totalCost: 20,
      weirdos: [originalWeirdo, duplicatedWeirdo],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock the duplication API response
    mockApiClient.duplicateWeirdo.mockResolvedValue({
      newWeirdo: duplicatedWeirdo,
      warband: updatedWarband,
    });

    // Create a test warband with one weirdo
    const TestWrapper = () => {
      const { createWarband, updateWarband } = useWarband();
      
      // Initialize warband on mount
      React.useEffect(() => {
        createWarband('Test Warband', 125);
        updateWarband({
          id: 'warband-1',
          weirdos: [originalWeirdo],
          totalCost: 10,
        });
      }, []);

      return <TestDuplicationComponent />;
    };

    render(
      <WarbandProvider>
        <TestWrapper />
      </WarbandProvider>
    );

    // Verify initial state
    expect(screen.getByTestId('warband-name')).toHaveTextContent('Test Warband');
    expect(screen.getByTestId('weirdo-count')).toHaveTextContent('1');
    expect(screen.getByTestId('selected-weirdo')).toHaveTextContent('None');

    // Click duplicate button
    const duplicateButton = screen.getByTestId('duplicate-button');
    fireEvent.click(duplicateButton);

    // Wait for duplication to complete
    await waitFor(() => {
      expect(mockApiClient.duplicateWeirdo).toHaveBeenCalledWith('warband-1', 'weirdo-1');
    });

    // Verify updated state
    await waitFor(() => {
      expect(screen.getByTestId('weirdo-count')).toHaveTextContent('2');
      expect(screen.getByTestId('selected-weirdo')).toHaveTextContent('weirdo-2');
    });
  });

  it('should handle duplication errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock API error
    mockApiClient.duplicateWeirdo.mockRejectedValue(new Error('Duplication failed'));

    const TestWrapper = () => {
      const { createWarband, updateWarband } = useWarband();
      
      React.useEffect(() => {
        createWarband('Test Warband', 125);
        updateWarband({
          id: 'warband-1',
          weirdos: [{
            id: 'weirdo-1',
            name: 'Test Trooper',
            type: 'trooper' as const,
            attributes: {
              speed: 2,
              defense: '1d6',
              firepower: 'None',
              prowess: '1d6',
              willpower: '2d6',
            },
            closeCombatWeapons: [],
            rangedWeapons: [],
            equipment: [],
            psychicPowers: [],
            leaderTrait: null,
            notes: '',
            totalCost: 10,
          }],
          totalCost: 10,
        });
      }, []);

      return <TestDuplicationComponent />;
    };

    render(
      <WarbandProvider>
        <TestWrapper />
      </WarbandProvider>
    );

    // Click duplicate button
    const duplicateButton = screen.getByTestId('duplicate-button');
    fireEvent.click(duplicateButton);

    // Wait for error handling
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error duplicating weirdo:', expect.any(Error));
    });

    // Verify state remains unchanged
    expect(screen.getByTestId('weirdo-count')).toHaveTextContent('1');
    expect(screen.getByTestId('selected-weirdo')).toHaveTextContent('None');

    consoleSpy.mockRestore();
  });

  it('should not duplicate when no warband is loaded', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <WarbandProvider>
        <TestDuplicationComponent />
      </WarbandProvider>
    );

    // Click duplicate button with no warband
    const duplicateButton = screen.getByTestId('duplicate-button');
    fireEvent.click(duplicateButton);

    // Verify no API call is made
    expect(mockApiClient.duplicateWeirdo).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
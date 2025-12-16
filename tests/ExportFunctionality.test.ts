import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../src/frontend/services/apiClient';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Export Functionality Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle direct warband data response from export endpoint', async () => {
    // Mock the response that the backend actually sends (direct warband data)
    const mockWarbandData = {
      id: 'test-id',
      name: 'Test Warband',
      ability: null,
      pointLimit: 75,
      totalCost: 25,
      weirdos: [],
      exportVersion: '1.0',
      exportedAt: '2023-12-15T22:00:00.000Z',
      exportedBy: 'Space Weirdos Warband Builder'
    };

    // Mock fetch to return the direct warband data (as the backend actually does)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockWarbandData,
      headers: new Headers({
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="Test_Warband_warband.json"'
      })
    } as Response);

    // Test the export functionality
    const result = await apiClient.exportWarband('test-id');

    // Verify the result is the warband data directly
    expect(result).toEqual(mockWarbandData);
    expect(result).toHaveProperty('id', 'test-id');
    expect(result).toHaveProperty('name', 'Test Warband');
    expect(result).toHaveProperty('exportVersion', '1.0');
    expect(result).toHaveProperty('exportedBy', 'Space Weirdos Warband Builder');

    // Verify the correct endpoint was called
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/warbands/test-id/export',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    );
  });

  it('should handle export errors properly', async () => {
    // Mock fetch to return an error response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Warband not found' })
    } as Response);

    // Test that the error is properly thrown
    await expect(apiClient.exportWarband('non-existent-id')).rejects.toThrow();

    // Verify the correct endpoint was called
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/warbands/non-existent-id/export',
      expect.objectContaining({
        method: 'GET'
      })
    );
  });
});
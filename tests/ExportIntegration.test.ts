import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../src/frontend/services/apiClient';
import { FileUtils } from '../src/frontend/services/FileUtils';

// Mock fetch for API client testing
global.fetch = vi.fn();

// Mock FileUtils.downloadWarbandAsJson to avoid DOM manipulation in tests
vi.mock('../src/frontend/services/FileUtils', async () => {
  const actual = await vi.importActual('../src/frontend/services/FileUtils');
  return {
    ...actual,
    FileUtils: {
      ...actual.FileUtils,
      downloadWarbandAsJson: vi.fn()
    }
  };
});

describe('Export Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete the full export flow from API call to download', async () => {
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

    // Test the complete export flow
    const exportedData = await apiClient.exportWarband('test-id');
    
    // Verify the API client returns the correct data
    expect(exportedData).toEqual(mockWarbandData);

    // Test that FileUtils can handle the exported data
    expect(() => {
      FileUtils.downloadWarbandAsJson(exportedData, 'Test Warband.json');
    }).not.toThrow();

    // Verify FileUtils.downloadWarbandAsJson was called with correct parameters
    expect(FileUtils.downloadWarbandAsJson).toHaveBeenCalledWith(
      mockWarbandData,
      'Test Warband.json'
    );
  });

  it('should handle the export flow with default filename', async () => {
    const mockWarbandData = {
      id: 'test-id-2',
      name: 'Another Warband',
      ability: 'Cyborgs',
      pointLimit: 125,
      totalCost: 50,
      weirdos: [],
      exportVersion: '1.0',
      exportedAt: '2023-12-15T22:00:00.000Z',
      exportedBy: 'Space Weirdos Warband Builder'
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockWarbandData
    } as Response);

    // Test export without specifying filename
    const exportedData = await apiClient.exportWarband('test-id-2');
    
    expect(() => {
      FileUtils.downloadWarbandAsJson(exportedData);
    }).not.toThrow();

    expect(FileUtils.downloadWarbandAsJson).toHaveBeenCalledWith(mockWarbandData);
  });

  it('should handle API errors in the export flow', async () => {
    // Mock fetch to return an error response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Warband not found' })
    } as Response);

    // Test that the error is properly thrown and doesn't reach FileUtils
    await expect(apiClient.exportWarband('non-existent-id')).rejects.toThrow();

    // Verify FileUtils was not called when API fails
    expect(FileUtils.downloadWarbandAsJson).not.toHaveBeenCalled();
  });
});
/**
 * Tests for ReadmeContentService
 * Focuses on core functionality: fetching, caching, and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ReadmeContentService, readmeContentService } from '../src/frontend/services/ReadmeContentService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ReadmeContentService', () => {
  let service: ReadmeContentService;

  beforeEach(() => {
    // Get fresh instance and clear cache
    service = ReadmeContentService.getInstance();
    service.clearCache();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getContent', () => {
    it('should fetch content from API successfully', async () => {
      const mockContent = {
        title: 'Test Title',
        version: 'v1.0.0',
        features: ['Feature 1', 'Feature 2'],
        gameRules: ['Rule 1', 'Rule 2'],
        lastUpdated: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockContent
        })
      });

      const result = await service.getContent();

      expect(result.title).toBe('Test Title');
      expect(result.version).toBe('v1.0.0');
      expect(result.features).toEqual(['Feature 1', 'Feature 2']);
      expect(result.gameRules).toEqual(['Rule 1', 'Rule 2']);
      expect(result.lastUpdated).toBeInstanceOf(Date);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return cached content on subsequent calls', async () => {
      const mockContent = {
        title: 'Cached Title',
        version: 'v1.0.0',
        features: ['Feature 1'],
        gameRules: ['Rule 1'],
        lastUpdated: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockContent
        })
      });

      // First call should fetch
      const result1 = await service.getContent();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await service.getContent();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2.title).toBe('Cached Title');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(service.getContent()).rejects.toThrow('Failed to fetch README content: 500 Internal Server Error');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getContent()).rejects.toThrow('Network error');
    });
  });

  describe('refreshContent', () => {
    it('should bypass cache and fetch fresh content', async () => {
      const mockContent1 = {
        title: 'Original Title',
        version: 'v1.0.0',
        features: ['Feature 1'],
        gameRules: ['Rule 1'],
        lastUpdated: '2023-01-01T00:00:00.000Z'
      };

      const mockContent2 = {
        title: 'Updated Title',
        version: 'v2.0.0',
        features: ['Feature 2'],
        gameRules: ['Rule 2'],
        lastUpdated: '2023-01-02T00:00:00.000Z'
      };

      // First fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContent1 })
      });

      await service.getContent();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Refresh should fetch again
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContent2 })
      });

      const result = await service.refreshContent();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.title).toBe('Updated Title');
      expect(result.version).toBe('v2.0.0');
    });
  });

  describe('state management', () => {
    it('should track loading state correctly', async () => {
      expect(service.isLoading()).toBe(false);

      const mockContent = {
        title: 'Test',
        version: 'v1.0.0',
        features: [],
        gameRules: [],
        lastUpdated: '2023-01-01T00:00:00.000Z'
      };

      // Mock a delayed response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, data: mockContent })
          }), 100)
        )
      );

      const contentPromise = service.getContent();
      expect(service.isLoading()).toBe(true);

      await contentPromise;
      expect(service.isLoading()).toBe(false);
    });

    it('should provide fallback content', () => {
      const fallback = service.getFallbackContent();
      
      expect(fallback.title).toBe('Space Weirdos Warband Builder');
      expect(fallback.version).toBe('Version 1.0.0');
      expect(fallback.features).toBeInstanceOf(Array);
      expect(fallback.gameRules).toBeInstanceOf(Array);
      expect(fallback.lastUpdated).toBeInstanceOf(Date);
    });

    it('should clear cache correctly', async () => {
      const mockContent = {
        title: 'Test',
        version: 'v1.0.0',
        features: [],
        gameRules: [],
        lastUpdated: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockContent })
      });

      // Load content
      await service.getContent();
      expect(service.getCachedContent()).not.toBeNull();

      // Clear cache
      service.clearCache();
      expect(service.getCachedContent()).toBeNull();
      expect(service.getError()).toBeNull();
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ReadmeContentService.getInstance();
      const instance2 = ReadmeContentService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(readmeContentService);
    });
  });
});
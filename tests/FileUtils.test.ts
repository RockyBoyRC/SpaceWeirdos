/**
 * FileUtils Service Tests
 * 
 * Unit tests for the FileUtils service functionality including
 * file validation, filename sanitization, and configuration integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileUtils, FileOperationError } from '../src/frontend/services/FileUtils';

// Mock the frontend config
vi.mock('../src/frontend/config/frontendConfig', () => ({
  getFrontendConfigInstance: () => ({
    api: {
      baseUrl: 'http://localhost:3001/api',
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 10000
    }
  })
}));

describe('FileUtils', () => {
  beforeEach(() => {
    // Reset configuration to defaults before each test
    FileUtils.updateConfig({
      maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['application/json', '.json'],
      maxFilenameLength: 255,
      enableFilenameSanitization: true,
      fileOperationTimeoutMs: 30000
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove dangerous characters from filename', () => {
      const dangerous = 'my<warband>:test/file\\name|?.json';
      const sanitized = FileUtils.sanitizeFilename(dangerous);
      expect(sanitized).toBe('my_warband_test_file_name_.json');
    });

    it('should add .json extension if missing', () => {
      const withoutExtension = 'my-warband';
      const sanitized = FileUtils.sanitizeFilename(withoutExtension);
      expect(sanitized).toBe('my-warband.json');
    });

    it('should preserve .json extension if present', () => {
      const withExtension = 'my-warband.json';
      const sanitized = FileUtils.sanitizeFilename(withExtension);
      expect(sanitized).toBe('my-warband.json');
    });

    it('should handle empty filename', () => {
      const empty = '';
      const sanitized = FileUtils.sanitizeFilename(empty);
      expect(sanitized).toBe('warband.json');
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(300);
      const sanitized = FileUtils.sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized).toMatch(/\.json$/);
    });

    it('should not sanitize when sanitization is disabled', () => {
      FileUtils.updateConfig({ enableFilenameSanitization: false });
      const dangerous = 'my<warband>:test.json';
      const sanitized = FileUtils.sanitizeFilename(dangerous);
      expect(sanitized).toBe('my<warband>:test.json');
    });
  });

  describe('validateFile', () => {
    it('should validate file size within limits', () => {
      const smallFile = new File(['test content'], 'test.json', { 
        type: 'application/json' 
      });
      
      const result = FileUtils.validateFile(smallFile);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files that are too large', () => {
      // Create a mock file that appears large
      const largeFile = new File(['test'], 'large.json', { 
        type: 'application/json' 
      });
      
      // Mock the size property
      Object.defineProperty(largeFile, 'size', {
        value: 20 * 1024 * 1024, // 20MB
        writable: false
      });
      
      const result = FileUtils.validateFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum allowed size');
    });

    it('should validate allowed file types by extension', () => {
      const jsonFile = new File(['{}'], 'test.json', { type: 'text/plain' });
      const result = FileUtils.validateFile(jsonFile);
      expect(result.valid).toBe(true);
    });

    it('should validate allowed file types by MIME type', () => {
      const jsonFile = new File(['{}'], 'test.txt', { type: 'application/json' });
      const result = FileUtils.validateFile(jsonFile);
      expect(result.valid).toBe(true);
    });

    it('should reject disallowed file types', () => {
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = FileUtils.validateFile(textFile);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('File type not allowed');
    });

    it('should reject filenames that are too long', () => {
      const longName = 'a'.repeat(300) + '.json';
      const file = new File(['{}'], longName, { type: 'application/json' });
      
      const result = FileUtils.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Filename too long');
    });

    it('should provide warnings for large files within limits', () => {
      // Create a file with a large size that should trigger warning
      const file = new File(['test'], 'test.json', { type: 'application/json' });
      
      // Mock size to be 85% of max (should trigger warning)
      Object.defineProperty(file, 'size', {
        value: 8.5 * 1024 * 1024, // 8.5MB (85% of 10MB limit, above 80% threshold)
        writable: false,
        configurable: true
      });
      
      const result = FileUtils.validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Large file size');
    });
  });

  describe('downloadWarbandAsJson', () => {
    beforeEach(() => {
      // Mock DOM methods
      global.document = {
        createElement: vi.fn(() => ({
          href: '',
          download: '',
          click: vi.fn(),
        })),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        }
      } as any;

      global.URL = {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn(),
      } as any;

      global.Blob = vi.fn() as any;
    });

    it('should create download for warband data', () => {
      const warband = { name: 'Test Warband', id: '123' };
      
      expect(() => {
        FileUtils.downloadWarbandAsJson(warband, 'test-warband.json');
      }).not.toThrow();
      
      expect(global.Blob).toHaveBeenCalledWith(
        [JSON.stringify(warband, null, 2)],
        { type: 'application/json' }
      );
    });

    it('should handle download errors gracefully', () => {
      // Mock Blob constructor to throw
      global.Blob = vi.fn(() => {
        throw new Error('Blob creation failed');
      }) as any;
      
      const warband = { name: 'Test Warband' };
      
      expect(() => {
        FileUtils.downloadWarbandAsJson(warband);
      }).toThrow(FileOperationError);
    });
  });

  describe('configuration management', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
        allowedFileTypes: ['.json']
      };
      
      FileUtils.updateConfig(newConfig);
      const config = FileUtils.getConfig();
      
      expect(config.maxFileSizeBytes).toBe(5 * 1024 * 1024);
      expect(config.allowedFileTypes).toEqual(['.json']);
    });

    it('should return current configuration', () => {
      const config = FileUtils.getConfig();
      
      expect(config).toHaveProperty('maxFileSizeBytes');
      expect(config).toHaveProperty('allowedFileTypes');
      expect(config).toHaveProperty('maxFilenameLength');
      expect(config).toHaveProperty('enableFilenameSanitization');
      expect(config).toHaveProperty('fileOperationTimeoutMs');
    });
  });
});
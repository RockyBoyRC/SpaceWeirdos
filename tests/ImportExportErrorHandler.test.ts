/**
 * ImportExportErrorHandler Tests
 * 
 * Unit tests for the error handling and classification system
 * for import/export operations.
 */

import { describe, it, expect, vi } from 'vitest';
import { ImportExportErrorHandler, ImportExportError, ValidationError } from '../src/frontend/services/ImportExportErrorHandler';

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

describe('ImportExportErrorHandler', () => {
  describe('classifyError', () => {
    it('should classify network errors correctly', () => {
      const networkError = new TypeError('fetch failed');
      const classification = ImportExportErrorHandler.classifyError(networkError, 'import');
      
      expect(classification.error.type).toBe('NETWORK_ERROR');
      expect(classification.error.retryable).toBe(true);
      expect(classification.error.severity).toBe('medium');
      expect(classification.retryStrategy.shouldRetry).toBe(true);
    });

    it('should classify timeout errors correctly', () => {
      const timeoutError = new Error('Operation timed out');
      const classification = ImportExportErrorHandler.classifyError(timeoutError, 'export');
      
      expect(classification.error.type).toBe('TIMEOUT_ERROR');
      expect(classification.error.retryable).toBe(true);
      expect(classification.retryStrategy.shouldRetry).toBe(true);
      expect(classification.retryStrategy.delayMs).toBeGreaterThan(1000); // Should have longer delay
    });

    it('should classify file operation errors correctly', () => {
      const fileError = new Error('File read failed');
      const classification = ImportExportErrorHandler.classifyError(fileError, 'import');
      
      expect(classification.error.type).toBe('FILE_READ_ERROR');
      expect(classification.error.retryable).toBe(false);
      expect(classification.error.severity).toBe('high');
      expect(classification.retryStrategy.shouldRetry).toBe(false);
    });

    it('should classify JSON parsing errors correctly', () => {
      const jsonError = new SyntaxError('Unexpected token in JSON');
      const classification = ImportExportErrorHandler.classifyError(jsonError, 'import');
      
      expect(classification.error.type).toBe('VALIDATION_ERROR');
      expect(classification.error.retryable).toBe(false);
      expect(classification.error.code).toBe('INVALID_JSON_FORMAT');
    });

    it('should classify server errors correctly', () => {
      const serverError = new Error('500 Internal Server Error');
      const classification = ImportExportErrorHandler.classifyError(serverError, 'export');
      
      expect(classification.error.type).toBe('SERVER_ERROR');
      expect(classification.error.retryable).toBe(true);
      expect(classification.error.severity).toBe('high');
      expect(classification.retryStrategy.shouldRetry).toBe(true);
    });

    it('should classify security errors correctly', () => {
      const securityError = new Error('CORS policy blocked request');
      const classification = ImportExportErrorHandler.classifyError(securityError, 'import');
      
      expect(classification.error.type).toBe('SECURITY_ERROR');
      expect(classification.error.retryable).toBe(false);
      expect(classification.error.severity).toBe('critical');
      expect(classification.retryStrategy.shouldRetry).toBe(false);
    });

    it('should handle unknown errors with fallback classification', () => {
      const unknownError = new Error('Something went wrong');
      const classification = ImportExportErrorHandler.classifyError(unknownError, 'import');
      
      expect(classification.error.type).toBe('UNKNOWN_ERROR');
      expect(classification.error.retryable).toBe(true);
      expect(classification.retryStrategy.maxAttempts).toBe(1); // Limited retries for unknown errors
    });

    it('should include context in error messages', () => {
      const error = new Error('Test error');
      const context = { fileName: 'test.json', fileSize: 1024, step: 'validation' };
      const classification = ImportExportErrorHandler.classifyError(error, 'import', context);
      
      expect(classification.userMessage).toContain('test.json');
      expect(classification.userMessage).toContain('validation');
      expect(classification.technicalMessage).toContain('file: test.json');
      expect(classification.technicalMessage).toContain('size: 1024 bytes');
    });
  });

  describe('categorizeValidationErrors', () => {
    it('should categorize structural validation errors', () => {
      const errors: ValidationError[] = [
        { field: 'name', message: 'Name is required', code: 'REQUIRED_FIELD' },
        { field: 'id', message: 'Invalid type', code: 'INVALID_TYPE' }
      ];
      
      const categorized = ImportExportErrorHandler.categorizeValidationErrors(errors);
      
      expect(categorized.structural).toHaveLength(2);
      expect(categorized.gameData).toHaveLength(0);
      expect(categorized.businessLogic).toHaveLength(0);
    });

    it('should categorize game data validation errors', () => {
      const errors: ValidationError[] = [
        { field: 'weapon', message: 'Weapon not found', code: 'MISSING_WEAPON' },
        { field: 'equipment', message: 'Unknown equipment item', code: 'UNKNOWN_ITEM' }
      ];
      
      const categorized = ImportExportErrorHandler.categorizeValidationErrors(errors);
      
      expect(categorized.gameData).toHaveLength(2);
      expect(categorized.structural).toHaveLength(0);
      expect(categorized.businessLogic).toHaveLength(0);
    });

    it('should categorize business logic validation errors', () => {
      const errors: ValidationError[] = [
        { field: 'cost', message: 'Point limit exceeded', code: 'POINT_LIMIT_EXCEEDED' },
        { field: 'equipment', message: 'Equipment limit exceeded', code: 'EQUIPMENT_LIMIT_EXCEEDED' }
      ];
      
      const categorized = ImportExportErrorHandler.categorizeValidationErrors(errors);
      
      expect(categorized.businessLogic).toHaveLength(2);
      expect(categorized.structural).toHaveLength(0);
      expect(categorized.gameData).toHaveLength(0);
    });

    it('should handle mixed validation error types', () => {
      const errors: ValidationError[] = [
        { field: 'name', message: 'Name is required', code: 'REQUIRED_FIELD' },
        { field: 'weapon', message: 'Weapon not found', code: 'MISSING_WEAPON' },
        { field: 'cost', message: 'Point limit exceeded', code: 'POINT_LIMIT_EXCEEDED' },
        { field: 'other', message: 'Some other error', code: 'OTHER_ERROR' }
      ];
      
      const categorized = ImportExportErrorHandler.categorizeValidationErrors(errors);
      
      expect(categorized.structural).toHaveLength(1);
      expect(categorized.gameData).toHaveLength(1);
      expect(categorized.businessLogic).toHaveLength(1);
      expect(categorized.other).toHaveLength(1);
    });
  });

  describe('generateContextualSuggestions', () => {
    it('should add file size suggestions for timeout errors', () => {
      const error: ImportExportError = {
        type: 'TIMEOUT_ERROR',
        message: 'Operation timed out',
        retryable: true,
        severity: 'medium',
        suggestions: ['Try again later']
      };
      
      const context = { fileSize: 10 * 1024 * 1024 }; // 10MB
      const suggestions = ImportExportErrorHandler.generateContextualSuggestions(error, 'import', context);
      
      expect(suggestions[0]).toContain('smaller file');
      expect(suggestions[0]).toContain('10.0MB');
    });

    it('should add retry count information for network errors', () => {
      const error: ImportExportError = {
        type: 'NETWORK_ERROR',
        message: 'Network failed',
        retryable: true,
        severity: 'medium',
        suggestions: ['Check connection']
      };
      
      const context = { retryCount: 2 };
      const suggestions = ImportExportErrorHandler.generateContextualSuggestions(error, 'import', context);
      
      expect(suggestions[suggestions.length - 1]).toContain('retry attempt 3');
    });

    it('should add version compatibility suggestions for import validation errors', () => {
      const error: ImportExportError = {
        type: 'VALIDATION_ERROR',
        message: 'Validation failed',
        retryable: false,
        severity: 'medium',
        suggestions: ['Check data']
      };
      
      const suggestions = ImportExportErrorHandler.generateContextualSuggestions(error, 'import');
      
      expect(suggestions[suggestions.length - 1]).toContain('compatible version');
    });
  });

  describe('shouldShowTechnicalDetails', () => {
    it('should show technical details for validation errors', () => {
      const validationError: ImportExportError = {
        type: 'VALIDATION_ERROR',
        message: 'Validation failed',
        retryable: false,
        severity: 'medium',
        suggestions: []
      };
      
      expect(ImportExportErrorHandler.shouldShowTechnicalDetails(validationError)).toBe(true);
    });

    it('should show technical details for file read errors', () => {
      const fileError: ImportExportError = {
        type: 'FILE_READ_ERROR',
        message: 'File read failed',
        retryable: false,
        severity: 'high',
        suggestions: []
      };
      
      expect(ImportExportErrorHandler.shouldShowTechnicalDetails(fileError)).toBe(true);
    });

    it('should hide technical details for network errors', () => {
      const networkError: ImportExportError = {
        type: 'NETWORK_ERROR',
        message: 'Network failed',
        retryable: true,
        severity: 'medium',
        suggestions: []
      };
      
      expect(ImportExportErrorHandler.shouldShowTechnicalDetails(networkError)).toBe(false);
    });

    it('should show technical details for low severity errors', () => {
      const lowSeverityError: ImportExportError = {
        type: 'UNKNOWN_ERROR',
        message: 'Minor issue',
        retryable: true,
        severity: 'low',
        suggestions: []
      };
      
      expect(ImportExportErrorHandler.shouldShowTechnicalDetails(lowSeverityError)).toBe(true);
    });
  });
});
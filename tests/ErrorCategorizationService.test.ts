/**
 * Error Categorization Service Tests
 * 
 * Tests for the comprehensive error categorization system including
 * error classification, grouping, and user-friendly message generation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorCategorizationService, ErrorCategory, ErrorSeverity } from '../src/backend/services/ErrorCategorizationService.js';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager.js';

// Mock ConfigurationManager
vi.mock('../src/backend/config/ConfigurationManager.js');

describe('ErrorCategorizationService', () => {
  let service: ErrorCategorizationService;
  let mockConfigManager: vi.Mocked<ConfigurationManager>;

  beforeEach(() => {
    mockConfigManager = {
      getFileOperationConfig: vi.fn().mockReturnValue({
        maxFileSizeBytes: 10 * 1024 * 1024 // 10MB
      })
    } as any;

    // Mock the getInstance method
    vi.mocked(ConfigurationManager.getInstance).mockReturnValue(mockConfigManager);
    
    service = new ErrorCategorizationService();
  });

  describe('categorizeValidationError', () => {
    it('should categorize structural validation errors correctly', () => {
      const error = service.categorizeValidationError(
        'name',
        'WARBAND_NAME_REQUIRED',
        'Warband name is required'
      );

      expect(error.category).toBe(ErrorCategory.STRUCTURE);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.field).toBe('name');
      expect(error.code).toBe('WARBAND_NAME_REQUIRED');
      expect(error.userFriendlyMessage).toBe('Your warband needs a name to be saved.');
      expect(error.suggestions).toContain('Enter a name for your warband in the name field');
      expect(error.retryable).toBe(false);
    });

    it('should categorize business rule validation errors correctly', () => {
      const error = service.categorizeValidationError(
        'equipment',
        'EQUIPMENT_LIMIT_EXCEEDED',
        'Equipment limit exceeded',
        { type: 'leader', limit: 3 }
      );

      expect(error.category).toBe(ErrorCategory.BUSINESS_RULES);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.userFriendlyMessage).toBe('This leader has too much equipment. Maximum 3 items allowed.');
    });

    it('should categorize game data validation errors correctly', () => {
      const error = service.categorizeValidationError(
        'closeCombatWeapons',
        'CLOSE_COMBAT_WEAPON_REQUIRED',
        'Close combat weapon required'
      );

      expect(error.category).toBe(ErrorCategory.GAME_DATA);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.userFriendlyMessage).toBe('Every weirdo must have at least one close combat weapon.');
    });
  });

  describe('categorizeFileError', () => {
    it('should categorize file size errors correctly', () => {
      const error = service.categorizeFileError(
        'FILE_TOO_LARGE',
        'File too large',
        'test.json',
        15 * 1024 * 1024
      );

      expect(error.category).toBe(ErrorCategory.FILE_OPERATION);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.userFriendlyMessage).toBe('File is too large. Maximum size is 10MB.');
      expect(error.suggestions).toContain('Try a smaller file');
      expect(error.retryable).toBe(false);
    });

    it('should categorize invalid file type errors correctly', () => {
      const error = service.categorizeFileError(
        'INVALID_FILE_TYPE',
        'Invalid file type',
        'test.txt'
      );

      expect(error.category).toBe(ErrorCategory.FILE_OPERATION);
      expect(error.userFriendlyMessage).toBe('File type not supported. Please select a JSON file.');
      expect(error.suggestions).toContain('Select a .json file exported from Space Weirdos');
    });
  });

  describe('categorizeNetworkError', () => {
    it('should categorize timeout errors correctly', () => {
      const error = service.categorizeNetworkError(
        'NETWORK_TIMEOUT',
        'Request timed out'
      );

      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.WARNING);
      expect(error.userFriendlyMessage).toBe('The request took too long to complete. Please try again.');
      expect(error.retryable).toBe(true);
    });

    it('should categorize server errors correctly', () => {
      const error = service.categorizeNetworkError(
        'SERVER_ERROR',
        'Internal server error',
        500,
        '/api/import'
      );

      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.userFriendlyMessage).toBe('The server encountered an error. Please try again later.');
      expect(error.retryable).toBe(true);
    });

    it('should categorize connection errors as critical', () => {
      const error = service.categorizeNetworkError(
        'CONNECTION_ERROR',
        'Could not connect'
      );

      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.retryable).toBe(true);
    });
  });

  describe('groupErrors', () => {
    it('should group errors by category correctly', () => {
      const errors = [
        service.categorizeValidationError('name', 'WARBAND_NAME_REQUIRED', 'Name required'),
        service.categorizeFileError('FILE_TOO_LARGE', 'File too large'),
        service.categorizeNetworkError('NETWORK_TIMEOUT', 'Timeout')
      ];

      const grouping = service.groupErrors(errors);

      expect(grouping.byCategory[ErrorCategory.STRUCTURE]).toHaveLength(1);
      expect(grouping.byCategory[ErrorCategory.FILE_OPERATION]).toHaveLength(1);
      expect(grouping.byCategory[ErrorCategory.NETWORK]).toHaveLength(1);
    });

    it('should group errors by severity correctly', () => {
      const errors = [
        service.categorizeValidationError('name', 'WARBAND_NAME_REQUIRED', 'Name required'), // CRITICAL
        service.categorizeValidationError('equipment', 'EQUIPMENT_LIMIT_EXCEEDED', 'Limit exceeded'), // ERROR
        service.categorizeNetworkError('NETWORK_TIMEOUT', 'Timeout') // WARNING
      ];

      const grouping = service.groupErrors(errors);

      expect(grouping.bySeverity[ErrorSeverity.CRITICAL]).toHaveLength(1);
      expect(grouping.bySeverity[ErrorSeverity.ERROR]).toHaveLength(1);
      expect(grouping.bySeverity[ErrorSeverity.WARNING]).toHaveLength(1);
      expect(grouping.criticalErrors).toHaveLength(1);
    });

    it('should group errors by field correctly', () => {
      const errors = [
        service.categorizeValidationError('name', 'WARBAND_NAME_REQUIRED', 'Name required'),
        service.categorizeValidationError('name', 'INVALID_POINT_LIMIT', 'Invalid limit')
      ];

      const grouping = service.groupErrors(errors);

      expect(grouping.byField['name']).toHaveLength(2);
    });

    it('should identify retryable errors correctly', () => {
      const errors = [
        service.categorizeValidationError('name', 'WARBAND_NAME_REQUIRED', 'Name required'), // not retryable
        service.categorizeNetworkError('NETWORK_TIMEOUT', 'Timeout') // retryable
      ];

      const grouping = service.groupErrors(errors);

      expect(grouping.retryableErrors).toHaveLength(1);
      expect(grouping.retryableErrors[0].code).toBe('NETWORK_TIMEOUT');
    });
  });

  describe('generateErrorSummary', () => {
    it('should generate summary for no errors', () => {
      const summary = service.generateErrorSummary([]);
      expect(summary).toBe('No errors found.');
    });

    it('should generate summary for mixed error types', () => {
      const errors = [
        service.categorizeValidationError('name', 'WARBAND_NAME_REQUIRED', 'Name required'), // CRITICAL
        service.categorizeValidationError('equipment', 'EQUIPMENT_LIMIT_EXCEEDED', 'Limit exceeded'), // ERROR
        service.categorizeNetworkError('NETWORK_TIMEOUT', 'Timeout') // WARNING
      ];

      const summary = service.generateErrorSummary(errors);

      expect(summary).toContain('1 critical error');
      expect(summary).toContain('1 error');
      expect(summary).toContain('1 warning');
      expect(summary).toContain('found.');
    });

    it('should handle plural forms correctly', () => {
      const errors = [
        service.categorizeValidationError('name1', 'WARBAND_NAME_REQUIRED', 'Name required'),
        service.categorizeValidationError('name2', 'WARBAND_NAME_REQUIRED', 'Name required')
      ];

      const summary = service.generateErrorSummary(errors);

      expect(summary).toContain('2 critical errors');
      expect(summary).toContain('found.');
    });
  });
});
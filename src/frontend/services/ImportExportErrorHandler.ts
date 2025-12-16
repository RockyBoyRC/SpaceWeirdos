/**
 * Import/Export Error Handler
 * 
 * Comprehensive error handling and classification system for import/export operations.
 * Provides error categorization, retry mechanism determination, and user-friendly
 * error messages for different failure types.
 * 
 * Enhanced with comprehensive error categorization and field-specific reporting.
 * Requirements: 7.3, 7.4, 8.2
 */

import { getFrontendConfigInstance } from '../config/frontendConfig';

/**
 * Import/Export error types for classification
 */
export type ImportExportErrorType = 
  | 'NETWORK_ERROR'
  | 'FILE_READ_ERROR'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'TIMEOUT_ERROR'
  | 'SECURITY_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Enhanced error categories for comprehensive classification
 */
export enum ErrorCategory {
  STRUCTURE = 'structure',
  GAME_DATA = 'game_data',
  BUSINESS_RULES = 'business_rules',
  NETWORK = 'network',
  FILE_OPERATION = 'file_operation',
  VALIDATION = 'validation',
  SECURITY = 'security',
  SYSTEM = 'system'
}

/**
 * Import/Export error interface
 */
export interface ImportExportError {
  /** Error type for classification */
  type: ImportExportErrorType;
  /** Error category for grouping */
  category: ErrorCategory;
  /** Primary error message */
  message: string;
  /** User-friendly message */
  userFriendlyMessage: string;
  /** Detailed error information */
  details?: string;
  /** Validation errors if applicable */
  validationErrors?: ValidationError[];
  /** Whether this error can be retried */
  retryable: boolean;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Suggested actions for the user */
  suggestions: string[];
  /** Technical error code for debugging */
  code?: string;
  /** Field that caused the error (for validation errors) */
  field?: string;
  /** Original error object */
  originalError?: Error;
}

/**
 * Validation error interface
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  /** Validation error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
  /** Expected value or format */
  expected?: string;
  /** Actual received value */
  received?: unknown;
}

/**
 * Retry strategy interface
 */
export interface RetryStrategy {
  /** Whether retry is recommended */
  shouldRetry: boolean;
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Delay between retries in milliseconds */
  delayMs: number;
  /** Whether to use exponential backoff */
  useExponentialBackoff: boolean;
  /** Reason why retry is or isn't recommended */
  reason: string;
}

/**
 * Error classification result
 */
export interface ErrorClassification {
  /** Classified error information */
  error: ImportExportError;
  /** Retry strategy for this error */
  retryStrategy: RetryStrategy;
  /** User-friendly message */
  userMessage: string;
  /** Technical message for developers */
  technicalMessage: string;
}

/**
 * Error grouping result for comprehensive categorization
 */
export interface ErrorGrouping {
  /** Errors grouped by category */
  byCategory: Record<ErrorCategory, ImportExportError[]>;
  /** Errors grouped by severity */
  bySeverity: Record<ErrorSeverity, ImportExportError[]>;
  /** Errors grouped by field (for validation errors) */
  byField: Record<string, ImportExportError[]>;
  /** All retryable errors */
  retryableErrors: ImportExportError[];
  /** All critical errors requiring immediate attention */
  criticalErrors: ImportExportError[];
  /** Summary statistics */
  summary: {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
  };
}

/**
 * Import/Export Error Handler class
 */
export class ImportExportErrorHandler {
  private static frontendConfig = getFrontendConfigInstance();

  /**
   * Classifies an error and provides comprehensive error information
   * 
   * @param error - The error to classify
   * @param operation - The operation that failed ('import' | 'export')
   * @param context - Additional context about the operation
   * @returns Classified error with retry strategy and messages
   */
  static classifyError(
    error: unknown, 
    operation: 'import' | 'export',
    context?: { fileName?: string; fileSize?: number; step?: string }
  ): ErrorClassification {
    const importExportError = this.convertToImportExportError(error, operation, context);
    const retryStrategy = this.determineRetryStrategy(importExportError);
    const userMessage = this.generateUserMessage(importExportError, operation, context);
    const technicalMessage = this.generateTechnicalMessage(importExportError, context);

    return {
      error: importExportError,
      retryStrategy,
      userMessage,
      technicalMessage
    };
  }

  /**
   * Groups multiple errors by category, severity, and field
   * Requirements: 7.3
   */
  static groupErrors(errors: ImportExportError[]): ErrorGrouping {
    const byCategory: Record<ErrorCategory, ImportExportError[]> = {
      [ErrorCategory.STRUCTURE]: [],
      [ErrorCategory.GAME_DATA]: [],
      [ErrorCategory.BUSINESS_RULES]: [],
      [ErrorCategory.NETWORK]: [],
      [ErrorCategory.FILE_OPERATION]: [],
      [ErrorCategory.VALIDATION]: [],
      [ErrorCategory.SECURITY]: [],
      [ErrorCategory.SYSTEM]: []
    };

    const bySeverity: Record<ErrorSeverity, ImportExportError[]> = {
      low: [],
      medium: [],
      high: [],
      critical: []
    };

    const byField: Record<string, ImportExportError[]> = {};
    const retryableErrors: ImportExportError[] = [];
    const criticalErrors: ImportExportError[] = [];

    // Categorize each error
    errors.forEach(error => {
      // Group by category
      byCategory[error.category].push(error);

      // Group by severity
      bySeverity[error.severity].push(error);

      // Group by field (for validation errors)
      if (error.field) {
        if (!byField[error.field]) {
          byField[error.field] = [];
        }
        byField[error.field].push(error);
      }

      // Collect retryable errors
      if (error.retryable) {
        retryableErrors.push(error);
      }

      // Collect critical errors
      if (error.severity === 'critical') {
        criticalErrors.push(error);
      }
    });

    // Generate summary statistics
    const summary = {
      total: errors.length,
      byCategory: Object.fromEntries(
        Object.entries(byCategory).map(([category, categoryErrors]) => [
          category,
          categoryErrors.length
        ])
      ) as Record<ErrorCategory, number>,
      bySeverity: Object.fromEntries(
        Object.entries(bySeverity).map(([severity, severityErrors]) => [
          severity,
          severityErrors.length
        ])
      ) as Record<ErrorSeverity, number>
    };

    return {
      byCategory,
      bySeverity,
      byField,
      retryableErrors,
      criticalErrors,
      summary
    };
  }

  /**
   * Generates a comprehensive error summary for user display
   * Requirements: 7.3, 7.4
   */
  static generateErrorSummary(errors: ImportExportError[]): string {
    if (errors.length === 0) {
      return 'No errors found.';
    }

    const grouping = this.groupErrors(errors);
    const { summary } = grouping;

    let summaryText = '';

    // Add critical errors first
    if (summary.bySeverity.critical > 0) {
      summaryText += `${summary.bySeverity.critical} critical error${summary.bySeverity.critical === 1 ? '' : 's'}`;
    }

    // Add high severity errors
    if (summary.bySeverity.high > 0) {
      if (summaryText) summaryText += ', ';
      summaryText += `${summary.bySeverity.high} error${summary.bySeverity.high === 1 ? '' : 's'}`;
    }

    // Add medium severity errors
    if (summary.bySeverity.medium > 0) {
      if (summaryText) summaryText += ', ';
      summaryText += `${summary.bySeverity.medium} warning${summary.bySeverity.medium === 1 ? '' : 's'}`;
    }

    // Add category breakdown for context
    const categoryBreakdown: string[] = [];
    if (summary.byCategory[ErrorCategory.STRUCTURE] > 0) {
      categoryBreakdown.push(`${summary.byCategory[ErrorCategory.STRUCTURE]} structural`);
    }
    if (summary.byCategory[ErrorCategory.GAME_DATA] > 0) {
      categoryBreakdown.push(`${summary.byCategory[ErrorCategory.GAME_DATA]} game data`);
    }
    if (summary.byCategory[ErrorCategory.BUSINESS_RULES] > 0) {
      categoryBreakdown.push(`${summary.byCategory[ErrorCategory.BUSINESS_RULES]} rule violation`);
    }

    if (categoryBreakdown.length > 0) {
      summaryText += ` (${categoryBreakdown.join(', ')})`;
    }

    return summaryText + ' found.';
  }

  /**
   * Converts various error types to ImportExportError
   */
  private static convertToImportExportError(
    error: unknown, 
    operation: 'import' | 'export',
    context?: { fileName?: string; fileSize?: number; step?: string }
  ): ImportExportError {
    // Handle network errors (fetch failures, timeouts)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'NETWORK_ERROR',
        category: ErrorCategory.NETWORK,
        message: 'Network connection failed',
        userFriendlyMessage: 'Could not connect to the server. Please check your internet connection.',
        details: error.message,
        retryable: true,
        severity: 'medium',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the problem persists'
        ],
        code: 'NETWORK_FETCH_FAILED',
        originalError: error
      };
    }

    // Handle timeout errors
    if (error instanceof Error && (
      error.message.includes('timeout') || 
      error.message.includes('timed out') ||
      error.name === 'TimeoutError'
    )) {
      return {
        type: 'TIMEOUT_ERROR',
        category: ErrorCategory.NETWORK,
        message: 'Operation timed out',
        userFriendlyMessage: 'The request took too long to complete. Please try again.',
        details: error.message,
        retryable: true,
        severity: 'medium',
        suggestions: this.generateTimeoutSuggestions(context),
        code: 'OPERATION_TIMEOUT',
        originalError: error
      };
    }

    // Handle file operation errors
    if (error instanceof Error && (
      error.message.includes('file') ||
      error.message.includes('File') ||
      error.name === 'FileOperationError'
    )) {
      return {
        type: 'FILE_READ_ERROR',
        category: ErrorCategory.FILE_OPERATION,
        message: 'File operation failed',
        userFriendlyMessage: 'Could not read the selected file. It may be corrupted or inaccessible.',
        details: error.message,
        retryable: false,
        severity: 'high',
        suggestions: [
          'Ensure the file is not corrupted',
          'Try selecting a different file',
          'Check file permissions'
        ],
        code: 'FILE_OPERATION_FAILED',
        originalError: error
      };
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        type: 'VALIDATION_ERROR',
        category: ErrorCategory.STRUCTURE,
        message: 'Invalid file format',
        userFriendlyMessage: 'File contains invalid JSON data and cannot be imported.',
        details: 'The selected file does not contain valid JSON data',
        retryable: false,
        severity: 'high',
        suggestions: [
          'Ensure the file is a valid JSON export',
          'Try exporting the warband again',
          'Check the file was not modified after export'
        ],
        code: 'INVALID_JSON_FORMAT',
        originalError: error
      };
    }

    // Handle validation errors (from API responses)
    if (error instanceof Error && error.message.includes('validation')) {
      return {
        type: 'VALIDATION_ERROR',
        category: ErrorCategory.VALIDATION,
        message: 'Data validation failed',
        userFriendlyMessage: 'The warband data contains errors that prevent import.',
        details: error.message,
        retryable: false,
        severity: 'medium',
        suggestions: [
          'Check the warband data for missing or invalid fields',
          'Ensure all equipment and weapons exist in the current game data',
          'Try importing a different warband file'
        ],
        code: 'VALIDATION_FAILED',
        originalError: error
      };
    }

    // Handle server errors (HTTP 5xx)
    if (error instanceof Error && (
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504') ||
      error.message.includes('Internal Server Error')
    )) {
      return {
        type: 'SERVER_ERROR',
        category: ErrorCategory.SYSTEM,
        message: 'Server error occurred',
        userFriendlyMessage: 'The server encountered an error. Please try again later.',
        details: error.message,
        retryable: true,
        severity: 'high',
        suggestions: this.generateServerErrorSuggestions(operation),
        code: 'SERVER_ERROR',
        originalError: error
      };
    }

    // Handle security errors
    if (error instanceof Error && (
      error.message.includes('security') ||
      error.message.includes('Security') ||
      error.message.includes('CORS') ||
      error.message.includes('blocked')
    )) {
      return {
        type: 'SECURITY_ERROR',
        category: ErrorCategory.SECURITY,
        message: 'Security restriction encountered',
        userFriendlyMessage: 'Security restriction encountered. This may be due to browser security settings.',
        details: error.message,
        retryable: false,
        severity: 'critical',
        suggestions: [
          'This may be due to browser security restrictions',
          'Try using a different browser',
          'Contact support for assistance'
        ],
        code: 'SECURITY_RESTRICTION',
        originalError: error
      };
    }

    // Handle unknown errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      type: 'UNKNOWN_ERROR',
      category: ErrorCategory.SYSTEM,
      message: 'An unexpected error occurred',
      userFriendlyMessage: 'An unexpected error occurred. Please try again.',
      details: errorMessage,
      retryable: true,
      severity: 'medium',
      suggestions: [
        'Try the operation again',
        'Refresh the page and try again',
        'Contact support if the problem persists'
      ],
      code: 'UNKNOWN_ERROR',
      originalError: error instanceof Error ? error : undefined
    };
  }

  /**
   * Determines the appropriate retry strategy for an error
   */
  private static determineRetryStrategy(error: ImportExportError): RetryStrategy {
    const apiConfig = this.frontendConfig.api;

    switch (error.type) {
      case 'NETWORK_ERROR':
        return {
          shouldRetry: true,
          maxAttempts: apiConfig.maxRetries,
          delayMs: apiConfig.retryDelayMs,
          useExponentialBackoff: true,
          reason: 'Network errors are often temporary and may succeed on retry'
        };

      case 'TIMEOUT_ERROR':
        return {
          shouldRetry: true,
          maxAttempts: Math.max(2, Math.floor(apiConfig.maxRetries / 2)),
          delayMs: apiConfig.retryDelayMs * 2,
          useExponentialBackoff: true,
          reason: 'Timeout errors may succeed with longer delays between attempts'
        };

      case 'SERVER_ERROR':
        return {
          shouldRetry: true,
          maxAttempts: apiConfig.maxRetries,
          delayMs: apiConfig.retryDelayMs * 1.5,
          useExponentialBackoff: true,
          reason: 'Server errors are often temporary and may resolve quickly'
        };

      case 'FILE_READ_ERROR':
      case 'VALIDATION_ERROR':
      case 'SECURITY_ERROR':
        return {
          shouldRetry: false,
          maxAttempts: 0,
          delayMs: 0,
          useExponentialBackoff: false,
          reason: 'These errors require user action and will not resolve with retry'
        };

      case 'UNKNOWN_ERROR':
        return {
          shouldRetry: true,
          maxAttempts: 1, // Only one retry for unknown errors
          delayMs: apiConfig.retryDelayMs,
          useExponentialBackoff: false,
          reason: 'Unknown errors may be temporary, but limit retries to avoid loops'
        };

      default:
        return {
          shouldRetry: false,
          maxAttempts: 0,
          delayMs: 0,
          useExponentialBackoff: false,
          reason: 'Default strategy for unhandled error types'
        };
    }
  }

  /**
   * Generates a user-friendly error message with context-aware suggestions
   * Requirements: 7.4, 7.5
   */
  private static generateUserMessage(
    error: ImportExportError, 
    operation: 'import' | 'export',
    context?: { fileName?: string; fileSize?: number; step?: string }
  ): string {
    const operationText = operation === 'import' ? 'importing' : 'exporting';
    const fileText = context?.fileName ? ` "${context.fileName}"` : '';
    const stepText = context?.step ? ` during ${context.step}` : '';

    // Generate context-aware base message
    let baseMessage = this.generateContextAwareMessage(error, operation, context);

    // Add file size context for relevant errors
    if (error.type === 'FILE_READ_ERROR' && context?.fileSize) {
      const sizeMB = (context.fileSize / (1024 * 1024)).toFixed(1);
      baseMessage += ` (File size: ${sizeMB}MB)`;
    }

    // Add step context if available
    if (stepText) {
      baseMessage += stepText;
    }

    // Add primary suggestion with context
    const contextualSuggestions = this.generateContextualSuggestions(error, operation, context);
    if (contextualSuggestions.length > 0) {
      baseMessage += `. ${contextualSuggestions[0]}`;
    }

    return baseMessage;
  }

  /**
   * Generates context-aware error messages based on error type and operation
   * Requirements: 7.4, 7.5
   */
  private static generateContextAwareMessage(
    error: ImportExportError,
    operation: 'import' | 'export',
    context?: { fileName?: string; fileSize?: number; step?: string }
  ): string {
    const operationText = operation === 'import' ? 'importing' : 'exporting';
    const fileText = context?.fileName ? ` "${context.fileName}"` : '';

    switch (error.type) {
      case 'NETWORK_ERROR':
        return `Unable to connect to server while ${operationText}${fileText}`;
      
      case 'TIMEOUT_ERROR':
        if (context?.fileSize && context.fileSize > 5 * 1024 * 1024) { // > 5MB
          return `${operationText.charAt(0).toUpperCase() + operationText.slice(1)} timed out - large file may need more time${fileText}`;
        }
        return `${operationText.charAt(0).toUpperCase() + operationText.slice(1)} timed out${fileText}`;
      
      case 'SERVER_ERROR':
        return `Server encountered an error while ${operationText}${fileText}`;
      
      case 'FILE_READ_ERROR':
        if (operation === 'import') {
          return `Cannot read the selected file${fileText}`;
        }
        return `Cannot create export file${fileText}`;
      
      case 'VALIDATION_ERROR':
        if (operation === 'import') {
          return `Warband data validation failed${fileText}`;
        }
        return `Export data validation failed${fileText}`;
      
      case 'SECURITY_ERROR':
        return `Security restriction encountered while ${operationText}${fileText}`;
      
      default:
        return `Failed ${operationText}${fileText}: ${error.message}`;
    }
  }

  /**
   * Generates specific suggestions for timeout and server errors
   * Requirements: 7.4, 7.5
   */
  private static generateTimeoutSuggestions(context?: { fileSize?: number }): string[] {
    const suggestions = [
      'Try again - the server may be temporarily busy',
      'Check your internet connection speed'
    ];

    if (context?.fileSize) {
      const sizeMB = (context.fileSize / (1024 * 1024)).toFixed(1);
      if (context.fileSize > 10 * 1024 * 1024) { // > 10MB
        suggestions.unshift(`Consider using a smaller warband file (current: ${sizeMB}MB)`);
      } else if (context.fileSize > 5 * 1024 * 1024) { // > 5MB
        suggestions.unshift(`Large file detected (${sizeMB}MB) - this may take longer than usual`);
      }
    }

    suggestions.push('Contact support if timeouts persist');
    return suggestions;
  }

  /**
   * Generates specific suggestions for server errors
   * Requirements: 7.4, 7.5
   */
  private static generateServerErrorSuggestions(operation: 'import' | 'export'): string[] {
    const suggestions = [
      'The server may be temporarily unavailable',
      'Try again in a few moments'
    ];

    if (operation === 'import') {
      suggestions.push('Ensure your warband file is from a compatible version');
    } else {
      suggestions.push('Your warband data may be too complex for export');
    }

    suggestions.push('Contact support if the problem persists');
    return suggestions;
  }

  /**
   * Generates a technical error message for debugging
   */
  private static generateTechnicalMessage(
    error: ImportExportError,
    context?: { fileName?: string; fileSize?: number; step?: string }
  ): string {
    let message = `[${error.code || error.type}] ${error.message}`;
    
    if (error.details) {
      message += ` | Details: ${error.details}`;
    }

    if (context) {
      const contextParts = [];
      if (context.fileName) contextParts.push(`file: ${context.fileName}`);
      if (context.fileSize) contextParts.push(`size: ${context.fileSize} bytes`);
      if (context.step) contextParts.push(`step: ${context.step}`);
      
      if (contextParts.length > 0) {
        message += ` | Context: ${contextParts.join(', ')}`;
      }
    }

    if (error.originalError && error.originalError.stack) {
      message += ` | Stack: ${error.originalError.stack}`;
    }

    return message;
  }

  /**
   * Categorizes validation errors by type
   */
  static categorizeValidationErrors(errors: ValidationError[]): {
    structural: ValidationError[];
    gameData: ValidationError[];
    businessLogic: ValidationError[];
    other: ValidationError[];
  } {
    const categorized = {
      structural: [] as ValidationError[],
      gameData: [] as ValidationError[],
      businessLogic: [] as ValidationError[],
      other: [] as ValidationError[]
    };

    for (const error of errors) {
      if (this.isStructuralError(error)) {
        categorized.structural.push(error);
      } else if (this.isBusinessLogicError(error)) {
        categorized.businessLogic.push(error);
      } else if (this.isGameDataError(error)) {
        categorized.gameData.push(error);
      } else {
        categorized.other.push(error);
      }
    }

    return categorized;
  }

  /**
   * Checks if a validation error is structural (missing fields, wrong types)
   */
  private static isStructuralError(error: ValidationError): boolean {
    const structuralCodes = [
      'MISSING_FIELD',
      'INVALID_TYPE',
      'INVALID_FORMAT',
      'REQUIRED_FIELD',
      'INVALID_JSON_FORMAT'
    ];
    
    return structuralCodes.includes(error.code) ||
           error.message.toLowerCase().includes('missing') ||
           error.message.toLowerCase().includes('required') ||
           error.message.toLowerCase().includes('invalid type');
  }

  /**
   * Checks if a validation error is related to game data references
   */
  private static isGameDataError(error: ValidationError): boolean {
    const gameDataCodes = [
      'MISSING_WEAPON',
      'MISSING_EQUIPMENT',
      'MISSING_ABILITY',
      'INVALID_REFERENCE',
      'UNKNOWN_ITEM'
    ];
    
    return gameDataCodes.includes(error.code) ||
           error.message.toLowerCase().includes('weapon') ||
           error.message.toLowerCase().includes('equipment') ||
           error.message.toLowerCase().includes('ability') ||
           error.message.toLowerCase().includes('not found');
  }

  /**
   * Checks if a validation error is related to business logic
   */
  private static isBusinessLogicError(error: ValidationError): boolean {
    const businessLogicCodes = [
      'POINT_LIMIT_EXCEEDED',
      'EQUIPMENT_LIMIT_EXCEEDED',
      'INVALID_COMBINATION',
      'RULE_VIOLATION'
    ];
    
    return businessLogicCodes.includes(error.code) ||
           error.message.toLowerCase().includes('limit exceeded') ||
           error.message.toLowerCase().includes('points') ||
           error.message.toLowerCase().includes('exceeded');
  }

  /**
   * Generates user-friendly suggestions based on error type and context
   */
  static generateContextualSuggestions(
    error: ImportExportError,
    operation: 'import' | 'export',
    context?: { fileName?: string; fileSize?: number; retryCount?: number }
  ): string[] {
    const suggestions = [...error.suggestions];

    // Add context-specific suggestions
    if (error.type === 'TIMEOUT_ERROR' && context?.fileSize) {
      const sizeMB = (context.fileSize / (1024 * 1024)).toFixed(1);
      if (context.fileSize > 5 * 1024 * 1024) { // > 5MB
        suggestions.unshift(`Try with a smaller file (current: ${sizeMB}MB)`);
      }
    }

    if (error.type === 'NETWORK_ERROR' && context?.retryCount !== undefined && context.retryCount >= 0) {
      suggestions.push(`This is retry attempt ${context.retryCount + 1}`);
    }

    if (operation === 'import' && error.type === 'VALIDATION_ERROR') {
      suggestions.push('Check that the file was exported from a compatible version');
    }

    return suggestions;
  }

  /**
   * Determines if an error should show detailed technical information to the user
   */
  static shouldShowTechnicalDetails(error: ImportExportError): boolean {
    // Show technical details for validation errors (users can fix these)
    // Hide technical details for network/server errors (users can't fix these)
    return error.type === 'VALIDATION_ERROR' || 
           error.type === 'FILE_READ_ERROR' ||
           error.severity === 'low';
  }

  /**
   * Creates user-friendly error messages that hide technical implementation details
   * Requirements: 7.4, 7.5
   */
  static createUserFriendlyMessage(
    error: ImportExportError,
    operation: 'import' | 'export',
    context?: { fileName?: string; fileSize?: number; retryCount?: number }
  ): {
    title: string;
    message: string;
    suggestions: string[];
    showTechnicalDetails: boolean;
    canRetry: boolean;
  } {
    const title = this.generateErrorTitle(error, operation);
    const message = this.generateContextAwareMessage(error, operation, context);
    const suggestions = this.generateContextualSuggestions(error, operation, context);
    const showTechnicalDetails = this.shouldShowTechnicalDetails(error);
    const canRetry = error.retryable;

    return {
      title,
      message,
      suggestions,
      showTechnicalDetails,
      canRetry
    };
  }

  /**
   * Generates appropriate error titles for different error types
   * Requirements: 7.4
   */
  private static generateErrorTitle(error: ImportExportError, operation: 'import' | 'export'): string {
    const operationText = operation === 'import' ? 'Import' : 'Export';
    
    switch (error.type) {
      case 'NETWORK_ERROR':
        return 'Connection Problem';
      case 'TIMEOUT_ERROR':
        return `${operationText} Timed Out`;
      case 'SERVER_ERROR':
        return 'Server Unavailable';
      case 'FILE_READ_ERROR':
        return operation === 'import' ? 'Cannot Read File' : 'Cannot Create File';
      case 'VALIDATION_ERROR':
        return 'Invalid Warband Data';
      case 'SECURITY_ERROR':
        return 'Security Restriction';
      default:
        return `${operationText} Failed`;
    }
  }

  /**
   * Generates contextual error messages for different scenarios
   * Requirements: 7.4, 7.5
   */
  static generateContextualErrorMessage(
    errorType: ImportExportErrorType,
    operation: 'import' | 'export',
    context?: {
      fileName?: string;
      fileSize?: number;
      retryCount?: number;
      validationErrors?: ValidationError[];
    }
  ): string {
    const operationText = operation === 'import' ? 'importing' : 'exporting';
    
    switch (errorType) {
      case 'NETWORK_ERROR':
        if (context?.retryCount && context.retryCount > 0) {
          return `Still having trouble connecting to the server (attempt ${context.retryCount + 1}). Please check your internet connection.`;
        }
        return 'Cannot connect to the server. Please check your internet connection and try again.';
      
      case 'TIMEOUT_ERROR':
        if (context?.fileSize && context.fileSize > 10 * 1024 * 1024) {
          const sizeMB = (context.fileSize / (1024 * 1024)).toFixed(1);
          return `The operation timed out while processing your ${sizeMB}MB file. Large files may need more time to process.`;
        }
        return `The ${operation} operation took too long to complete. This might be due to server load or network conditions.`;
      
      case 'SERVER_ERROR':
        return `The server encountered an unexpected problem while ${operationText} your warband. This is usually temporary.`;
      
      case 'FILE_READ_ERROR':
        if (operation === 'import') {
          return 'The selected file cannot be read. It may be corrupted, in the wrong format, or inaccessible.';
        }
        return 'Cannot create the export file. This may be due to browser restrictions or insufficient storage.';
      
      case 'VALIDATION_ERROR':
        if (context?.validationErrors && context.validationErrors.length > 0) {
          const errorCount = context.validationErrors.length;
          return `Found ${errorCount} validation error${errorCount === 1 ? '' : 's'} in the warband data. Please review and correct the issues.`;
        }
        return 'The warband data contains errors that prevent it from being processed correctly.';
      
      case 'SECURITY_ERROR':
        return 'Your browser\'s security settings are preventing this operation. This is usually due to file access restrictions.';
      
      default:
        return `An unexpected error occurred while ${operationText} your warband.`;
    }
  }
}
/**
 * Configuration Error Classes
 * 
 * This module defines structured error classes for configuration-related errors.
 * These errors provide detailed information for debugging and user feedback.
 */

/**
 * Base configuration error class
 * Provides structured error information with error codes and suggestions
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly field?: string,
    public readonly expectedType?: string,
    public readonly receivedValue?: unknown,
    public readonly suggestions?: string[]
  ) {
    super(message);
    this.name = 'ConfigurationError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }

  /**
   * Creates a formatted error message with all available details
   */
  getDetailedMessage(): string {
    let message = this.message;
    
    if (this.field) {
      message += ` (Field: ${this.field})`;
    }
    
    if (this.expectedType && this.receivedValue !== undefined) {
      message += ` Expected: ${this.expectedType}, Received: ${String(this.receivedValue)}`;
    }
    
    if (this.suggestions && this.suggestions.length > 0) {
      message += `\nSuggestions:\n${this.suggestions.map(s => `  - ${s}`).join('\n')}`;
    }
    
    return message;
  }
}

/**
 * Environment variable error class
 * Thrown when required environment variables are missing or invalid
 */
export class EnvironmentError extends ConfigurationError {
  constructor(
    message: string,
    public readonly missingVariables: string[] = [],
    public readonly invalidVariables: Array<{ name: string; value: unknown; expectedType: string }> = []
  ) {
    const suggestions: string[] = [];
    
    // Add suggestions for missing variables
    missingVariables.forEach(variable => {
      suggestions.push(`Set ${variable} environment variable`);
    });
    
    // Add suggestions for invalid variables
    invalidVariables.forEach(({ name, expectedType }) => {
      suggestions.push(`Set ${name} to a valid ${expectedType} value`);
    });
    
    super(message, 'ENVIRONMENT_ERROR', undefined, undefined, undefined, suggestions);
    this.name = 'EnvironmentError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EnvironmentError.prototype);
  }

  /**
   * Creates an EnvironmentError for missing required variables
   */
  static forMissingVariables(variables: string[]): EnvironmentError {
    const message = `Missing required environment variables: ${variables.join(', ')}`;
    return new EnvironmentError(message, variables);
  }

  /**
   * Creates an EnvironmentError for invalid variable types
   */
  static forInvalidTypes(
    invalidVars: Array<{ name: string; value: unknown; expectedType: string }>
  ): EnvironmentError {
    const varNames = invalidVars.map(v => v.name).join(', ');
    const message = `Invalid environment variable types: ${varNames}`;
    return new EnvironmentError(message, [], invalidVars);
  }
}

/**
 * Validation error class
 * Thrown when configuration validation fails
 */
export class ValidationError extends ConfigurationError {
  constructor(
    field: string,
    message: string,
    expectedType?: string,
    receivedValue?: unknown,
    suggestions?: string[]
  ) {
    const fullMessage = `Configuration validation failed for ${field}: ${message}`;
    super(fullMessage, 'VALIDATION_ERROR', field, expectedType, receivedValue, suggestions);
    this.name = 'ValidationError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Creates a ValidationError for type mismatches
   */
  static forTypeMismatch(
    field: string,
    expectedType: string,
    receivedValue: unknown
  ): ValidationError {
    const message = `Expected ${expectedType} but received ${typeof receivedValue}`;
    const suggestions = [`Ensure ${field} is a valid ${expectedType}`];
    return new ValidationError(field, message, expectedType, receivedValue, suggestions);
  }

  /**
   * Creates a ValidationError for out-of-range values
   */
  static forOutOfRange(
    field: string,
    value: number,
    min: number,
    max: number
  ): ValidationError {
    const message = `Value ${value} is out of range [${min}, ${max}]`;
    const suggestions = [`Set ${field} to a value between ${min} and ${max}`];
    return new ValidationError(field, message, `number (${min}-${max})`, value, suggestions);
  }

  /**
   * Creates a ValidationError for invalid enum values
   */
  static forInvalidEnum(
    field: string,
    value: unknown,
    validValues: readonly string[]
  ): ValidationError {
    const message = `Invalid value "${String(value)}", must be one of: ${validValues.join(', ')}`;
    const suggestions = [`Set ${field} to one of: ${validValues.join(', ')}`];
    return new ValidationError(field, message, `enum (${validValues.join('|')})`, value, suggestions);
  }
}

/**
 * Migration error class
 * Thrown when configuration migration fails
 */
export class MigrationError extends ConfigurationError {
  constructor(
    message: string,
    public readonly fromVersion: string,
    public readonly toVersion: string,
    public readonly migrationStep?: string
  ) {
    const fullMessage = `Configuration migration failed from ${fromVersion} to ${toVersion}: ${message}`;
    const suggestions = [
      'Check the configuration format matches the expected version',
      'Manually update the configuration to the new format',
      'Contact support if the migration continues to fail'
    ];
    
    super(fullMessage, 'MIGRATION_ERROR', migrationStep, undefined, undefined, suggestions);
    this.name = 'MigrationError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MigrationError.prototype);
  }
}

/**
 * Loading error class
 * Thrown when configuration loading fails
 */
export class LoadingError extends ConfigurationError {
  constructor(
    message: string,
    public readonly source: string,
    public readonly cause?: Error
  ) {
    const fullMessage = `Configuration loading failed from ${source}: ${message}`;
    const suggestions = [
      'Check that the configuration source is accessible',
      'Verify the configuration format is valid',
      'Ensure all required permissions are granted'
    ];
    
    super(fullMessage, 'LOADING_ERROR', source, undefined, undefined, suggestions);
    this.name = 'LoadingError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, LoadingError.prototype);
  }

  /**
   * Creates a LoadingError from another error
   */
  static fromError(source: string, error: Error): LoadingError {
    return new LoadingError(error.message, source, error);
  }
}

/**
 * Type guard to check if an error is a ConfigurationError
 */
export function isConfigurationError(error: unknown): error is ConfigurationError {
  return error instanceof ConfigurationError;
}

/**
 * Type guard to check if an error is an EnvironmentError
 */
export function isEnvironmentError(error: unknown): error is EnvironmentError {
  return error instanceof EnvironmentError;
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard to check if an error is a MigrationError
 */
export function isMigrationError(error: unknown): error is MigrationError {
  return error instanceof MigrationError;
}

/**
 * Type guard to check if an error is a LoadingError
 */
export function isLoadingError(error: unknown): error is LoadingError {
  return error instanceof LoadingError;
}
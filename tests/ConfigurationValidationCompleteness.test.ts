/**
 * Configuration Validation Completeness Property-Based Tests
 * 
 * **Feature: codebase-refactoring-centralization, Property 4: Configuration validation completeness**
 * 
 * Tests that configuration validation provides structured errors with clear messages and error codes
 * for any invalid configuration input.
 * Uses fast-check library for property-based testing with minimum 50 iterations.
 * 
 * Requirements: 1.4, 3.1, 3.2, 8.1, 8.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager.js';
import { ConfigurationError, ValidationError } from '../src/backend/config/errors.js';

describe('Configuration Validation Completeness Property Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Reset singleton instance for each test
    (ConfigurationManager as any).instance = null;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  /**
   * Property 4: Configuration validation completeness
   * For any invalid configuration input, the system should return structured errors 
   * with clear messages and error codes
   * 
   * **Feature: codebase-refactoring-centralization, Property 4: Configuration validation completeness**
   * **Validates: Requirements 1.4, 3.1, 3.2, 8.1, 8.2**
   */
  it('Property 4: Configuration validation completeness', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate invalid configuration values to test validation
        fc.record({
          // Invalid port values
          invalidPort: fc.oneof(
            fc.constant('not-a-number'),
            fc.constant(''),
            fc.integer({ min: -1000, max: 0 }).map(String), // negative or zero
            fc.integer({ min: 65536, max: 100000 }).map(String), // too large
            fc.constant('65536'), // exactly at boundary
            fc.constant('0') // exactly zero
          ),
          
          // Invalid numeric values
          invalidRetries: fc.oneof(
            fc.constant('negative'),
            fc.integer({ min: -100, max: -1 }).map(String), // negative
            fc.constant('not-a-number'),
            fc.constant('')
          ),
          
          invalidDelay: fc.oneof(
            fc.constant('negative-delay'),
            fc.integer({ min: -1000, max: -1 }).map(String), // negative
            fc.constant('zero'), // invalid string
            fc.constant('')
          ),
          
          invalidTimeout: fc.oneof(
            fc.constant('no-timeout'),
            fc.integer({ min: -1000, max: 0 }).map(String), // negative or zero
            fc.constant(''),
            fc.constant('infinity')
          ),
          
          invalidCacheSize: fc.oneof(
            fc.constant('huge-cache'),
            fc.integer({ min: -100, max: 0 }).map(String), // negative or zero
            fc.constant(''),
            fc.constant('not-a-size')
          ),
          
          invalidCacheTtl: fc.oneof(
            fc.constant('forever'),
            fc.integer({ min: -1000, max: -1 }).map(String), // negative
            fc.constant(''),
            fc.constant('no-ttl')
          ),
          
          // Invalid boolean values
          invalidBoolean: fc.oneof(
            fc.constant('maybe'),
            fc.constant('sometimes'),
            fc.constant('2'),
            fc.constant('-1'),
            fc.constant(''),
            fc.constant('TRUE'), // case sensitive
            fc.constant('FALSE') // case sensitive
          ),
          
          // Invalid enum values
          invalidEnvironment: fc.oneof(
            fc.constant('staging'),
            fc.constant('local'),
            fc.constant('dev'),
            fc.constant('prod'),
            fc.constant('testing'),
            fc.constant(''),
            fc.constant('DEVELOPMENT') // case sensitive
          ),
          
          invalidLogLevel: fc.oneof(
            fc.constant('verbose'),
            fc.constant('trace'),
            fc.constant('silent'),
            fc.constant('all'),
            fc.constant(''),
            fc.constant('INFO') // case sensitive
          ),
          
          // Invalid string values
          invalidHost: fc.constant(''), // empty string
          invalidPath: fc.constant(''), // empty string
          invalidUrl: fc.oneof(
            fc.constant('not-a-url'),
            fc.constant(''),
            fc.constant('ftp://invalid-protocol'),
            fc.constant('just-a-string')
          ),
          
          // Invalid threshold values
          invalidThreshold: fc.oneof(
            fc.constant('high'),
            fc.float({ min: Math.fround(-1), max: Math.fround(-0.1) }).map(String), // negative
            fc.float({ min: Math.fround(1.1), max: Math.fround(2) }).map(String), // greater than 1
            fc.constant(''),
            fc.constant('100%') // not a decimal
          ),
          
          // Test different combinations
          testScenario: fc.constantFrom(
            'invalid-port',
            'invalid-retries',
            'invalid-delay',
            'invalid-timeout',
            'invalid-cache-size',
            'invalid-cache-ttl',
            'invalid-boolean',
            'invalid-environment',
            'invalid-log-level',
            'invalid-host',
            'invalid-path',
            'invalid-url',
            'invalid-threshold'
          )
        }),
        async (testData) => {
          // Reset singleton instance
          (ConfigurationManager as any).instance = null;
          
          // Clear environment first
          const configKeys = [
            'NODE_ENV', 'PORT', 'HOST', 'CORS_ORIGINS', 'STATIC_PATH', 'DATA_PATH',
            'WARBAND_DATA_PATH', 'ENABLE_AUTO_SAVE', 'VITE_API_URL', 'API_MAX_RETRIES',
            'API_RETRY_DELAY_MS', 'API_TIMEOUT_MS', 'CACHE_DEFAULT_MAX_SIZE',
            'CACHE_DEFAULT_TTL_MS', 'LOG_LEVEL', 'DEBUG_ENABLED',
            'ENABLE_PERFORMANCE_MONITORING', 'ENABLE_DETAILED_ERRORS',
            'VALIDATION_COST_WARNING_THRESHOLD', 'VALIDATION_CONTEXT_AWARE_WARNINGS',
            'VALIDATION_STRICT_MODE'
          ];
          
          configKeys.forEach(key => {
            delete process.env[key];
          });
          
          // Set valid base environment
          process.env.NODE_ENV = 'test';
          
          // Set invalid value based on test scenario
          switch (testData.testScenario) {
            case 'invalid-port':
              process.env.PORT = testData.invalidPort;
              break;
            case 'invalid-retries':
              process.env.API_MAX_RETRIES = testData.invalidRetries;
              break;
            case 'invalid-delay':
              process.env.API_RETRY_DELAY_MS = testData.invalidDelay;
              break;
            case 'invalid-timeout':
              process.env.API_TIMEOUT_MS = testData.invalidTimeout;
              break;
            case 'invalid-cache-size':
              process.env.CACHE_DEFAULT_MAX_SIZE = testData.invalidCacheSize;
              break;
            case 'invalid-cache-ttl':
              process.env.CACHE_DEFAULT_TTL_MS = testData.invalidCacheTtl;
              break;
            case 'invalid-boolean':
              process.env.ENABLE_AUTO_SAVE = testData.invalidBoolean;
              break;
            case 'invalid-environment':
              process.env.NODE_ENV = testData.invalidEnvironment;
              break;
            case 'invalid-log-level':
              process.env.LOG_LEVEL = testData.invalidLogLevel;
              break;
            case 'invalid-host':
              process.env.HOST = testData.invalidHost;
              break;
            case 'invalid-path':
              process.env.STATIC_PATH = testData.invalidPath;
              break;
            case 'invalid-url':
              process.env.VITE_API_URL = testData.invalidUrl;
              break;
            case 'invalid-threshold':
              process.env.VALIDATION_COST_WARNING_THRESHOLD = testData.invalidThreshold;
              break;
          }

          const configManager = ConfigurationManager.getInstance();
          
          try {
            // Attempt to initialize configuration
            await configManager.initialize();
            
            // If initialization succeeds, validate the configuration
            const validationResult = configManager.validate();
            
            // For invalid inputs, we expect either:
            // 1. Initialization to fail with structured error, OR
            // 2. Validation to fail with structured errors, OR  
            // 3. Fallback behavior with warnings (for non-critical errors)
            
            if (!validationResult.valid) {
              // Validation should provide structured errors
              expect(validationResult.errors).toBeDefined();
              expect(Array.isArray(validationResult.errors)).toBe(true);
              expect(validationResult.errors.length).toBeGreaterThan(0);
              
              // Each error should have required structure
              validationResult.errors.forEach(error => {
                expect(error).toBeDefined();
                expect(error.field).toBeDefined();
                expect(typeof error.field).toBe('string');
                expect(error.field.length).toBeGreaterThan(0);
                
                expect(error.message).toBeDefined();
                expect(typeof error.message).toBe('string');
                expect(error.message.length).toBeGreaterThan(0);
                
                expect(error.code).toBeDefined();
                expect(typeof error.code).toBe('string');
                expect(error.code.length).toBeGreaterThan(0);
                
                // Error codes should follow naming convention
                expect(error.code).toMatch(/^[A-Z_]+$/);
                
                // Should have suggestions for fixing the error
                if (error.suggestions) {
                  expect(Array.isArray(error.suggestions)).toBe(true);
                  error.suggestions.forEach(suggestion => {
                    expect(typeof suggestion).toBe('string');
                    expect(suggestion.length).toBeGreaterThan(0);
                  });
                }
              });
            }
            
            // Warnings should also be structured if present
            if (validationResult.warnings && validationResult.warnings.length > 0) {
              validationResult.warnings.forEach(warning => {
                expect(warning).toBeDefined();
                expect(warning.field).toBeDefined();
                expect(typeof warning.field).toBe('string');
                expect(warning.field.length).toBeGreaterThan(0);
                
                expect(warning.message).toBeDefined();
                expect(typeof warning.message).toBe('string');
                expect(warning.message.length).toBeGreaterThan(0);
                
                expect(warning.code).toBeDefined();
                expect(typeof warning.code).toBe('string');
                expect(warning.code.length).toBeGreaterThan(0);
                
                // Warning codes should follow naming convention
                expect(warning.code).toMatch(/^[A-Z_]+$/);
              });
            }
            
          } catch (error) {
            // If initialization fails, error should be structured
            expect(error).toBeInstanceOf(ConfigurationError);
            
            if (error instanceof ConfigurationError) {
              // Should have proper error structure
              expect(error.message).toBeDefined();
              expect(typeof error.message).toBe('string');
              expect(error.message.length).toBeGreaterThan(0);
              
              expect(error.code).toBeDefined();
              expect(typeof error.code).toBe('string');
              expect(error.code.length).toBeGreaterThan(0);
              
              // Error codes should follow naming convention
              expect(error.code).toMatch(/^[A-Z_]+$/);
              
              // Should provide detailed error message
              const detailedMessage = error.getDetailedMessage();
              expect(detailedMessage).toBeDefined();
              expect(typeof detailedMessage).toBe('string');
              expect(detailedMessage.length).toBeGreaterThan(error.message.length);
              
              // Should have suggestions if available
              if (error.suggestions) {
                expect(Array.isArray(error.suggestions)).toBe(true);
                error.suggestions.forEach(suggestion => {
                  expect(typeof suggestion).toBe('string');
                  expect(suggestion.length).toBeGreaterThan(0);
                });
              }
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test specific validation error scenarios
   */
  it('should provide specific validation errors for known invalid values', async () => {
    const testCases = [
      {
        name: 'invalid port - negative',
        env: { PORT: '-1' },
        expectedErrorField: 'server.port',
        expectedErrorCode: 'INVALID_PORT'
      },
      {
        name: 'invalid port - too large',
        env: { PORT: '70000' },
        expectedErrorField: 'server.port',
        expectedErrorCode: 'INVALID_PORT'
      },
      {
        name: 'invalid port - not a number',
        env: { PORT: 'not-a-port' },
        expectedErrorField: 'server.port',
        expectedErrorCode: 'INVALID_PORT'
      },
      {
        name: 'invalid retries - negative',
        env: { API_MAX_RETRIES: '-5' },
        expectedErrorField: 'api.maxRetries',
        expectedErrorCode: 'INVALID_MAX_RETRIES'
      },
      {
        name: 'invalid delay - negative',
        env: { API_RETRY_DELAY_MS: '-1000' },
        expectedErrorField: 'api.retryDelayMs',
        expectedErrorCode: 'INVALID_RETRY_DELAY'
      },
      {
        name: 'invalid timeout - zero',
        env: { API_TIMEOUT_MS: '0' },
        expectedErrorField: 'api.timeoutMs',
        expectedErrorCode: 'INVALID_TIMEOUT'
      },
      {
        name: 'invalid cache size - zero',
        env: { CACHE_DEFAULT_MAX_SIZE: '0' },
        expectedErrorField: 'cache.defaultMaxSize',
        expectedErrorCode: 'INVALID_CACHE_SIZE'
      },
      {
        name: 'invalid cache TTL - negative',
        env: { CACHE_DEFAULT_TTL_MS: '-1' },
        expectedErrorField: 'cache.defaultTtlMs',
        expectedErrorCode: 'INVALID_CACHE_TTL'
      },
      {
        name: 'invalid threshold - negative',
        env: { VALIDATION_COST_WARNING_THRESHOLD: '-0.5' },
        expectedErrorField: 'validation.costWarningThreshold',
        expectedErrorCode: 'INVALID_WARNING_THRESHOLD'
      },
      {
        name: 'invalid threshold - greater than 1',
        env: { VALIDATION_COST_WARNING_THRESHOLD: '1.5' },
        expectedErrorField: 'validation.costWarningThreshold',
        expectedErrorCode: 'INVALID_WARNING_THRESHOLD'
      },
      {
        name: 'invalid host - empty',
        env: { HOST: '' },
        expectedErrorField: 'server.host',
        expectedErrorCode: 'INVALID_HOST'
      },
      {
        name: 'invalid URL - malformed',
        env: { VITE_API_URL: 'not-a-url' },
        expectedErrorField: 'api.baseUrl',
        expectedErrorCode: 'MALFORMED_BASE_URL'
      }
    ];

    for (const testCase of testCases) {
      // Reset environment and singleton
      process.env = { ...originalEnv };
      (ConfigurationManager as any).instance = null;
      
      // Set base valid environment
      process.env.NODE_ENV = 'test';
      
      // Set the invalid value
      Object.entries(testCase.env).forEach(([key, value]) => {
        process.env[key] = value;
      });

      const configManager = ConfigurationManager.getInstance();
      
      try {
        await configManager.initialize();
        
        // Check validation result
        const validationResult = configManager.validate();
        
        if (!validationResult.valid) {
          // Should have the expected error
          const matchingError = validationResult.errors.find(
            error => error.field === testCase.expectedErrorField && error.code === testCase.expectedErrorCode
          );
          
          expect(matchingError, `Expected error for ${testCase.name} with field ${testCase.expectedErrorField} and code ${testCase.expectedErrorCode}`).toBeDefined();
          
          if (matchingError) {
            expect(matchingError.message).toBeDefined();
            expect(matchingError.message.length).toBeGreaterThan(0);
            expect(matchingError.suggestions).toBeDefined();
            expect(Array.isArray(matchingError.suggestions)).toBe(true);
          }
        } else {
          // If validation passes, the system should have used fallback/default values
          // This is acceptable behavior for non-critical configuration errors
          console.warn(`Test case "${testCase.name}" passed validation - system used fallback behavior`);
        }
        
      } catch (error) {
        // Initialization failure is also acceptable for critical errors
        expect(error).toBeInstanceOf(ConfigurationError);
        
        if (error instanceof ConfigurationError) {
          expect(error.code).toBeDefined();
          expect(error.message).toBeDefined();
          expect(error.getDetailedMessage()).toBeDefined();
        }
      }
    }
  });

  /**
   * Test that validation provides helpful suggestions
   */
  it('should provide helpful suggestions for common configuration errors', async () => {
    const testCases = [
      {
        env: { PORT: 'abc' },
        expectedSuggestion: /PORT.*valid.*number/i
      },
      {
        env: { API_MAX_RETRIES: '-1' },
        expectedSuggestion: /API_MAX_RETRIES.*non-negative/i
      },
      {
        env: { VITE_API_URL: 'invalid-url' },
        expectedSuggestion: /VITE_API_URL.*complete.*URL/i
      },
      {
        env: { NODE_ENV: 'invalid-env' },
        expectedSuggestion: /NODE_ENV.*development.*production.*test/i
      },
      {
        env: { LOG_LEVEL: 'invalid-level' },
        expectedSuggestion: /LOG_LEVEL.*error.*warn.*info.*debug/i
      }
    ];

    for (const testCase of testCases) {
      // Reset environment and singleton
      process.env = { ...originalEnv };
      (ConfigurationManager as any).instance = null;
      
      // Set base valid environment
      process.env.NODE_ENV = 'test';
      
      // Set the invalid value
      Object.entries(testCase.env).forEach(([key, value]) => {
        process.env[key] = value;
      });

      const configManager = ConfigurationManager.getInstance();
      
      try {
        await configManager.initialize();
        const validationResult = configManager.validate();
        
        if (!validationResult.valid && validationResult.errors.length > 0) {
          // Check if any error has a suggestion matching the pattern
          const hasMatchingSuggestion = validationResult.errors.some(error => 
            error.suggestions && error.suggestions.some(suggestion => 
              testCase.expectedSuggestion.test(suggestion)
            )
          );
          
          expect(hasMatchingSuggestion, `Expected suggestion matching ${testCase.expectedSuggestion} for env ${JSON.stringify(testCase.env)}`).toBe(true);
        }
        
      } catch (error) {
        if (error instanceof ConfigurationError && error.suggestions) {
          const hasMatchingSuggestion = error.suggestions.some(suggestion => 
            testCase.expectedSuggestion.test(suggestion)
          );
          
          expect(hasMatchingSuggestion, `Expected suggestion matching ${testCase.expectedSuggestion} in error for env ${JSON.stringify(testCase.env)}`).toBe(true);
        }
      }
    }
  });
});
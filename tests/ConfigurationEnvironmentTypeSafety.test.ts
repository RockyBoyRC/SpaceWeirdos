/**
 * Configuration Environment Variable Type Safety Property-Based Tests
 * 
 * **Feature: codebase-refactoring-centralization, Property 2: Environment variable type safety**
 * 
 * Tests that environment variable access provides type-safe parsing and validation.
 * Uses fast-check library for property-based testing with minimum 50 iterations.
 * 
 * Requirements: 1.2, 4.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager.js';
import { Environment, LogLevel } from '../src/backend/config/types.js';

describe('Configuration Environment Variable Type Safety Property Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Reset singleton instance for each test
    (ConfigurationManager as any).instance = null;
    
    // Ensure clean environment for each test
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  /**
   * Property 2: Environment variable type safety
   * For any environment variable access, the returned value should match the expected type 
   * and be properly validated
   * 
   * **Feature: codebase-refactoring-centralization, Property 2: Environment variable type safety**
   * **Validates: Requirements 1.2, 4.2**
   */
  it('Property 2: Environment variable type safety', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various environment variable values with different types
        fc.record({
          // String values that should remain strings
          NODE_ENV: fc.option(fc.constantFrom('development', 'production', 'test')),
          HOST: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          STATIC_PATH: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          DATA_PATH: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          VITE_API_URL: fc.option(fc.webUrl()),
          
          // Numeric values that should be parsed as numbers
          PORT: fc.option(fc.oneof(
            fc.integer({ min: 1000, max: 65535 }).map(String), // valid numbers
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => isNaN(Number(s))) // invalid numbers
          )),
          API_MAX_RETRIES: fc.option(fc.oneof(
            fc.integer({ min: 0, max: 10 }).map(String), // valid numbers
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => isNaN(Number(s))) // invalid numbers
          )),
          API_RETRY_DELAY_MS: fc.option(fc.oneof(
            fc.integer({ min: 100, max: 10000 }).map(String), // valid positive numbers
            fc.integer({ min: -1000, max: 0 }).map(String), // invalid negative numbers
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => isNaN(Number(s))) // invalid strings
          )),
          CACHE_DEFAULT_MAX_SIZE: fc.option(fc.oneof(
            fc.integer({ min: 1, max: 1000 }).map(String), // valid positive numbers
            fc.integer({ min: -100, max: 0 }).map(String), // invalid non-positive numbers
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => isNaN(Number(s))) // invalid strings
          )),
          
          // Boolean values that should be parsed as booleans
          ENABLE_AUTO_SAVE: fc.option(fc.oneof(
            fc.constantFrom('true', 'false', '1', '0', 'yes', 'no'), // valid boolean strings
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => 
              !['true', 'false', '1', '0', 'yes', 'no'].includes(s.toLowerCase())
            ) // invalid boolean strings
          )),
          DEBUG_ENABLED: fc.option(fc.oneof(
            fc.constantFrom('true', 'false', '1', '0', 'yes', 'no'), // valid boolean strings
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => 
              !['true', 'false', '1', '0', 'yes', 'no'].includes(s.toLowerCase())
            ) // invalid boolean strings
          )),
          
          // Enum values that should be validated
          LOG_LEVEL: fc.option(fc.oneof(
            fc.constantFrom('error', 'warn', 'info', 'debug'), // valid log levels
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => 
              !['error', 'warn', 'info', 'debug'].includes(s)
            ) // invalid log levels
          )),
          
          // Array values that should be parsed correctly
          CORS_ORIGINS: fc.option(fc.oneof(
            fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }).map(origins => origins.join(',')), // valid URLs
            fc.string({ minLength: 1, maxLength: 100 }) // any string (should be parsed as array)
          ))
        }),
        async (envVars) => {
          // Set environment variables
          Object.entries(envVars).forEach(([key, value]) => {
            if (value !== null) {
              process.env[key] = value;
            }
          });

          // Create fresh configuration manager instance
          const configManager = ConfigurationManager.getInstance();
          
          // Initialize configuration
          await configManager.initialize();
          
          // Get complete configuration
          const config = configManager.getConfiguration();
          
          // Verify type safety for numeric values
          expect(typeof config.server.port).toBe('number');
          expect(config.server.port).toBeGreaterThan(0);
          expect(config.server.port).toBeLessThanOrEqual(65535);
          
          expect(typeof config.api.maxRetries).toBe('number');
          expect(config.api.maxRetries).toBeGreaterThanOrEqual(0);
          
          expect(typeof config.api.retryDelayMs).toBe('number');
          expect(config.api.retryDelayMs).toBeGreaterThan(0);
          
          expect(typeof config.api.timeoutMs).toBe('number');
          expect(config.api.timeoutMs).toBeGreaterThan(0);
          
          expect(typeof config.cache.defaultMaxSize).toBe('number');
          expect(config.cache.defaultMaxSize).toBeGreaterThan(0);
          
          expect(typeof config.cache.defaultTtlMs).toBe('number');
          expect(config.cache.defaultTtlMs).toBeGreaterThan(0);
          
          // Verify type safety for string values
          expect(typeof config.server.host).toBe('string');
          expect(config.server.host.length).toBeGreaterThan(0);
          
          expect(typeof config.server.staticPath).toBe('string');
          expect(config.server.staticPath.length).toBeGreaterThan(0);
          
          expect(typeof config.server.dataPath).toBe('string');
          expect(config.server.dataPath.length).toBeGreaterThan(0);
          
          expect(typeof config.api.baseUrl).toBe('string');
          expect(config.api.baseUrl.length).toBeGreaterThan(0);
          
          // Verify type safety for boolean values
          expect(typeof config.server.enableAutoSave).toBe('boolean');
          expect(typeof config.environment.debugEnabled).toBe('boolean');
          expect(typeof config.environment.isDevelopment).toBe('boolean');
          expect(typeof config.environment.isProduction).toBe('boolean');
          expect(typeof config.environment.isTest).toBe('boolean');
          expect(typeof config.validation.enableContextAwareWarnings).toBe('boolean');
          expect(typeof config.validation.strictValidation).toBe('boolean');
          
          // Verify type safety for enum values
          expect(['development', 'production', 'test']).toContain(config.environment.environment);
          expect(['error', 'warn', 'info', 'debug']).toContain(config.environment.logLevel);
          
          // Verify type safety for array values
          expect(Array.isArray(config.server.corsOrigins)).toBe(true);
          config.server.corsOrigins.forEach(origin => {
            expect(typeof origin).toBe('string');
          });
          
          // Verify that environment-specific boolean flags are consistent
          const env = config.environment.environment;
          expect(config.environment.isDevelopment).toBe(env === 'development');
          expect(config.environment.isProduction).toBe(env === 'production');
          expect(config.environment.isTest).toBe(env === 'test');
          
          // Verify that numeric values are within reasonable ranges
          expect(config.cost.pointLimits.warningThreshold).toBeGreaterThanOrEqual(0);
          expect(config.cost.pointLimits.warningThreshold).toBeLessThanOrEqual(1);
          
          expect(config.validation.costWarningThreshold).toBeGreaterThanOrEqual(0);
          expect(config.validation.costWarningThreshold).toBeLessThanOrEqual(1);
          
          // Verify that all required configuration sections have proper types
          expect(config.server).toBeTypeOf('object');
          expect(config.api).toBeTypeOf('object');
          expect(config.cache).toBeTypeOf('object');
          expect(config.cost).toBeTypeOf('object');
          expect(config.validation).toBeTypeOf('object');
          expect(config.environment).toBeTypeOf('object');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test specific type conversion scenarios
   */
  it('should handle specific type conversion scenarios correctly', async () => {
    const testCases = [
      // Boolean parsing
      { env: { ENABLE_AUTO_SAVE: 'true' }, expected: { enableAutoSave: true } },
      { env: { ENABLE_AUTO_SAVE: 'false' }, expected: { enableAutoSave: false } },
      { env: { ENABLE_AUTO_SAVE: '1' }, expected: { enableAutoSave: true } },
      { env: { ENABLE_AUTO_SAVE: '0' }, expected: { enableAutoSave: false } },
      { env: { ENABLE_AUTO_SAVE: 'yes' }, expected: { enableAutoSave: true } },
      { env: { ENABLE_AUTO_SAVE: 'no' }, expected: { enableAutoSave: false } },
      { env: { ENABLE_AUTO_SAVE: 'invalid' }, expected: { enableAutoSave: true } }, // default
      
      // Number parsing
      { env: { PORT: '8080' }, expected: { port: 8080 } },
      { env: { PORT: 'invalid' }, expected: { port: 3001 } }, // default
      { env: { API_MAX_RETRIES: '5' }, expected: { maxRetries: 5 } },
      { env: { API_MAX_RETRIES: '-1' }, expected: { maxRetries: 3 } }, // default (negative not allowed for retries)
      
      // Positive number parsing
      { env: { CACHE_DEFAULT_MAX_SIZE: '200' }, expected: { defaultMaxSize: 200 } },
      { env: { CACHE_DEFAULT_MAX_SIZE: '0' }, expected: { defaultMaxSize: 100 } }, // default (zero not allowed)
      { env: { CACHE_DEFAULT_MAX_SIZE: '-50' }, expected: { defaultMaxSize: 100 } }, // default (negative not allowed)
      
      // Enum parsing
      { env: { LOG_LEVEL: 'error' }, expected: { logLevel: 'error' } },
      { env: { NODE_ENV: 'development', LOG_LEVEL: 'invalid' }, expected: { logLevel: 'debug' } }, // default for development
      { env: { NODE_ENV: 'production', LOG_LEVEL: 'invalid' }, expected: { logLevel: 'info' } }, // default for production
    ];

    for (const testCase of testCases) {
      // Reset environment and singleton
      process.env = { ...originalEnv };
      (ConfigurationManager as any).instance = null;
      
      // Set test environment
      process.env.NODE_ENV = 'development'; // default
      Object.entries(testCase.env).forEach(([key, value]) => {
        process.env[key] = value;
      });

      const configManager = ConfigurationManager.getInstance();
      await configManager.initialize();
      const config = configManager.getConfiguration();

      // Check expected values
      if ('enableAutoSave' in testCase.expected) {
        expect(config.server.enableAutoSave).toBe(testCase.expected.enableAutoSave);
      }
      if ('port' in testCase.expected) {
        expect(config.server.port).toBe(testCase.expected.port);
      }
      if ('maxRetries' in testCase.expected) {
        expect(config.api.maxRetries).toBe(testCase.expected.maxRetries);
      }
      if ('defaultMaxSize' in testCase.expected) {
        expect(config.cache.defaultMaxSize).toBe(testCase.expected.defaultMaxSize);
      }
      if ('logLevel' in testCase.expected) {
        expect(config.environment.logLevel).toBe(testCase.expected.logLevel);
      }
    }
  });

  /**
   * Test that invalid environment values don't break the system
   */
  it('should gracefully handle completely invalid environment values', async () => {
    // Set completely invalid values for all environment variables
    process.env.NODE_ENV = 'test'; // Use test environment for test defaults
    process.env.PORT = 'not-a-port';
    process.env.HOST = '';
    process.env.CORS_ORIGINS = '';
    process.env.API_MAX_RETRIES = 'negative-infinity';
    process.env.CACHE_DEFAULT_MAX_SIZE = 'huge';
    process.env.LOG_LEVEL = 'super-verbose';
    process.env.DEBUG_ENABLED = 'sometimes';

    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    const config = configManager.getConfiguration();

    // Should still have valid configuration with defaults
    expect(config.environment.environment).toBe('test'); // test environment
    expect(config.server.port).toBe(3001); // default
    expect(config.server.host).toBe('localhost'); // default
    expect(config.server.corsOrigins).toEqual(['*']); // default
    expect(config.api.maxRetries).toBe(3); // default
    expect(config.cache.defaultMaxSize).toBe(100); // default
    expect(config.environment.logLevel).toBe('error'); // default for test environment
    expect(config.environment.debugEnabled).toBe(false); // default for test environment

    // Configuration should still be valid
    const validationResult = configManager.validate();
    expect(validationResult.valid).toBe(true);
  });
});
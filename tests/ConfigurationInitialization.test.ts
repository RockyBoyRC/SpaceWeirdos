/**
 * Configuration Initialization Property-Based Tests
 * 
 * **Feature: codebase-refactoring-centralization, Property 1: Configuration initialization completeness**
 * 
 * Tests that configuration initialization works correctly across all possible scenarios.
 * Uses fast-check library for property-based testing with minimum 50 iterations.
 * 
 * Requirements: 1.1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager.js';
import { Configuration, Environment } from '../src/backend/config/types.js';

describe('Configuration Initialization Property Tests', () => {
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
   * Property 1: Configuration initialization completeness
   * For any configuration system initialization, all required configuration sections 
   * (server, api, cache, cost, validation) should be loaded and accessible
   * 
   * **Feature: codebase-refactoring-centralization, Property 1: Configuration initialization completeness**
   * **Validates: Requirements 1.1**
   */
  it('Property 1: Configuration initialization completeness', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate environment variables for testing
        fc.record({
          NODE_ENV: fc.option(fc.constantFrom('development', 'production', 'test')),
          PORT: fc.option(fc.integer({ min: 1000, max: 65535 }).map(String)),
          HOST: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          CORS_ORIGINS: fc.option(fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }).map(origins => origins.join(','))),
          STATIC_PATH: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          DATA_PATH: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          WARBAND_DATA_PATH: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          ENABLE_AUTO_SAVE: fc.option(fc.constantFrom('true', 'false', '1', '0', 'yes', 'no')),
          VITE_API_URL: fc.option(fc.webUrl()),
          API_MAX_RETRIES: fc.option(fc.integer({ min: 0, max: 10 }).map(String)),
          API_RETRY_DELAY_MS: fc.option(fc.integer({ min: 100, max: 10000 }).map(String)),
          API_TIMEOUT_MS: fc.option(fc.integer({ min: 1000, max: 60000 }).map(String)),
          CACHE_DEFAULT_MAX_SIZE: fc.option(fc.integer({ min: 1, max: 1000 }).map(String)),
          CACHE_DEFAULT_TTL_MS: fc.option(fc.integer({ min: 1000, max: 300000 }).map(String)),
          LOG_LEVEL: fc.option(fc.constantFrom('error', 'warn', 'info', 'debug')),
          DEBUG_ENABLED: fc.option(fc.constantFrom('true', 'false', '1', '0')),
          ENABLE_PERFORMANCE_MONITORING: fc.option(fc.constantFrom('true', 'false')),
          ENABLE_DETAILED_ERRORS: fc.option(fc.constantFrom('true', 'false'))
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
          const config: Configuration = configManager.getConfiguration();
          
          // Verify all required sections are present and accessible
          expect(config).toBeDefined();
          expect(config.server).toBeDefined();
          expect(config.api).toBeDefined();
          expect(config.cache).toBeDefined();
          expect(config.cost).toBeDefined();
          expect(config.validation).toBeDefined();
          expect(config.environment).toBeDefined();
          
          // Verify server configuration completeness
          expect(config.server.port).toBeTypeOf('number');
          expect(config.server.host).toBeTypeOf('string');
          expect(Array.isArray(config.server.corsOrigins)).toBe(true);
          expect(config.server.staticPath).toBeTypeOf('string');
          expect(config.server.dataPath).toBeTypeOf('string');
          expect(config.server.warbandDataPath).toBeTypeOf('string');
          expect(config.server.enableAutoSave).toBeTypeOf('boolean');
          
          // Verify API configuration completeness
          expect(config.api.baseUrl).toBeTypeOf('string');
          expect(config.api.maxRetries).toBeTypeOf('number');
          expect(config.api.retryDelayMs).toBeTypeOf('number');
          expect(config.api.timeoutMs).toBeTypeOf('number');
          
          // Verify cache configuration completeness
          expect(config.cache.defaultMaxSize).toBeTypeOf('number');
          expect(config.cache.defaultTtlMs).toBeTypeOf('number');
          expect(config.cache.itemCostCacheSize).toBeTypeOf('number');
          expect(config.cache.itemCostCacheTtl).toBeTypeOf('number');
          expect(config.cache.costCalculationCacheSize).toBeTypeOf('number');
          expect(config.cache.costCalculationCacheTtl).toBeTypeOf('number');
          
          // Verify cost configuration completeness
          expect(config.cost.pointLimits).toBeDefined();
          expect(config.cost.pointLimits.standard).toBeTypeOf('number');
          expect(config.cost.pointLimits.extended).toBeTypeOf('number');
          expect(config.cost.pointLimits.warningThreshold).toBeTypeOf('number');
          expect(config.cost.trooperLimits).toBeDefined();
          expect(config.cost.equipmentLimits).toBeDefined();
          expect(config.cost.discountValues).toBeDefined();
          expect(config.cost.abilityWeaponLists).toBeDefined();
          expect(config.cost.abilityEquipmentLists).toBeDefined();
          
          // Verify validation configuration completeness
          expect(config.validation.costWarningThreshold).toBeTypeOf('number');
          expect(config.validation.enableContextAwareWarnings).toBeTypeOf('boolean');
          expect(config.validation.strictValidation).toBeTypeOf('boolean');
          expect(config.validation.messages).toBeDefined();
          expect(config.validation.messages.warbandNameRequired).toBeTypeOf('string');
          
          // Verify environment configuration completeness
          expect(config.environment.environment).toMatch(/^(development|production|test)$/);
          expect(config.environment.isDevelopment).toBeTypeOf('boolean');
          expect(config.environment.isProduction).toBeTypeOf('boolean');
          expect(config.environment.isTest).toBeTypeOf('boolean');
          expect(config.environment.debugEnabled).toBeTypeOf('boolean');
          expect(config.environment.logLevel).toMatch(/^(error|warn|info|debug)$/);
          
          // Verify individual section accessors work
          expect(configManager.getServerConfig()).toEqual(config.server);
          expect(configManager.getApiConfig()).toEqual(config.api);
          expect(configManager.getCacheConfig()).toEqual(config.cache);
          expect(configManager.getCostConfig()).toEqual(config.cost);
          expect(configManager.getValidationConfig()).toEqual(config.validation);
          expect(configManager.getEnvironmentConfig()).toEqual(config.environment);
          expect(configManager.getEnvironment()).toEqual(config.environment.environment);
          
          // Verify validation passes
          const validationResult = configManager.validate();
          expect(validationResult.valid).toBe(true);
          expect(validationResult.errors).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test that configuration initialization works with minimal environment
   */
  it('should initialize with minimal environment variables', async () => {
    // Clear all environment variables except NODE_ENV
    Object.keys(process.env).forEach(key => {
      if (key !== 'NODE_ENV') {
        delete process.env[key];
      }
    });
    process.env.NODE_ENV = 'test';

    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    
    const config = configManager.getConfiguration();
    
    // Should have all sections with default values
    // Note: Test runs in test environment, so expect test defaults
    expect(config.server.port).toBeGreaterThanOrEqual(0); // Test environment may use port 0
    expect(config.api.maxRetries).toBe(0); // Test environment sets maxRetries to 0 for predictable behavior
    expect(config.cache.defaultMaxSize).toBe(100);
    expect(config.cost.pointLimits.standard).toBe(75);
    expect(config.validation.costWarningThreshold).toBe(0.9);
    expect(config.environment.environment).toBe('test');
  });

  /**
   * Test that configuration initialization fails gracefully with invalid values
   */
  it('should handle invalid environment values gracefully', async () => {
    // Set environment to development first
    process.env.NODE_ENV = 'development';
    
    // Set invalid values that should use defaults
    process.env.PORT = 'invalid';
    process.env.API_MAX_RETRIES = 'not-a-number';
    process.env.CACHE_DEFAULT_MAX_SIZE = '-1';
    process.env.LOG_LEVEL = 'invalid-level';
    process.env.DEBUG_ENABLED = 'maybe';

    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    
    const config = configManager.getConfiguration();
    
    // Should use default values for invalid inputs
    expect(config.server.port).toBe(3001); // default
    expect(config.api.maxRetries).toBe(3); // default
    expect(config.cache.defaultMaxSize).toBe(100); // default
    expect(config.environment.logLevel).toBe('debug'); // development default when LOG_LEVEL is invalid
    expect(config.environment.debugEnabled).toBe(true); // development default when DEBUG_ENABLED is invalid
  });
});
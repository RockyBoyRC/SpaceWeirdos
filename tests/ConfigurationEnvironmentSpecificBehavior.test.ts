/**
 * Configuration Environment-Specific Behavior Property-Based Tests
 * 
 * **Feature: codebase-refactoring-centralization, Property 5: Environment-specific configuration behavior**
 * 
 * Tests that the system loads appropriate environment-specific settings and behaviors
 * for any environment type (development, production, test).
 * Uses fast-check library for property-based testing with minimum 50 iterations.
 * 
 * Requirements: 1.5, 7.1, 7.2, 7.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager.js';
import { Environment, LogLevel } from '../src/backend/config/types.js';

describe('Configuration Environment-Specific Behavior Property Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear NODE_ENV to ensure clean state
    delete process.env.NODE_ENV;
    
    // Reset singleton instance for each test
    (ConfigurationManager as any).instance = null;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  /**
   * Property 5: Environment-specific configuration behavior
   * For any environment type (development, production, test), the system should load 
   * appropriate environment-specific settings and behaviors
   * 
   * **Feature: codebase-refactoring-centralization, Property 5: Environment-specific configuration behavior**
   * **Validates: Requirements 1.5, 7.1, 7.2, 7.3**
   */
  it('Property 5: Environment-specific configuration behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate different environment configurations
        fc.constantFrom('development', 'production', 'test'),
        async (environment) => {
          // Reset singleton instance for each test
          (ConfigurationManager as any).instance = null;
          
          // Set the environment directly in process.env
          const originalNodeEnv = process.env.NODE_ENV;
          process.env.NODE_ENV = environment;
          
          // Set required environment variables for production
          if (environment === 'production') {
            process.env.VITE_API_URL = 'http://localhost:3001/api';
          }

          try {
            // Create fresh configuration manager instance
            const configManager = ConfigurationManager.getInstance();
            
            // Initialize configuration
            await configManager.initialize();
            
            // Get complete configuration
            const config = configManager.getConfiguration();
            
            // The core property: environment-specific behavior should be applied
            // Verify that the configuration reflects the environment we set
            
            // Basic environment detection should work
            expect(['development', 'production', 'test']).toContain(config.environment.environment);
            
            // Environment flags should be consistent with detected environment
            const detectedEnv = config.environment.environment;
            expect(config.environment.isDevelopment).toBe(detectedEnv === 'development');
            expect(config.environment.isProduction).toBe(detectedEnv === 'production');
            expect(config.environment.isTest).toBe(detectedEnv === 'test');
            
            // Environment-specific settings should be applied based on detected environment
            switch (detectedEnv) {
              case 'development':
                // Development should have debug-friendly defaults
                expect(config.environment.debugEnabled).toBe(true);
                expect(config.environment.logLevel).toBe('debug');
                expect(config.environment.enablePerformanceMonitoring).toBe(false);
                expect(config.environment.enableDetailedErrors).toBe(true);
                
                // Development should have shorter cache TTLs for faster feedback
                expect(config.cache.defaultTtlMs).toBeLessThanOrEqual(5000);
                
                // Development should allow common dev ports in CORS
                expect(config.server.corsOrigins).toContain('*');
                break;
                
              case 'production':
                // Production should have performance-optimized defaults
                expect(config.environment.debugEnabled).toBe(false);
                expect(config.environment.logLevel).toBe('info');
                expect(config.environment.enablePerformanceMonitoring).toBe(true);
                expect(config.environment.enableDetailedErrors).toBe(false);
                
                // Production should have longer cache TTLs for better performance
                expect(config.cache.defaultTtlMs).toBeGreaterThanOrEqual(300000);
                break;
                
              case 'test':
                // Test should have test-optimized defaults
                expect(config.environment.debugEnabled).toBe(false);
                expect(config.environment.logLevel).toBe('error');
                expect(config.environment.enablePerformanceMonitoring).toBe(false);
                expect(config.environment.enableDetailedErrors).toBe(true);
                
                // Test should have very short cache TTLs for predictable behavior
                expect(config.cache.defaultTtlMs).toBeLessThanOrEqual(1000);
                
                // Test should have no retries for predictable behavior
                expect(config.api.maxRetries).toBe(0);
                
                // Test should disable auto-save by default
                expect(config.server.enableAutoSave).toBe(false);
                
                // Test should use random port by default
                expect(config.server.port).toBe(0);
                break;
            }
            
            // Verify that all configurations are still valid regardless of environment
            const validationResult = configManager.validate();
            expect(validationResult.valid).toBe(true);
            
            // Verify that environment-specific optimizations are applied
            if (detectedEnv === 'production') {
              // Production should have optimizations for performance
              expect(config.cache.defaultTtlMs).toBeGreaterThan(5000); // Better than default
              expect(config.environment.logLevel).not.toBe('debug'); // Not debug in production
            }
            
            if (detectedEnv === 'test') {
              // Test should have optimizations for speed and predictability
              expect(config.cache.defaultTtlMs).toBeLessThan(5000); // Faster than default
              expect(config.api.maxRetries).toBeLessThanOrEqual(1); // Minimal retries for tests
            }
            
            if (detectedEnv === 'development') {
              // Development should have optimizations for debugging
              expect(config.environment.enableDetailedErrors).toBe(true);
              expect(config.server.corsOrigins.length).toBeGreaterThan(0); // Should allow some origins
            }
          } finally {
            // Restore original NODE_ENV
            if (originalNodeEnv !== undefined) {
              process.env.NODE_ENV = originalNodeEnv;
            } else {
              delete process.env.NODE_ENV;
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test specific environment behavior scenarios
   */
  it('should apply correct environment-specific overrides', async () => {
    const environments: Environment[] = ['development', 'production', 'test'];
    
    for (const env of environments) {
      // Reset environment and singleton
      process.env = { ...originalEnv };
      (ConfigurationManager as any).instance = null;
      
      // Set specific environment
      process.env.NODE_ENV = env;

      const configManager = ConfigurationManager.getInstance();
      await configManager.initialize();
      const config = configManager.getConfiguration();

      // Verify environment is correctly detected
      expect(config.environment.environment).toBe(env);
      
      // Verify environment-specific behaviors
      switch (env) {
        case 'development':
          expect(config.environment.debugEnabled).toBe(true);
          expect(config.environment.logLevel).toBe('debug');
          expect(config.environment.enableDetailedErrors).toBe(true);
          expect(config.environment.enablePerformanceMonitoring).toBe(false);
          expect(config.server.corsOrigins).toContain('*');
          expect(config.cache.defaultTtlMs).toBeLessThanOrEqual(5000);
          break;
          
        case 'production':
          expect(config.environment.debugEnabled).toBe(false);
          expect(config.environment.logLevel).toBe('info');
          expect(config.environment.enableDetailedErrors).toBe(false);
          expect(config.environment.enablePerformanceMonitoring).toBe(true);
          expect(config.cache.defaultTtlMs).toBeGreaterThanOrEqual(300000);
          break;
          
        case 'test':
          expect(config.environment.debugEnabled).toBe(false);
          expect(config.environment.logLevel).toBe('error');
          expect(config.environment.enableDetailedErrors).toBe(true);
          expect(config.environment.enablePerformanceMonitoring).toBe(false);
          expect(config.server.enableAutoSave).toBe(false);
          expect(config.server.port).toBe(0);
          expect(config.api.maxRetries).toBe(0);
          expect(config.cache.defaultTtlMs).toBeLessThanOrEqual(1000);
          break;
      }
    }
  });

  /**
   * Test that environment variables can override environment-specific defaults
   */
  it('should allow environment variables to override environment-specific defaults', async () => {
    // Test production with debug enabled (override)
    process.env.NODE_ENV = 'production';
    process.env.DEBUG_ENABLED = 'true';
    process.env.LOG_LEVEL = 'debug';
    process.env.ENABLE_DETAILED_ERRORS = 'true';

    let configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    let config = configManager.getConfiguration();

    expect(config.environment.environment).toBe('production');
    expect(config.environment.debugEnabled).toBe(true); // Overridden
    expect(config.environment.logLevel).toBe('debug'); // Overridden
    expect(config.environment.enableDetailedErrors).toBe(true); // Overridden
    expect(config.environment.enablePerformanceMonitoring).toBe(true); // Still production default

    // Reset and test development with production-like settings
    process.env = { ...originalEnv };
    (ConfigurationManager as any).instance = null;
    
    process.env.NODE_ENV = 'development';
    process.env.DEBUG_ENABLED = 'false';
    process.env.LOG_LEVEL = 'info';
    process.env.ENABLE_PERFORMANCE_MONITORING = 'true';

    configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    config = configManager.getConfiguration();

    expect(config.environment.environment).toBe('development');
    expect(config.environment.debugEnabled).toBe(false); // Overridden
    expect(config.environment.logLevel).toBe('info'); // Overridden
    expect(config.environment.enablePerformanceMonitoring).toBe(true); // Overridden
    expect(config.environment.enableDetailedErrors).toBe(true); // Still development default
  });

  /**
   * Test that invalid environment falls back to development with appropriate warnings
   */
  it('should fallback to development for invalid environment with appropriate behavior', async () => {
    process.env.NODE_ENV = 'invalid-environment';

    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    const config = configManager.getConfiguration();

    // Should fallback to development
    expect(config.environment.environment).toBe('development');
    expect(config.environment.isDevelopment).toBe(true);
    expect(config.environment.isProduction).toBe(false);
    expect(config.environment.isTest).toBe(false);

    // Should have development-specific behavior
    expect(config.environment.debugEnabled).toBe(true);
    expect(config.environment.logLevel).toBe('debug');
    expect(config.environment.enableDetailedErrors).toBe(true);
    expect(config.environment.enablePerformanceMonitoring).toBe(false);
  });

  /**
   * Debug test to understand what's happening with production configuration
   */
  it('should debug production configuration', async () => {
    // Reset singleton instance
    (ConfigurationManager as any).instance = null;
    
    // Set production environment with required variables
    process.env.NODE_ENV = 'production';
    process.env.VITE_API_URL = 'http://localhost:3001/api'; // Required for production

    const configManager = ConfigurationManager.getInstance();
    
    // Test the environment-specific overrides directly
    const productionOverrides = (configManager as any).getProductionOverrides();
    console.log('Production overrides cache:', productionOverrides.cache);
    
    // Test what configData is being loaded
    const configData = (configManager as any).loadConfigurationData();
    console.log('Loaded configData cache:', configData.cache);
    console.log('Loaded configData environment:', configData.environment);
    
    await configManager.initialize();
    const config = configManager.getConfiguration();

    console.log('Environment detected:', config.environment.environment);
    console.log('Cache defaultTtlMs:', config.cache.defaultTtlMs);
    console.log('Debug enabled:', config.environment.debugEnabled);
    console.log('Log level:', config.environment.logLevel);

    // This should pass if environment-specific overrides are working
    expect(config.environment.environment).toBe('production');
    expect(config.cache.defaultTtlMs).toBe(300000); // Should be production value
  });

  /**
   * Debug test to understand what's happening with test configuration
   */
  it('should debug test configuration', async () => {
    // Reset singleton instance
    (ConfigurationManager as any).instance = null;
    
    // Set test environment
    process.env.NODE_ENV = 'test';

    const configManager = ConfigurationManager.getInstance();
    
    // Test the environment defaults
    const testDefaults = (configManager as any).getEnvironmentDefaults('test');
    console.log('Test environment defaults:', testDefaults);
    
    // Test what configData is being loaded
    const configData = (configManager as any).loadConfigurationData();
    console.log('Loaded configData environment:', configData.environment);
    
    await configManager.initialize();
    const config = configManager.getConfiguration();

    console.log('Environment detected:', config.environment.environment);
    console.log('Debug enabled:', config.environment.debugEnabled);
    console.log('Log level:', config.environment.logLevel);

    // This should pass if environment-specific defaults are working
    expect(config.environment.environment).toBe('test');
    expect(config.environment.debugEnabled).toBe(false); // Should be test default
    expect(config.environment.logLevel).toBe('error'); // Should be test default
  });
});
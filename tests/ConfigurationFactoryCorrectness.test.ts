/**
 * Property-Based Tests for Configuration Factory Function Correctness
 * 
 * **Feature: codebase-refactoring-centralization, Property 11: Factory function configuration correctness**
 * **Validates: Requirements 6.1, 6.2**
 * 
 * Tests that factory functions create properly configured instances with expected settings.
 * Uses property-based testing to verify correctness across all possible parameter combinations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager.js';
import { ConfigurationFactory, createConfiguredCache, createConfiguredApiClient, createConfiguredCostEngine, createConfiguredValidationService } from '../src/backend/config/ConfigurationFactory.js';
import { CachePurpose, CacheOptions } from '../src/backend/config/types.js';

describe('Configuration Factory Function Correctness', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let configManager: ConfigurationManager;
  let factory: ConfigurationFactory;

  beforeEach(async () => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.VITE_API_URL = 'http://localhost:3001/api';
    
    // Initialize configuration manager
    configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    
    // Create factory instance
    factory = new ConfigurationFactory(configManager);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  /**
   * **Feature: codebase-refactoring-centralization, Property 11: Factory function configuration correctness**
   * **Validates: Requirements 6.1, 6.2**
   * 
   * Property: For any cache purpose and optional overrides, the factory should return
   * cache configuration parameters that match the centralized configuration system.
   */
  it('should create cache instances with correct configuration from centralized system', () => {
    fc.assert(
      fc.property(
        // Generate cache purpose
        fc.constantFrom('item-cost', 'cost-calculation', 'validation-result', 'api-response'),
        // Generate optional overrides
        fc.option(
          fc.record({
            maxSize: fc.option(fc.integer({ min: 1, max: 1000 })),
            ttlMs: fc.option(fc.integer({ min: 100, max: 60000 })),
            enableMetrics: fc.option(fc.boolean())
          }),
          { nil: undefined }
        ),
        (purpose: CachePurpose, overrides) => {
          // Create cache instance using factory
          const cache = factory.createCacheInstance(purpose, overrides);
          
          // Verify cache instance is created
          expect(cache).toBeDefined();
          expect(typeof cache.get).toBe('function');
          expect(typeof cache.set).toBe('function');
          expect(typeof cache.clear).toBe('function');
          expect(typeof cache.size).toBe('function');
          
          // Get expected configuration from centralized system
          const cacheConfig = configManager.getCacheConfig();
          
          let expectedMaxSize: number;
          let expectedTtlMs: number;
          
          // Determine expected values based on purpose
          switch (purpose) {
            case 'item-cost':
              expectedMaxSize = cacheConfig.itemCostCacheSize;
              expectedTtlMs = cacheConfig.itemCostCacheTtl;
              break;
            case 'cost-calculation':
              expectedMaxSize = cacheConfig.costCalculationCacheSize;
              expectedTtlMs = cacheConfig.costCalculationCacheTtl;
              break;
            case 'validation-result':
              expectedMaxSize = cacheConfig.validationCacheSize;
              expectedTtlMs = cacheConfig.validationCacheTtl;
              break;
            case 'api-response':
              expectedMaxSize = cacheConfig.apiResponseCacheSize;
              expectedTtlMs = cacheConfig.apiResponseCacheTtl;
              break;
            default:
              expectedMaxSize = cacheConfig.defaultMaxSize;
              expectedTtlMs = cacheConfig.defaultTtlMs;
          }
          
          // Apply overrides to expected values
          if (overrides) {
            expectedMaxSize = overrides.maxSize ?? expectedMaxSize;
            expectedTtlMs = overrides.ttlMs ?? expectedTtlMs;
          }
          
          // Test cache behavior matches expected configuration
          // Fill cache to capacity and verify size limit
          for (let i = 0; i < expectedMaxSize + 5; i++) {
            cache.set(`key${i}`, `value${i}`);
          }
          
          // Cache size should not exceed maxSize
          expect(cache.size()).toBeLessThanOrEqual(expectedMaxSize);
          
          // Test basic cache functionality
          cache.clear();
          cache.set('test-key', 'test-value');
          
          // Value should be retrievable immediately
          expect(cache.get('test-key')).toBe('test-value');
          
          // Verify cache can be cleared
          cache.clear();
          expect(cache.size()).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: codebase-refactoring-centralization, Property 11: Factory function configuration correctness**
   * **Validates: Requirements 6.1, 6.2**
   * 
   * Property: For any API client configuration overrides, the created API client configuration
   * should contain the expected values from centralized configuration with overrides applied.
   */
  it('should create API client configuration with correct values from centralized system', () => {
    fc.assert(
      fc.property(
        // Generate optional API client overrides
        fc.option(
          fc.record({
            baseUrl: fc.option(fc.webUrl()),
            maxRetries: fc.option(fc.integer({ min: 0, max: 10 })),
            retryDelayMs: fc.option(fc.integer({ min: 100, max: 10000 })),
            timeoutMs: fc.option(fc.integer({ min: 1000, max: 60000 }))
          }),
          { nil: undefined }
        ),
        (overrides) => {
          // Create API client configuration using factory
          const apiConfig = factory.createApiClientConfig(overrides);
          
          // Verify configuration object structure
          expect(apiConfig).toBeDefined();
          expect(typeof apiConfig.baseUrl).toBe('string');
          expect(typeof apiConfig.maxRetries).toBe('number');
          expect(typeof apiConfig.retryDelayMs).toBe('number');
          expect(typeof apiConfig.timeoutMs).toBe('number');
          
          // Get expected configuration from centralized system
          const centralizedApiConfig = configManager.getApiConfig();
          
          // Verify values match centralized configuration with overrides applied
          const expectedBaseUrl = overrides?.baseUrl ?? centralizedApiConfig.baseUrl;
          const expectedMaxRetries = overrides?.maxRetries ?? centralizedApiConfig.maxRetries;
          const expectedRetryDelayMs = overrides?.retryDelayMs ?? centralizedApiConfig.retryDelayMs;
          const expectedTimeoutMs = overrides?.timeoutMs ?? centralizedApiConfig.timeoutMs;
          
          expect(apiConfig.baseUrl).toBe(expectedBaseUrl);
          expect(apiConfig.maxRetries).toBe(expectedMaxRetries);
          expect(apiConfig.retryDelayMs).toBe(expectedRetryDelayMs);
          expect(apiConfig.timeoutMs).toBe(expectedTimeoutMs);
          
          // Verify values are within reasonable ranges
          expect(apiConfig.maxRetries).toBeGreaterThanOrEqual(0);
          expect(apiConfig.retryDelayMs).toBeGreaterThan(0);
          expect(apiConfig.timeoutMs).toBeGreaterThan(0);
          
          // Verify base URL is a valid URL format
          expect(() => new URL(apiConfig.baseUrl)).not.toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: codebase-refactoring-centralization, Property 11: Factory function configuration correctness**
   * **Validates: Requirements 6.1, 6.2**
   * 
   * Property: For any service creation request, the factory should create properly
   * configured service instances that are ready for use.
   */
  it('should create service instances that are properly configured and functional', () => {
    fc.assert(
      fc.property(
        // Generate service type to create
        fc.constantFrom('costEngine', 'validationService'),
        (serviceType) => {
          let service: any;
          
          // Create service using factory
          switch (serviceType) {
            case 'costEngine':
              service = factory.createCostEngine();
              
              // Verify CostEngine has expected methods
              expect(service).toBeDefined();
              expect(typeof service.getAttributeCost).toBe('function');
              expect(typeof service.getWeaponCost).toBe('function');
              expect(typeof service.getEquipmentCost).toBe('function');
              expect(typeof service.getPsychicPowerCost).toBe('function');
              expect(typeof service.calculateWeirdoCost).toBe('function');
              expect(typeof service.calculateWarbandCost).toBe('function');
              break;
              
            case 'validationService':
              service = factory.createValidationService();
              
              // Verify ValidationService has expected methods
              expect(service).toBeDefined();
              expect(typeof service.validateWeirdo).toBe('function');
              expect(typeof service.validateWarband).toBe('function');
              expect(typeof service.validateWeaponRequirements).toBe('function');
              expect(typeof service.validateEquipmentLimits).toBe('function');
              expect(typeof service.validateWeirdoPointLimit).toBe('function');
              break;
          }
          
          // Verify service instance is unique (not a singleton)
          const secondService = serviceType === 'costEngine' 
            ? factory.createCostEngine()
            : factory.createValidationService();
          
          // Services should be separate instances
          expect(service).not.toBe(secondService);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: codebase-refactoring-centralization, Property 11: Factory function configuration correctness**
   * **Validates: Requirements 6.1, 6.2**
   * 
   * Property: The convenience functions should create instances with the same configuration
   * as the factory methods, ensuring consistency across different creation approaches.
   */
  it('should create consistent instances through convenience functions and factory methods', () => {
    fc.assert(
      fc.property(
        // Generate cache purpose for testing
        fc.constantFrom('item-cost', 'cost-calculation', 'validation-result', 'api-response'),
        // Generate optional overrides
        fc.option(
          fc.record({
            maxSize: fc.option(fc.integer({ min: 1, max: 1000 })),
            ttlMs: fc.option(fc.integer({ min: 100, max: 60000 }))
          }),
          { nil: undefined }
        ),
        (purpose: CachePurpose, overrides) => {
          // Create cache using factory method
          const factoryCache = factory.createCacheInstance(purpose, overrides);
          
          // Create cache using convenience function
          const convenienceCache = createConfiguredCache(purpose, overrides);
          
          // Both caches should have the same configuration behavior
          // Test by filling both to capacity and verifying same size limits
          const testSize = 10;
          
          for (let i = 0; i < testSize; i++) {
            factoryCache.set(`key${i}`, `value${i}`);
            convenienceCache.set(`key${i}`, `value${i}`);
          }
          
          // Both should have same size behavior
          expect(factoryCache.size()).toBe(convenienceCache.size());
          
          // Both should retrieve same values (check only if values haven't expired)
          const currentSize = factoryCache.size();
          if (currentSize > 0) {
            // Check the most recently added values (less likely to have expired)
            const startIndex = Math.max(0, testSize - currentSize);
            for (let i = startIndex; i < testSize; i++) {
              const factoryValue = factoryCache.get(`key${i}`);
              const convenienceValue = convenienceCache.get(`key${i}`);
              
              // Both should have the same behavior (both null or both have value)
              if (factoryValue !== null) {
                expect(factoryValue).toBe(`value${i}`);
              }
              if (convenienceValue !== null) {
                expect(convenienceValue).toBe(`value${i}`);
              }
              
              // Both should have consistent behavior
              expect(factoryValue === null).toBe(convenienceValue === null);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: codebase-refactoring-centralization, Property 11: Factory function configuration correctness**
   * **Validates: Requirements 6.1, 6.2**
   * 
   * Property: The service bundle creation should provide all configured services
   * with consistent configuration from the centralized system.
   */
  it('should create service bundles with all required services properly configured', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No parameters needed for this test
        () => {
          // Create service bundle
          const bundle = factory.createServiceBundle();
          
          // Verify bundle structure
          expect(bundle).toBeDefined();
          expect(bundle.costEngine).toBeDefined();
          expect(bundle.validationService).toBeDefined();
          expect(bundle.caches).toBeDefined();
          expect(bundle.apiConfig).toBeDefined();
          
          // Verify cache bundle contains all expected caches
          expect(bundle.caches.itemCostCache).toBeDefined();
          expect(bundle.caches.costCalculationCache).toBeDefined();
          expect(bundle.caches.validationCache).toBeDefined();
          expect(bundle.caches.apiResponseCache).toBeDefined();
          
          // Verify services are functional
          expect(typeof bundle.costEngine.calculateWeirdoCost).toBe('function');
          expect(typeof bundle.validationService.validateWarband).toBe('function');
          
          // Verify API config has expected structure
          expect(typeof bundle.apiConfig.baseUrl).toBe('string');
          expect(typeof bundle.apiConfig.maxRetries).toBe('number');
          expect(typeof bundle.apiConfig.retryDelayMs).toBe('number');
          expect(typeof bundle.apiConfig.timeoutMs).toBe('number');
          
          // Verify API config values come from centralized configuration
          const centralizedApiConfig = configManager.getApiConfig();
          expect(bundle.apiConfig.baseUrl).toBe(centralizedApiConfig.baseUrl);
          expect(bundle.apiConfig.maxRetries).toBe(centralizedApiConfig.maxRetries);
          expect(bundle.apiConfig.retryDelayMs).toBe(centralizedApiConfig.retryDelayMs);
          expect(bundle.apiConfig.timeoutMs).toBe(centralizedApiConfig.timeoutMs);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: codebase-refactoring-centralization, Property 11: Factory function configuration correctness**
   * **Validates: Requirements 6.1, 6.2**
   * 
   * Property: Factory functions should handle edge cases gracefully and maintain
   * configuration correctness even with extreme parameter values.
   */
  it('should handle edge cases and maintain configuration correctness', () => {
    fc.assert(
      fc.property(
        // Generate edge case scenarios
        fc.record({
          cacheOverrides: fc.option(
            fc.record({
              maxSize: fc.option(fc.oneof(
                fc.constant(1), // Minimum size
                fc.constant(10000), // Very large size
                fc.integer({ min: 1, max: 1000 })
              )),
              ttlMs: fc.option(fc.oneof(
                fc.constant(1), // Minimum TTL
                fc.constant(86400000), // 24 hours
                fc.integer({ min: 100, max: 60000 })
              ))
            }),
            { nil: undefined }
          ),
          apiOverrides: fc.option(
            fc.record({
              maxRetries: fc.option(fc.oneof(
                fc.constant(0), // No retries
                fc.constant(100), // Many retries
                fc.integer({ min: 0, max: 10 })
              )),
              retryDelayMs: fc.option(fc.oneof(
                fc.constant(1), // Minimum delay
                fc.constant(60000), // 1 minute delay
                fc.integer({ min: 100, max: 10000 })
              ))
            }),
            { nil: undefined }
          )
        }),
        ({ cacheOverrides, apiOverrides }) => {
          // Test cache creation with edge case overrides
          const cache = factory.createCacheInstance('item-cost', cacheOverrides);
          expect(cache).toBeDefined();
          
          // Cache should still function correctly
          cache.set('test', 'value');
          expect(cache.get('test')).toBe('value');
          
          // Test API config creation with edge case overrides
          const apiConfig = factory.createApiClientConfig(apiOverrides);
          expect(apiConfig).toBeDefined();
          
          // API config should have valid values
          expect(apiConfig.maxRetries).toBeGreaterThanOrEqual(0);
          expect(apiConfig.retryDelayMs).toBeGreaterThan(0);
          expect(apiConfig.timeoutMs).toBeGreaterThan(0);
          
          // Values should match overrides when provided (handle null as undefined)
          if (apiOverrides?.maxRetries !== undefined && apiOverrides.maxRetries !== null) {
            expect(apiConfig.maxRetries).toBe(apiOverrides.maxRetries);
          }
          if (apiOverrides?.retryDelayMs !== undefined && apiOverrides.retryDelayMs !== null) {
            expect(apiConfig.retryDelayMs).toBe(apiOverrides.retryDelayMs);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
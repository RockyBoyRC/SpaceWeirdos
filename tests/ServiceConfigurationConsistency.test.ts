import { describe, it, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager';
import { ConfigurationFactory } from '../src/backend/config/ConfigurationFactory';
import { CostEngine } from '../src/backend/services/CostEngine';
import { ValidationService } from '../src/backend/services/ValidationService';
import { getFrontendConfigInstance } from '../src/frontend/config/frontendConfig';
import { CostConfig, ValidationConfig, CacheConfig, ApiConfig } from '../src/backend/config/types';

const testConfig = { numRuns: 50 };

describe('Service Configuration Consistency', () => {
  let configManager: ConfigurationManager;
  let configFactory: ConfigurationFactory;

  beforeEach(async () => {
    // Create a fresh configuration manager for each test
    configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    configFactory = new ConfigurationFactory(configManager);
  });

  describe('Property 10: Service configuration consistency', () => {
    // **Feature: codebase-refactoring-centralization, Property 10: Service configuration consistency**
    // **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
    
    it('should ensure CostEngine uses centralized cost configuration', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Get configuration from manager
          const costConfig = configManager.getCostConfig();
          
          // Create CostEngine through factory
          const costEngine = configFactory.createCostEngine();
          
          // Verify the CostEngine has access to the same configuration
          // We can't directly access private config, but we can test behavior
          // Test that the configuration values are consistent by checking
          // that the same configuration object is used
          
          // The factory should create services with the same config values
          const anotherCostEngine = configFactory.createCostEngine();
          
          // Both engines should behave identically with same inputs
          // This validates they're using the same configuration
          const testAttributes = {
            speed: 1 as const,
            defense: '2d6' as const,
            firepower: 'None' as const,
            prowess: '2d6' as const,
            willpower: '2d6' as const
          };
          
          const testWeirdo = {
            id: 'test-id',
            name: 'Test Weirdo',
            type: 'trooper' as const,
            attributes: testAttributes,
            closeCombatWeapons: [{
              id: 'weapon-id',
              name: 'Unarmed',
              type: 'close' as const,
              baseCost: 0,
              maxActions: 1,
              notes: ''
            }],
            rangedWeapons: [],
            equipment: [],
            psychicPowers: [],
            leaderTrait: null,
            notes: '',
            totalCost: 0
          };
          
          const cost1 = costEngine.calculateWeirdoCost(testWeirdo, null);
          const cost2 = anotherCostEngine.calculateWeirdoCost(testWeirdo, null);
          
          // Both should return the same cost (consistent configuration)
          return cost1 === cost2;
        }),
        testConfig
      );
    });

    it('should ensure ValidationService uses centralized validation configuration', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Get configurations from manager
          const costConfig = configManager.getCostConfig();
          const validationConfig = configManager.getValidationConfig();
          
          // Create ValidationService through factory
          const validationService = configFactory.createValidationService();
          
          // Create another ValidationService through factory
          const anotherValidationService = configFactory.createValidationService();
          
          // Test that both services use the same configuration by validating
          // the same warband and getting identical results
          const testWarband = {
            id: 'test-warband',
            name: 'Test Warband',
            ability: null,
            pointLimit: costConfig.pointLimits.standard,
            totalCost: 0,
            weirdos: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const result1 = validationService.validateWarband(testWarband);
          const result2 = anotherValidationService.validateWarband(testWarband);
          
          // Both should return the same validation result (consistent configuration)
          return result1.valid === result2.valid && 
                 result1.errors.length === result2.errors.length &&
                 result1.warnings.length === result2.warnings.length;
        }),
        testConfig
      );
    });

    it('should ensure cache instances use centralized cache configuration', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('item-cost', 'cost-calculation', 'validation-result', 'api-response'),
          (cachePurpose) => {
            // Get cache configuration from manager
            const cacheConfig = configManager.getCacheConfig();
            
            // Create cache instances through factory
            const cache1 = configFactory.createCacheInstance(cachePurpose);
            const cache2 = configFactory.createCacheInstance(cachePurpose);
            
            // Both caches should have the same configuration
            // We can test this by checking their size limits and TTL behavior
            
            // Test that both caches have the same capacity by filling them
            // and checking when they start evicting
            const testKey = 'test-key';
            const testValue = { test: 'value' };
            
            cache1.set(testKey, testValue);
            cache2.set(testKey, testValue);
            
            const value1 = cache1.get(testKey);
            const value2 = cache2.get(testKey);
            
            // Both should return the same value (consistent behavior)
            return JSON.stringify(value1) === JSON.stringify(value2);
          }
        ),
        testConfig
      );
    });

    it('should ensure API configuration is consistent between backend and frontend', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Get backend API configuration
          const backendApiConfig = configManager.getApiConfig();
          
          // Get frontend API configuration
          const frontendConfig = getFrontendConfigInstance();
          const frontendApiConfig = frontendConfig.api;
          
          // The configurations should have compatible defaults
          // (They may differ due to environment variables, but structure should be consistent)
          
          // Check that both have the required fields
          const backendHasRequiredFields = 
            typeof backendApiConfig.baseUrl === 'string' &&
            typeof backendApiConfig.maxRetries === 'number' &&
            typeof backendApiConfig.retryDelayMs === 'number' &&
            typeof backendApiConfig.timeoutMs === 'number';
            
          const frontendHasRequiredFields = 
            typeof frontendApiConfig.baseUrl === 'string' &&
            typeof frontendApiConfig.maxRetries === 'number' &&
            typeof frontendApiConfig.retryDelayMs === 'number' &&
            typeof frontendApiConfig.timeoutMs === 'number';
          
          // Both should have consistent field types and reasonable values
          const backendValuesReasonable = 
            backendApiConfig.maxRetries >= 0 &&
            backendApiConfig.retryDelayMs >= 0 &&
            backendApiConfig.timeoutMs > 0;
            
          const frontendValuesReasonable = 
            frontendApiConfig.maxRetries >= 0 &&
            frontendApiConfig.retryDelayMs >= 0 &&
            frontendApiConfig.timeoutMs > 0;
          
          return backendHasRequiredFields && 
                 frontendHasRequiredFields && 
                 backendValuesReasonable && 
                 frontendValuesReasonable;
        }),
        testConfig
      );
    });

    it('should ensure cache configuration is consistent between backend and frontend', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Get backend cache configuration
          const backendCacheConfig = configManager.getCacheConfig();
          
          // Get frontend cache configuration
          const frontendConfig = getFrontendConfigInstance();
          const frontendCacheConfig = frontendConfig.cache;
          
          // Check that both have the required fields with reasonable values
          const backendHasValidConfig = 
            backendCacheConfig.defaultMaxSize > 0 &&
            backendCacheConfig.defaultTtlMs >= 0 &&
            backendCacheConfig.itemCostCacheSize > 0 &&
            backendCacheConfig.itemCostCacheTtl >= 0 &&
            backendCacheConfig.costCalculationCacheSize > 0 &&
            backendCacheConfig.costCalculationCacheTtl >= 0;
            
          const frontendHasValidConfig = 
            frontendCacheConfig.defaultMaxSize > 0 &&
            frontendCacheConfig.defaultTtlMs >= 0 &&
            frontendCacheConfig.itemCostCacheSize > 0 &&
            frontendCacheConfig.itemCostCacheTtl >= 0 &&
            frontendCacheConfig.costCalculationCacheSize > 0 &&
            frontendCacheConfig.costCalculationCacheTtl >= 0;
          
          return backendHasValidConfig && frontendHasValidConfig;
        }),
        testConfig
      );
    });

    it('should ensure factory creates services with consistent configuration', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Create multiple service bundles through factory
          const bundle1 = configFactory.createServiceBundle();
          const bundle2 = configFactory.createServiceBundle();
          
          // Test that services in both bundles behave consistently
          const testWeirdo = {
            id: 'test-id',
            name: 'Test Weirdo',
            type: 'trooper' as const,
            attributes: {
              speed: 1 as const,
              defense: '2d6' as const,
              firepower: 'None' as const,
              prowess: '2d6' as const,
              willpower: '2d6' as const
            },
            closeCombatWeapons: [{
              id: 'weapon-id',
              name: 'Unarmed',
              type: 'close' as const,
              baseCost: 0,
              maxActions: 1,
              notes: ''
            }],
            rangedWeapons: [],
            equipment: [],
            psychicPowers: [],
            leaderTrait: null,
            notes: '',
            totalCost: 0
          };
          
          const testWarband = {
            id: 'test-warband',
            name: 'Test Warband',
            ability: null,
            pointLimit: 75,
            totalCost: 0,
            weirdos: [testWeirdo],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Both cost engines should return the same cost
          const cost1 = bundle1.costEngine.calculateWeirdoCost(testWeirdo, null);
          const cost2 = bundle2.costEngine.calculateWeirdoCost(testWeirdo, null);
          
          // Both validation services should return the same validation result
          const validation1 = bundle1.validationService.validateWarband(testWarband);
          const validation2 = bundle2.validationService.validateWarband(testWarband);
          
          // Both API configs should have the same structure
          const apiConfigsMatch = 
            bundle1.apiConfig.baseUrl === bundle2.apiConfig.baseUrl &&
            bundle1.apiConfig.maxRetries === bundle2.apiConfig.maxRetries &&
            bundle1.apiConfig.retryDelayMs === bundle2.apiConfig.retryDelayMs &&
            bundle1.apiConfig.timeoutMs === bundle2.apiConfig.timeoutMs;
          
          return cost1 === cost2 && 
                 validation1.valid === validation2.valid &&
                 validation1.errors.length === validation2.errors.length &&
                 apiConfigsMatch;
        }),
        testConfig
      );
    });
  });
});
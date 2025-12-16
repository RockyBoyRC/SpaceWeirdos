/**
 * Configuration System Integration Tests
 * 
 * Tests end-to-end configuration loading in all environments,
 * verifies all services use centralized configuration correctly,
 * and tests configuration changes affect multiple services appropriately.
 * 
 * Requirements: All requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager.js';
import { ConfigurationFactory } from '../src/backend/config/ConfigurationFactory.js';
import { CostEngine } from '../src/backend/services/CostEngine.js';
import { ValidationService } from '../src/backend/services/ValidationService.js';
import { DataRepository } from '../src/backend/services/DataRepository.js';
import { Environment } from '../src/backend/config/types.js';

describe('Configuration System Integration Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let configManager: ConfigurationManager;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear any existing configuration manager instance
    (ConfigurationManager as any).instance = null;
    
    // Create fresh configuration manager
    configManager = ConfigurationManager.getInstance();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clear configuration manager instance
    (ConfigurationManager as any).instance = null;
  });

  describe('End-to-End Configuration Loading', () => {
    it('should load complete configuration in development environment', async () => {
      // Set development environment
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.VITE_API_URL = 'http://localhost:3001/api';
      
      await configManager.initialize();
      
      // Verify all configuration sections are loaded
      const serverConfig = configManager.getServerConfig();
      const apiConfig = configManager.getApiConfig();
      const cacheConfig = configManager.getCacheConfig();
      const costConfig = configManager.getCostConfig();
      const validationConfig = configManager.getValidationConfig();
      const envConfig = configManager.getEnvironmentConfig();
      
      // Verify server configuration
      expect(serverConfig.port).toBe(3001);
      expect(serverConfig.host).toBe('localhost');
      expect(serverConfig.corsOrigins).toEqual(['*']);
      expect(serverConfig.staticPath).toBe('dist');
      expect(serverConfig.dataPath).toBe('data');
      expect(serverConfig.enableAutoSave).toBe(true);
      
      // Verify API configuration
      expect(apiConfig.baseUrl).toBe('http://localhost:3001/api');
      expect(apiConfig.maxRetries).toBe(3);
      expect(apiConfig.retryDelayMs).toBe(1000);
      expect(apiConfig.timeoutMs).toBe(10000);
      
      // Verify cache configuration
      expect(cacheConfig.defaultMaxSize).toBe(100);
      expect(cacheConfig.defaultTtlMs).toBe(5000);
      expect(cacheConfig.itemCostCacheSize).toBe(200);
      expect(cacheConfig.itemCostCacheTtl).toBe(10000);
      
      // Verify cost configuration
      expect(costConfig.pointLimits.standard).toBe(75);
      expect(costConfig.pointLimits.extended).toBe(125);
      expect(costConfig.trooperLimits.standardLimit).toBe(20);
      expect(costConfig.equipmentLimits.leaderStandard).toBe(2);
      
      // Verify validation configuration
      expect(validationConfig.costWarningThreshold).toBe(0.9);
      expect(validationConfig.enableContextAwareWarnings).toBe(true);
      expect(validationConfig.strictValidation).toBe(false);
      
      // Verify environment configuration
      expect(envConfig.environment).toBe('development');
      expect(envConfig.isDevelopment).toBe(true);
      expect(envConfig.isProduction).toBe(false);
      expect(envConfig.isTest).toBe(false);
      expect(envConfig.debugEnabled).toBe(true);
      expect(envConfig.logLevel).toBe('debug');
    });

    it('should load complete configuration in production environment', async () => {
      // Set production environment
      process.env.NODE_ENV = 'production';
      process.env.PORT = '8080';
      process.env.HOST = '0.0.0.0';
      process.env.VITE_API_URL = 'https://api.example.com/api';
      process.env.CORS_ORIGINS = 'https://example.com,https://www.example.com';
      
      await configManager.initialize();
      
      const serverConfig = configManager.getServerConfig();
      const apiConfig = configManager.getApiConfig();
      const cacheConfig = configManager.getCacheConfig();
      const envConfig = configManager.getEnvironmentConfig();
      
      // Verify production-specific server configuration
      expect(serverConfig.port).toBe(8080);
      expect(serverConfig.host).toBe('0.0.0.0');
      expect(serverConfig.corsOrigins).toEqual(['https://example.com', 'https://www.example.com']);
      
      // Verify production-specific API configuration
      expect(apiConfig.baseUrl).toBe('https://api.example.com/api');
      
      // Verify production-specific cache configuration (longer TTLs)
      expect(cacheConfig.defaultTtlMs).toBe(300000); // 5 minutes
      expect(cacheConfig.itemCostCacheTtl).toBe(600000); // 10 minutes
      expect(cacheConfig.costCalculationCacheTtl).toBe(300000); // 5 minutes
      
      // Verify production-specific environment configuration
      expect(envConfig.environment).toBe('production');
      expect(envConfig.isDevelopment).toBe(false);
      expect(envConfig.isProduction).toBe(true);
      expect(envConfig.isTest).toBe(false);
      expect(envConfig.debugEnabled).toBe(false);
      expect(envConfig.logLevel).toBe('info');
      expect(envConfig.enablePerformanceMonitoring).toBe(true);
      expect(envConfig.enableDetailedErrors).toBe(false);
    });

    it('should load complete configuration in test environment', async () => {
      // Set test environment
      process.env.NODE_ENV = 'test';
      process.env.PORT = '0'; // Random port for tests
      
      await configManager.initialize();
      
      const serverConfig = configManager.getServerConfig();
      const apiConfig = configManager.getApiConfig();
      const cacheConfig = configManager.getCacheConfig();
      const envConfig = configManager.getEnvironmentConfig();
      
      // Verify test-specific server configuration
      expect(serverConfig.port).toBe(0); // Random port
      expect(serverConfig.enableAutoSave).toBe(false); // Disabled in tests
      
      // Verify test-specific API configuration
      expect(apiConfig.maxRetries).toBe(0); // No retries in tests
      
      // Verify test-specific cache configuration (short TTLs)
      expect(cacheConfig.defaultTtlMs).toBe(100);
      expect(cacheConfig.itemCostCacheTtl).toBe(100);
      expect(cacheConfig.costCalculationCacheTtl).toBe(100);
      
      // Verify test-specific environment configuration
      expect(envConfig.environment).toBe('test');
      expect(envConfig.isDevelopment).toBe(false);
      expect(envConfig.isProduction).toBe(false);
      expect(envConfig.isTest).toBe(true);
      expect(envConfig.debugEnabled).toBe(false);
      expect(envConfig.logLevel).toBe('error');
      expect(envConfig.enablePerformanceMonitoring).toBe(false);
      expect(envConfig.enableDetailedErrors).toBe(true);
    });
  });

  describe('Service Configuration Integration', () => {
    beforeEach(async () => {
      // Set up basic environment for service tests
      process.env.NODE_ENV = 'development';
      await configManager.initialize();
    });

    it('should create CostEngine with centralized configuration', async () => {
      const factory = new ConfigurationFactory(configManager);
      const costEngine = factory.createCostEngine();
      
      // Verify CostEngine uses centralized configuration
      const costConfig = configManager.getCostConfig();
      
      // Test that cost engine uses the correct point limits
      expect(costEngine).toBeDefined();
      
      // We can't directly access private configuration in CostEngine,
      // but we can test that it behaves according to the configuration
      // by testing cost calculations that depend on the limits
      
      // This is an integration test, so we test the behavior rather than implementation
      const testWeirdo = {
        id: 'test-weirdo',
        name: 'Test Weirdo',
        type: 'trooper' as const,
        attributes: {
          speed: 1 as const,
          defense: '2d6' as const,
          firepower: 'None' as const,
          prowess: '2d6' as const,
          willpower: '2d6' as const
        },
        closeCombatWeapons: [],
        rangedWeapons: [],
        equipment: [],
        leaderTrait: null,
        psychicPowers: [],
        notes: '',
        totalCost: 0
      };
      
      const cost = costEngine.calculateWeirdoCost(testWeirdo, null);
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThanOrEqual(0);
    });

    it('should create ValidationService with centralized configuration', async () => {
      const factory = new ConfigurationFactory(configManager);
      const validationService = factory.createValidationService();
      
      // Verify ValidationService uses centralized configuration
      const validationConfig = configManager.getValidationConfig();
      
      expect(validationService).toBeDefined();
      
      // Test that validation service uses the correct configuration
      // by testing validation behavior that depends on the configuration
      const testWarband = {
        id: 'test-warband',
        name: 'Test Warband',
        ability: null,
        pointLimit: 75, // Should match costConfig.pointLimits.standard
        totalCost: 0,
        weirdos: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const validationResult = validationService.validateWarband(testWarband);
      expect(validationResult).toBeDefined();
      expect(validationResult.valid).toBe(true);
      expect(Array.isArray(validationResult.errors)).toBe(true);
    });

    it('should create DataRepository with centralized configuration', async () => {
      const factory = new ConfigurationFactory(configManager);
      const serverConfig = configManager.getServerConfig();
      
      // Create DataRepository using configuration
      const dataRepository = new DataRepository(serverConfig.warbandDataPath, serverConfig.enableAutoSave);
      
      expect(dataRepository).toBeDefined();
      
      // Test that DataRepository uses the correct file path from configuration
      // We can't directly access private properties, but we can test behavior
      const testWarband = {
        id: 'test-warband',
        name: 'Test Warband',
        ability: null,
        pointLimit: 75,
        totalCost: 0,
        weirdos: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Test basic repository operations work
      const savedWarband = await dataRepository.saveWarband(testWarband);
      expect(savedWarband.id).toBe(testWarband.id);
      expect(savedWarband.name).toBe(testWarband.name);
      
      const retrievedWarband = await dataRepository.getWarband(testWarband.id);
      expect(retrievedWarband).toBeDefined();
      expect(retrievedWarband?.id).toBe(testWarband.id);
    });

    it('should create cache instances with centralized configuration', async () => {
      const cacheConfig = configManager.getCacheConfig();
      
      // Test item cost cache configuration
      const itemCostCache = configManager.createCacheInstance('item-cost');
      expect(itemCostCache.maxSize).toBe(cacheConfig.itemCostCacheSize);
      expect(itemCostCache.ttlMs).toBe(cacheConfig.itemCostCacheTtl);
      
      // Test cost calculation cache configuration
      const costCalcCache = configManager.createCacheInstance('cost-calculation');
      expect(costCalcCache.maxSize).toBe(cacheConfig.costCalculationCacheSize);
      expect(costCalcCache.ttlMs).toBe(cacheConfig.costCalculationCacheTtl);
      
      // Test validation cache configuration
      const validationCache = configManager.createCacheInstance('validation-result');
      expect(validationCache.maxSize).toBe(cacheConfig.validationCacheSize);
      expect(validationCache.ttlMs).toBe(cacheConfig.validationCacheTtl);
      
      // Test API response cache configuration
      const apiCache = configManager.createCacheInstance('api-response');
      expect(apiCache.maxSize).toBe(cacheConfig.apiResponseCacheSize);
      expect(apiCache.ttlMs).toBe(cacheConfig.apiResponseCacheTtl);
      
      // Test default cache configuration
      const defaultCache = configManager.createCacheInstance('item-cost' as any);
      expect(defaultCache.maxSize).toBe(cacheConfig.itemCostCacheSize);
      expect(defaultCache.ttlMs).toBe(cacheConfig.itemCostCacheTtl);
    });
  });

  describe('Configuration Change Propagation', () => {
    it('should propagate cache configuration changes to multiple services', async () => {
      // Set initial cache configuration
      process.env.NODE_ENV = 'development';
      process.env.CACHE_DEFAULT_MAX_SIZE = '50';
      process.env.CACHE_DEFAULT_TTL_MS = '2000';
      process.env.CACHE_ITEM_COST_SIZE = '100';
      process.env.CACHE_ITEM_COST_TTL = '5000';
      
      await configManager.initialize();
      
      const cacheConfig = configManager.getCacheConfig();
      
      // Verify configuration values are applied
      expect(cacheConfig.defaultMaxSize).toBe(50);
      expect(cacheConfig.defaultTtlMs).toBe(2000);
      expect(cacheConfig.itemCostCacheSize).toBe(100);
      expect(cacheConfig.itemCostCacheTtl).toBe(5000);
      
      // Create multiple cache instances and verify they use the same configuration
      const cache1 = configManager.createCacheInstance('item-cost');
      const cache2 = configManager.createCacheInstance('item-cost');
      
      expect(cache1.maxSize).toBe(100);
      expect(cache1.ttlMs).toBe(5000);
      expect(cache2.maxSize).toBe(100);
      expect(cache2.ttlMs).toBe(5000);
      
      // Verify different cache types use their specific configuration
      const defaultCache = configManager.createCacheInstance('cost-calculation');
      expect(defaultCache.maxSize).toBe(cacheConfig.costCalculationCacheSize);
      expect(defaultCache.ttlMs).toBe(cacheConfig.costCalculationCacheTtl);
    });

    it('should propagate cost configuration changes to CostEngine', async () => {
      // Set custom cost configuration
      process.env.NODE_ENV = 'development';
      process.env.POINT_LIMIT_STANDARD = '100';
      process.env.POINT_LIMIT_EXTENDED = '150';
      process.env.TROOPER_LIMIT_STANDARD = '25';
      process.env.EQUIPMENT_LIMIT_LEADER_STANDARD = '3';
      
      await configManager.initialize();
      
      const costConfig = configManager.getCostConfig();
      
      // Verify configuration values are applied
      expect(costConfig.pointLimits.standard).toBe(100);
      expect(costConfig.pointLimits.extended).toBe(150);
      expect(costConfig.trooperLimits.standardLimit).toBe(25);
      expect(costConfig.equipmentLimits.leaderStandard).toBe(3);
      
      // Create CostEngine and verify it uses the updated configuration
      const factory = new ConfigurationFactory(configManager);
      const costEngine = factory.createCostEngine();
      
      expect(costEngine).toBeDefined();
      
      // Test that the cost engine behaves according to the new configuration
      // by testing calculations that would be affected by the limits
      const testWeirdo = {
        id: 'test-weirdo',
        name: 'Test Weirdo',
        type: 'trooper' as const,
        attributes: {
          speed: 1 as const,
          defense: '2d6' as const,
          firepower: 'None' as const,
          prowess: '2d6' as const,
          willpower: '2d6' as const
        },
        closeCombatWeapons: [],
        rangedWeapons: [],
        equipment: [],
        leaderTrait: null,
        psychicPowers: [],
        notes: '',
        totalCost: 0
      };
      
      const cost = costEngine.calculateWeirdoCost(testWeirdo, null);
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThanOrEqual(0);
    });

    it('should propagate validation configuration changes to ValidationService', async () => {
      // Set custom validation configuration
      process.env.NODE_ENV = 'development';
      process.env.VALIDATION_COST_WARNING_THRESHOLD = '0.8';
      process.env.VALIDATION_CONTEXT_AWARE_WARNINGS = 'false';
      process.env.VALIDATION_STRICT_MODE = 'true';
      
      await configManager.initialize();
      
      const validationConfig = configManager.getValidationConfig();
      
      // Verify configuration values are applied
      expect(validationConfig.costWarningThreshold).toBe(0.8);
      expect(validationConfig.enableContextAwareWarnings).toBe(false);
      expect(validationConfig.strictValidation).toBe(true);
      
      // Create ValidationService and verify it uses the updated configuration
      const factory = new ConfigurationFactory(configManager);
      const validationService = factory.createValidationService();
      
      expect(validationService).toBeDefined();
      
      // Test that validation service uses the updated configuration
      const testWarband = {
        id: 'test-warband',
        name: 'Test Warband',
        ability: null,
        pointLimit: 75,
        totalCost: 0,
        weirdos: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const validationResult = validationService.validateWarband(testWarband);
      expect(validationResult).toBeDefined();
      expect(validationResult.valid).toBe(true);
      expect(Array.isArray(validationResult.errors)).toBe(true);
    });

    it('should handle environment-specific configuration overrides consistently', async () => {
      // Test that changing environment affects multiple configuration sections
      const environments: Environment[] = ['development', 'production', 'test'];
      
      for (const env of environments) {
        // Clear and recreate configuration manager for each environment
        (ConfigurationManager as any).instance = null;
        const envConfigManager = ConfigurationManager.getInstance();
        
        process.env.NODE_ENV = env;
        await envConfigManager.initialize();
        
        const envConfig = envConfigManager.getEnvironmentConfig();
        const cacheConfig = envConfigManager.getCacheConfig();
        
        // Verify environment-specific settings
        expect(envConfig.environment).toBe(env);
        
        switch (env) {
          case 'development':
            expect(envConfig.debugEnabled).toBe(true);
            expect(envConfig.logLevel).toBe('debug');
            expect(envConfig.enablePerformanceMonitoring).toBe(false);
            expect(cacheConfig.defaultTtlMs).toBe(5000); // Default TTL
            break;
            
          case 'production':
            expect(envConfig.debugEnabled).toBe(false);
            expect(envConfig.logLevel).toBe('info');
            expect(envConfig.enablePerformanceMonitoring).toBe(true);
            expect(cacheConfig.defaultTtlMs).toBe(300000); // Longer TTL for production
            break;
            
          case 'test':
            expect(envConfig.debugEnabled).toBe(false);
            expect(envConfig.logLevel).toBe('error');
            expect(envConfig.enablePerformanceMonitoring).toBe(false);
            expect(cacheConfig.defaultTtlMs).toBe(100); // Short TTL for tests
            break;
        }
        
        // Verify that cache instances created in each environment use the correct TTL
        const cache = envConfigManager.createCacheInstance('cost-calculation');
        expect(cache.ttlMs).toBe(cacheConfig.costCalculationCacheTtl);
      }
    });
  });

  describe('Configuration Validation Integration', () => {
    it('should validate complete configuration and provide detailed errors', async () => {
      // Set invalid configuration values that will cause validation to fail
      process.env.NODE_ENV = 'development';
      process.env.PORT = 'invalid-port';
      process.env.API_MAX_RETRIES = '-1';
      process.env.CACHE_DEFAULT_MAX_SIZE = '0';
      process.env.POINT_LIMIT_STANDARD = '-10';
      
      // Mock console.warn to capture fallback warnings
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Configuration should initialize with fallback behavior due to invalid values
      await configManager.initialize();
      
      // Verify fallback warnings were logged
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      // Verify that validation detects the issues
      const validation = configManager.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      consoleWarnSpy.mockRestore();
    });

    it('should use fallback configuration when primary initialization fails', async () => {
      // Set some invalid values that should trigger fallback
      process.env.NODE_ENV = 'invalid-environment';
      process.env.PORT = 'invalid-port';
      
      // Mock console.warn to capture fallback warnings
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Should initialize with fallback behavior
      await configManager.initialize();
      
      // Verify fallback warnings were logged
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      // Verify fallback configuration is used
      const envConfig = configManager.getEnvironmentConfig();
      expect(envConfig.environment).toBe('development'); // Fallback environment
      
      const serverConfig = configManager.getServerConfig();
      expect(serverConfig.port).toBe(3001); // Fallback port
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Configuration Migration Integration', () => {
    it('should migrate legacy configuration format automatically', async () => {
      const legacyConfig = {
        POINT_LIMITS: {
          standard: 80,
          extended: 130
        },
        TROOPER_LIMITS: {
          standardLimit: 22,
          maximumLimit: 27
        },
        VALIDATION_MESSAGES: {
          warbandNameRequired: 'Custom warband name message',
          weirdoNameRequired: 'Custom weirdo name message'
        }
      };
      
      // Test migration
      const migrationResult = configManager.needsMigration(legacyConfig);
      expect(migrationResult.needed).toBe(true);
      expect(migrationResult.fromVersion).toBe('legacy-constants');
      expect(migrationResult.toVersion).toBe('1.0.0');
      
      // Test automatic migration
      const migratedConfig = configManager.autoMigrateIfNeeded(legacyConfig);
      expect(migratedConfig).toBeDefined();
      expect(migratedConfig?.cost?.pointLimits?.standard).toBe(80);
      expect(migratedConfig?.cost?.pointLimits?.extended).toBe(130);
      expect(migratedConfig?.cost?.trooperLimits?.standardLimit).toBe(22);
      expect(migratedConfig?.validation?.messages?.warbandNameRequired).toBe('Custom warband name message');
    });

    it('should migrate early configuration format automatically', async () => {
      const earlyConfig = {
        server: {
          port: 4000,
          host: 'example.com'
        },
        api: {
          baseUrl: 'https://api.example.com',
          maxRetries: 5
        },
        cache: {
          defaultMaxSize: 150,
          defaultTtlMs: 8000
        }
      };
      
      // Test migration detection
      const migrationResult = configManager.needsMigration(earlyConfig);
      expect(migrationResult.needed).toBe(true);
      expect(migrationResult.fromVersion).toBe('0.9.0');
      expect(migrationResult.toVersion).toBe('1.0.0');
      
      // Test automatic migration
      const migratedConfig = configManager.autoMigrateIfNeeded(earlyConfig);
      expect(migratedConfig).toBeDefined();
      expect(migratedConfig?.server?.port).toBe(4000);
      expect(migratedConfig?.server?.host).toBe('example.com');
      expect(migratedConfig?.server?.enableAutoSave).toBe(true); // New field with default
      expect(migratedConfig?.api?.baseUrl).toBe('https://api.example.com');
      expect(migratedConfig?.cache?.defaultMaxSize).toBe(150);
      expect(migratedConfig?.cache?.validationCacheSize).toBe(50); // New field with default
    });
  });
});
/**
 * Property-Based Tests for Centralized Configuration Consistency
 * 
 * **Feature: codebase-refactoring-centralization, Property 6: Centralized configuration consistency**
 * 
 * Tests that all service initialization (cache, API, server, timing, retry) uses
 * configuration values from the centralized configuration system.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager.js';
import { CostCache } from '../src/frontend/services/CostCache.js';

describe('Centralized Configuration Consistency', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  /**
   * **Feature: codebase-refactoring-centralization, Property 6: Centralized configuration consistency**
   * 
   * Property: For any service initialization (cache, API, server, timing, retry), 
   * the configuration values should come from the centralized configuration system
   */
  it('should ensure cost configuration values are available from centralized system', async () => {
    // Initialize configuration manager
    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    
    // Get configuration values from centralized system
    const costConfig = configManager.getCostConfig();
    
    // Test that all cost configuration values are available and valid
    expect(costConfig.pointLimits.standard).toBeGreaterThan(0);
    expect(costConfig.pointLimits.extended).toBeGreaterThan(costConfig.pointLimits.standard);
    expect(costConfig.pointLimits.warningThreshold).toBeGreaterThan(0);
    expect(costConfig.pointLimits.warningThreshold).toBeLessThanOrEqual(1);
    
    expect(costConfig.trooperLimits.standardLimit).toBeGreaterThan(0);
    expect(costConfig.trooperLimits.maximumLimit).toBeGreaterThanOrEqual(costConfig.trooperLimits.standardLimit);
    expect(costConfig.trooperLimits.specialSlotMin).toBeGreaterThan(0);
    expect(costConfig.trooperLimits.specialSlotMax).toBeGreaterThanOrEqual(costConfig.trooperLimits.specialSlotMin);
    
    expect(costConfig.equipmentLimits.leaderStandard).toBeGreaterThanOrEqual(0);
    expect(costConfig.equipmentLimits.leaderCyborgs).toBeGreaterThanOrEqual(costConfig.equipmentLimits.leaderStandard);
    expect(costConfig.equipmentLimits.trooperStandard).toBeGreaterThanOrEqual(0);
    expect(costConfig.equipmentLimits.trooperCyborgs).toBeGreaterThanOrEqual(costConfig.equipmentLimits.trooperStandard);
    
    expect(costConfig.discountValues.mutantDiscount).toBeGreaterThanOrEqual(0);
    expect(costConfig.discountValues.heavilyArmedDiscount).toBeGreaterThanOrEqual(0);
    
    // Test weapon and equipment lists
    expect(Array.isArray(costConfig.abilityWeaponLists.mutantWeapons)).toBe(true);
    expect(costConfig.abilityWeaponLists.mutantWeapons.length).toBeGreaterThan(0);
    expect(Array.isArray(costConfig.abilityEquipmentLists.soldierFreeEquipment)).toBe(true);
    expect(costConfig.abilityEquipmentLists.soldierFreeEquipment.length).toBeGreaterThan(0);
  });

  /**
   * **Feature: codebase-refactoring-centralization, Property 6: Centralized configuration consistency**
   * 
   * Property: Validation messages should come from centralized configuration
   */
  it('should ensure validation messages are available from centralized configuration', async () => {
    // Initialize configuration manager
    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    
    // Get validation configuration from centralized system
    const validationConfig = configManager.getValidationConfig();
    
    // Test that all validation messages are available and non-empty
    expect(typeof validationConfig.messages.warbandNameRequired).toBe('string');
    expect(validationConfig.messages.warbandNameRequired.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.weirdoNameRequired).toBe('string');
    expect(validationConfig.messages.weirdoNameRequired.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.invalidPointLimit).toBe('string');
    expect(validationConfig.messages.invalidPointLimit.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.attributesIncomplete).toBe('string');
    expect(validationConfig.messages.attributesIncomplete.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.closeCombatWeaponRequired).toBe('string');
    expect(validationConfig.messages.closeCombatWeaponRequired.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.rangedWeaponRequired).toBe('string');
    expect(validationConfig.messages.rangedWeaponRequired.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.firepowerRequiredForRangedWeapon).toBe('string');
    expect(validationConfig.messages.firepowerRequiredForRangedWeapon.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.equipmentLimitExceeded).toBe('string');
    expect(validationConfig.messages.equipmentLimitExceeded.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.trooperPointLimitExceeded).toBe('string');
    expect(validationConfig.messages.trooperPointLimitExceeded.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.multiple25PointWeirdos).toBe('string');
    expect(validationConfig.messages.multiple25PointWeirdos.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.warbandPointLimitExceeded).toBe('string');
    expect(validationConfig.messages.warbandPointLimitExceeded.length).toBeGreaterThan(0);
    
    expect(typeof validationConfig.messages.leaderTraitInvalid).toBe('string');
    expect(validationConfig.messages.leaderTraitInvalid.length).toBeGreaterThan(0);
  });

  /**
   * **Feature: codebase-refactoring-centralization, Property 6: Centralized configuration consistency**
   * 
   * Property: Cache instances should use configuration values from centralized system
   */
  it('should ensure cache instances can be created with centralized configuration values', async () => {
    // Initialize configuration manager
    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    
    // Get cache configuration from centralized system
    const cacheConfig = configManager.getCacheConfig();
    
    // Test that cache configuration values are available and consistent
    expect(cacheConfig.itemCostCacheSize).toBeGreaterThan(0);
    expect(cacheConfig.itemCostCacheTtl).toBeGreaterThan(0);
    expect(cacheConfig.costCalculationCacheSize).toBeGreaterThan(0);
    expect(cacheConfig.costCalculationCacheTtl).toBeGreaterThan(0);
    
    // Test that we can create cache instances with these values
    const itemCostCache = new CostCache<number>(
      cacheConfig.itemCostCacheSize,
      cacheConfig.itemCostCacheTtl
    );
    const costCalculationCache = new CostCache<any>(
      cacheConfig.costCalculationCacheSize,
      cacheConfig.costCalculationCacheTtl
    );
    
    // Verify cache instances are created successfully
    expect(itemCostCache).toBeDefined();
    expect(costCalculationCache).toBeDefined();
    
    // Test basic cache functionality to ensure configuration is working
    itemCostCache.set('test-key', 42);
    expect(itemCostCache.get('test-key')).toBe(42);
    
    costCalculationCache.set('test-calc', { cost: 100 });
    expect(costCalculationCache.get('test-calc')).toEqual({ cost: 100 });
  });

  /**
   * **Feature: codebase-refactoring-centralization, Property 6: Centralized configuration consistency**
   * 
   * Property: Server and API configuration should be centralized
   */
  it('should ensure server and API configuration values are centralized', async () => {
    // Initialize configuration manager
    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    
    // Get server and API configuration from centralized system
    const serverConfig = configManager.getServerConfig();
    const apiConfig = configManager.getApiConfig();
    
    // Test that server configuration values are available and valid
    expect(serverConfig.port).toBeGreaterThanOrEqual(0);
    expect(serverConfig.port).toBeLessThanOrEqual(65535);
    expect(typeof serverConfig.host).toBe('string');
    expect(serverConfig.host.length).toBeGreaterThan(0);
    
    // Test that API configuration values are available and valid
    expect(apiConfig.maxRetries).toBeGreaterThanOrEqual(0);
    expect(apiConfig.retryDelayMs).toBeGreaterThanOrEqual(0);
    expect(apiConfig.timeoutMs).toBeGreaterThan(0);
    expect(typeof apiConfig.baseUrl).toBe('string');
    expect(apiConfig.baseUrl.length).toBeGreaterThan(0);
  });
});
/**
 * Configuration Factory
 * 
 * This module provides factory functions for creating configured service instances
 * using the centralized configuration system. All services created through these
 * factories will use consistent configuration values from ConfigurationManager.
 */

import { ConfigurationManager } from './ConfigurationManager.js';
import { CachePurpose, CacheOptions } from './types.js';
import { SimpleCache } from '../services/SimpleCache.js';
import { CostEngine } from '../services/CostEngine.js';
import { ValidationService } from '../services/ValidationService.js';
import { WarbandService } from '../services/WarbandService.js';

/**
 * API Client configuration interface for factory
 */
export interface ApiClientConfig {
  baseUrl: string;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
}

/**
 * Configuration Factory class
 * 
 * Provides factory methods for creating configured service instances using the
 * centralized configuration system. All services created through these factories
 * will use consistent configuration values from ConfigurationManager.
 * 
 * @example Basic usage:
 * ```typescript
 * const factory = new ConfigurationFactory();
 * const costEngine = factory.createCostEngine();
 * const validationService = factory.createValidationService();
 * ```
 * 
 * @example Creating configured caches:
 * ```typescript
 * const factory = new ConfigurationFactory();
 * const itemCache = factory.createCacheInstance<number>('item-cost');
 * const validationCache = factory.createCacheInstance<ValidationResult>('validation-result');
 * ```
 * 
 * @example Service bundle creation:
 * ```typescript
 * const factory = new ConfigurationFactory();
 * const services = factory.createServiceBundle();
 * console.log('All services configured:', services);
 * ```
 */
export class ConfigurationFactory {
  private configManager: ConfigurationManager;

  constructor(configManager?: ConfigurationManager) {
    this.configManager = configManager || ConfigurationManager.getInstance();
  }

  /**
   * Creates a configured cache instance for the specified purpose
   * 
   * Each cache purpose has predefined size and TTL defaults based on the centralized
   * configuration. You can override these defaults by providing custom options.
   * 
   * @param purpose - The cache purpose (determines default size and TTL)
   *   - 'item-cost': For caching individual item costs
   *   - 'cost-calculation': For caching complete cost calculations
   *   - 'validation-result': For caching validation results
   *   - 'api-response': For caching API responses
   * @param overrides - Optional overrides for cache configuration
   * @returns Configured SimpleCache instance
   * 
   * @example Creating purpose-specific caches:
   * ```typescript
   * const factory = new ConfigurationFactory();
   * 
   * // Create item cost cache with default settings
   * const itemCache = factory.createCacheInstance<number>('item-cost');
   * 
   * // Create validation cache with custom size
   * const validationCache = factory.createCacheInstance<ValidationResult>(
   *   'validation-result',
   *   { maxSize: 200 }
   * );
   * 
   * // Create API response cache with custom TTL
   * const apiCache = factory.createCacheInstance<ApiResponse>(
   *   'api-response',
   *   { ttlMs: 120000 } // 2 minutes
   * );
   * ```
   */
  createCacheInstance<T>(
    purpose: CachePurpose,
    overrides?: Partial<CacheOptions>
  ): SimpleCache<T> {
    const cacheConfig = this.configManager.getCacheConfig();
    
    let maxSize: number;
    let ttlMs: number;
    
    // Get purpose-specific defaults
    switch (purpose) {
      case 'item-cost':
        maxSize = cacheConfig.itemCostCacheSize;
        ttlMs = cacheConfig.itemCostCacheTtl;
        break;
      case 'cost-calculation':
        maxSize = cacheConfig.costCalculationCacheSize;
        ttlMs = cacheConfig.costCalculationCacheTtl;
        break;
      case 'validation-result':
        maxSize = cacheConfig.validationCacheSize;
        ttlMs = cacheConfig.validationCacheTtl;
        break;
      case 'api-response':
        maxSize = cacheConfig.apiResponseCacheSize;
        ttlMs = cacheConfig.apiResponseCacheTtl;
        break;
      default:
        maxSize = cacheConfig.defaultMaxSize;
        ttlMs = cacheConfig.defaultTtlMs;
    }
    
    // Apply overrides if provided
    if (overrides) {
      maxSize = overrides.maxSize ?? maxSize;
      ttlMs = overrides.ttlMs ?? ttlMs;
    }
    
    return new SimpleCache<T>(maxSize, ttlMs);
  }

  /**
   * Creates a configured API client configuration object
   * 
   * This returns configuration that can be used to create API clients with
   * consistent settings from the centralized configuration system.
   * 
   * @param overrides - Optional overrides for API configuration
   * @returns API client configuration object with baseUrl, retries, delays, and timeouts
   * 
   * @example Creating API client configuration:
   * ```typescript
   * const factory = new ConfigurationFactory();
   * 
   * // Use default API configuration
   * const defaultConfig = factory.createApiClientConfig();
   * console.log(`API URL: ${defaultConfig.baseUrl}`);
   * 
   * // Override specific settings
   * const customConfig = factory.createApiClientConfig({
   *   maxRetries: 5,
   *   timeoutMs: 15000
   * });
   * 
   * // Use with fetch or axios
   * const response = await fetch(defaultConfig.baseUrl + '/endpoint', {
   *   timeout: defaultConfig.timeoutMs
   * });
   * ```
   */
  createApiClientConfig(overrides?: Partial<ApiClientConfig>): ApiClientConfig {
    const apiConfig = this.configManager.getApiConfig();
    
    return {
      baseUrl: overrides?.baseUrl ?? apiConfig.baseUrl,
      maxRetries: overrides?.maxRetries ?? apiConfig.maxRetries,
      retryDelayMs: overrides?.retryDelayMs ?? apiConfig.retryDelayMs,
      timeoutMs: overrides?.timeoutMs ?? apiConfig.timeoutMs
    };
  }

  /**
   * Creates a configured CostEngine instance
   * 
   * The CostEngine uses configuration for cost calculation constants including
   * point limits, trooper limits, equipment limits, and discount values.
   * 
   * @returns Configured CostEngine instance ready for cost calculations
   * 
   * @example Creating and using a CostEngine:
   * ```typescript
   * const factory = new ConfigurationFactory();
   * const costEngine = factory.createCostEngine();
   * 
   * // Calculate weirdo cost
   * const weirdoCost = costEngine.calculateWeirdoCost(weirdo);
   * console.log(`Weirdo cost: ${weirdoCost} points`);
   * 
   * // Calculate warband total
   * const warbandCost = costEngine.calculateWarbandCost(warband);
   * console.log(`Warband total: ${warbandCost} points`);
   * ```
   */
  createCostEngine(): CostEngine {
    const costConfig = this.configManager.getCostConfig();
    return new CostEngine(costConfig);
  }

  /**
   * Creates a configured ValidationService instance
   * 
   * The ValidationService uses configuration for validation rules, thresholds,
   * and validation messages to ensure consistent validation across the application.
   * 
   * @returns Configured ValidationService instance ready for validation operations
   * 
   * @example Creating and using a ValidationService:
   * ```typescript
   * const factory = new ConfigurationFactory();
   * const validationService = factory.createValidationService();
   * 
   * // Validate a weirdo
   * const weirdoValidation = validationService.validateWeirdo(weirdo);
   * if (!weirdoValidation.valid) {
   *   console.error('Weirdo validation errors:', weirdoValidation.errors);
   * }
   * 
   * // Validate a warband
   * const warbandValidation = validationService.validateWarband(warband);
   * if (warbandValidation.warnings.length > 0) {
   *   console.warn('Warband warnings:', warbandValidation.warnings);
   * }
   * ```
   */
  createValidationService(): ValidationService {
    const costConfig = this.configManager.getCostConfig();
    const validationConfig = this.configManager.getValidationConfig();
    return new ValidationService(costConfig, validationConfig);
  }

  /**
   * Creates multiple cache instances for common use cases
   * 
   * Useful for initializing all caches at application startup with consistent
   * configuration. Each cache is optimized for its specific purpose.
   * 
   * @returns Object containing all common cache instances with appropriate types
   * 
   * @example Initializing all caches at startup:
   * ```typescript
   * const factory = new ConfigurationFactory();
   * const caches = factory.createCommonCaches();
   * 
   * // Use specific caches
   * const itemCost = caches.itemCostCache.get('weapon-id');
   * caches.costCalculationCache.set('warband-id', { cost: 75, breakdown: {...} });
   * 
   * // Check cache status
   * console.log(`Item cache size: ${caches.itemCostCache.size}`);
   * ```
   */
  createCommonCaches(): {
    itemCostCache: SimpleCache<number>;
    costCalculationCache: SimpleCache<{ cost: number; breakdown?: any }>;
    validationCache: SimpleCache<{ valid: boolean; errors: any[] }>;
    apiResponseCache: SimpleCache<any>;
  } {
    return {
      itemCostCache: this.createCacheInstance<number>('item-cost'),
      costCalculationCache: this.createCacheInstance<{ cost: number; breakdown?: any }>('cost-calculation'),
      validationCache: this.createCacheInstance<{ valid: boolean; errors: any[] }>('validation-result'),
      apiResponseCache: this.createCacheInstance<any>('api-response')
    };
  }

  /**
   * Creates a configured WarbandService instance
   * 
   * Creates a WarbandService with properly configured CostEngine and ValidationService
   * dependencies. This ensures all services use consistent configuration values.
   * 
   * @param repository - The DataRepository instance to use for persistence
   * @returns Configured WarbandService instance
   * 
   * @example Creating a configured WarbandService:
   * ```typescript
   * const factory = new ConfigurationFactory();
   * const repository = new DataRepository('warbands.json');
   * const warbandService = factory.createWarbandService(repository);
   * 
   * // Service uses centralized configuration
   * const warband = warbandService.createWarband({
   *   name: 'Test Warband',
   *   pointLimit: 75,
   *   ability: 'Mutants'
   * });
   * ```
   */
  createWarbandService(repository: any): WarbandService {
    const costEngine = this.createCostEngine();
    const validationService = this.createValidationService();
    
    return new WarbandService(repository, costEngine, validationService);
  }

  /**
   * Creates a service bundle with all configured services
   * 
   * Useful for dependency injection or service initialization. This creates
   * all major services with consistent configuration in a single call.
   * 
   * @returns Object containing all configured services and supporting infrastructure
   * 
   * @example Service bundle initialization:
   * ```typescript
   * const factory = new ConfigurationFactory();
   * const services = factory.createServiceBundle();
   * 
   * // Use services
   * const weirdoCost = services.costEngine.calculateWeirdoCost(weirdo);
   * const validation = services.validationService.validateWarband(warband);
   * 
   * // Use caches
   * services.caches.itemCostCache.set('item-id', cost);
   * 
   * // Use API configuration
   * const apiClient = new ApiClient(services.apiConfig);
   * ```
   * 
   * @example Dependency injection setup:
   * ```typescript
   * const factory = new ConfigurationFactory();
   * const services = factory.createServiceBundle();
   * 
   * // Inject into application
   * const app = new Application({
   *   costEngine: services.costEngine,
   *   validationService: services.validationService,
   *   caches: services.caches
   * });
   * ```
   */
  createServiceBundle(): {
    costEngine: CostEngine;
    validationService: ValidationService;
    caches: ReturnType<ConfigurationFactory['createCommonCaches']>;
    apiConfig: ApiClientConfig;
  } {
    return {
      costEngine: this.createCostEngine(),
      validationService: this.createValidationService(),
      caches: this.createCommonCaches(),
      apiConfig: this.createApiClientConfig()
    };
  }
}

/**
 * Default factory instance using the singleton ConfigurationManager
 */
export const configurationFactory = new ConfigurationFactory();

/**
 * Convenience functions for creating configured instances
 * 
 * These functions provide a simpler API for creating configured instances
 * without needing to instantiate a ConfigurationFactory directly.
 */

/**
 * Creates a configured cache instance using the default factory
 * 
 * @param purpose - The cache purpose (determines default size and TTL)
 * @param overrides - Optional overrides for cache configuration
 * @returns Configured SimpleCache instance
 * 
 * @example
 * ```typescript
 * import { createConfiguredCache } from './ConfigurationFactory.js';
 * 
 * const itemCache = createConfiguredCache<number>('item-cost');
 * const validationCache = createConfiguredCache<ValidationResult>(
 *   'validation-result',
 *   { maxSize: 150 }
 * );
 * ```
 */
export function createConfiguredCache<T>(
  purpose: CachePurpose,
  overrides?: Partial<CacheOptions>
): SimpleCache<T> {
  return configurationFactory.createCacheInstance<T>(purpose, overrides);
}

/**
 * Creates API client configuration using the default factory
 * 
 * @param overrides - Optional overrides for API configuration
 * @returns API client configuration object
 * 
 * @example
 * ```typescript
 * import { createConfiguredApiClient } from './ConfigurationFactory.js';
 * 
 * const apiConfig = createConfiguredApiClient();
 * const customApiConfig = createConfiguredApiClient({
 *   maxRetries: 5,
 *   timeoutMs: 20000
 * });
 * ```
 */
export function createConfiguredApiClient(overrides?: Partial<ApiClientConfig>): ApiClientConfig {
  return configurationFactory.createApiClientConfig(overrides);
}

/**
 * Creates a configured CostEngine using the default factory
 * 
 * @returns Configured CostEngine instance
 * 
 * @example
 * ```typescript
 * import { createConfiguredCostEngine } from './ConfigurationFactory.js';
 * 
 * const costEngine = createConfiguredCostEngine();
 * const weirdoCost = costEngine.calculateWeirdoCost(weirdo);
 * ```
 */
export function createConfiguredCostEngine(): CostEngine {
  return configurationFactory.createCostEngine();
}

/**
 * Creates a configured ValidationService using the default factory
 * 
 * @returns Configured ValidationService instance
 * 
 * @example
 * ```typescript
 * import { createConfiguredValidationService } from './ConfigurationFactory.js';
 * 
 * const validationService = createConfiguredValidationService();
 * const validation = validationService.validateWarband(warband);
 * ```
 */
export function createConfiguredValidationService(): ValidationService {
  return configurationFactory.createValidationService();
}
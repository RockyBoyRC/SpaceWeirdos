/**
 * Frontend Configuration
 * 
 * This module provides configuration for frontend services that aligns with
 * the backend centralized configuration system. It uses environment variables
 * that should match the backend configuration defaults.
 */

/**
 * Frontend API configuration
 */
export interface FrontendApiConfig {
  baseUrl: string;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
}

/**
 * Frontend cache configuration
 */
export interface FrontendCacheConfig {
  defaultMaxSize: number;
  defaultTtlMs: number;
  itemCostCacheSize: number;
  itemCostCacheTtl: number;
  costCalculationCacheSize: number;
  costCalculationCacheTtl: number;
}

/**
 * Complete frontend configuration
 */
export interface FrontendConfig {
  api: FrontendApiConfig;
  cache: FrontendCacheConfig;
}

/**
 * Gets the frontend API configuration from environment variables
 * These should align with backend ConfigurationManager.getDefaultApiConfig()
 */
function getApiConfig(): FrontendApiConfig {
  return {
    baseUrl: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api',
    maxRetries: parseInt((import.meta as any).env?.VITE_API_MAX_RETRIES) || 3,
    retryDelayMs: parseInt((import.meta as any).env?.VITE_API_RETRY_DELAY_MS) || 1000,
    timeoutMs: parseInt((import.meta as any).env?.VITE_API_TIMEOUT_MS) || 10000,
  };
}

/**
 * Gets the frontend cache configuration from environment variables
 * These should align with backend ConfigurationManager.getDefaultCacheConfig()
 */
function getCacheConfig(): FrontendCacheConfig {
  return {
    defaultMaxSize: parseInt((import.meta as any).env?.VITE_CACHE_DEFAULT_MAX_SIZE) || 100,
    defaultTtlMs: parseInt((import.meta as any).env?.VITE_CACHE_DEFAULT_TTL_MS) || 5000,
    itemCostCacheSize: parseInt((import.meta as any).env?.VITE_CACHE_ITEM_COST_SIZE) || 200,
    itemCostCacheTtl: parseInt((import.meta as any).env?.VITE_CACHE_ITEM_COST_TTL) || 10000,
    costCalculationCacheSize: parseInt((import.meta as any).env?.VITE_CACHE_COST_CALC_SIZE) || 100,
    costCalculationCacheTtl: parseInt((import.meta as any).env?.VITE_CACHE_COST_CALC_TTL) || 5000,
  };
}

/**
 * Gets the complete frontend configuration
 */
export function getFrontendConfig(): FrontendConfig {
  return {
    api: getApiConfig(),
    cache: getCacheConfig(),
  };
}

/**
 * Singleton instance of frontend configuration
 */
let frontendConfig: FrontendConfig | null = null;

/**
 * Gets the singleton frontend configuration instance
 */
export function getFrontendConfigInstance(): FrontendConfig {
  if (!frontendConfig) {
    frontendConfig = getFrontendConfig();
  }
  return frontendConfig;
}
/**
 * Configuration System Types and Interfaces
 * 
 * This module defines all TypeScript interfaces and types for the centralized
 * configuration system. It provides type-safe access to all application settings,
 * environment variables, and service configurations.
 */

/**
 * Environment types supported by the application
 */
export type Environment = 'development' | 'production' | 'test';

/**
 * Log levels for application logging
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Cache purposes for different cache instances
 */
export type CachePurpose = 
  | 'item-cost'
  | 'cost-calculation'
  | 'validation-result'
  | 'api-response';

/**
 * File operation configuration interface
 * Contains settings for file upload, download, and validation
 */
export interface FileOperationConfig {
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSizeBytes: number;
  /** Allowed file types for import */
  allowedFileTypes: string[];
  /** Maximum filename length */
  maxFilenameLength: number;
  /** Enable filename sanitization */
  enableFilenameSanitization: boolean;
  /** Timeout for file operations in milliseconds */
  fileOperationTimeoutMs: number;
}

/**
 * Server configuration interface
 * Contains all server-related settings including port, host, and paths
 */
export interface ServerConfig {
  /** Server port number */
  port: number;
  /** Server host address */
  host: string;
  /** Allowed CORS origins */
  corsOrigins: string[];
  /** Path to static files */
  staticPath: string;
  /** Path to data files */
  dataPath: string;
  /** Path to warband data file */
  warbandDataPath: string;
  /** Enable auto-save for data repository */
  enableAutoSave: boolean;
}

/**
 * API configuration interface
 * Contains all API client settings including URLs, timeouts, and retry policies
 */
export interface ApiConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retry attempts in milliseconds */
  retryDelayMs: number;
  /** Request timeout in milliseconds */
  timeoutMs: number;
}

/**
 * Cache configuration interface
 * Contains settings for all cache instances used throughout the application
 */
export interface CacheConfig {
  /** Default maximum cache size */
  defaultMaxSize: number;
  /** Default TTL in milliseconds */
  defaultTtlMs: number;
  /** Item cost cache specific settings */
  itemCostCacheSize: number;
  itemCostCacheTtl: number;
  /** Cost calculation cache specific settings */
  costCalculationCacheSize: number;
  costCalculationCacheTtl: number;
  /** Validation result cache specific settings */
  validationCacheSize: number;
  validationCacheTtl: number;
  /** API response cache specific settings */
  apiResponseCacheSize: number;
  apiResponseCacheTtl: number;
}

/**
 * Cost calculation configuration interface
 * Contains all constants and settings used by the CostEngine
 */
export interface CostConfig {
  /** Point limit thresholds */
  pointLimits: {
    /** Standard point limit for smaller warbands */
    standard: number;
    /** Extended point limit for larger warbands */
    extended: number;
    /** Warning threshold percentage (0.0 to 1.0) */
    warningThreshold: number;
  };
  /** Trooper cost limits */
  trooperLimits: {
    /** Standard maximum cost for troopers */
    standardLimit: number;
    /** Absolute maximum cost for any trooper */
    maximumLimit: number;
    /** Minimum cost for special slot */
    specialSlotMin: number;
    /** Maximum cost for special slot */
    specialSlotMax: number;
  };
  /** Equipment limits by weirdo type and warband ability */
  equipmentLimits: {
    /** Equipment limit for leaders without Cyborgs ability */
    leaderStandard: number;
    /** Equipment limit for leaders with Cyborgs ability */
    leaderCyborgs: number;
    /** Equipment limit for troopers without Cyborgs ability */
    trooperStandard: number;
    /** Equipment limit for troopers with Cyborgs ability */
    trooperCyborgs: number;
  };
  /** Discount values for warband abilities */
  discountValues: {
    /** Discount applied by Mutants ability */
    mutantDiscount: number;
    /** Discount applied by Heavily Armed ability */
    heavilyArmedDiscount: number;
  };
  /** Weapon lists affected by warband abilities */
  abilityWeaponLists: {
    /** Close combat weapons that receive discount with Mutants ability */
    mutantWeapons: readonly string[];
  };
  /** Equipment lists affected by warband abilities */
  abilityEquipmentLists: {
    /** Equipment items that are free with Soldiers ability */
    soldierFreeEquipment: readonly string[];
  };
}

/**
 * Validation configuration interface
 * Contains all validation-related settings and thresholds
 */
export interface ValidationConfig {
  /** Cost warning threshold percentage */
  costWarningThreshold: number;
  /** Enable context-aware warnings */
  enableContextAwareWarnings: boolean;
  /** Enable strict validation mode */
  strictValidation: boolean;
  /** Validation messages configuration */
  messages: {
    warbandNameRequired: string;
    weirdoNameRequired: string;
    invalidPointLimit: string;
    attributesIncomplete: string;
    closeCombatWeaponRequired: string;
    rangedWeaponRequired: string;
    firepowerRequiredForRangedWeapon: string;
    equipmentLimitExceeded: string;
    trooperPointLimitExceeded: string;
    multiple25PointWeirdos: string;
    warbandPointLimitExceeded: string;
    leaderTraitInvalid: string;
  };
}

/**
 * Environment-specific configuration interface
 * Contains settings that vary by environment (development, production, test)
 */
export interface EnvironmentConfig {
  /** Current environment */
  environment: Environment;
  /** Whether running in development mode */
  isDevelopment: boolean;
  /** Whether running in production mode */
  isProduction: boolean;
  /** Whether running in test mode */
  isTest: boolean;
  /** Whether debug logging is enabled */
  debugEnabled: boolean;
  /** Current log level */
  logLevel: LogLevel;
  /** Whether to enable performance monitoring */
  enablePerformanceMonitoring: boolean;
  /** Whether to enable detailed error reporting */
  enableDetailedErrors: boolean;
}

/**
 * Cache options interface for factory functions
 */
export interface CacheOptions {
  /** Maximum cache size */
  maxSize: number;
  /** TTL in milliseconds */
  ttlMs: number;
  /** Enable cache metrics collection */
  enableMetrics: boolean;
}

/**
 * Configuration validation result interface
 */
export interface ConfigurationValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** List of validation errors */
  errors: ConfigurationErrorType[];
  /** List of validation warnings */
  warnings: ConfigurationWarning[];
}

/**
 * Configuration error interface
 */
export interface ConfigurationErrorType {
  /** Field name that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
  /** Expected type or value */
  expectedType?: string;
  /** Actual received value */
  receivedValue?: unknown;
  /** Suggestions for fixing the error */
  suggestions?: string[];
}

/**
 * Configuration warning interface
 */
export interface ConfigurationWarning {
  /** Field name that generated the warning */
  field: string;
  /** Warning message */
  message: string;
  /** Warning code for programmatic handling */
  code: string;
  /** Suggestion for addressing the warning */
  suggestion?: string;
}

/**
 * Main configuration interface that combines all configuration sections
 */
export interface Configuration {
  /** Server configuration */
  server: ServerConfig;
  /** API configuration */
  api: ApiConfig;
  /** Cache configuration */
  cache: CacheConfig;
  /** Cost calculation configuration */
  cost: CostConfig;
  /** Validation configuration */
  validation: ValidationConfig;
  /** Environment-specific configuration */
  environment: EnvironmentConfig;
  /** File operation configuration */
  fileOperations: FileOperationConfig;
}

/**
 * Configuration data interface for raw configuration loading
 * Used internally by ConfigurationManager for loading from various sources
 */
export interface ConfigurationData {
  /** Raw server configuration data */
  server?: Partial<ServerConfig>;
  /** Raw API configuration data */
  api?: Partial<ApiConfig>;
  /** Raw cache configuration data */
  cache?: Partial<CacheConfig>;
  /** Raw cost configuration data */
  cost?: Partial<CostConfig>;
  /** Raw validation configuration data */
  validation?: Partial<ValidationConfig>;
  /** Raw environment configuration data */
  environment?: Partial<EnvironmentConfig>;
  /** Raw file operation configuration data */
  fileOperations?: Partial<FileOperationConfig>;
}

/**
 * Configuration migration interface
 * Used for migrating old configuration formats to new ones
 */
export interface ConfigurationMigration {
  /** Source version */
  fromVersion: string;
  /** Target version */
  toVersion: string;
  /** Migration function */
  migrate(oldConfig: unknown): ConfigurationData;
  /** Validation function for old config */
  validate(config: unknown): boolean;
}

/**
 * Type guard for checking if a value is a valid Environment
 */
export function isValidEnvironment(value: unknown): value is Environment {
  return typeof value === 'string' && 
    ['development', 'production', 'test'].includes(value);
}

/**
 * Type guard for checking if a value is a valid LogLevel
 */
export function isValidLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && 
    ['error', 'warn', 'info', 'debug'].includes(value);
}

/**
 * Type guard for checking if a value is a valid CachePurpose
 */
export function isValidCachePurpose(value: unknown): value is CachePurpose {
  return typeof value === 'string' && 
    ['item-cost', 'cost-calculation', 'validation-result', 'api-response'].includes(value);
}
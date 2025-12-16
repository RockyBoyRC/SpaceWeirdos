# Design Document

## Overview

This design document outlines the architecture for refactoring the Space Weirdos codebase to implement a centralized configuration system, eliminate code duplication, and improve maintainability. The solution will create a type-safe configuration management system that centralizes all global variables, environment settings, and service configurations while maintaining backward compatibility.

## Architecture

The refactoring will implement a layered configuration architecture:

```
┌─────────────────────────────────────────┐
│           Application Layer             │
│  (Components, Services, Routes)         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Configuration Layer              │
│  - ConfigurationManager                 │
│  - Environment Detection                │
│  - Type-Safe Access                     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Configuration Sources           │
│  - Environment Variables                │
│  - Default Values                       │
│  - Environment-Specific Overrides      │
└─────────────────────────────────────────┘
```

The architecture separates concerns by:
- **Application Layer**: Consumes configuration through type-safe interfaces
- **Configuration Layer**: Manages configuration loading, validation, and access
- **Configuration Sources**: Provides raw configuration data from various sources

## Components and Interfaces

### Core Configuration Manager

```typescript
interface ConfigurationManager {
  // Server configuration
  getServerConfig(): ServerConfig;
  
  // API configuration  
  getApiConfig(): ApiConfig;
  
  // Cache configuration
  getCacheConfig(): CacheConfig;
  
  // Cost engine configuration
  getCostConfig(): CostConfig;
  
  // Validation configuration
  getValidationConfig(): ValidationConfig;
  
  // Environment detection
  getEnvironment(): Environment;
  
  // Configuration validation
  validate(): ConfigurationValidationResult;
}
```

### Configuration Interfaces

```typescript
interface ServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  staticPath: string;
  dataPath: string;
}

interface ApiConfig {
  baseUrl: string;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
}

interface CacheConfig {
  defaultMaxSize: number;
  defaultTtlMs: number;
  itemCostCacheSize: number;
  itemCostCacheTtl: number;
  costCalculationCacheSize: number;
  costCalculationCacheTtl: number;
}

interface CostConfig {
  pointLimits: {
    standard: number;
    extended: number;
    warningThreshold: number;
  };
  trooperLimits: {
    standardLimit: number;
    maximumLimit: number;
    specialSlotMin: number;
    specialSlotMax: number;
  };
  equipmentLimits: {
    leaderStandard: number;
    leaderCyborgs: number;
    trooperStandard: number;
    trooperCyborgs: number;
  };
  discountValues: {
    mutantDiscount: number;
    heavilyArmedDiscount: number;
  };
}

interface ValidationConfig {
  costWarningThreshold: number;
  enableContextAwareWarnings: boolean;
  strictValidation: boolean;
}
```

### Configuration Factory

```typescript
interface ConfigurationFactory {
  createCacheInstance<T>(
    purpose: CachePurpose,
    overrides?: Partial<CacheOptions>
  ): CostCache<T>;
  
  createApiClient(
    overrides?: Partial<ApiConfig>
  ): ApiClient;
  
  createCostEngine(
    overrides?: Partial<CostConfig>
  ): CostEngine;
  
  createValidationService(
    overrides?: Partial<ValidationConfig>
  ): ValidationService;
}
```

## Data Models

### Environment Configuration

```typescript
type Environment = 'development' | 'production' | 'test';

interface EnvironmentConfig {
  environment: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  debugEnabled: boolean;
  logLevel: LogLevel;
}
```

### Configuration Validation

```typescript
interface ConfigurationValidationResult {
  valid: boolean;
  errors: ConfigurationError[];
  warnings: ConfigurationWarning[];
}

interface ConfigurationError {
  field: string;
  message: string;
  code: string;
  expectedType?: string;
  receivedValue?: unknown;
}

interface ConfigurationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}
```

### Cache Configuration

```typescript
type CachePurpose = 
  | 'item-cost'
  | 'cost-calculation'
  | 'validation-result'
  | 'api-response';

interface CacheOptions {
  maxSize: number;
  ttlMs: number;
  enableMetrics: boolean;
}
```

Now I need to use the prework tool to analyze the acceptance criteria before writing the correctness properties.

<function_calls>
<invoke name="prework">
<parameter name="featureName">codebase-refactoring-centralization
## Correctn
ess Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

- Configuration loading and validation properties can be combined into comprehensive configuration integrity properties
- Environment-specific properties can be consolidated into environment behavior properties  
- Factory function properties can be combined into consistent factory behavior properties
- Error handling properties can be consolidated into comprehensive error handling properties

The following properties represent the essential correctness guarantees after removing redundancy:

Property 1: Configuration initialization completeness
*For any* configuration system initialization, all required configuration sections (server, api, cache, cost, validation) should be loaded and accessible
**Validates: Requirements 1.1**

Property 2: Environment variable type safety
*For any* environment variable access, the returned value should match the expected type and be properly validated
**Validates: Requirements 1.2, 4.2**

Property 3: Default value provision
*For any* optional configuration setting that is missing, the system should provide the appropriate default value
**Validates: Requirements 1.3**

Property 4: Configuration validation completeness
*For any* invalid configuration input, the system should return structured errors with clear messages and error codes
**Validates: Requirements 1.4, 3.1, 3.2, 8.1, 8.2**

Property 5: Environment-specific configuration behavior
*For any* environment type (development, production, test), the system should load appropriate environment-specific settings and behaviors
**Validates: Requirements 1.5, 7.1, 7.2, 7.3**

Property 6: Centralized configuration consistency
*For any* service initialization (cache, API, server, timing, retry), the configuration values should come from the centralized configuration system
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 7: Missing environment variable handling
*For any* missing required environment variable, the system should provide clear error messages indicating which variables are required
**Validates: Requirements 3.3**

Property 8: Type conversion error handling
*For any* type conversion failure, the system should provide error messages indicating the expected type and received value
**Validates: Requirements 3.4**

Property 9: Configuration loading fallback behavior
*For any* configuration loading failure, the system should provide fallback behavior and log appropriate warnings
**Validates: Requirements 3.5, 7.4**

Property 10: Service configuration consistency
*For any* service type (Cost_Engine, Validation_Service, cache, API, persistence), all instances should use consistent configuration values from the centralized system
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

Property 11: Factory function configuration correctness
*For any* factory function call (cache, API client, service creation), the created instance should be properly configured with the expected settings
**Validates: Requirements 6.1, 6.2**

Property 12: Utility function consistency
*For any* utility function usage (validation, error handling, logging), the behavior should be consistent across different contexts
**Validates: Requirements 6.3, 6.4, 6.5**

Property 13: Configuration migration compatibility
*For any* old configuration format, the system should successfully migrate it to the new format while preserving all valid settings
**Validates: Requirements 4.5**

## Error Handling

The configuration system will implement comprehensive error handling with structured error types:

### Configuration Errors

```typescript
class ConfigurationError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string,
    public expectedType?: string,
    public receivedValue?: unknown,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

class EnvironmentError extends ConfigurationError {
  constructor(message: string, missingVariables: string[]) {
    super(message, 'ENVIRONMENT_ERROR');
    this.suggestions = missingVariables.map(v => `Set ${v} environment variable`);
  }
}

class ValidationError extends ConfigurationError {
  constructor(field: string, message: string, expectedType?: string, receivedValue?: unknown) {
    super(`Configuration validation failed for ${field}: ${message}`, 'VALIDATION_ERROR', field, expectedType, receivedValue);
  }
}
```

### Error Recovery Strategies

1. **Graceful Degradation**: When non-critical configuration is missing, use defaults and log warnings
2. **Fail Fast**: When critical configuration is missing or invalid, fail immediately with clear error messages
3. **Environment Fallback**: When environment detection fails, default to development mode with warnings
4. **Migration Support**: When old configuration formats are detected, attempt automatic migration

## Testing Strategy

The configuration system will use a dual testing approach combining unit tests and property-based tests:

### Unit Testing Approach

Unit tests will verify specific configuration scenarios:
- Loading configuration from different sources
- Environment variable parsing and validation
- Error handling for specific invalid inputs
- Factory function creation with known parameters
- Migration of specific old configuration formats

### Property-Based Testing Approach

Property-based tests will verify universal properties using fast-check with minimum 50 iterations:
- Configuration completeness across all possible initialization scenarios
- Type safety across all possible environment variable combinations
- Default value provision across all possible missing configuration scenarios
- Error handling consistency across all possible invalid inputs
- Environment-specific behavior across all environment types
- Service configuration consistency across all service types
- Factory function correctness across all possible parameter combinations

Each property-based test will be tagged with the format: `**Feature: codebase-refactoring-centralization, Property {number}: {property_text}**`

### Integration Testing

Integration tests will verify:
- End-to-end configuration loading in different environments
- Service initialization with centralized configuration
- Configuration changes affecting multiple services
- Migration scenarios with real configuration files

## Implementation Strategy

### Phase 1: Core Configuration System
1. Create configuration interfaces and types
2. Implement ConfigurationManager with environment detection
3. Add configuration validation and error handling
4. Create configuration loading from environment variables and defaults

### Phase 2: Service Integration
1. Refactor existing services to use centralized configuration
2. Create factory functions for service creation
3. Update existing constants and magic numbers to use configuration
4. Implement configuration-based cache and API client creation

### Phase 3: Environment Support
1. Add environment-specific configuration loading
2. Implement development, production, and test configurations
3. Add configuration migration support for backward compatibility
4. Create example configuration files for each environment

### Phase 4: Validation and Documentation
1. Add comprehensive configuration validation
2. Implement structured error handling with clear messages
3. Add JSDoc documentation for all configuration options
4. Create configuration schema documentation

## Migration Strategy

### Backward Compatibility

The refactoring will maintain backward compatibility by:
1. Keeping existing constant exports as deprecated aliases
2. Providing automatic migration for old configuration formats
3. Supporting both old and new initialization patterns during transition
4. Logging deprecation warnings for old usage patterns

### Migration Path

1. **Phase 1**: Introduce new configuration system alongside existing constants
2. **Phase 2**: Update services to use new configuration while maintaining old exports
3. **Phase 3**: Add deprecation warnings for old constant usage
4. **Phase 4**: Remove deprecated constants and old initialization patterns

### Configuration File Migration

```typescript
interface ConfigurationMigration {
  fromVersion: string;
  toVersion: string;
  migrate(oldConfig: unknown): ConfigurationData;
  validate(config: unknown): boolean;
}
```

The system will support automatic migration of configuration files from previous formats, ensuring smooth transitions during updates.
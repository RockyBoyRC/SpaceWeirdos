# Configuration Migration Guide

This guide provides comprehensive instructions for migrating from legacy configuration patterns to the centralized configuration system.

## Overview

The Space Weirdos application has migrated from scattered constants and hardcoded values to a centralized configuration system. This migration provides:

- **Type Safety**: All configuration is strongly typed with TypeScript interfaces
- **Environment Support**: Different settings for development, production, and test environments
- **Validation**: Comprehensive validation with clear error messages
- **Centralization**: All configuration in one place for easier maintenance
- **Backward Compatibility**: Legacy constants are still supported with deprecation warnings

## Migration Paths

### 1. Legacy Constants Migration

**From:** Individual constant files (`costs.ts`, `validationMessages.ts`)
**To:** Centralized configuration system

#### Before (Legacy - Files Removed)
```typescript
// These files have been removed - use ConfigurationManager instead
// import { POINT_LIMITS, TROOPER_LIMITS } from './constants/costs';
// import { VALIDATION_MESSAGES } from './constants/validationMessages';

// const standardLimit = POINT_LIMITS.STANDARD_LIMIT;
const trooperLimit = TROOPER_LIMITS.MAXIMUM_LIMIT;
const errorMessage = VALIDATION_MESSAGES.WARBAND_NAME_REQUIRED;
```

#### After (Centralized)
```typescript
import { ConfigurationManager } from './config/ConfigurationManager';

const configManager = ConfigurationManager.getInstance();
await configManager.initialize();

const costConfig = configManager.getCostConfig();
const validationConfig = configManager.getValidationConfig();

const standardLimit = costConfig.pointLimits.standard;
const trooperLimit = costConfig.trooperLimits.maximumLimit;
const errorMessage = validationConfig.messages.warbandNameRequired;
```

### 2. Hardcoded Values Migration

**From:** Hardcoded values scattered throughout the codebase
**To:** Configuration-driven values

#### Before (Hardcoded)
```typescript
const cache = new CostCache(100, 5000); // hardcoded size and TTL
const apiClient = new ApiClient('http://localhost:3001/api', 3, 1000); // hardcoded URL, retries, delay
```

#### After (Configuration-driven)
```typescript
const configManager = ConfigurationManager.getInstance();
const cacheConfig = configManager.getCacheConfig();
const apiConfig = configManager.getApiConfig();

const cache = new CostCache(cacheConfig.itemCostCacheSize, cacheConfig.itemCostCacheTtl);
const apiClient = new ApiClient(apiConfig.baseUrl, apiConfig.maxRetries, apiConfig.retryDelayMs);
```

### 3. Environment Variables Migration

**From:** Direct `process.env` access
**To:** Type-safe configuration access

#### Before (Direct Environment Access)
```typescript
const port = parseInt(process.env.PORT || '3001');
const debugEnabled = process.env.DEBUG === 'true';
const logLevel = process.env.LOG_LEVEL || 'info';
```

#### After (Type-safe Configuration)
```typescript
const configManager = ConfigurationManager.getInstance();
const serverConfig = configManager.getServerConfig();
const envConfig = configManager.getEnvironmentConfig();

const port = serverConfig.port;
const debugEnabled = envConfig.debugEnabled;
const logLevel = envConfig.logLevel;
```

## Automatic Migration

The configuration system supports automatic migration for common legacy formats:

### Legacy Constants Format
```typescript
const configManager = ConfigurationManager.getInstance();

// Check if migration is needed
const migrationInfo = configManager.needsMigration(oldConfig);
if (migrationInfo.needed) {
  // Automatically migrate
  const migratedConfig = configManager.autoMigrateIfNeeded(oldConfig);
  if (migratedConfig) {
    console.log('Configuration migrated successfully');
  }
}
```

### Supported Migration Paths

1. **Legacy Constants → v1.0.0**
   - Migrates from `costs.ts` and `validationMessages.ts` format
   - Preserves all existing values
   - Maps to new configuration structure

2. **Early Config v0.9.0 → v1.0.0**
   - Migrates from early configuration format
   - Adds new configuration fields with defaults
   - Maintains backward compatibility

## Environment Configuration

### Development Environment
```bash
NODE_ENV=development
PORT=3001
DEBUG_ENABLED=true
LOG_LEVEL=debug
```

### Production Environment
```bash
NODE_ENV=production
PORT=80
DEBUG_ENABLED=false
LOG_LEVEL=info
VITE_API_URL=https://api.example.com
```

### Test Environment
```bash
NODE_ENV=test
PORT=0
DEBUG_ENABLED=false
LOG_LEVEL=error
```

## Configuration Validation

The system provides comprehensive validation with clear error messages:

```typescript
const configManager = ConfigurationManager.getInstance();
await configManager.initialize();

const validation = configManager.validate();
if (!validation.valid) {
  console.error('Configuration errors:');
  validation.errors.forEach(error => {
    console.error(`- ${error.field}: ${error.message}`);
    if (error.suggestions) {
      error.suggestions.forEach(suggestion => {
        console.error(`  Suggestion: ${suggestion}`);
      });
    }
  });
}
```

## Service Integration

### Cache Services
```typescript
// Before
const itemCostCache = new CostCache(200, 10000);
const costCalculationCache = new CostCache(100, 5000);

// After
const configManager = ConfigurationManager.getInstance();
const cacheConfig = configManager.getCacheConfig();

const itemCostCache = new CostCache(
  cacheConfig.itemCostCacheSize,
  cacheConfig.itemCostCacheTtl
);
const costCalculationCache = new CostCache(
  cacheConfig.costCalculationCacheSize,
  cacheConfig.costCalculationCacheTtl
);
```

### API Services
```typescript
// Before
const apiClient = new ApiClient({
  baseUrl: 'http://localhost:3001/api',
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 10000
});

// After
const configManager = ConfigurationManager.getInstance();
const apiConfig = configManager.getApiConfig();

const apiClient = new ApiClient(apiConfig);
```

### Validation Services
```typescript
// Before
const validationService = new ValidationService({
  costWarningThreshold: 0.9,
  enableContextAwareWarnings: true,
  messages: VALIDATION_MESSAGES
});

// After
const configManager = ConfigurationManager.getInstance();
const validationConfig = configManager.getValidationConfig();

const validationService = new ValidationService(validationConfig);
```

## Error Handling

The configuration system provides structured error handling:

```typescript
try {
  const configManager = ConfigurationManager.getInstance();
  await configManager.initialize();
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error(`Configuration error: ${error.message}`);
    console.error(`Error code: ${error.code}`);
  } else if (error instanceof EnvironmentError) {
    console.error(`Environment error: ${error.message}`);
    console.error(`Missing variables: ${error.missingVariables}`);
  } else if (error instanceof ValidationError) {
    console.error(`Validation error: ${error.message}`);
    console.error(`Field: ${error.field}`);
  }
}
```

## Best Practices

### 1. Initialize Early
```typescript
// Initialize configuration as early as possible in your application
const configManager = ConfigurationManager.getInstance();
await configManager.initialize();
```

### 2. Use Factory Functions
```typescript
// Use configuration factory functions for consistent service creation
const configManager = ConfigurationManager.getInstance();
const cacheInstance = configManager.createCacheInstance('item-cost');
```

### 3. Environment-Specific Settings
```typescript
// Leverage environment-specific configuration
const configManager = ConfigurationManager.getInstance();
const env = configManager.getEnvironment();

if (env === 'development') {
  // Development-specific logic
} else if (env === 'production') {
  // Production-specific logic
}
```

### 4. Validation Before Use
```typescript
// Always validate configuration before using it
const configManager = ConfigurationManager.getInstance();
const validation = configManager.validate();

if (!validation.valid) {
  throw new Error('Invalid configuration');
}
```

## Troubleshooting

### Common Issues

1. **Configuration Not Initialized**
   ```
   Error: Configuration manager not initialized. Call initialize() first.
   ```
   **Solution:** Call `await configManager.initialize()` before accessing configuration.

2. **Missing Environment Variables**
   ```
   Error: Required environment variables missing: NODE_ENV, PORT
   ```
   **Solution:** Set the required environment variables or use defaults.

3. **Invalid Configuration Values**
   ```
   Error: Port must be an integer between 0 and 65535
   ```
   **Solution:** Check environment variable values and ensure they match expected types.

### Debug Mode

Enable debug mode for detailed configuration logging:

```bash
DEBUG_ENABLED=true
LOG_LEVEL=debug
```

This will provide detailed information about:
- Configuration loading process
- Environment variable parsing
- Validation results
- Migration attempts

## Migration Checklist

- [ ] Replace direct constant imports with configuration manager access
- [ ] Update hardcoded values to use configuration
- [ ] Replace direct `process.env` access with type-safe configuration
- [ ] Update service initialization to use configuration
- [ ] Add proper error handling for configuration errors
- [ ] Test configuration in all environments (development, production, test)
- [ ] Validate configuration before deployment
- [ ] Update documentation and examples

## Support

For additional support with configuration migration:

1. Check the configuration validation results for specific error messages
2. Review the deprecation warnings in the console logs
3. Refer to the TypeScript interfaces in `src/backend/config/types.ts`
4. Examine the example configuration files in `docs/examples/configuration/`

The migration system is designed to be as smooth as possible while providing clear guidance for updating your code to use the new centralized configuration system.
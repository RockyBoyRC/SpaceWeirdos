# Configuration Management Guide

This guide covers the comprehensive configuration management system introduced in v1.8.0.

## Overview

The Space Weirdos Warband Builder uses a centralized configuration management system that provides:

- **Type-safe configuration access** across the entire application
- **Environment-specific optimization** for development, production, and test
- **Environment variable support** for all configuration values
- **Comprehensive validation** with detailed error messages
- **Fallback recovery** for graceful degradation

## Quick Start

### Basic Usage

```typescript
import { ConfigurationManager } from './config/ConfigurationManager.js';

// Initialize configuration (required before use)
const configManager = ConfigurationManager.getInstance();
await configManager.initialize();

// Access configuration sections
const serverConfig = configManager.getServerConfig();
const costConfig = configManager.getCostConfig();

// Use configuration values
console.log(`Server running on port ${serverConfig.port}`);
console.log(`Standard point limit: ${costConfig.pointLimits.standard}`);
```

### Environment Variables

All configuration values can be overridden via environment variables:

```bash
# Server configuration
PORT=3001
HOST=localhost
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# API configuration
VITE_API_URL=http://localhost:3001/api
API_MAX_RETRIES=3
API_TIMEOUT_MS=10000

# Cost configuration
POINT_LIMIT_STANDARD=75
POINT_LIMIT_EXTENDED=125
```

## Configuration Sections

### Server Configuration

Controls server behavior, ports, and file paths.

**Environment Variables:**
- `PORT` - Server port (default: 3001)
- `HOST` - Server host (default: localhost)
- `CORS_ORIGINS` - Comma-separated CORS origins (default: *)
- `STATIC_PATH` - Static files directory (default: dist)
- `DATA_PATH` - Game data directory (default: data)
- `WARBAND_DATA_PATH` - Warband data file (default: data/warbands.json)
- `ENABLE_AUTO_SAVE` - Enable automatic saving (default: true)

**Usage:**
```typescript
const serverConfig = configManager.getServerConfig();
console.log(`Server: ${serverConfig.host}:${serverConfig.port}`);
console.log(`Static files: ${serverConfig.staticPath}`);
console.log(`Auto-save: ${serverConfig.enableAutoSave}`);
```

### API Configuration

Controls API behavior, retries, and timeouts.

**Environment Variables:**
- `VITE_API_URL` - API base URL (required for production)
- `API_MAX_RETRIES` - Maximum retry attempts (default: 3)
- `API_RETRY_DELAY_MS` - Delay between retries (default: 1000)
- `API_TIMEOUT_MS` - Request timeout (default: 10000)

**Usage:**
```typescript
const apiConfig = configManager.getApiConfig();
console.log(`API URL: ${apiConfig.baseUrl}`);
console.log(`Max retries: ${apiConfig.maxRetries}`);
console.log(`Timeout: ${apiConfig.timeoutMs}ms`);
```

### Cache Configuration

Controls cache sizes and TTL values for all cache types.

**Environment Variables:**
- `CACHE_DEFAULT_MAX_SIZE` - Default cache size (default: 100)
- `CACHE_DEFAULT_TTL_MS` - Default cache TTL (default: 5000)
- `CACHE_ITEM_COST_SIZE` - Item cost cache size (default: 200)
- `CACHE_ITEM_COST_TTL` - Item cost cache TTL (default: 10000)
- `CACHE_COST_CALC_SIZE` - Cost calculation cache size (default: 100)
- `CACHE_COST_CALC_TTL` - Cost calculation cache TTL (default: 5000)
- `CACHE_VALIDATION_SIZE` - Validation cache size (default: 50)
- `CACHE_VALIDATION_TTL` - Validation cache TTL (default: 30000)
- `CACHE_API_RESPONSE_SIZE` - API response cache size (default: 100)
- `CACHE_API_RESPONSE_TTL` - API response cache TTL (default: 60000)

**Usage:**
```typescript
const cacheConfig = configManager.getCacheConfig();
console.log(`Default cache size: ${cacheConfig.defaultMaxSize}`);
console.log(`Item cost cache TTL: ${cacheConfig.itemCostCacheTtl}ms`);

// Create configuration-managed cache
const cache = configManager.createCacheInstance<ItemCost>('item-cost');
```

### Cost Configuration

Controls game rules, point limits, and cost calculations.

**Environment Variables:**
- `POINT_LIMIT_STANDARD` - Standard point limit (default: 75)
- `POINT_LIMIT_EXTENDED` - Extended point limit (default: 125)
- `POINT_LIMIT_WARNING_THRESHOLD` - Warning threshold (default: 0.9)
- `TROOPER_LIMIT_STANDARD` - Standard trooper limit (default: 20)
- `TROOPER_LIMIT_MAXIMUM` - Maximum trooper limit (default: 25)
- `EQUIPMENT_LIMIT_LEADER_STANDARD` - Leader equipment limit (default: 2)
- `EQUIPMENT_LIMIT_TROOPER_STANDARD` - Trooper equipment limit (default: 1)
- `DISCOUNT_MUTANT` - Mutant discount value (default: 1)
- `DISCOUNT_HEAVILY_ARMED` - Heavily Armed discount value (default: 1)

**Usage:**
```typescript
const costConfig = configManager.getCostConfig();
console.log(`Standard limit: ${costConfig.pointLimits.standard}`);
console.log(`Extended limit: ${costConfig.pointLimits.extended}`);
console.log(`Mutant discount: ${costConfig.discountValues.mutantDiscount}`);
```

### Validation Configuration

Controls validation behavior, thresholds, and error messages.

**Environment Variables:**
- `VALIDATION_COST_WARNING_THRESHOLD` - Cost warning threshold (default: 0.9)
- `VALIDATION_CONTEXT_AWARE_WARNINGS` - Enable context-aware warnings (default: true)
- `VALIDATION_STRICT_MODE` - Enable strict validation (default: false)

**Usage:**
```typescript
const validationConfig = configManager.getValidationConfig();
console.log(`Warning threshold: ${validationConfig.costWarningThreshold}`);
console.log(`Context-aware warnings: ${validationConfig.enableContextAwareWarnings}`);
console.log(`Error message: ${validationConfig.messages.warbandNameRequired}`);
```

### Environment Configuration

Controls environment-specific behavior, logging, and debugging.

**Environment Variables:**
- `NODE_ENV` - Environment type (development, production, test)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `DEBUG_ENABLED` - Enable debug mode (default: environment-specific)
- `ENABLE_PERFORMANCE_MONITORING` - Enable performance monitoring (default: environment-specific)
- `ENABLE_DETAILED_ERRORS` - Enable detailed error messages (default: environment-specific)

**Usage:**
```typescript
const envConfig = configManager.getEnvironmentConfig();
console.log(`Environment: ${envConfig.environment}`);
console.log(`Debug enabled: ${envConfig.debugEnabled}`);
console.log(`Log level: ${envConfig.logLevel}`);

// Environment checks
if (configManager.getEnvironment() === 'development') {
  console.log('Running in development mode');
}
```

### File Operations Configuration

Controls file upload/download limits and security settings.

**Environment Variables:**
- `FILE_MAX_SIZE_BYTES` - Maximum file size (default: 10MB)
- `FILE_ALLOWED_TYPES` - Comma-separated allowed file types (default: application/json,.json)
- `FILE_MAX_FILENAME_LENGTH` - Maximum filename length (default: 255)
- `FILE_ENABLE_SANITIZATION` - Enable filename sanitization (default: true)
- `FILE_OPERATION_TIMEOUT_MS` - File operation timeout (default: 30000)

**Usage:**
```typescript
const fileConfig = configManager.getFileOperationConfig();
console.log(`Max file size: ${fileConfig.maxFileSizeBytes} bytes`);
console.log(`Allowed types: ${fileConfig.allowedFileTypes.join(', ')}`);
console.log(`Sanitization: ${fileConfig.enableFilenameSanitization}`);
```

## Environment-Specific Behavior

### Development Environment

**Characteristics:**
- Debug logging enabled
- Shorter cache TTLs for rapid development
- Detailed error messages
- Auto-save enabled by default

**Optimizations:**
- Cache TTL: 5 seconds (default)
- Log level: debug
- Performance monitoring: disabled
- Detailed errors: enabled

### Production Environment

**Characteristics:**
- Performance optimizations enabled
- Longer cache TTLs for better performance
- Minimal logging (info level)
- Performance monitoring enabled

**Optimizations:**
- Cache TTL: 5-15 minutes
- Log level: info
- Performance monitoring: enabled
- Detailed errors: disabled

### Test Environment

**Characteristics:**
- Predictable behavior for testing
- Very short cache TTLs
- Error-level logging only
- Auto-save disabled

**Optimizations:**
- Cache TTL: 100ms
- Log level: error
- Random ports for parallel execution
- No retries for predictable behavior

## Configuration Examples

### Development Configuration (.env.development)

```bash
NODE_ENV=development
PORT=3001
HOST=localhost
VITE_API_URL=http://localhost:3001/api
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Cache settings for development
CACHE_DEFAULT_TTL_MS=5000
CACHE_ITEM_COST_TTL=10000

# Validation settings
VALIDATION_COST_WARNING_THRESHOLD=0.9
VALIDATION_CONTEXT_AWARE_WARNINGS=true

# Debug settings
DEBUG_ENABLED=true
LOG_LEVEL=debug
```

### Production Configuration (.env.production)

```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
VITE_API_URL=https://api.spaceweirdos.com/api
CORS_ORIGINS=https://spaceweirdos.com

# Optimized cache settings for production
CACHE_DEFAULT_TTL_MS=300000
CACHE_ITEM_COST_TTL=600000
CACHE_COST_CALC_TTL=300000
CACHE_VALIDATION_TTL=900000

# Production settings
DEBUG_ENABLED=false
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
```

### Test Configuration (.env.test)

```bash
NODE_ENV=test
PORT=0
ENABLE_AUTO_SAVE=false
API_MAX_RETRIES=0

# Fast cache settings for tests
CACHE_DEFAULT_TTL_MS=100
CACHE_ITEM_COST_TTL=100
CACHE_COST_CALC_TTL=100

# Test settings
DEBUG_ENABLED=false
LOG_LEVEL=error
```

## Migration from Legacy Constants

### Before v1.8.0 (Legacy)

```typescript
// ❌ OLD - Deprecated constants
import { POINT_LIMITS } from '../constants/costs.js';
import { VALIDATION_MESSAGES } from '../constants/validationMessages.js';

const limit = POINT_LIMITS.STANDARD_LIMIT;
const message = VALIDATION_MESSAGES.WARBAND_NAME_REQUIRED;
```

### After v1.8.0 (Configuration System)

```typescript
// ✅ NEW - Configuration system
import { ConfigurationManager } from '../config/ConfigurationManager.js';

const configManager = ConfigurationManager.getInstance();
await configManager.initialize();

const limit = configManager.getCostConfig().pointLimits.standard;
const message = configManager.getValidationConfig().messages.warbandNameRequired;
```

### Migration Steps

1. **Replace constant imports:**
   ```bash
   # Find all constant imports
   grep -r "import.*constants" src/
   
   # Replace with ConfigurationManager usage
   ```

2. **Update service constructors:**
   ```typescript
   // Before
   constructor() {
     this.pointLimit = POINT_LIMITS.STANDARD_LIMIT;
   }
   
   // After
   constructor(private configManager: ConfigurationManager) {
     this.pointLimit = configManager.getCostConfig().pointLimits.standard;
   }
   ```

3. **Initialize configuration:**
   ```typescript
   // In your main application file
   const configManager = ConfigurationManager.getInstance();
   await configManager.initialize();
   ```

## Validation and Error Handling

### Configuration Validation

The system provides comprehensive validation:

```typescript
// Validate configuration
const validation = configManager.validate();

if (!validation.valid) {
  console.error('Configuration errors:');
  validation.errors.forEach(error => {
    console.error(`- ${error.field}: ${error.message}`);
    if (error.suggestions) {
      console.error(`  Suggestions: ${error.suggestions.join(', ')}`);
    }
  });
}

// Handle warnings
if (validation.warnings.length > 0) {
  console.warn('Configuration warnings:');
  validation.warnings.forEach(warning => {
    console.warn(`- ${warning.field}: ${warning.message}`);
    if (warning.suggestion) {
      console.warn(`  Suggestion: ${warning.suggestion}`);
    }
  });
}
```

### Error Types

**Configuration Errors:**
- `INVALID_PORT` - Port number out of range
- `INVALID_HOST` - Invalid hostname
- `MALFORMED_BASE_URL` - Invalid URL format
- `INVALID_CACHE_SIZE` - Cache size not a positive integer
- `INVALID_POINT_LIMIT` - Point limit not a positive integer

**Configuration Warnings:**
- `PRIVILEGED_PORT` - Using port < 1024
- `HIGH_RETRY_COUNT` - Retry count > 10
- `LARGE_CACHE_SIZE` - Cache size > 1000
- `SHORT_TTL` - TTL < 1000ms

### Fallback Recovery

The system provides graceful degradation:

```typescript
try {
  await configManager.initialize();
} catch (error) {
  // System attempts fallback recovery automatically
  console.warn('Configuration fallback active - some features may be limited');
}
```

**Fallback Behavior:**
- Uses safe defaults for critical values
- Continues operation with reduced functionality
- Logs warnings for degraded features
- Provides guidance for fixing configuration

## Advanced Usage

### Custom Cache Creation

```typescript
// Create purpose-specific cache
const cache = configManager.createCacheInstance<MyDataType>('my-cache');

// Cache will use configuration-managed settings:
// - Size from CACHE_DEFAULT_MAX_SIZE
// - TTL from CACHE_DEFAULT_TTL_MS
```

### Environment Detection

```typescript
const env = configManager.getEnvironment();

switch (env) {
  case 'development':
    // Development-specific logic
    break;
  case 'production':
    // Production-specific logic
    break;
  case 'test':
    // Test-specific logic
    break;
}
```

### Configuration Monitoring

```typescript
// Check if configuration is initialized
if (configManager.isInitialized()) {
  // Safe to use configuration
}

// Get current environment
const isDev = configManager.getEnvironmentConfig().isDevelopment;
const isProd = configManager.getEnvironmentConfig().isProduction;
```

## Troubleshooting

### Common Issues

**Configuration Not Initialized:**
```typescript
// ❌ Error: Configuration not initialized
const config = configManager.getServerConfig();

// ✅ Solution: Initialize first
await configManager.initialize();
const config = configManager.getServerConfig();
```

**Invalid Environment Variables:**
```bash
# ❌ Error: Invalid port
PORT=abc

# ✅ Solution: Use valid number
PORT=3001
```

**Missing Required Variables:**
```bash
# ❌ Error: Missing API URL in production
NODE_ENV=production

# ✅ Solution: Set required variables
NODE_ENV=production
VITE_API_URL=https://api.example.com/api
```

### Debug Configuration

```typescript
// Enable debug logging
process.env.DEBUG_ENABLED = 'true';
process.env.LOG_LEVEL = 'debug';

// Initialize and check configuration
const configManager = ConfigurationManager.getInstance();
await configManager.initialize();

// Validate configuration
const validation = configManager.validate();
console.log('Configuration validation:', validation);
```

### Configuration Testing

```typescript
// Test configuration in different environments
process.env.NODE_ENV = 'test';
const configManager = ConfigurationManager.getInstance();
await configManager.initialize();

// Verify test-specific settings
const cacheConfig = configManager.getCacheConfig();
console.log('Test cache TTL:', cacheConfig.defaultTtlMs); // Should be 100
```

## Best Practices

### Environment Variables

1. **Use descriptive names:** `CACHE_ITEM_COST_TTL` instead of `CACHE_TTL`
2. **Group related variables:** All cache variables start with `CACHE_`
3. **Provide defaults:** Don't require environment variables for development
4. **Document variables:** Include descriptions and examples

### Configuration Usage

1. **Initialize early:** Call `initialize()` at application startup
2. **Use type-safe access:** Use specific config getters instead of raw configuration
3. **Handle errors:** Always handle configuration initialization errors
4. **Validate configuration:** Use the validation system to catch issues early

### Performance

1. **Cache configuration:** Don't repeatedly access configuration in hot paths
2. **Use environment checks:** Cache environment detection results
3. **Optimize for environment:** Use environment-specific optimizations

### Testing

1. **Test all environments:** Verify configuration works in dev, prod, and test
2. **Test validation:** Ensure validation catches configuration errors
3. **Test fallback:** Verify graceful degradation works
4. **Mock configuration:** Use configuration mocking in unit tests

## Support

For configuration-related issues:

- **Documentation:** This guide and inline code documentation
- **Examples:** See `docs/examples/configuration/` directory
- **Migration:** See migration examples in this guide
- **Issues:** Report bugs and feature requests on GitHub

## License

ISC License - See [LICENSE](../LICENSE) for details
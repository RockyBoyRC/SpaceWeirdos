# Configuration System Troubleshooting Guide

This guide helps resolve common configuration issues in the Space Weirdos application.

## Common Issues

### 1. Configuration Manager Not Initialized

**Error:** `Configuration manager not initialized. Call initialize() first.`

**Cause:** The ConfigurationManager singleton hasn't been initialized before use.

**Solution:**
```typescript
const configManager = ConfigurationManager.getInstance();
await configManager.initialize();
```

**In Tests:**
```typescript
beforeEach(async () => {
  (ConfigurationManager as any).instance = null;
  const configManager = ConfigurationManager.getInstance();
  await configManager.initialize();
});
```

### 2. Invalid Environment Variables

**Error:** `Configuration validation failed: PORT: Port must be an integer between 0 and 65535`

**Cause:** Environment variable has invalid value.

**Solutions:**
- Check `.env` file for typos
- Ensure numeric values are valid numbers
- Verify boolean values are `true`/`false` or `1`/`0`

**Example:**
```bash
# Wrong
PORT=invalid-port

# Correct
PORT=3001
```

### 3. Missing Required Environment Variables

**Error:** `Environment variable fallback warnings: NODE_ENV not set, defaulting to development`

**Cause:** Required environment variables are missing.

**Solution:**
Set the missing environment variables:
```bash
export NODE_ENV=development
export PORT=3001
export VITE_API_URL=http://localhost:3001/api
```

### 4. Configuration Fallback Warnings

**Warning:** `Configuration fallback: Some validation errors were ignored`

**Cause:** Configuration has issues but the system is using fallback values.

**Impact:** Application may have reduced functionality.

**Solution:**
1. Check the console for specific validation errors
2. Fix the invalid configuration values
3. Restart the application

### 5. Service Creation Errors

**Error:** `Cannot read properties of undefined (reading 'pointLimits')`

**Cause:** Service is trying to use configuration before it's loaded.

**Solution:**
Ensure services receive proper configuration:
```typescript
// Wrong
const costEngine = new CostEngine();

// Correct
const configManager = ConfigurationManager.getInstance();
const costConfig = configManager.getCostConfig();
const costEngine = new CostEngine(costConfig);

// Or use factory
const factory = new ConfigurationFactory(configManager);
const costEngine = factory.createCostEngine();
```

## Environment-Specific Issues

### Development Environment

**Issue:** Debug logs not appearing
**Solution:** Ensure `NODE_ENV=development` and `DEBUG_ENABLED=true`

**Issue:** Cache not working as expected
**Solution:** Development uses shorter TTLs (5 seconds). This is normal.

### Production Environment

**Issue:** Application performance is slow
**Solution:** Verify `NODE_ENV=production` to enable performance optimizations

**Issue:** Detailed errors in logs
**Solution:** Production hides detailed errors by default. Set `ENABLE_DETAILED_ERRORS=true` if needed for debugging.

### Test Environment

**Issue:** Tests failing with port conflicts
**Solution:** Test environment uses `PORT=0` (random port) by default. This is correct.

**Issue:** Cache not working in tests
**Solution:** Test environment uses very short TTLs (100ms). This is intentional for predictable test behavior.

## Configuration Migration

### Migrating from Legacy Constants

If you're upgrading from a version that used hardcoded constants:

1. **Remove old imports:**
```typescript
// These files have been removed - use ConfigurationManager instead
// import { POINT_LIMITS } from './constants/costs';
// import { VALIDATION_MESSAGES } from './constants/validationMessages';
```

2. **Use ConfigurationManager:**
```typescript
// Replace with this
const configManager = ConfigurationManager.getInstance();
const costConfig = configManager.getCostConfig();
const validationConfig = configManager.getValidationConfig();
```

3. **Update constant usage:**
```typescript
// Old
const limit = POINT_LIMITS.STANDARD_LIMIT;

// New
const limit = costConfig.pointLimits.standard;
```

### Automatic Migration

The system automatically migrates old configuration formats:

```typescript
const configManager = ConfigurationManager.getInstance();
const migrationResult = configManager.needsMigration(oldConfig);

if (migrationResult.needed) {
  const migratedConfig = configManager.autoMigrateIfNeeded(oldConfig);
}
```

## Debugging Configuration

### Enable Debug Logging

Set environment variables:
```bash
NODE_ENV=development
DEBUG_ENABLED=true
LOG_LEVEL=debug
```

### Check Configuration Values

```typescript
const configManager = ConfigurationManager.getInstance();
await configManager.initialize();

// Validate configuration
const validation = configManager.validate();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}

// Check specific values
console.log('Server config:', configManager.getServerConfig());
console.log('Cost config:', configManager.getCostConfig());
```

### Configuration Schema

The configuration follows this structure:

```typescript
interface Configuration {
  server: ServerConfig;      // Port, host, CORS, file paths
  api: ApiConfig;           // Base URL, retries, timeouts
  cache: CacheConfig;       // Cache sizes and TTLs
  cost: CostConfig;         // Game rule constants
  validation: ValidationConfig; // Validation settings and messages
  environment: EnvironmentConfig; // Environment-specific settings
}
```

## Getting Help

If you're still experiencing issues:

1. Check the console for detailed error messages
2. Verify your environment variables match the expected format
3. Try running with default configuration (no environment variables)
4. Check the example configuration files in `docs/examples/configuration/`
5. Review the integration tests in `tests/ConfigurationIntegrationTests.test.ts` for usage examples

## Related Documentation

- [Configuration Examples](examples/configuration/README.md)
- [API Documentation](API-DOCUMENTATION.md)
- [Architecture Overview](ARCHITECTURE.md)
# Configuration Examples

This directory contains example configuration files for different environments in the Space Weirdos Warband Builder.

## Quick Start

1. **Choose your environment:**
   - `development.env.example` - For local development
   - `production.env.example` - For production deployment
   - `test.env.example` - For running tests

2. **Copy the appropriate file:**
   ```bash
   # For development
   cp docs/examples/configuration/development.env.example .env.development
   
   # For production
   cp docs/examples/configuration/production.env.example .env.production
   
   # For testing
   cp docs/examples/configuration/test.env.example .env.test
   ```

3. **Customize the values:**
   - Edit the copied file to match your specific requirements
   - Update URLs, ports, and other environment-specific values
   - Remove or comment out variables you don't need to override

## Environment Files

### development.env.example

**Purpose:** Local development environment configuration

**Key Features:**
- Debug logging enabled
- Shorter cache TTLs for rapid development cycles
- CORS configured for common development ports
- Auto-save enabled for convenience
- Detailed error messages for debugging

**Usage:**
```bash
cp docs/examples/configuration/development.env.example .env.development
# Edit .env.development as needed
npm run dev:backend
```

### production.env.example

**Purpose:** Production deployment configuration

**Key Features:**
- Performance optimizations enabled
- Longer cache TTLs for better performance (5-15 minutes)
- Minimal logging (info level only)
- Performance monitoring enabled
- Security-focused CORS configuration

**Required Variables:**
- `VITE_API_URL` - Must be set to your production API URL
- `CORS_ORIGINS` - Should be set to your production domain(s)

**Usage:**
```bash
cp docs/examples/configuration/production.env.example .env.production
# Edit .env.production with your production values
npm run build
npm start
```

### test.env.example

**Purpose:** Test environment configuration

**Key Features:**
- Predictable behavior for testing
- Very short cache TTLs (100ms)
- Random ports to prevent conflicts in parallel tests
- No retries for deterministic test behavior
- Minimal logging to reduce test output noise

**Usage:**
```bash
cp docs/examples/configuration/test.env.example .env.test
# Usually no editing needed
npm test
```

## Configuration Sections

### Server Configuration
Controls server behavior, ports, and file paths.

**Key Variables:**
- `PORT` - Server port (0 for tests means any available port)
- `HOST` - Server host (0.0.0.0 for production, localhost for dev/test)
- `CORS_ORIGINS` - Comma-separated allowed origins

### API Configuration
Controls API behavior, retries, and timeouts.

**Key Variables:**
- `VITE_API_URL` - API base URL (required for production)
- `API_MAX_RETRIES` - Retry attempts (0 for tests, 3 for dev/prod)
- `API_TIMEOUT_MS` - Request timeout

### Cache Configuration
Controls cache sizes and TTL values.

**Environment Differences:**
- **Development:** 5-60 seconds (rapid development)
- **Production:** 5-15 minutes (performance optimization)
- **Test:** 100ms (predictable behavior)

### Cost Configuration
Controls game rules and point limits.

**Usually Consistent Across Environments:**
- `POINT_LIMIT_STANDARD=75`
- `POINT_LIMIT_EXTENDED=125`
- `TROOPER_LIMIT_STANDARD=20`

### Validation Configuration
Controls validation behavior and thresholds.

**Key Variables:**
- `VALIDATION_COST_WARNING_THRESHOLD=0.9` - Warning at 90% of limit
- `VALIDATION_CONTEXT_AWARE_WARNINGS=true` - Enable smart warnings
- `VALIDATION_STRICT_MODE` - false for dev/prod, true for tests

### Environment Configuration
Controls logging, debugging, and monitoring.

**Environment Differences:**
- **Development:** Debug logging, detailed errors
- **Production:** Info logging, performance monitoring
- **Test:** Error logging only, detailed errors for debugging

### File Operations Configuration
Controls file upload/download limits.

**Environment Differences:**
- **Development/Production:** 10MB limit, 30s timeout
- **Test:** 1MB limit, 5s timeout (faster tests)

## Customization Guide

### Common Customizations

**Change Server Port:**
```bash
# Default: 3001
PORT=8080
```

**Update API URL:**
```bash
# Development
VITE_API_URL=http://localhost:8080/api

# Production
VITE_API_URL=https://api.yourdomain.com/api
```

**Adjust Cache Performance:**
```bash
# Longer cache for better performance
CACHE_DEFAULT_TTL_MS=600000  # 10 minutes
CACHE_ITEM_COST_TTL=1800000  # 30 minutes

# Shorter cache for rapid development
CACHE_DEFAULT_TTL_MS=1000    # 1 second
```

**Configure CORS:**
```bash
# Single origin
CORS_ORIGINS=https://yourdomain.com

# Multiple origins
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com

# Development (allow all)
CORS_ORIGINS=*
```

### Advanced Customizations

**Game Rule Modifications:**
```bash
# Custom point limits
POINT_LIMIT_STANDARD=100
POINT_LIMIT_EXTENDED=150

# Custom warning threshold (80% instead of 90%)
VALIDATION_COST_WARNING_THRESHOLD=0.8

# Custom trooper limits
TROOPER_LIMIT_STANDARD=25
TROOPER_LIMIT_MAXIMUM=30
```

**Performance Tuning:**
```bash
# High-performance caching
CACHE_DEFAULT_MAX_SIZE=500
CACHE_ITEM_COST_SIZE=1000
CACHE_COST_CALC_SIZE=500

# Low-memory configuration
CACHE_DEFAULT_MAX_SIZE=50
CACHE_ITEM_COST_SIZE=100
CACHE_COST_CALC_SIZE=50
```

**Security Hardening:**
```bash
# Strict file limits
FILE_MAX_SIZE_BYTES=1048576      # 1MB
FILE_MAX_FILENAME_LENGTH=100
FILE_OPERATION_TIMEOUT_MS=10000  # 10 seconds

# Disable auto-save in production
ENABLE_AUTO_SAVE=false
```

## Environment Variable Priority

Configuration values are applied in this order (later values override earlier ones):

1. **Default values** (built into the application)
2. **Environment-specific defaults** (based on NODE_ENV)
3. **Environment variables** (from .env files or system environment)

## Validation

The configuration system validates all values and provides helpful error messages:

```bash
# Test your configuration
npm run test:config

# Or check during startup
npm run dev:backend
# Look for configuration validation messages in the console
```

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Solution: Change the port
PORT=3002
```

**Invalid API URL:**
```bash
# ❌ Wrong
VITE_API_URL=localhost:3001/api

# ✅ Correct
VITE_API_URL=http://localhost:3001/api
```

**CORS Issues:**
```bash
# ❌ Wrong (missing protocol)
CORS_ORIGINS=localhost:3000

# ✅ Correct
CORS_ORIGINS=http://localhost:3000
```

**Cache Issues:**
```bash
# ❌ Wrong (negative value)
CACHE_DEFAULT_TTL_MS=-1000

# ✅ Correct
CACHE_DEFAULT_TTL_MS=5000
```

### Debug Configuration

Enable debug logging to see configuration loading:

```bash
DEBUG_ENABLED=true
LOG_LEVEL=debug
npm run dev:backend
```

Look for messages like:
- "Environment detected: development"
- "Configuration loaded successfully"
- "Configuration validation: passed"

## Best Practices

### Development
- Use shorter cache TTLs for rapid iteration
- Enable debug logging and detailed errors
- Use localhost for all URLs
- Enable auto-save for convenience

### Production
- Use longer cache TTLs for performance
- Disable debug logging
- Use specific CORS origins (not wildcards)
- Enable performance monitoring
- Set proper API URLs with HTTPS

### Testing
- Use very short cache TTLs for predictable behavior
- Use random ports to avoid conflicts
- Disable retries for deterministic tests
- Use minimal logging to reduce noise

### Security
- Never commit actual .env files to version control
- Use specific CORS origins in production
- Set reasonable file size limits
- Enable filename sanitization
- Use HTTPS in production

## Support

For configuration help:
- **Full Documentation:** [docs/CONFIGURATION.md](../CONFIGURATION.md)
- **Migration Guide:** See v1.8.0 release notes
- **GitHub Issues:** Report configuration problems

## License

ISC License - See [LICENSE](../../../LICENSE) for details
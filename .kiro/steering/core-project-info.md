---
inclusion: always
---

# Core Project Information

## Technology Stack

### Frontend
- **Language:** TypeScript
- **Framework:** React
- **Purpose:** Web interface for user interaction

### Backend
- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** Express
- **Purpose:** Business logic, in-memory database, JSON file I/O

### Data Storage
- **In-Memory Database:** JavaScript objects, Maps, and Sets
- **Persistence:** JSON files on local filesystem
- **Configuration:** Centralized Configuration System (ConfigurationManager)

### Testing
- **Unit Testing:** Vitest
- **Property-Based Testing:** fast-check (minimum 50 iterations per test)
- **Test Location:** Co-located with source files using `.test.ts` suffix

### Key Libraries
- **File I/O:** Node.js `fs` module (promises API)
- **JSON Handling:** Native `JSON.parse()` and `JSON.stringify()`
- **HTTP Server:** Express.js
- **Configuration Management:** Custom ConfigurationManager with environment variable support
- **UI Design System:** CSS custom properties for design tokens (colors, spacing, typography)

## Configuration System Requirements

### MANDATORY: Use ConfigurationManager for Backend Constants

**All backend magic numbers, global variables, and business logic configuration parameters MUST use the existing Configuration System:**

**Note:** UI design tokens (colors, spacing, typography) are managed separately through CSS custom properties in the UI Design System (`src/frontend/styles/tokens/`).

```typescript
// ✅ CORRECT - Use ConfigurationManager
import { ConfigurationManager } from '../config/ConfigurationManager.js';

const configManager = ConfigurationManager.getInstance();
await configManager.initialize();

const costConfig = configManager.getCostConfig();
const pointLimit = costConfig.pointLimits.standard; // 75
const maxRetries = configManager.getApiConfig().maxRetries; // 3
```

```typescript
// ❌ WRONG - Direct backend constants/magic numbers
const POINT_LIMIT = 75;
const MAX_RETRIES = 3;
const CACHE_SIZE = 100;
```

**For UI design tokens, use CSS custom properties:**
```css
/* ✅ CORRECT - UI design tokens in CSS */
:root {
  --color-primary: #3b82f6;
  --spacing-md: 1rem;
  --font-size-lg: 1.125rem;
}
```

### Configuration vs UI Design Tokens

**Backend Configuration (Use ConfigurationManager):**
- Business logic constants (point limits, equipment limits)
- API settings (URLs, timeouts, retries)
- Cache configuration (sizes, TTL values)
- Validation rules and messages
- Environment-specific behavior

**UI Design Tokens (Use CSS Custom Properties):**
- Visual design constants (colors, spacing, typography)
- Layout tokens (breakpoints, grid systems)
- Animation timing and easing functions
- Shadows, borders, and visual effects

### Configuration Categories

**Server Configuration:**
- Ports, hosts, CORS origins
- File paths (static, data, warband data)
- Auto-save settings

**API Configuration:**
- Base URLs, timeouts, retry policies
- Request/response settings

**Cache Configuration:**
- Cache sizes and TTL values
- Purpose-specific cache settings

**Cost Configuration:**
- Point limits, trooper limits
- Equipment limits, discount values
- Ability-specific weapon/equipment lists

**Validation Configuration:**
- Warning thresholds, validation flags
- All validation error messages

**Environment Configuration:**
- Environment detection, debug settings
- Logging levels, performance monitoring

### Environment Variable Support

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

# Cache configuration
CACHE_DEFAULT_MAX_SIZE=100
CACHE_DEFAULT_TTL_MS=5000

# Cost configuration
POINT_LIMIT_STANDARD=75
POINT_LIMIT_EXTENDED=125
TROOPER_LIMIT_STANDARD=20

# Validation configuration
VALIDATION_COST_WARNING_THRESHOLD=0.9
VALIDATION_CONTEXT_AWARE_WARNINGS=true
```

### Migration from Legacy Constants

**Removed files (DO NOT USE):**
- `src/backend/constants/costs.ts` - REMOVED - Use `configManager.getCostConfig()` instead
- `src/backend/constants/validationMessages.ts` - REMOVED - Use `configManager.getValidationConfig().messages` instead

**Migration examples:**
```typescript
// ❌ OLD - Deprecated constants
import { POINT_LIMITS } from '../constants/costs.js';
const limit = POINT_LIMITS.STANDARD_LIMIT;

// ✅ NEW - Configuration system
const costConfig = configManager.getCostConfig();
const limit = costConfig.pointLimits.standard;
```

### Configuration Validation

The system provides comprehensive validation:
- Type checking for all configuration values
- Range validation for numeric values
- Environment-specific overrides
- Fallback behavior for missing values
- Detailed error messages with suggestions

### Cache Factory Integration

Use the configuration system for cache creation:

```typescript
// ✅ CORRECT - Use configuration-managed cache
const cache = configManager.createCacheInstance<ItemCost>('item-cost');

// ❌ WRONG - Manual cache configuration
const cache = new SimpleCache<ItemCost>(200, 10000);
```

## Code Style

- Use clear, descriptive variable and function names
- Follow TypeScript and React best practices
- Keep functions focused and single-purpose
- Add comments for complex logic
- Use async/await for asynchronous operations
- Prefer functional programming patterns where appropriate
- Use proper TypeScript types (avoid `any`)
- Follow ESLint and Prettier configurations
- **MANDATORY:** Use ConfigurationManager for backend constants and business logic values
- **MANDATORY:** Use CSS custom properties for UI design tokens (colors, spacing, typography)

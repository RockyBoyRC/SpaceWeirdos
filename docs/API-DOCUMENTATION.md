# API Documentation

## Overview

The Space Weirdos Warband Builder uses a RESTful API for all frontend-backend communication. The API provides endpoints for cost calculation, validation, and warband management with comprehensive error handling and type safety.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required for API endpoints.

## Response Format

All API responses follow a consistent structure:

```typescript
// Success Response
{
  success: true,
  data: T // Response data
}

// Error Response
{
  success: false,
  error: {
    message: string,
    code?: string,
    details?: any
  }
}
```

## Endpoints

### Cost Calculation

#### POST /api/cost/calculate

Calculates real-time cost for a weirdo with context-aware warnings.

**Request Body:**
```typescript
{
  weirdoType: 'leader' | 'trooper',
  attributes: {
    speed: 1 | 2 | 3,
    defense: '2d6' | '2d8' | '2d10',
    firepower: 'None' | '2d8' | '2d10',
    prowess: '2d6' | '2d8' | '2d10',
    willpower: '2d6' | '2d8' | '2d10'
  },
  weapons: {
    close: Weapon[],
    ranged: Weapon[]
  },
  equipment: Equipment[],
  psychicPowers: PsychicPower[],
  warbandAbility?: 'Heavily Armed' | 'Mutants' | 'Soldiers' | 'Cyborgs'
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    totalCost: number,
    breakdown: {
      attributes: number,
      weapons: number,
      equipment: number,
      psychicPowers: number
    },
    warnings: string[], // Context-aware warnings from ValidationService
    isApproachingLimit: boolean, // Derived from warnings
    isOverLimit: boolean
  }
}
```

**Warning Logic:**
- Uses backend ValidationService for context-aware warnings
- Considers warband composition (25-point weirdo existence)
- Warns within 3 points of applicable limits
- Provides clear messaging about which limits apply

### Validation

#### POST /api/validation/weirdo

Validates a weirdo with comprehensive rule checking and context-aware warnings.

**Request Body:**
```typescript
{
  weirdo: Weirdo,
  warband?: Warband // Optional warband context for full validation
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    valid: boolean,
    errors: ValidationError[],
    warnings: ValidationWarning[] // Context-aware warnings
  }
}
```

**Validation Types:**
```typescript
interface ValidationError {
  field: string,
  message: string,
  code: string
}

interface ValidationWarning {
  field: string,
  message: string,
  code: string
}
```

#### POST /api/validation/warband

Validates a complete warband with all rules and constraints.

**Request Body:**
```typescript
{
  warband: Warband
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    valid: boolean,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  }
}
```

### Warband Management

#### GET /api/warbands

Retrieve all saved warbands.

**Response:**
```typescript
{
  success: true,
  data: {
    warbands: WarbandSummary[]
  }
}
```

#### GET /api/warbands/:id

Retrieve a specific warband by ID.

**Response:**
```typescript
{
  success: true,
  data: {
    warband: Warband
  }
}
```

#### POST /api/warbands

Create a new warband.

**Request Body:**
```typescript
{
  warband: Omit<Warband, 'id' | 'createdAt' | 'updatedAt'>
}
```

#### PUT /api/warbands/:id

Update an existing warband.

**Request Body:**
```typescript
{
  warband: Warband
}
```

#### DELETE /api/warbands/:id

Delete a warband.

**Response:**
```typescript
{
  success: true,
  data: {
    message: 'Warband deleted successfully'
  }
}
```

### Import/Export Operations

#### GET /api/warbands/:id/export

Export a warband as a JSON file for backup or sharing.

**Parameters:**
- `id` (string): The unique identifier of the warband to export

**Response Headers:**
```
Content-Type: application/json
Content-Disposition: attachment; filename="[warband_name]_warband.json"
Cache-Control: no-cache
```

**Response Body:**
```typescript
{
  // Core warband properties
  id: string,
  name: string,
  ability: WarbandAbility | null,
  pointLimit: 75 | 125,
  totalCost: number,
  weirdos: Weirdo[],
  createdAt: string, // ISO date string
  updatedAt: string, // ISO date string
  
  // Export metadata
  exportVersion: string, // "1.0"
  exportedAt: string, // ISO date string
  exportedBy: string // "Space Weirdos Warband Builder"
}
```

**Error Responses:**
```typescript
// Warband not found
{
  type: 'VALIDATION_ERROR',
  message: 'Warband ID is required',
  details: string,
  retryable: false
}

// Export failed
{
  type: 'SERVER_ERROR',
  message: 'Export operation failed',
  details: string,
  retryable: false
}
```

#### POST /api/warbands/import

Import a warband from JSON data with comprehensive validation and conflict resolution.

**Request Body:**
```typescript
{
  // Complete exported warband JSON structure
  id: string,
  name: string,
  ability: WarbandAbility | null,
  pointLimit: 75 | 125,
  totalCost: number,
  weirdos: Weirdo[],
  createdAt: string,
  updatedAt: string,
  exportVersion: string,
  exportedAt: string,
  exportedBy: string
}
```

**Success Response:**
```typescript
{
  success: true,
  message: 'Warband imported successfully',
  warband: Warband // The imported warband with new ID
}
```

**Error Responses:**
```typescript
// Validation errors
{
  error: 'Validation failed',
  type: 'VALIDATION_ERROR',
  message: 'The imported warband data contains validation errors',
  validationErrors: Array<{
    field: string,
    message: string,
    code: string
  }>,
  retryable: false
}

// Name conflict
{
  error: 'Name conflict',
  type: 'NAME_CONFLICT',
  message: 'A warband with this name already exists',
  conflictingName: string,
  retryable: true,
  suggestions: ['Choose a different name', 'Replace the existing warband']
}

// Import failed
{
  type: 'SERVER_ERROR',
  message: 'Import operation failed',
  details: string,
  retryable: false
}
```

#### POST /api/warbands/validate-import

Validate imported warband data without actually importing it. Useful for pre-validation and error checking.

**Request Body:**
```typescript
{
  // Same structure as import endpoint
  id: string,
  name: string,
  ability: WarbandAbility | null,
  pointLimit: 75 | 125,
  totalCost: number,
  weirdos: Weirdo[],
  createdAt: string,
  updatedAt: string,
  exportVersion: string,
  exportedAt: string,
  exportedBy: string
}
```

**Response:**
```typescript
{
  valid: boolean,
  errors: Array<{
    field: string,
    message: string,
    code: string
  }>,
  warnings: Array<{
    field: string,
    message: string,
    code: string
  }>,
  categories: {
    structure: ValidationIssue[], // Missing fields, invalid types
    gameData: ValidationIssue[], // Missing weapons, equipment, abilities
    businessLogic: ValidationIssue[], // Point limits, invalid combinations
    other: ValidationIssue[] // Other validation issues
  }
}
```

**Validation Categories:**
- **Structure**: Missing required fields, invalid data types, malformed JSON
- **Game Data**: Missing weapons, equipment, abilities, or other game references
- **Business Logic**: Point limit violations, invalid attribute combinations, rule violations
- **Other**: Miscellaneous validation issues not fitting other categories

## Error Codes

### Validation Error Codes
- `REQUIRED_FIELD`: Missing required field
- `INVALID_VALUE`: Value outside allowed range
- `WEAPON_REQUIRED`: Missing required weapon
- `EQUIPMENT_LIMIT`: Too many equipment items
- `COST_EXCEEDED`: Point cost too high
- `INVALID_TRAIT`: Leader trait on trooper
- `WARBAND_INVALID`: Warband structure violation

### Import/Export Error Codes
- `MISSING_WARBAND_ID`: Warband ID not provided for export
- `EXPORT_FAILED`: Export operation encountered an error
- `IMPORT_FAILED`: Import operation encountered an error
- `INVALID_JSON_DATA`: Invalid or malformed JSON data provided
- `NAME_CONFLICT`: Imported warband name conflicts with existing warband
- `VALIDATION_ERROR`: Imported data failed validation checks
- `FILE_READ_ERROR`: Error reading or processing file data
- `NETWORK_ERROR`: Network-related error during operation
- `TIMEOUT_ERROR`: Operation timed out
- `SERVER_ERROR`: Internal server error during import/export
- `UNKNOWN_ERROR`: Unexpected error occurred

### Import/Export Error Types
- `NETWORK_ERROR`: Connection issues, network failures
- `FILE_READ_ERROR`: File format, size, or access issues
- `VALIDATION_ERROR`: Data validation failures
- `SERVER_ERROR`: Internal server errors
- `TIMEOUT_ERROR`: Operation timeout errors
- `UNKNOWN_ERROR`: Unclassified errors

### Warning Codes
- `COST_APPROACHING_LIMIT`: Weirdo cost within 3 points of applicable limit

### HTTP Error Codes
- `400`: Bad Request - Invalid request data
- `404`: Not Found - Resource not found
- `409`: Conflict - Name conflict during import
- `500`: Internal Server Error - Server error

## Context-Aware Warning System

### Warning Generation Logic

The API uses the backend `ValidationService` to generate context-aware warnings:

1. **No 25-point weirdo exists**: Warns at 18-20 (20-limit) and 23-25 (25-limit)
2. **25-point weirdo exists (different weirdo)**: Warns at 18-20 only
3. **25-point weirdo exists (same weirdo)**: Warns at 23-25 only

### Warning Messages

- `"Cost is within X points of the 20-point limit"`
- `"Cost is within X points of the 25-point limit (premium weirdo slot)"`
- `"Cost is within X points of the 25-point limit"`

### Integration Notes

- Frontend should use `isApproachingLimit` flag for UI state
- Display `warnings` array for user feedback
- Warnings don't block actions (unlike errors)
- Real-time endpoints provide immediate feedback

## Performance

### Caching
- Cost calculations are cached for performance
- Cache invalidation on warband changes
- Sub-100ms response times for real-time endpoints

### Rate Limiting
- Currently no rate limiting implemented
- Consider implementing for production use

## Configuration

### Import/Export Configuration Settings

The import/export system uses the Configuration Manager for all settings and limits. These can be overridden via environment variables:

#### File Operation Settings

```bash
# Maximum file size for imports (default: 10MB)
FILE_MAX_SIZE_BYTES=10485760

# Allowed file types for import (default: application/json,.json)
FILE_ALLOWED_TYPES=application/json,.json

# Maximum filename length (default: 255)
FILE_MAX_FILENAME_LENGTH=255

# Enable filename sanitization (default: true)
FILE_ENABLE_FILENAME_SANITIZATION=true
```

#### Validation Settings

```bash
# Enable comprehensive validation (default: true)
VALIDATION_ENABLE_COMPREHENSIVE=true

# Enable game data reference validation (default: true)
VALIDATION_ENABLE_GAME_DATA_VALIDATION=true

# Enable business rule validation (default: true)
VALIDATION_ENABLE_BUSINESS_RULES=true
```

#### Security Settings

```bash
# Enable input sanitization (default: true)
SECURITY_ENABLE_INPUT_SANITIZATION=true

# Enable filename sanitization (default: true)
SECURITY_ENABLE_FILENAME_SANITIZATION=true
```

### Configuration Access

```typescript
// Access configuration in backend code
const configManager = ConfigurationManager.getInstance();
await configManager.initialize();

const fileConfig = configManager.getFileOperationConfig();
console.log(`Max file size: ${fileConfig.maxFileSizeBytes} bytes`);
console.log(`Allowed types: ${fileConfig.allowedFileTypes.join(', ')}`);
```

## Type Definitions

Full TypeScript type definitions are available in:
- `src/backend/models/types.ts` - Backend types
- `src/frontend/services/apiTypes.ts` - API request/response types

## Examples

### Real-time Cost Calculation

```javascript
// Calculate cost for a 19-point trooper
const response = await fetch('/api/cost/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    weirdoType: 'trooper',
    attributes: {
      speed: 3,
      defense: '2d8',
      firepower: '2d8',
      prowess: '2d8',
      willpower: '2d8'
    },
    weapons: { close: [unarmedWeapon], ranged: [] },
    equipment: [],
    psychicPowers: [],
    warbandAbility: null
  })
});

const result = await response.json();
// result.data.totalCost = 19
// result.data.warnings = ["Cost is within 1 point of the 20-point limit"]
// result.data.isApproachingLimit = true
```

### Weirdo Validation

```javascript
// Validate a weirdo with warband context
const response = await fetch('/api/validation/weirdo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    weirdo: myWeirdo,
    warband: myWarband
  })
});

const result = await response.json();
// result.data.valid = true
// result.data.errors = []
// result.data.warnings = ["Cost is within 2 points of the 25-point limit"]
```

### Export Warband

```javascript
// Export a warband as JSON file
const response = await fetch('/api/warbands/123/export', {
  method: 'GET'
});

// Response will trigger file download with headers:
// Content-Type: application/json
// Content-Disposition: attachment; filename="My_Warband_warband.json"

const exportedWarband = await response.json();
// exportedWarband contains complete warband data with metadata
```

### Import Warband

```javascript
// Import a warband from JSON data
const importData = {
  id: "original-id",
  name: "Imported Warband",
  ability: "Heavily Armed",
  pointLimit: 75,
  totalCost: 65,
  weirdos: [...], // Array of weirdo objects
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
  exportVersion: "1.0",
  exportedAt: "2023-01-01T00:00:00.000Z",
  exportedBy: "Space Weirdos Warband Builder"
};

const response = await fetch('/api/warbands/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(importData)
});

const result = await response.json();
if (result.success) {
  // result.warband contains the imported warband with new ID
  console.log('Import successful:', result.warband);
} else if (result.type === 'NAME_CONFLICT') {
  // Handle name conflict
  console.log('Name conflict:', result.conflictingName);
  console.log('Suggestions:', result.suggestions);
} else if (result.type === 'VALIDATION_ERROR') {
  // Handle validation errors
  console.log('Validation errors:', result.validationErrors);
}
```

### Validate Import Data

```javascript
// Validate import data before actually importing
const response = await fetch('/api/warbands/validate-import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(importData)
});

const validation = await response.json();
if (validation.valid) {
  console.log('Data is valid for import');
} else {
  console.log('Validation errors:', validation.errors);
  console.log('Validation warnings:', validation.warnings);
  console.log('Issues by category:', validation.categories);
}
```

This API provides a robust foundation for building Space Weirdos warbands with intelligent validation and context-aware feedback!

# Design Document

## Overview

This design document outlines the architecture for merging version 1.6 import/export capabilities into the current local codebase. The solution integrates advanced file operations, comprehensive validation, and enhanced user interface components while preserving the existing configuration management system and maintaining API separation principles.

The design prioritizes user experience through intuitive file operations, robust error handling, and seamless integration with existing warband management workflows.

## Architecture

### System Components

The import/export system extends the existing architecture with new specialized components:

```
Frontend Layer:
├── Import/Export UI Components
│   ├── FileOperationStatus (progress tracking)
│   ├── ImportExportErrorDisplay (error handling)
│   ├── NameConflictDialog (conflict resolution)
│   └── Enhanced WarbandList (export buttons)
├── File Operations Service
│   ├── FileUtils (browser file operations)
│   └── Validation utilities
└── API Client Extensions
    └── Import/Export endpoints

Backend Layer:
├── Import/Export Controller
│   ├── Export endpoint (/api/warbands/:id/export)
│   ├── Import endpoint (/api/warbands/import)
│   └── Validation endpoint (/api/warbands/validate-import)
├── WarbandImportExportService
│   ├── JSON serialization/deserialization
│   ├── Data validation and sanitization
│   └── Game data reference validation
└── Enhanced Error Handling
    └── Structured error responses with categorization
```

### Integration Points

The new components integrate with existing systems:

- **Configuration Manager**: All constants, limits, and validation thresholds
- **Validation Service**: Extended for import-specific validation rules
- **Warband Service**: Enhanced with import/export operations
- **API Layer**: New endpoints following existing RESTful patterns
- **Error Handling**: Extended AppError system with import/export error types

## Components and Interfaces

### Backend Components

#### ImportExportController
```typescript
class ImportExportController {
  async exportWarband(req: Request, res: Response): Promise<void>
  async importWarband(req: Request, res: Response): Promise<void>
  async validateImport(req: Request, res: Response): Promise<void>
}
```

**Responsibilities:**
- Handle HTTP requests for import/export operations
- Coordinate with WarbandImportExportService
- Provide structured error responses with categorization
- Set appropriate headers for file downloads

#### WarbandImportExportService
```typescript
class WarbandImportExportService {
  async exportWarbandToJson(id: string): Promise<ExportResult>
  async importWarbandFromJson(jsonData: unknown): Promise<ImportResult>
  validateWarbandJson(jsonData: unknown): ImportValidation
  sanitizeWarbandForImport(exportedWarband: ExportedWarband): Partial<Warband>
}
```

**Responsibilities:**
- Business logic for import/export operations
- Comprehensive JSON schema validation
- Game data reference validation against current data files
- Data sanitization and conflict resolution
- Integration with existing WarbandService

### Frontend Components

#### FileOperationStatus
```typescript
interface FileOperationStatusProps {
  operation: 'import' | 'export'
  state: FileOperationState
  progress?: number
  message?: string
  fileName?: string
  onCancel?: () => void
}
```

**Responsibilities:**
- Display real-time progress for file operations
- Provide cancellation options for long-running operations
- Show operation-specific status messages and icons
- Support both determinate and indeterminate progress indicators

#### ImportExportErrorDisplay
```typescript
interface ImportExportErrorDisplayProps {
  error: ImportExportError
  operation: 'import' | 'export'
  onRetry?: () => void
  onDismiss: () => void
}
```

**Responsibilities:**
- Display categorized error information with specific field references
- Provide contextual suggestions based on error type
- Support retry mechanisms for recoverable errors
- Show validation errors in structured format

#### NameConflictDialog
```typescript
interface NameConflictDialogProps {
  existingWarbandName: string
  importedWarbandName: string
  onRename: (newName: string) => void
  onReplace: () => void
  onCancel: () => void
}
```

**Responsibilities:**
- Handle warband name conflicts during import
- Provide rename input with validation
- Confirm destructive replace operations
- Implement proper focus management and accessibility

#### FileUtils Service
```typescript
class FileUtils {
  static downloadWarbandAsJson(warband: Warband): void
  static selectJsonFile(): Promise<File>
  static readJsonFile(file: File): Promise<unknown>
  static sanitizeFilename(filename: string): string
  static validateFile(file: File): FileValidationResult
}
```

**Responsibilities:**
- Browser-based file upload and download operations
- File validation for type, size, and format
- Filename sanitization for security and compatibility
- Error handling for file operation failures

## Data Models

### Export Data Structure
```typescript
interface ExportedWarband {
  // Core warband properties
  id: string
  name: string
  ability: WarbandAbility | null
  pointLimit: 75 | 125
  totalCost: number
  weirdos: Weirdo[]
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  
  // Export metadata
  exportVersion: string // "1.0"
  exportedAt: string // ISO date string
  exportedBy: string // "Space Weirdos Warband Builder"
}
```

### Validation Results
```typescript
interface ImportValidation {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  field: string
  message: string
  code: ValidationErrorCode
}

interface ValidationWarning {
  field: string
  message: string
  code: string
}
```

### Error Types
```typescript
type ImportExportErrorType = 
  | 'NETWORK_ERROR'
  | 'FILE_READ_ERROR'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR'

interface ImportExportError {
  type: ImportExportErrorType
  message: string
  details?: string
  validationErrors?: ValidationError[]
  retryable: boolean
}
```

## Error Handling

### Error Categorization

The system categorizes errors for better user understanding:

**Structure Errors**: Missing required fields, invalid data types
**Game Data Errors**: Missing weapons, equipment, or abilities in current data
**Business Logic Errors**: Point limit violations, invalid attribute values
**File Operation Errors**: File read failures, invalid formats, size limits
**Network Errors**: Connection failures, timeouts, server errors

### Error Recovery

- **Retryable Errors**: Network failures, timeouts, temporary server errors
- **User-Fixable Errors**: File format issues, validation failures
- **Fatal Errors**: Corrupted data, unsupported formats

### User Feedback

Each error type provides:
- Clear description of the problem
- Specific field references for validation errors
- Actionable suggestions for resolution
- Retry options where appropriate

## Testing Strategy

### Unit Testing

**Backend Services:**
- WarbandImportExportService validation logic
- ImportExportController error handling
- File sanitization and security functions
- JSON schema validation edge cases

**Frontend Components:**
- FileOperationStatus state management
- ImportExportErrorDisplay error categorization
- NameConflictDialog user interactions
- FileUtils browser API integration

**Integration Testing:**
- Complete import/export workflows
- Error handling across API boundaries
- File operation security validation
- Configuration Manager integration

### Property-Based Testing

The system will implement property-based tests using fast-check with minimum 50 iterations per test. Each test will be tagged with the format: `**Feature: v1.6-merge-import-export, Property {number}: {property_text}**`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Export Operations

**Property 1: Export completeness**
*For any* valid warband, exporting it should produce JSON data containing all required warband fields (id, name, ability, pointLimit, totalCost, weirdos, timestamps)
**Validates: Requirements 1.1**

**Property 2: Export metadata inclusion**
*For any* warband export, the resulting JSON should include export metadata with version information, export timestamp, and source application identifier
**Validates: Requirements 1.3**

**Property 3: Filename sanitization**
*For any* string containing invalid filesystem characters, the filename sanitization function should produce a safe filename without invalid characters while preserving readability
**Validates: Requirements 1.4**

**Property 4: Export error handling**
*For any* export operation that encounters an error, the system should generate a structured error response with appropriate error type classification and retry information
**Validates: Requirements 1.5**

### Import Operations and Validation

**Property 5: Import validation completeness**
*For any* JSON input, the validation engine should check both structural validity and game data reference integrity before allowing import
**Validates: Requirements 2.2**

**Property 6: Valid import success**
*For any* structurally valid and game-data-complete warband JSON, the import operation should successfully create a warband in the local database
**Validates: Requirements 2.3**

**Property 7: Name conflict detection**
*For any* imported warband with a name that matches an existing warband, the system should detect the conflict and trigger resolution mechanisms
**Validates: Requirements 2.4**

**Property 8: Validation error categorization**
*For any* invalid warband data, the validation engine should categorize errors by type (structure, data types, game data, business logic) with specific field references
**Validates: Requirements 2.5**

### Schema and Data Validation

**Property 9: JSON schema validation**
*For any* JSON input, the schema validation should correctly identify structural compliance with the expected warband format
**Validates: Requirements 3.1**

**Property 10: Game data reference validation**
*For any* warband data containing game references (weapons, equipment, abilities), the validation should verify all references exist in current game data
**Validates: Requirements 3.2**

**Property 11: Missing reference warning generation**
*For any* warband data with missing game data references, the validation should generate specific warnings identifying the missing items
**Validates: Requirements 3.3**

**Property 12: Structural error prevention**
*For any* malformed warband data, the validation should prevent import and provide detailed error descriptions for each structural issue
**Validates: Requirements 3.4**

**Property 13: Issue categorization consistency**
*For any* validation result, issues should be consistently categorized by type to enable appropriate user interface presentation
**Validates: Requirements 3.5**

### Error Handling and User Feedback

**Property 14: Cancellation availability**
*For any* file operation state, the system should correctly determine whether cancellation is appropriate and available to the user
**Validates: Requirements 4.2**

**Property 15: Error message specificity**
*For any* error condition, the system should generate specific error messages with actionable suggestions appropriate to the error type
**Validates: Requirements 4.4**

**Property 16: Error type classification**
*For any* error input, the system should correctly classify errors as network, server, validation, or file operation errors
**Validates: Requirements 4.5**

### Name Conflict Resolution

**Property 17: Conflict detection accuracy**
*For any* warband name and existing warband list, the conflict detection should correctly identify whether a name collision exists
**Validates: Requirements 5.1**

**Property 18: Name validation**
*For any* proposed warband name, the validation should correctly determine if the name is valid and unique within the current database
**Validates: Requirements 5.2**

**Property 19: Unique name generation**
*For any* base name and list of existing names, the unique name generator should produce a name that is guaranteed not to conflict with existing names
**Validates: Requirements 5.4**

### Configuration Integration

**Property 20: Configuration-based validation limits**
*For any* validation operation, the system should use Configuration Manager values for all thresholds, limits, and validation rules
**Validates: Requirements 6.2**

**Property 21: Configuration-based file restrictions**
*For any* file operation, the system should respect Configuration Manager settings for file size limits and allowed file types
**Validates: Requirements 6.3**

**Property 22: Configuration-based error messages**
*For any* error message generation, the system should use Configuration Manager templates and message formats
**Validates: Requirements 6.4**

### Comprehensive Error Handling

**Property 23: File error classification**
*For any* file operation error, the system should correctly classify the error as format, size, access, or other file-related issues
**Validates: Requirements 7.1**

**Property 24: Retry mechanism appropriateness**
*For any* error condition, the system should correctly determine whether the error is recoverable and provide retry mechanisms only when appropriate
**Validates: Requirements 7.2**

**Property 25: Validation error grouping**
*For any* set of validation errors, the system should group errors by category and provide specific field references for each error
**Validates: Requirements 7.3**

**Property 26: Server error user messaging**
*For any* server error, the system should generate user-friendly messages that explain the issue without exposing technical implementation details
**Validates: Requirements 7.4**

**Property 27: Timeout error suggestions**
*For any* timeout error, the system should provide specific suggestions for resolution including alternative approaches or file size recommendations
**Validates: Requirements 7.5**

### Security and Data Integrity

**Property 28: File validation security**
*For any* uploaded file, the validation should check file type, size, and format constraints before any processing occurs
**Validates: Requirements 8.1**

**Property 29: Input data sanitization**
*For any* imported data, the sanitization process should neutralize potentially malicious content while preserving valid warband data
**Validates: Requirements 8.2**

**Property 30: Export-import round trip integrity**
*For any* valid warband, exporting and then importing the warband should result in equivalent warband data (excluding generated IDs and timestamps)
**Validates: Requirements 8.3**

**Property 31: Filename security sanitization**
*For any* filename input, the sanitization should remove or replace characters that could cause filesystem security issues while maintaining filename readability
**Validates: Requirements 8.4**

**Property 32: Unique ID generation**
*For any* import operation, the system should generate new unique IDs for imported warbands and weirdos to prevent database conflicts
**Validates: Requirements 8.5**
/**
 * FileUtils Service
 * 
 * Browser-based file operations service for import/export functionality.
 * Provides secure file upload, download, and validation capabilities
 * integrated with the Configuration Manager for file operation limits.
 */

import { getFrontendConfigInstance } from '../config/frontendConfig';

/**
 * File validation result interface
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * File operation error types
 */
export type FileOperationErrorType = 
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'FILE_READ_ERROR'
  | 'FILENAME_TOO_LONG'
  | 'INVALID_JSON'
  | 'SECURITY_ERROR';

/**
 * File operation error class
 */
export class FileOperationError extends Error {
  constructor(
    message: string,
    public type: FileOperationErrorType,
    public details?: string
  ) {
    super(message);
    this.name = 'FileOperationError';
  }
}

/**
 * File operation configuration (frontend equivalent of backend config)
 */
interface FileOperationConfig {
  maxFileSizeBytes: number;
  allowedFileTypes: string[];
  maxFilenameLength: number;
  enableFilenameSanitization: boolean;
  fileOperationTimeoutMs: number;
}

/**
 * Gets file operation configuration from environment variables
 * These should align with backend FileOperationConfig defaults
 * Requirements: 6.2, 6.3, 6.4
 */
function getFileOperationConfig(): FileOperationConfig {
  return {
    maxFileSizeBytes: parseInt((import.meta as any).env?.VITE_FILE_MAX_SIZE_BYTES) || 10 * 1024 * 1024, // 10MB
    allowedFileTypes: (import.meta as any).env?.VITE_FILE_ALLOWED_TYPES?.split(',').map((t: string) => t.trim()) || ['application/json', '.json'],
    maxFilenameLength: parseInt((import.meta as any).env?.VITE_FILE_MAX_FILENAME_LENGTH) || 255,
    enableFilenameSanitization: (import.meta as any).env?.VITE_FILE_ENABLE_SANITIZATION !== 'false',
    fileOperationTimeoutMs: parseInt((import.meta as any).env?.VITE_FILE_OPERATION_TIMEOUT_MS) || 30000
  };
}

/**
 * Gets security validation configuration from environment variables
 * Requirements: 6.2, 6.3
 */
function getSecurityValidationConfig() {
  return {
    maxJsonNestingLevel: parseInt((import.meta as any).env?.VITE_MAX_JSON_NESTING_LEVEL) || 50,
    maxArraySize: parseInt((import.meta as any).env?.VITE_MAX_ARRAY_SIZE) || 1000,
    maxObjectKeys: parseInt((import.meta as any).env?.VITE_MAX_OBJECT_KEYS) || 500,
    maxStringLength: parseInt((import.meta as any).env?.VITE_MAX_STRING_LENGTH) || 10000,
    enableStrictValidation: (import.meta as any).env?.VITE_ENABLE_STRICT_VALIDATION === 'true'
  };
}

/**
 * FileUtils class providing browser-based file operations
 */
export class FileUtils {
  private static config = getFileOperationConfig();
  private static securityConfig = getSecurityValidationConfig();

  /**
   * Downloads a warband as a JSON file
   * 
   * @param warband - The warband data to export
   * @param filename - Optional custom filename (will be sanitized)
   */
  static downloadWarbandAsJson(warband: unknown, filename?: string): void {
    try {
      // Generate JSON content
      const jsonContent = JSON.stringify(warband, null, 2);
      
      // Create blob with JSON content
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      // Generate filename
      const sanitizedFilename = filename 
        ? this.sanitizeFilename(filename)
        : this.generateDefaultFilename(warband);
      
      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = sanitizedFilename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      throw new FileOperationError(
        'Failed to download warband as JSON',
        'FILE_READ_ERROR',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Opens a file selection dialog for JSON files
   * 
   * @returns Promise that resolves to the selected file
   */
  static selectJsonFile(): Promise<File> {
    return new Promise((resolve, reject) => {
      try {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = this.config.allowedFileTypes.join(',');
        input.multiple = false;
        
        // Handle file selection
        input.onchange = (event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (!file) {
            reject(new FileOperationError('No file selected', 'FILE_READ_ERROR'));
            return;
          }
          
          resolve(file);
        };
        
        // Handle cancellation
        input.oncancel = () => {
          reject(new FileOperationError('File selection cancelled', 'FILE_READ_ERROR'));
        };
        
        // Trigger file dialog
        input.click();
        
      } catch (error) {
        reject(new FileOperationError(
          'Failed to open file selection dialog',
          'SECURITY_ERROR',
          error instanceof Error ? error.message : String(error)
        ));
      }
    });
  }

  /**
   * Reads a JSON file and parses its content
   * 
   * @param file - The file to read
   * @returns Promise that resolves to the parsed JSON content
   */
  static readJsonFile(file: File): Promise<unknown> {
    return new Promise((resolve, reject) => {
      try {
        // Validate file first
        const validation = this.validateFile(file);
        if (!validation.valid) {
          reject(new FileOperationError(
            `File validation failed: ${validation.errors.join(', ')}`,
            'INVALID_FILE_TYPE'
          ));
          return;
        }
        
        // Create FileReader
        const reader = new FileReader();
        
        // Set up timeout
        const timeout = setTimeout(() => {
          reader.abort();
          reject(new FileOperationError(
            'File reading timed out',
            'FILE_READ_ERROR',
            `Timeout after ${this.config.fileOperationTimeoutMs}ms`
          ));
        }, this.config.fileOperationTimeoutMs);
        
        // Handle successful read
        reader.onload = (event) => {
          clearTimeout(timeout);
          
          try {
            const content = event.target?.result as string;
            if (!content) {
              reject(new FileOperationError('File content is empty', 'FILE_READ_ERROR'));
              return;
            }
            
            // Validate file content for security issues
            const contentValidation = this.validateFileContent(content);
            if (!contentValidation.valid) {
              reject(new FileOperationError(
                `File content validation failed: ${contentValidation.errors.join(', ')}`,
                'SECURITY_ERROR'
              ));
              return;
            }
            
            // Log warnings if any
            if (contentValidation.warnings.length > 0) {
              console.warn('File content warnings:', contentValidation.warnings);
            }
            
            // Parse JSON
            const jsonData = JSON.parse(content);
            resolve(jsonData);
            
          } catch (parseError) {
            reject(new FileOperationError(
              'Invalid JSON format',
              'INVALID_JSON',
              parseError instanceof Error ? parseError.message : String(parseError)
            ));
          }
        };
        
        // Handle read errors
        reader.onerror = () => {
          clearTimeout(timeout);
          reject(new FileOperationError(
            'Failed to read file',
            'FILE_READ_ERROR',
            reader.error?.message || 'Unknown file read error'
          ));
        };
        
        // Handle abort
        reader.onabort = () => {
          clearTimeout(timeout);
          reject(new FileOperationError(
            'File reading was aborted',
            'FILE_READ_ERROR'
          ));
        };
        
        // Start reading
        reader.readAsText(file);
        
      } catch (error) {
        reject(new FileOperationError(
          'Failed to initiate file reading',
          'FILE_READ_ERROR',
          error instanceof Error ? error.message : String(error)
        ));
      }
    });
  }

  /**
   * Sanitizes a filename for safe filesystem usage with comprehensive security measures
   * Requirements: 8.4
   * 
   * @param filename - The filename to sanitize
   * @returns Sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    if (!this.config.enableFilenameSanitization) {
      return filename;
    }
    
    if (typeof filename !== 'string') {
      return 'warband.json';
    }
    
    // Start with the input filename
    let sanitized = filename;
    
    // Remove or neutralize dangerous patterns
    sanitized = sanitized
      // Remove script-related content first (before character replacement)
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      // Remove SQL injection patterns
      .replace(/['";]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      // Remove path traversal attempts
      .replace(/\.\./g, '')
      // Replace dangerous filesystem characters (including < > but not as HTML removal)
      .replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g, '_')
      // Remove Unicode control characters
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, '_')
      // Normalize Unicode to prevent homograph attacks
      .normalize('NFKC')
      // Remove leading/trailing dots and spaces (Windows reserved)
      .replace(/^[.\s]+|[.\s]+$/g, '')
      // Replace multiple consecutive underscores/spaces with single underscore
      .replace(/[_\s]+/g, '_')
      // Remove leading/trailing underscores
      .replace(/^_+|_+$/g, '')
      // Ensure it's not empty
      .trim();
    
    // Handle Windows reserved names
    const windowsReserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    if (windowsReserved.test(sanitized.replace(/\.[^.]*$/, ''))) {
      sanitized = 'safe_' + sanitized;
    }
    
    // Handle empty filename after sanitization
    if (!sanitized || sanitized === '_') {
      sanitized = 'warband';
    }
    
    // Ensure reasonable length before adding extension
    const maxBaseLength = this.config.maxFilenameLength - 5; // Reserve space for .json
    if (sanitized.length > maxBaseLength) {
      sanitized = sanitized.substring(0, maxBaseLength);
    }
    
    // Ensure .json extension
    if (!sanitized.toLowerCase().endsWith('.json')) {
      sanitized += '.json';
    }
    
    // Final length check
    if (sanitized.length > this.config.maxFilenameLength) {
      const extension = '.json';
      const maxNameLength = this.config.maxFilenameLength - extension.length;
      sanitized = sanitized.substring(0, maxNameLength) + extension;
    }
    
    // Ensure the filename doesn't start with a dot (hidden file)
    if (sanitized.startsWith('.')) {
      sanitized = 'file_' + sanitized;
    }
    
    return sanitized;
  }

  /**
   * Validates a file against configured constraints with comprehensive security checks
   * 
   * @param file - The file to validate
   * @returns Validation result with errors and warnings
   */
  static validateFile(file: File): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic null/undefined checks
    if (!file) {
      errors.push('File is required');
      return { valid: false, errors, warnings };
    }
    
    // Security validation: Check for suspicious file properties
    this.performSecurityValidation(file, errors, warnings);
    
    // Check file size
    if (file.size > this.config.maxFileSizeBytes) {
      const maxSizeMB = (this.config.maxFileSizeBytes / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      errors.push(`File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
    }
    
    // Check for empty files
    if (file.size === 0) {
      errors.push('File is empty');
    }
    
    // Check file type with enhanced validation
    const isValidType = this.validateFileType(file);
    if (!isValidType) {
      errors.push(`File type not allowed. Allowed types: ${this.config.allowedFileTypes.join(', ')}`);
    }
    
    // Check filename with security validation
    this.validateFilename(file.name, errors, warnings);
    
    // Warnings for large files (but within limits)
    const warningThreshold = this.config.maxFileSizeBytes * 0.8; // 80% of max size
    if (file.size > warningThreshold) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      warnings.push(`Large file size (${sizeMB}MB) may take longer to process`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Performs comprehensive security validation on uploaded files
   * Requirements: 8.1, 8.4
   */
  private static performSecurityValidation(file: File, errors: string[], warnings: string[]): void {
    // Check for suspicious file names that might indicate malicious intent
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|app|deb|pkg|dmg)$/i, // Executable extensions
      /\.(php|asp|aspx|jsp|cgi|pl|py|rb|sh)$/i, // Script extensions
      /\.(htaccess|htpasswd|config|ini|conf)$/i, // Configuration files
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i, // Windows reserved names
      /\.\./,  // Path traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /^\./, // Hidden files
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        errors.push(`Suspicious filename detected: ${file.name}`);
        break;
      }
    }
    
    // Check for files with multiple extensions (e.g., file.txt.exe)
    const extensionCount = (file.name.match(/\./g) || []).length;
    if (extensionCount > 2) {
      warnings.push(`File has multiple extensions: ${file.name}`);
    }
    
    // Check for extremely long filenames that might cause buffer overflows
    if (file.name.length > 255) {
      errors.push(`Filename too long (${file.name.length} characters). Maximum: 255`);
    }
    
    // Check for files with unusual MIME types
    if (file.type && !file.type.startsWith('application/json') && !file.type.startsWith('text/')) {
      warnings.push(`Unusual MIME type: ${file.type}`);
    }
    
    // Check for files that are suspiciously large for JSON
    const maxReasonableJsonSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxReasonableJsonSize) {
      warnings.push(`File is unusually large for JSON data (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
    }
  }

  /**
   * Enhanced file type validation with security considerations
   */
  private static validateFileType(file: File): boolean {
    // Check both MIME type and extension for better security
    const hasValidMimeType = this.config.allowedFileTypes.some(allowedType => {
      if (!allowedType.startsWith('.')) {
        return file.type === allowedType;
      }
      return false;
    });
    
    const hasValidExtension = this.config.allowedFileTypes.some(allowedType => {
      if (allowedType.startsWith('.')) {
        return file.name.toLowerCase().endsWith(allowedType.toLowerCase());
      }
      return false;
    });
    
    // For JSON files, we expect either valid MIME type OR valid extension
    // This handles cases where browsers don't set MIME type correctly
    return hasValidMimeType || hasValidExtension;
  }

  /**
   * Validates filename for security issues
   */
  private static validateFilename(filename: string, errors: string[], warnings: string[]): void {
    // Check filename length
    if (filename.length > this.config.maxFilenameLength) {
      errors.push(`Filename too long (${filename.length} characters). Maximum: ${this.config.maxFilenameLength}`);
    }
    
    // Check for empty filename
    if (!filename.trim()) {
      errors.push('Filename cannot be empty');
    }
    
    // Check for dangerous characters
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) {
      errors.push('Filename contains invalid characters');
    }
    
    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      errors.push('Filename contains path traversal characters');
    }
    
    // Check for Unicode control characters
    const controlChars = /[\u0000-\u001f\u007f-\u009f]/;
    if (controlChars.test(filename)) {
      warnings.push('Filename contains control characters');
    }
    
    // Check for homograph attacks (similar-looking characters)
    const suspiciousUnicode = /[\u0080-\u00ff\u0100-\u017f\u0180-\u024f]/;
    if (suspiciousUnicode.test(filename)) {
      warnings.push('Filename contains non-ASCII characters that may be confusing');
    }
  }

  /**
   * Generates a default filename for a warband export
   * 
   * @param warband - The warband data
   * @returns Generated filename
   */
  private static generateDefaultFilename(warband: unknown): string {
    let baseName = 'warband';
    
    // Try to extract warband name if it's an object with a name property
    if (warband && typeof warband === 'object' && 'name' in warband) {
      const warbandName = (warband as any).name;
      if (typeof warbandName === 'string' && warbandName.trim()) {
        baseName = warbandName.trim();
      }
    }
    
    // Add timestamp for uniqueness
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${baseName}_${timestamp}.json`;
    
    return this.sanitizeFilename(filename);
  }

  /**
   * Updates the file operation configuration (for testing or dynamic updates)
   * 
   * @param newConfig - Partial configuration to update
   */
  static updateConfig(newConfig: Partial<FileOperationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the current file operation configuration
   * 
   * @returns Current configuration
   */
  static getConfig(): FileOperationConfig {
    return { ...this.config };
  }

  /**
   * Gets the current security validation configuration
   * Requirements: 6.2, 6.3
   * 
   * @returns Current security configuration
   */
  static getSecurityConfig() {
    return { ...this.securityConfig };
  }

  /**
   * Updates the security validation configuration (for environment-specific settings)
   * Requirements: 6.3
   * 
   * @param newConfig - Partial security configuration to update
   */
  static updateSecurityConfig(newConfig: Partial<typeof FileUtils.securityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...newConfig };
  }

  /**
   * Applies environment-specific security settings
   * Requirements: 6.3
   * 
   * @param environment - The current environment (development, production, test)
   */
  static applyEnvironmentSecuritySettings(environment: 'development' | 'production' | 'test'): void {
    switch (environment) {
      case 'production':
        // Stricter limits in production
        this.updateSecurityConfig({
          maxJsonNestingLevel: 30,
          maxArraySize: 500,
          maxObjectKeys: 250,
          maxStringLength: 5000,
          enableStrictValidation: true
        });
        break;
      
      case 'test':
        // More permissive limits for testing
        this.updateSecurityConfig({
          maxJsonNestingLevel: 100,
          maxArraySize: 2000,
          maxObjectKeys: 1000,
          maxStringLength: 20000,
          enableStrictValidation: false
        });
        break;
      
      case 'development':
      default:
        // Default limits for development
        this.updateSecurityConfig({
          maxJsonNestingLevel: 50,
          maxArraySize: 1000,
          maxObjectKeys: 500,
          maxStringLength: 10000,
          enableStrictValidation: false
        });
        break;
    }
  }

  /**
   * Performs additional security validation on file content
   * Requirements: 8.1, 8.2
   * 
   * @param content - The file content to validate
   * @returns Validation result
   */
  static validateFileContent(content: string): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (typeof content !== 'string') {
      errors.push('File content must be a string');
      return { valid: false, errors, warnings };
    }
    
    // Check for extremely large content that might cause DoS
    const maxContentSize = this.config.maxFileSizeBytes;
    if (content.length > maxContentSize) {
      errors.push(`File content too large (${content.length} bytes). Maximum: ${maxContentSize} bytes`);
    }
    
    // Check for suspicious patterns that might indicate malicious content
    const suspiciousPatterns = [
      // Script injection patterns
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      // SQL injection patterns
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      // Command injection patterns
      /\$\([^)]*\)/,
      /`[^`]*`/,
      // Path traversal
      /\.\.[\/\\]/,
      // Null bytes
      /\x00/,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        warnings.push('File content contains potentially suspicious patterns');
        break;
      }
    }
    
    // Check for excessive nesting that might cause stack overflow
    const nestingLevel = this.calculateJsonNestingLevel(content);
    if (nestingLevel > this.securityConfig.maxJsonNestingLevel) {
      errors.push(`JSON nesting too deep (${nestingLevel} levels). Maximum: ${this.securityConfig.maxJsonNestingLevel}`);
    }
    
    // Check for excessive array/object sizes
    try {
      const parsed = JSON.parse(content);
      this.validateJsonStructure(parsed, errors, warnings);
    } catch (parseError) {
      // JSON parsing errors will be handled by the main import process
      // We don't add errors here to avoid duplicate error messages
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculates the maximum nesting level in JSON content
   */
  private static calculateJsonNestingLevel(content: string): number {
    let maxLevel = 0;
    let currentLevel = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (inString) {
        continue;
      }
      
      if (char === '{' || char === '[') {
        currentLevel++;
        maxLevel = Math.max(maxLevel, currentLevel);
      } else if (char === '}' || char === ']') {
        currentLevel--;
      }
    }
    
    return maxLevel;
  }

  /**
   * Validates JSON structure for security issues using configuration-based limits
   * Requirements: 6.2, 6.3
   */
  private static validateJsonStructure(obj: unknown, errors: string[], warnings: string[]): void {
    const validateRecursive = (value: unknown, depth: number = 0): void => {
      if (depth > this.securityConfig.maxJsonNestingLevel) {
        errors.push('JSON structure too deeply nested');
        return;
      }
      
      if (Array.isArray(value)) {
        if (value.length > this.securityConfig.maxArraySize) {
          if (this.securityConfig.enableStrictValidation) {
            errors.push(`Array too large (${value.length} items). Maximum: ${this.securityConfig.maxArraySize}`);
          } else {
            warnings.push(`Large array detected (${value.length} items). May impact performance.`);
          }
        }
        value.forEach(item => validateRecursive(item, depth + 1));
      } else if (value && typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length > this.securityConfig.maxObjectKeys) {
          if (this.securityConfig.enableStrictValidation) {
            errors.push(`Object too large (${keys.length} keys). Maximum: ${this.securityConfig.maxObjectKeys}`);
          } else {
            warnings.push(`Large object detected (${keys.length} keys). May impact performance.`);
          }
        }
        keys.forEach(key => {
          if (typeof key === 'string' && key.length > 100) {
            warnings.push('Object contains very long property names');
          }
          validateRecursive((value as Record<string, unknown>)[key], depth + 1);
        });
      } else if (typeof value === 'string' && value.length > this.securityConfig.maxStringLength) {
        if (this.securityConfig.enableStrictValidation) {
          errors.push(`String too long (${value.length} characters). Maximum: ${this.securityConfig.maxStringLength}`);
        } else {
          warnings.push(`Very long string detected (${value.length} characters)`);
        }
      }
    };
    
    validateRecursive(obj);
  }
}
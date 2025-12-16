/**
 * Unique ID Generator Service
 * 
 * Provides secure, collision-resistant ID generation for imported warbands and weirdos.
 * Uses timestamp-based generation with collision avoidance to ensure uniqueness
 * across all database operations.
 * 
 * Requirements: 8.5
 */

import { randomUUID, randomBytes } from 'crypto';
import { DataRepository } from './DataRepository.js';

/**
 * ID generation options
 */
export interface IdGenerationOptions {
  /** Prefix to add to generated IDs */
  prefix?: string;
  /** Whether to include timestamp in ID */
  includeTimestamp?: boolean;
  /** Maximum collision retry attempts */
  maxRetries?: number;
}

/**
 * ID generation result
 */
export interface IdGenerationResult {
  /** Generated unique ID */
  id: string;
  /** Whether collision avoidance was needed */
  hadCollision: boolean;
  /** Number of retry attempts made */
  retryCount: number;
}

/**
 * Unique ID Generator Service
 * 
 * Generates cryptographically secure, collision-resistant unique identifiers
 * for imported warbands and weirdos with timestamp-based generation and
 * collision avoidance mechanisms.
 */
export class UniqueIdGenerator {
  private repository: DataRepository;
  private generatedIds: Set<string> = new Set();
  private lastTimestamp: number = 0;
  private sequenceCounter: number = 0;

  constructor(repository: DataRepository) {
    this.repository = repository;
  }

  /**
   * Generates a unique ID for a warband with collision avoidance
   * Requirements: 8.5
   */
  generateWarbandId(options: IdGenerationOptions = {}): IdGenerationResult {
    const {
      prefix = 'wb',
      includeTimestamp = true,
      maxRetries = 10
    } = options;

    let retryCount = 0;
    let hadCollision = false;

    while (retryCount <= maxRetries) {
      const id = this.generateId(prefix, includeTimestamp);
      
      // Check for collision in repository and local cache
      if (!this.hasCollision(id, 'warband')) {
        this.generatedIds.add(id);
        return { id, hadCollision, retryCount };
      }
      
      hadCollision = true;
      retryCount++;
      
      // Add small delay to avoid rapid collision attempts
      if (retryCount > 5) {
        this.waitForNextMillisecond();
      }
    }

    // Fallback: generate UUID-based ID if all retries failed
    const fallbackId = `${prefix}_${randomUUID()}`;
    this.generatedIds.add(fallbackId);
    
    return { 
      id: fallbackId, 
      hadCollision: true, 
      retryCount: maxRetries 
    };
  }

  /**
   * Generates a unique ID for a weirdo with collision avoidance
   * Requirements: 8.5
   */
  generateWeirdoId(options: IdGenerationOptions = {}): IdGenerationResult {
    const {
      prefix = 'wd',
      includeTimestamp = true,
      maxRetries = 10
    } = options;

    let retryCount = 0;
    let hadCollision = false;

    while (retryCount <= maxRetries) {
      const id = this.generateId(prefix, includeTimestamp);
      
      // Check for collision in local cache (weirdos are not stored separately in repository)
      if (!this.generatedIds.has(id)) {
        this.generatedIds.add(id);
        return { id, hadCollision, retryCount };
      }
      
      hadCollision = true;
      retryCount++;
      
      // Add small delay to avoid rapid collision attempts
      if (retryCount > 5) {
        this.waitForNextMillisecond();
      }
    }

    // Fallback: generate UUID-based ID if all retries failed
    const fallbackId = `${prefix}_${randomUUID()}`;
    this.generatedIds.add(fallbackId);
    
    return { 
      id: fallbackId, 
      hadCollision: true, 
      retryCount: maxRetries 
    };
  }

  /**
   * Generates a batch of unique IDs for multiple entities
   * Requirements: 8.5
   */
  generateBatchIds(count: number, type: 'warband' | 'weirdo', options: IdGenerationOptions = {}): IdGenerationResult[] {
    const results: IdGenerationResult[] = [];
    
    for (let i = 0; i < count; i++) {
      if (type === 'warband') {
        results.push(this.generateWarbandId(options));
      } else {
        results.push(this.generateWeirdoId(options));
      }
    }
    
    return results;
  }

  /**
   * Generates a timestamp-based ID with optional prefix
   */
  private generateId(prefix: string, includeTimestamp: boolean): string {
    if (!includeTimestamp) {
      // Generate simple random ID without timestamp
      const randomPart = randomBytes(8).toString('hex');
      return `${prefix}_${randomPart}`;
    }

    // Get current timestamp in milliseconds
    const now = Date.now();
    
    // Handle same-millisecond generation with sequence counter
    if (now === this.lastTimestamp) {
      this.sequenceCounter++;
    } else {
      this.lastTimestamp = now;
      this.sequenceCounter = 0;
    }

    // Create timestamp-based ID with sequence counter and random component
    const timestampHex = now.toString(16); // Convert to hex for shorter representation
    const sequenceHex = this.sequenceCounter.toString(16).padStart(3, '0'); // 3-digit hex sequence
    const randomPart = randomBytes(4).toString('hex'); // 8-character random component
    
    return `${prefix}_${timestampHex}_${sequenceHex}_${randomPart}`;
  }

  /**
   * Checks if an ID has a collision with existing data
   */
  private hasCollision(id: string, type: 'warband' | 'weirdo'): boolean {
    // Check local cache first (fastest)
    if (this.generatedIds.has(id)) {
      return true;
    }

    // Check repository for warband IDs
    if (type === 'warband') {
      try {
        const existingWarband = this.repository.loadWarband(id);
        return existingWarband !== null;
      } catch (error) {
        // If loading fails, assume no collision to avoid blocking generation
        console.warn(`Failed to check warband ID collision for ${id}:`, error);
        return false;
      }
    }

    // For weirdos, we rely on local cache since they're not stored separately
    return false;
  }

  /**
   * Waits for the next millisecond to ensure timestamp uniqueness
   */
  private waitForNextMillisecond(): void {
    const start = Date.now();
    while (Date.now() === start) {
      // Busy wait for next millisecond
      // This is intentionally synchronous to ensure timestamp uniqueness
    }
  }

  /**
   * Clears the local ID cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.generatedIds.clear();
    this.sequenceCounter = 0;
    this.lastTimestamp = 0;
  }

  /**
   * Gets statistics about ID generation
   */
  getStatistics(): {
    cachedIds: number;
    lastTimestamp: number;
    sequenceCounter: number;
  } {
    return {
      cachedIds: this.generatedIds.size,
      lastTimestamp: this.lastTimestamp,
      sequenceCounter: this.sequenceCounter
    };
  }

  /**
   * Validates that an ID follows the expected format
   */
  static validateIdFormat(id: string, expectedPrefix?: string): boolean {
    if (typeof id !== 'string' || id.length === 0) {
      return false;
    }

    // Check for basic ID format (prefix_content)
    const parts = id.split('_');
    if (parts.length < 2) {
      return false;
    }

    // Check prefix if specified
    if (expectedPrefix && parts[0] !== expectedPrefix) {
      return false;
    }

    // Check for reasonable length (not too short or too long)
    if (id.length < 5 || id.length > 100) {
      return false;
    }

    // Check for dangerous characters
    const dangerousChars = /[<>:"|?*\x00-\x1f\x7f]/;
    if (dangerousChars.test(id)) {
      return false;
    }

    return true;
  }

  /**
   * Sanitizes an existing ID to ensure it's safe to use
   */
  static sanitizeId(id: string): string {
    if (typeof id !== 'string') {
      return '';
    }

    return id
      // Remove dangerous characters
      .replace(/[<>:"|?*\x00-\x1f\x7f]/g, '')
      // Remove path separators
      .replace(/[/\\]/g, '_')
      // Limit length
      .slice(0, 100)
      .trim();
  }
}
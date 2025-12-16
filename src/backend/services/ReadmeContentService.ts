import type { ReadmeContent } from '../models/types.js';
import { ReadmeParser } from './ReadmeParser.js';
import { PersistenceError, PersistenceErrorCode } from '../models/types.js';

/**
 * Service for managing README content with in-memory caching
 */
export class ReadmeContentService {
  private static instance: ReadmeContentService;
  private cachedContent: ReadmeContent | null = null;
  private lastLoadTime: Date | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ReadmeContentService {
    if (!ReadmeContentService.instance) {
      ReadmeContentService.instance = new ReadmeContentService();
    }
    return ReadmeContentService.instance;
  }

  /**
   * Initialize the service by loading README content
   * Should be called during application startup
   */
  public async initialize(): Promise<void> {
    try {
      await this.loadContent();
      console.log('README content loaded successfully');
    } catch (error) {
      console.error('Failed to load README content during initialization:', error);
      // Don't throw - allow server to start even if README loading fails
    }
  }

  /**
   * Get README content, loading from cache if available
   * @returns Promise<ReadmeContent> The README content
   * @throws PersistenceError if content cannot be loaded and no cache is available
   */
  public async getContent(): Promise<ReadmeContent> {
    // Return cached content if available
    if (this.cachedContent) {
      return this.cachedContent;
    }

    // Load content if not cached
    await this.loadContent();
    
    if (!this.cachedContent) {
      throw new PersistenceError(
        'README content not available',
        PersistenceErrorCode.FILE_READ_ERROR,
        { details: 'Content could not be loaded and no cache is available' }
      );
    }

    return this.cachedContent;
  }

  /**
   * Force reload of README content from file
   * @returns Promise<ReadmeContent> The freshly loaded content
   */
  public async reloadContent(): Promise<ReadmeContent> {
    this.cachedContent = null;
    this.lastLoadTime = null;
    return await this.getContent();
  }

  /**
   * Check if content is cached
   * @returns boolean True if content is available in cache
   */
  public isCached(): boolean {
    return this.cachedContent !== null;
  }

  /**
   * Get the last time content was loaded
   * @returns Date | null The last load time or null if never loaded
   */
  public getLastLoadTime(): Date | null {
    return this.lastLoadTime;
  }

  /**
   * Load content from README file and cache it
   * @private
   */
  private async loadContent(): Promise<void> {
    try {
      this.cachedContent = await ReadmeParser.parseReadmeFile();
      this.lastLoadTime = new Date();
    } catch (error) {
      console.error('Failed to load README content:', error);
      // Re-throw the error so callers can handle it appropriately
      throw error;
    }
  }
}
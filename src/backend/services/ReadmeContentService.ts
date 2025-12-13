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
   * Get fallback content when README cannot be loaded
   * @returns ReadmeContent Basic fallback information
   */
  public getFallbackContent(): ReadmeContent {
    return {
      title: 'Space Weirdos Warband Builder',
      version: 'Version 1.0.0',
      description: 'A complete web application for creating and managing warbands for the Space Weirdos tabletop game. Built with TypeScript, React, and Express using spec-driven development with formal correctness guarantees.',
      features: [
        'Complete Warband Management: Create, edit, save, duplicate, load, and delete warbands',
        'Real-Time Cost Calculation: Automatic point cost calculation with warband ability modifiers',
        'Context-Aware Validation: Smart warning system that adapts to your warband composition',
        'Comprehensive Validation: Enforces all game rules including point limits and equipment restrictions',
        'Persistent Storage: In-memory database with JSON file persistence',
        'Intuitive UI: Three main components for warband list, warband editing, and weirdo customization'
      ],
      gameRules: [
        'Warband creation with 75 or 125 point limits',
        'Leader and trooper customization with 5 attributes (Speed, Defense, Firepower, Prowess, Willpower)',
        'Close combat and ranged weapon selection',
        'Equipment limits (2 for leaders, 1 for troopers, +1 with Cyborgs ability)',
        'Psychic powers (unlimited)',
        'Leader traits (optional, leader only)',
        'Warband abilities with cost modifiers (Heavily Armed, Mutants, Soldiers, Cyborgs, etc.)',
        'Point limit enforcement (20 points for troopers, one 25-point weirdo allowed)'
      ],
      recentUpdates: [
        'Context-Aware Warning System',
        'Implemented intelligent warning system that adapts to warband composition',
        'Warnings trigger within 3 points of applicable limits (down from 10 points)',
        'Context-aware logic: warnings change based on whether a 25-point weirdo exists',
        'Backend ValidationService generates warnings for consistency with game rules',
        'Clear messaging distinguishes between 20-point and 25-point limits'
      ],
      lastUpdated: new Date()
    };
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
      
      // If we have no cached content, use fallback
      if (!this.cachedContent) {
        console.log('Using fallback README content');
        this.cachedContent = this.getFallbackContent();
        this.lastLoadTime = new Date();
      }
      
      // Re-throw the error so callers can handle it appropriately
      throw error;
    }
  }
}
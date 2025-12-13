/**
 * Frontend service for fetching README content from the backend API
 * Provides caching and error handling for the Learn About popup
 */

import { ApiError } from './apiClient';

/**
 * README content interface matching backend types
 */
export interface ReadmeContent {
  title: string;
  version: string;
  description: string;
  features: string[];
  gameRules: string[];
  recentUpdates: string[];
  lastUpdated: Date;
}

/**
 * API response structure for README content endpoint
 */
interface ReadmeContentResponse {
  success: boolean;
  data: ReadmeContent;
  warning?: string;
}

/**
 * Service state for loading and caching
 */
interface ServiceState {
  content: ReadmeContent | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

/**
 * README Content Service
 * Handles fetching, caching, and error management for README content
 */
export class ReadmeContentService {
  private static instance: ReadmeContentService;
  private state: ServiceState = {
    content: null,
    loading: false,
    error: null,
    lastFetched: null,
  };

  // Cache duration: 5 minutes
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000;
  
  // API configuration
  private readonly API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

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
   * Get README content with caching
   * Returns cached content if available and fresh, otherwise fetches from API
   */
  public async getContent(): Promise<ReadmeContent> {
    // Return cached content if available and fresh
    if (this.isCacheValid()) {
      return this.state.content!;
    }

    // If already loading, wait for the current request
    if (this.state.loading) {
      return this.waitForLoad();
    }

    // Fetch fresh content
    return this.fetchContent();
  }

  /**
   * Force refresh content from API, bypassing cache
   */
  public async refreshContent(): Promise<ReadmeContent> {
    this.clearCache();
    return this.fetchContent();
  }

  /**
   * Get current loading state
   */
  public isLoading(): boolean {
    return this.state.loading;
  }

  /**
   * Get current error state
   */
  public getError(): string | null {
    return this.state.error;
  }

  /**
   * Get cached content without fetching (may be null)
   */
  public getCachedContent(): ReadmeContent | null {
    return this.state.content;
  }

  /**
   * Clear cached content and error state
   */
  public clearCache(): void {
    this.state.content = null;
    this.state.error = null;
    this.state.lastFetched = null;
  }

  /**
   * Check if cached content is still valid
   */
  private isCacheValid(): boolean {
    if (!this.state.content || !this.state.lastFetched) {
      return false;
    }

    const now = new Date();
    const cacheAge = now.getTime() - this.state.lastFetched.getTime();
    return cacheAge < this.CACHE_DURATION_MS;
  }

  /**
   * Wait for current loading operation to complete
   */
  private async waitForLoad(): Promise<ReadmeContent> {
    // Poll until loading is complete
    while (this.state.loading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check if we have content or an error
    if (this.state.content) {
      return this.state.content;
    }

    if (this.state.error) {
      throw new ApiError(this.state.error);
    }

    // Fallback - should not happen
    throw new ApiError('Unknown error occurred while loading README content');
  }

  /**
   * Fetch content from the API
   */
  private async fetchContent(): Promise<ReadmeContent> {
    this.state.loading = true;
    this.state.error = null;

    try {
      const response = await fetch(`${this.API_BASE_URL}/readme-content`);
      
      if (!response.ok) {
        throw new ApiError(
          `Failed to fetch README content: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data: ReadmeContentResponse = await response.json();

      if (!data.success) {
        throw new ApiError('API returned unsuccessful response');
      }

      // Convert lastUpdated string back to Date object if needed
      const content: ReadmeContent = {
        ...data.data,
        lastUpdated: new Date(data.data.lastUpdated),
      };

      // Cache the content
      this.state.content = content;
      this.state.lastFetched = new Date();
      this.state.error = null;

      // Log warning if fallback content was used
      if (data.warning) {
        console.warn('README Content Service:', data.warning);
      }

      return content;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.state.error = errorMessage;
      
      console.error('Failed to fetch README content:', error);
      
      // If we have cached content, return it despite the error
      if (this.state.content) {
        console.warn('Using stale cached content due to fetch error');
        return this.state.content;
      }

      // No cached content available, throw the error
      throw new ApiError(errorMessage);
      
    } finally {
      this.state.loading = false;
    }
  }

  /**
   * Get fallback content for when API is unavailable
   * This matches the backend's fallback content structure
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
}

/**
 * Convenience function to get the singleton instance
 */
export const readmeContentService = ReadmeContentService.getInstance();
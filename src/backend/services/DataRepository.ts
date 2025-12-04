import { Warband } from '../models/types';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * DataRepository provides in-memory storage for warbands with JSON file persistence.
 * Uses a Map for O(1) lookups and automatically persists changes to disk.
 */
export class DataRepository {
  private warbands: Map<string, Warband>;
  private filePath: string;
  private persistenceEnabled: boolean;

  constructor(filePath: string = path.join(process.cwd(), 'data', 'warbands.json'), enablePersistence: boolean = true) {
    this.warbands = new Map();
    this.filePath = filePath;
    this.persistenceEnabled = enablePersistence;
  }

  /**
   * Saves a warband to in-memory storage and triggers async file persistence.
   * Generates a unique ID if the warband doesn't have one.
   * Updates the updatedAt timestamp.
   */
  saveWarband(warband: Warband): Warband {
    // Generate ID if not present
    if (!warband.id) {
      warband.id = randomUUID();
    }

    // Update timestamp
    warband.updatedAt = new Date();

    // If this is a new warband, set createdAt
    if (!this.warbands.has(warband.id)) {
      warband.createdAt = new Date();
    }

    // Store in memory
    this.warbands.set(warband.id, warband);

    // Trigger async persistence (fire and forget)
    if (this.persistenceEnabled) {
      this.persistToFile().catch(err => {
        console.error('Failed to persist warband to file:', err);
      });
    }

    return warband;
  }

  /**
   * Loads a warband from in-memory storage by ID.
   * Returns null if the warband is not found.
   */
  loadWarband(id: string): Warband | null {
    return this.warbands.get(id) || null;
  }

  /**
   * Returns all warbands from in-memory storage as an array.
   */
  loadAllWarbands(): Warband[] {
    return Array.from(this.warbands.values());
  }

  /**
   * Deletes a warband from in-memory storage and triggers async file persistence.
   * Returns true if the warband was deleted, false if it didn't exist.
   */
  deleteWarband(id: string): boolean {
    const existed = this.warbands.delete(id);

    // Trigger async persistence if deletion was successful
    if (existed && this.persistenceEnabled) {
      this.persistToFile().catch(err => {
        console.error('Failed to persist after deletion:', err);
      });
    }

    return existed;
  }

  /**
   * Serializes the in-memory Map to JSON and writes to file.
   * Creates the directory if it doesn't exist.
   */
  async persistToFile(): Promise<void> {
    // Convert Map to array of warbands
    const warbandsArray = Array.from(this.warbands.values());

    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write to file with pretty formatting
    await fs.writeFile(
      this.filePath,
      JSON.stringify(warbandsArray, null, 2),
      'utf-8'
    );
  }

  /**
   * Reads JSON file and populates the in-memory Map.
   * Should be called on server startup.
   * Creates an empty file if it doesn't exist.
   */
  async loadFromFile(): Promise<void> {
    try {
      // Read file
      const data = await fs.readFile(this.filePath, 'utf-8');
      const warbandsArray: Warband[] = JSON.parse(data);

      // Clear existing data
      this.warbands.clear();

      // Populate Map
      for (const warband of warbandsArray) {
        // Convert date strings back to Date objects
        warband.createdAt = new Date(warband.createdAt);
        warband.updatedAt = new Date(warband.updatedAt);
        
        this.warbands.set(warband.id, warband);
      }
    } catch (err: any) {
      // If file doesn't exist, create an empty one
      if (err.code === 'ENOENT') {
        await this.persistToFile();
      } else {
        throw err;
      }
    }
  }

  /**
   * Clears all warbands from memory (useful for testing).
   */
  clear(): void {
    this.warbands.clear();
  }
}

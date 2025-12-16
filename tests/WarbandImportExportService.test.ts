import { describe, it, expect, beforeEach } from 'vitest';
import { WarbandImportExportService } from '../src/backend/services/WarbandImportExportService';
import { DataRepository } from '../src/backend/services/DataRepository';
import { ValidationService } from '../src/backend/services/ValidationService';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager';
import { ConfigurationFactory } from '../src/backend/config/ConfigurationFactory';
import { Warband } from '../src/backend/models/types';

describe('WarbandImportExportService', () => {
  let service: WarbandImportExportService;
  let repository: DataRepository;
  let configManager: ConfigurationManager;

  beforeEach(async () => {
    // Reset singleton instance for each test
    (ConfigurationManager as any).instance = null;
    
    // Initialize configuration manager
    configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    
    // Create repository with persistence disabled for testing
    repository = new DataRepository(':memory:', false);
    
    // Create factory and configured services
    const configFactory = new ConfigurationFactory(configManager);
    const validationService = configFactory.createValidationService();
    
    // Create import/export service
    service = new WarbandImportExportService(repository, validationService);
  });

  describe('Constructor', () => {
    it('should create service with repository and validation service', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(WarbandImportExportService);
    });
  });

  describe('Export Functionality', () => {
    it('should return error for non-existent warband', async () => {
      const result = await service.exportWarbandToJson('non-existent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should export existing warband with metadata', async () => {
      // Create a test warband
      const testWarband: Warband = {
        id: 'test-id',
        name: 'Test Warband',
        ability: null,
        pointLimit: 75,
        totalCost: 0,
        weirdos: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save warband to repository
      const savedWarband = repository.saveWarband(testWarband);
      
      // Export the warband
      const result = await service.exportWarbandToJson(savedWarband.id);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe('Test Warband');
      expect(result.data!.exportVersion).toBe('1.0');
      expect(result.data!.exportedBy).toBe('Space Weirdos Warband Builder');
    });
  });

  describe('Validation Functionality', () => {
    it('should validate valid warband JSON', () => {
      const validWarband = {
        name: 'Test Warband',
        pointLimit: 75,
        ability: null,
        weirdos: []
      };

      const result = service.validateWarbandJson(validWarband);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid warband JSON', () => {
      const invalidWarband = {
        // Missing required fields
        pointLimit: 'invalid'
      };

      const result = service.validateWarbandJson(invalidWarband);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
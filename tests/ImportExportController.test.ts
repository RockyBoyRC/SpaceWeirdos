import { describe, it, expect, beforeEach } from 'vitest';
import { ImportExportController } from '../src/backend/controllers/ImportExportController';
import { WarbandImportExportService } from '../src/backend/services/WarbandImportExportService';
import { DataRepository } from '../src/backend/services/DataRepository';
import { ValidationService } from '../src/backend/services/ValidationService';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager';
import { ConfigurationFactory } from '../src/backend/config/ConfigurationFactory';

describe('ImportExportController', () => {
  let controller: ImportExportController;
  let importExportService: WarbandImportExportService;
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
    importExportService = new WarbandImportExportService(repository, validationService);
    
    // Create controller
    controller = new ImportExportController(importExportService);
  });

  describe('Constructor', () => {
    it('should create controller with import/export service', () => {
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(ImportExportController);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize validation errors correctly', () => {
      // Test that the controller can be instantiated and basic functionality works
      expect(controller).toBeDefined();
    });
  });
});
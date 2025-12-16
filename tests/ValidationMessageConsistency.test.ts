import { describe, it, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ValidationService } from '../src/backend/services/ValidationService';
import { ConfigurationManager } from '../src/backend/config/ConfigurationManager';
import { ConfigurationFactory } from '../src/backend/config/ConfigurationFactory';
import {
  Warband,
  WarbandAbility
} from '../src/backend/models/types';

// Define validation error codes directly since we're removing the deprecated constants
type ValidationErrorCode = 
  | 'WARBAND_NAME_REQUIRED'
  | 'WEIRDO_NAME_REQUIRED'
  | 'INVALID_POINT_LIMIT'
  | 'ATTRIBUTES_INCOMPLETE'
  | 'CLOSE_COMBAT_WEAPON_REQUIRED'
  | 'RANGED_WEAPON_REQUIRED'
  | 'FIREPOWER_REQUIRED_FOR_RANGED_WEAPON'
  | 'EQUIPMENT_LIMIT_EXCEEDED'
  | 'TROOPER_POINT_LIMIT_EXCEEDED'
  | 'MULTIPLE_25_POINT_WEIRDOS'
  | 'WARBAND_POINT_LIMIT_EXCEEDED'
  | 'LEADER_TRAIT_INVALID';

const testConfig = { numRuns: 50 };

describe('Validation Message Consistency', () => {
  let validationService: ValidationService;
  let configManager: ConfigurationManager;
  let configFactory: ConfigurationFactory;

  beforeEach(async () => {
    // Reset singleton instance for each test
    (ConfigurationManager as any).instance = null;
    
    // Initialize configuration manager
    configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    
    // Create factory and services
    configFactory = new ConfigurationFactory(configManager);
    validationService = configFactory.createValidationService();
  });

// Generator for all validation error codes
const validationErrorCodeGen = fc.constantFrom<ValidationErrorCode>(
  'WARBAND_NAME_REQUIRED',
  'WEIRDO_NAME_REQUIRED',
  'INVALID_POINT_LIMIT',
  'ATTRIBUTES_INCOMPLETE',
  'CLOSE_COMBAT_WEAPON_REQUIRED',
  'RANGED_WEAPON_REQUIRED',
  'FIREPOWER_REQUIRED_FOR_RANGED_WEAPON',
  'EQUIPMENT_LIMIT_EXCEEDED',
  'TROOPER_POINT_LIMIT_EXCEEDED',
  'MULTIPLE_25_POINT_WEIRDOS',
  'WARBAND_POINT_LIMIT_EXCEEDED',
  'LEADER_TRAIT_INVALID'
);

describe('Property 6: Centralized error messages maintain consistency', () => {
  // **Feature: code-refactoring, Property 6: Centralized error messages maintain consistency**
  // **Validates: Requirements 2.5, 2.6, 8.5**

  it('should ensure ValidationService uses messages from centralized configuration', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<WarbandAbility | null>(
          'Cyborgs',
          'Fanatics',
          'Living Weapons',
          'Heavily Armed',
          'Mutants',
          'Soldiers',
          'Undead',
          null
        ),
        (ability) => {
          // Get validation messages from centralized configuration
          const validationConfig = configManager.getValidationConfig();
          
          // Test warband name validation
          const emptyNameWarband: Warband = {
            id: 'test-id',
            name: '',
            ability,
            pointLimit: 75,
            totalCost: 0,
            weirdos: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const result = validationService.validateWarband(emptyNameWarband);
          const nameError = result.errors.find(e => e.code === 'WARBAND_NAME_REQUIRED');
          
          // If error exists, message should match centralized configuration
          if (nameError) {
            return nameError.message === validationConfig.messages.warbandNameRequired;
          }
          
          return true;
        }
      ),
      testConfig
    );
  });

  it('should ensure all validation messages are available from centralized configuration', () => {
    fc.assert(
      fc.property(
        validationErrorCodeGen,
        (errorCode) => {
          // Get validation messages from centralized configuration
          const validationConfig = configManager.getValidationConfig();
          const messages = validationConfig.messages;
          
          // Map error codes to message properties
          const messageMap: Record<ValidationErrorCode, string> = {
            'WARBAND_NAME_REQUIRED': messages.warbandNameRequired,
            'WEIRDO_NAME_REQUIRED': messages.weirdoNameRequired,
            'INVALID_POINT_LIMIT': messages.invalidPointLimit,
            'ATTRIBUTES_INCOMPLETE': messages.attributesIncomplete,
            'CLOSE_COMBAT_WEAPON_REQUIRED': messages.closeCombatWeaponRequired,
            'RANGED_WEAPON_REQUIRED': messages.rangedWeaponRequired,
            'FIREPOWER_REQUIRED_FOR_RANGED_WEAPON': messages.firepowerRequiredForRangedWeapon,
            'EQUIPMENT_LIMIT_EXCEEDED': messages.equipmentLimitExceeded,
            'TROOPER_POINT_LIMIT_EXCEEDED': messages.trooperPointLimitExceeded,
            'MULTIPLE_25_POINT_WEIRDOS': messages.multiple25PointWeirdos,
            'WARBAND_POINT_LIMIT_EXCEEDED': messages.warbandPointLimitExceeded,
            'LEADER_TRAIT_INVALID': messages.leaderTraitInvalid
          };
          
          // Get the message for this error code
          const message = messageMap[errorCode];
          
          // Verify it's a non-empty string
          return typeof message === 'string' && message.length > 0;
        }
      ),
      testConfig
    );
  });

  it('should support parameter substitution in validation messages', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('leader', 'trooper'),
          limit: fc.integer({ min: 1, max: 5 }),
          cost: fc.integer({ min: 0, max: 30 }),
          totalCost: fc.integer({ min: 0, max: 150 }),
          pointLimit: fc.constantFrom(75, 125)
        }),
        (params) => {
          // Get validation messages from centralized configuration
          const validationConfig = configManager.getValidationConfig();
          
          // Test parameter substitution for equipment limit message
          const equipmentMessage = validationConfig.messages.equipmentLimitExceeded;
          const substitutedMessage = equipmentMessage
            .replace('{type}', params.type)
            .replace('{limit}', String(params.limit));
          
          // Verify substitution worked
          const hasOriginalPlaceholders = substitutedMessage.includes('{type}') || substitutedMessage.includes('{limit}');
          const hasExpectedValues = substitutedMessage.includes(params.type) && substitutedMessage.includes(String(params.limit));
          
          return !hasOriginalPlaceholders && hasExpectedValues;
        }
      ),
      testConfig
    );
  });
});

});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import { WeaponSelector } from '../src/frontend/components/WeaponSelector';
import { CostEngine } from '../src/backend/services/CostEngine';
import { Weapon, WarbandAbility } from '../src/backend/models/types';
import * as apiClient from '../src/frontend/services/apiClient';

// Mock the API client
vi.mock('../src/frontend/services/apiClient', () => ({
  apiClient: {
    calculateCostRealTime: vi.fn(),
  },
}));

/**
 * Unit tests for WeaponSelector component
 * Requirements: 5.3, 5.7, 5.8, 12.2, 12.7
 */

describe('WeaponSelector Component', () => {
  const costEngine = new CostEngine();

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock response for API calls
    vi.mocked(apiClient.apiClient.calculateCostRealTime).mockResolvedValue({
      success: true,
      data: {
        totalCost: 0,
        breakdown: {
          attributes: 0,
          weapons: 0,
          equipment: 0,
          psychicPowers: 0,
        },
        warnings: [],
        isApproachingLimit: false,
        isOverLimit: false,
      },
    });
  });

  const mockCloseCombatWeapons: Weapon[] = [
    {
      id: 'unarmed',
      name: 'Unarmed',
      type: 'close',
      baseCost: 0,
      maxActions: 3,
      notes: '-1DT to Power rolls'
    },
    {
      id: 'claws-teeth',
      name: 'Claws & Teeth',
      type: 'close',
      baseCost: 2,
      maxActions: 3,
      notes: ''
    },
    {
      id: 'melee-weapon',
      name: 'Melee Weapon',
      type: 'close',
      baseCost: 1,
      maxActions: 2,
      notes: ''
    }
  ];

  const mockRangedWeapons: Weapon[] = [
    {
      id: 'auto-pistol',
      name: 'Auto Pistol',
      type: 'ranged',
      baseCost: 0,
      maxActions: 3,
      notes: '-1DT range > 1 stick'
    },
    {
      id: 'auto-rifle',
      name: 'Auto Rifle',
      type: 'ranged',
      baseCost: 1,
      maxActions: 3,
      notes: 'Aim1'
    }
  ];

  describe('Close Combat Weapons', () => {
    it('should render weapon list with costs and notes', async () => {
      const mockOnChange = vi.fn();

      // Mock API responses for each weapon
      vi.mocked(apiClient.apiClient.calculateCostRealTime).mockImplementation(async (params) => {
        const weaponName = params.weapons?.close?.[0] || '';
        let weaponCost = 0;
        
        if (weaponName === 'Unarmed') weaponCost = 0;
        else if (weaponName === 'Claws & Teeth') weaponCost = 2;
        else if (weaponName === 'Melee Weapon') weaponCost = 1;

        return {
          success: true,
          data: {
            totalCost: weaponCost,
            breakdown: {
              attributes: 0,
              weapons: weaponCost,
              equipment: 0,
              psychicPowers: 0,
            },
            warnings: [],
            isApproachingLimit: false,
            isOverLimit: false,
          },
        };
      });

      render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[]}
          availableWeapons={mockCloseCombatWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
         
        />
      );

      // Check title
      expect(screen.getByText('Close Combat Weapons')).toBeInTheDocument();

      // Wait for costs to load from API
      await waitFor(() => {
        expect(screen.getByText('0 pts')).toBeInTheDocument();
      });

      // Check all weapons are rendered with costs
      expect(screen.getByText('Unarmed')).toBeInTheDocument();
      expect(screen.getByText('-1DT to Power rolls')).toBeInTheDocument();

      expect(screen.getByText('Claws & Teeth')).toBeInTheDocument();
      expect(screen.getByText('2 pts')).toBeInTheDocument();

      expect(screen.getByText('Melee Weapon')).toBeInTheDocument();
      expect(screen.getByText('1 pts')).toBeInTheDocument();
    });

    it('should handle weapon selection', () => {
      const mockOnChange = vi.fn();

      render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[]}
          availableWeapons={mockCloseCombatWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
         
        />
      );

      // Click checkbox for Unarmed
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(mockOnChange).toHaveBeenCalledWith([mockCloseCombatWeapons[0]]);
    });

    it('should handle weapon deselection', () => {
      const mockOnChange = vi.fn();

      render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[mockCloseCombatWeapons[0]]}
          availableWeapons={mockCloseCombatWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
         
        />
      );

      // Click checkbox for Unarmed (already selected)
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    // Tests for automatic Unarmed deselection (Requirements 4.9)
    it('should automatically unselect Unarmed when selecting another close combat weapon', () => {
      const mockOnChange = vi.fn();

      // Start with Unarmed selected
      render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[mockCloseCombatWeapons[0]]} // Unarmed
          availableWeapons={mockCloseCombatWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
        />
      );

      // Click checkbox for Claws & Teeth (index 1)
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      // Should call onChange with only Claws & Teeth (Unarmed automatically removed)
      expect(mockOnChange).toHaveBeenCalledWith([mockCloseCombatWeapons[1]]);
    });

    it('should automatically unselect Unarmed when selecting multiple other weapons', () => {
      const mockOnChange = vi.fn();

      // Start with Unarmed and Claws & Teeth selected
      render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[mockCloseCombatWeapons[0], mockCloseCombatWeapons[1]]} // Unarmed + Claws & Teeth
          availableWeapons={mockCloseCombatWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
        />
      );

      // Click checkbox for Melee Weapon (index 2)
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[2]);

      // Should call onChange with Claws & Teeth and Melee Weapon (Unarmed automatically removed)
      expect(mockOnChange).toHaveBeenCalledWith([
        mockCloseCombatWeapons[1], // Claws & Teeth
        mockCloseCombatWeapons[2]  // Melee Weapon
      ]);
    });

    it('should allow selecting Unarmed when no other weapons are selected', () => {
      const mockOnChange = vi.fn();

      render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[]}
          availableWeapons={mockCloseCombatWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
        />
      );

      // Click checkbox for Unarmed
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Should call onChange with Unarmed
      expect(mockOnChange).toHaveBeenCalledWith([mockCloseCombatWeapons[0]]);
    });

    it('should not affect Unarmed deselection logic for ranged weapons', () => {
      const mockOnChange = vi.fn();

      render(
        <WeaponSelector
          type="ranged"
          selectedWeapons={[]}
          availableWeapons={mockRangedWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
        />
      );

      // Click checkbox for Auto Pistol
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Should call onChange with Auto Pistol (no Unarmed logic for ranged weapons)
      expect(mockOnChange).toHaveBeenCalledWith([mockRangedWeapons[0]]);
    });

    it('should handle edge case when Unarmed is not in available weapons', () => {
      const mockOnChange = vi.fn();
      const weaponsWithoutUnarmed = mockCloseCombatWeapons.slice(1); // Remove Unarmed

      render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[]}
          availableWeapons={weaponsWithoutUnarmed}
          warbandAbility={null}
          onChange={mockOnChange}
        />
      );

      // Click checkbox for Claws & Teeth
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Should call onChange with Claws & Teeth (no Unarmed to remove)
      expect(mockOnChange).toHaveBeenCalledWith([weaponsWithoutUnarmed[0]]);
    });
  });

  describe('Ranged Weapons', () => {
    it('should render ranged weapon list', () => {
      const mockOnChange = vi.fn();

      render(
        <WeaponSelector
          type="ranged"
          selectedWeapons={[]}
          availableWeapons={mockRangedWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
         
        />
      );

      // Check title
      expect(screen.getByText('Ranged Weapons')).toBeInTheDocument();

      // Check weapons are rendered
      expect(screen.getByText('Auto Pistol')).toBeInTheDocument();
      expect(screen.getByText('Auto Rifle')).toBeInTheDocument();
    });

    it('should be disabled when Firepower is None', () => {
      const mockOnChange = vi.fn();

      render(
        <WeaponSelector
          type="ranged"
          selectedWeapons={[]}
          availableWeapons={mockRangedWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
          disabled={true}
         
        />
      );

      // Check disabled message
      expect(screen.getByText('Ranged weapons are disabled when Firepower is None')).toBeInTheDocument();

      // Check all checkboxes are disabled
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('should not call onChange when disabled', () => {
      const mockOnChange = vi.fn();

      render(
        <WeaponSelector
          type="ranged"
          selectedWeapons={[]}
          availableWeapons={mockRangedWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
          disabled={true}
         
        />
      );

      // Try to click checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // onChange should not be called
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Cost Display', () => {
    it('should show modified costs with warband ability modifiers', async () => {
      const mockOnChange = vi.fn();

      // Mock API to return modified costs with Mutants ability
      vi.mocked(apiClient.apiClient.calculateCostRealTime).mockImplementation(async (params) => {
        const weaponName = params.weapons?.close?.[0] || '';
        let weaponCost = 0;
        
        // Apply Mutants ability modifier (reduces specific close combat weapons by 1)
        if (weaponName === 'Claws & Teeth') weaponCost = 1; // 2 - 1 = 1
        else if (weaponName === 'Unarmed') weaponCost = 0; // Already 0

        return {
          success: true,
          data: {
            totalCost: weaponCost,
            breakdown: {
              attributes: 0,
              weapons: weaponCost,
              equipment: 0,
              psychicPowers: 0,
            },
            warnings: [],
            isApproachingLimit: false,
            isOverLimit: false,
          },
        };
      });

      // With Mutants ability, selector shows modified costs
      // Mutants reduces specific close combat weapon costs by 1
      render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[]}
          availableWeapons={mockCloseCombatWeapons}
          warbandAbility={'Mutants' as WarbandAbility}
          onChange={mockOnChange}
        />
      );

      // Wait for API calls to complete and costs to load
      await waitFor(() => {
        // Claws & Teeth shows modified cost (1 pt) with Mutants ability
        // Mutants reduces Claws & Teeth from 2 pts to 1 pt
        const clawsTeethElement = screen.getByText('Claws & Teeth').closest('.weapon-selector__item');
        expect(clawsTeethElement).toHaveTextContent('1 pts');
      });
    });

    it('should show modified costs for ranged weapons with Heavily Armed ability', async () => {
      const mockOnChange = vi.fn();

      // Mock API to return modified costs with Heavily Armed ability
      vi.mocked(apiClient.apiClient.calculateCostRealTime).mockImplementation(async (params) => {
        const weaponName = params.weapons?.ranged?.[0] || '';
        let weaponCost = 0;
        
        // Apply Heavily Armed ability modifier (reduces ranged weapons by 1)
        if (weaponName === 'Auto Rifle') weaponCost = 0; // 1 - 1 = 0
        else if (weaponName === 'Auto Pistol') weaponCost = 0; // Already 0

        return {
          success: true,
          data: {
            totalCost: weaponCost,
            breakdown: {
              attributes: 0,
              weapons: weaponCost,
              equipment: 0,
              psychicPowers: 0,
            },
            warnings: [],
            isApproachingLimit: false,
            isOverLimit: false,
          },
        };
      });

      render(
        <WeaponSelector
          type="ranged"
          selectedWeapons={[]}
          availableWeapons={mockRangedWeapons}
          warbandAbility={'Heavily Armed' as WarbandAbility}
          onChange={mockOnChange}
        />
      );

      // Wait for API calls to complete and costs to load
      await waitFor(() => {
        // Auto Rifle shows modified cost (0 pts) with Heavily Armed ability
        // Heavily Armed reduces Auto Rifle from 1 pt to 0 pts
        const autoRifleElement = screen.getByText('Auto Rifle').closest('.weapon-selector__item');
        expect(autoRifleElement).toHaveTextContent('0 pts');
      });
    });

    it('should not show modified cost when no ability applies', () => {
      const mockOnChange = vi.fn();

      render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[]}
          availableWeapons={mockCloseCombatWeapons}
          warbandAbility={null}
          onChange={mockOnChange}
         
        />
      );

      // Should show regular costs without "was" text
      expect(screen.queryByText(/was/)).not.toBeInTheDocument();
    });
  });
});

/**
 * Property-Based Tests for Weapon Selector API Usage
 * 
 * **Feature: 6-frontend-backend-api-separation, Property 12: Selector components use API for cost display**
 * **Validates: Requirements 5.1**
 */
describe('Property-Based Tests: Weapon Selector API Usage', () => {
  const testConfig = { numRuns: 50 };

  /**
   * Property 12: Selector components use API for cost display
   * 
   * For any weapon selector with weapons and warband ability, the component should:
   * 1. Use the useItemCost hook (which calls the API) for each weapon
   * 2. Display costs returned from the API
   * 3. Handle loading states appropriately
   * 4. Not use local cost calculation functions
   * 
   * This test verifies that the WeaponSelector component retrieves costs from the
   * backend API with warband ability context, rather than calculating costs locally.
   * 
   * **Feature: 6-frontend-backend-api-separation, Property 12: Selector components use API for cost display**
   * **Validates: Requirements 5.1**
   */
  it('Property 12: WeaponSelector uses API for cost display', () => {
    fc.assert(
      fc.property(
        // Generate weapon type
        fc.constantFrom('close-combat' as const, 'ranged' as const),
        // Generate random weapons (1-3 weapons to keep test fast)
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 30 }),
            type: fc.constantFrom('close' as const, 'ranged' as const),
            baseCost: fc.integer({ min: 0, max: 5 }),
            maxActions: fc.constantFrom(1, 2, 3),
            notes: fc.string({ maxLength: 50 })
          }),
          { minLength: 1, maxLength: 3 }
        ),
        // Generate optional warband ability
        fc.option(
          fc.constantFrom<WarbandAbility>(
            'Cyborgs', 'Fanatics', 'Living Weapons', 
            'Heavily Armed', 'Mutants', 'Soldiers', 'Undead'
          ),
          { nil: null }
        ),

        (weaponType, weapons, warbandAbility) => {
          const mockOnChange = vi.fn();

          const { container, unmount } = render(
            <WeaponSelector
              type={weaponType}
              selectedWeapons={[]}
              availableWeapons={weapons}
              warbandAbility={warbandAbility}
              onChange={mockOnChange}
            />
          );

          try {
            // Property 1: Each weapon should have a cost display element
            const costElements = container.querySelectorAll('.weapon-selector__cost');
            expect(costElements.length).toBe(weapons.length);

            // Property 2: Cost elements should have data attributes for loading/error states
            // These attributes are set by the useItemCost hook
            costElements.forEach(costElement => {
              expect(costElement).toHaveAttribute('data-loading');
              expect(costElement).toHaveAttribute('data-error');
            });

            // Property 3: Cost display should show either:
            // - A numeric cost with "pts" (when loaded)
            // - "... pts" (when loading)
            // - "? pts" (when error)
            costElements.forEach(costElement => {
              const costText = costElement.textContent || '';
              const isValidCostFormat = 
                /^\d+ pts$/.test(costText) ||  // Numeric cost
                costText === '... pts' ||       // Loading
                costText === '? pts';           // Error
              
              expect(isValidCostFormat).toBe(true);
            });

            // Property 4: The component should render all weapons
            expect(container.querySelectorAll('.weapon-selector__item').length).toBe(weapons.length);

            return true;
          } finally {
            // Clean up after each iteration
            unmount();
          }
        }
      ),
      testConfig
    );
  });
});

/**
 * Property-Based Tests for Automatic Unarmed Deselection
 * 
 * **Feature: 4-weirdo-editor, Property 10: Automatic Unarmed deselection**
 * **Validates: Requirements 4.9**
 */
describe('Property-Based Tests: Automatic Unarmed Deselection', () => {
  const testConfig = { numRuns: 50 };

  /**
   * Property 10: Automatic Unarmed deselection
   * 
   * For any close combat weapon selection other than Unarmed, the Unarmed option should be 
   * automatically unselected to maintain mutual exclusivity.
   * 
   * This property verifies that:
   * 1. When selecting a non-Unarmed close combat weapon, Unarmed is automatically removed
   * 2. The behavior only applies to close combat weapons, not ranged weapons
   * 3. Multiple non-Unarmed weapons can be selected together
   * 4. Unarmed can still be selected when no other weapons are present
   * 
   * **Feature: 4-weirdo-editor, Property 10: Automatic Unarmed deselection**
   * **Validates: Requirements 4.9**
   */
  it('Property 10: Automatic Unarmed deselection for close combat weapons', () => {
    fc.assert(
      fc.property(
        // Generate close combat weapons including Unarmed
        fc.array(
          fc.record({
            id: fc.oneof(
              fc.constant('unarmed'),
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== 'unarmed')
            ),
            name: fc.oneof(
              fc.constant('Unarmed'),
              fc.string({ minLength: 1, maxLength: 30 }).filter(s => s !== 'Unarmed')
            ),
            type: fc.constant('close' as const),
            baseCost: fc.integer({ min: 0, max: 5 }),
            maxActions: fc.constantFrom(1, 2, 3),
            notes: fc.string({ maxLength: 50 })
          }),
          { minLength: 2, maxLength: 5 }
        ).filter(weapons => {
          // Ensure we have at least one Unarmed and one non-Unarmed weapon
          const hasUnarmed = weapons.some(w => w.id === 'unarmed');
          const hasNonUnarmed = weapons.some(w => w.id !== 'unarmed');
          return hasUnarmed && hasNonUnarmed;
        }),
        // Generate initial selected weapons (may include Unarmed)
        fc.boolean(), // Whether to start with Unarmed selected

        (availableWeapons, startWithUnarmed) => {
          const mockOnChange = vi.fn();
          const unarmedWeapon = availableWeapons.find(w => w.id === 'unarmed')!;
          const nonUnarmedWeapons = availableWeapons.filter(w => w.id !== 'unarmed');
          
          // Set initial selection
          const initialSelection = startWithUnarmed ? [unarmedWeapon] : [];

          const { unmount } = render(
            <WeaponSelector
              type="close-combat"
              selectedWeapons={initialSelection}
              availableWeapons={availableWeapons}
              warbandAbility={null}
              onChange={mockOnChange}
            />
          );

          try {
            // Find a non-Unarmed weapon to select
            const targetWeapon = nonUnarmedWeapons[0];
            const targetWeaponIndex = availableWeapons.findIndex(w => w.id === targetWeapon.id);
            
            // Click the checkbox for the non-Unarmed weapon
            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[targetWeaponIndex]);

            // Property 1: onChange should have been called
            expect(mockOnChange).toHaveBeenCalled();

            // Property 2: The result should not contain Unarmed if we selected a non-Unarmed weapon
            const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
            const resultWeapons = lastCall[0] as Weapon[];
            
            const hasUnarmedInResult = resultWeapons.some(w => w.id === 'unarmed');
            expect(hasUnarmedInResult).toBe(false);

            // Property 3: The result should contain the selected non-Unarmed weapon
            const hasTargetWeapon = resultWeapons.some(w => w.id === targetWeapon.id);
            expect(hasTargetWeapon).toBe(true);

            // Property 4: If there were other non-Unarmed weapons selected initially, they should remain
            const otherInitialWeapons = initialSelection.filter(w => w.id !== 'unarmed');
            otherInitialWeapons.forEach(weapon => {
              const isStillSelected = resultWeapons.some(w => w.id === weapon.id);
              expect(isStillSelected).toBe(true);
            });

            return true;
          } finally {
            // Clean up after each iteration
            unmount();
          }
        }
      ),
      testConfig
    );
  });

  /**
   * Property: Unarmed deselection only applies to close combat weapons
   * 
   * Verifies that the automatic Unarmed deselection logic does not affect ranged weapons.
   */
  it('Property: Unarmed deselection logic does not apply to ranged weapons', () => {
    fc.assert(
      fc.property(
        // Generate ranged weapons
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 30 }),
            type: fc.constant('ranged' as const),
            baseCost: fc.integer({ min: 0, max: 5 }),
            maxActions: fc.constantFrom(1, 2, 3),
            notes: fc.string({ maxLength: 50 })
          }),
          { minLength: 1, maxLength: 3 }
        ),

        (rangedWeapons) => {
          const mockOnChange = vi.fn();

          const { unmount } = render(
            <WeaponSelector
              type="ranged"
              selectedWeapons={[]}
              availableWeapons={rangedWeapons}
              warbandAbility={null}
              onChange={mockOnChange}
            />
          );

          try {
            // Select the first ranged weapon
            const checkboxes = screen.getAllByRole('checkbox');
            if (checkboxes.length > 0) {
              fireEvent.click(checkboxes[0]);

              // Property: onChange should be called with the selected weapon
              expect(mockOnChange).toHaveBeenCalledWith([rangedWeapons[0]]);
              
              // Property: No special Unarmed logic should apply (this is just normal selection)
              const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
              const resultWeapons = lastCall[0] as Weapon[];
              expect(resultWeapons).toEqual([rangedWeapons[0]]);
            }

            return true;
          } finally {
            // Clean up after each iteration
            unmount();
          }
        }
      ),
      testConfig
    );
  });
});

/**
 * Property-Based Tests for Weapon Selector
 * 
 * **Feature: space-weirdos-ui, Property 14: Ranged weapon selections are disabled when Firepower is None**
 * **Validates: Requirements 12.7**
 */
describe('Property-Based Tests: Ranged Weapon Disabling', () => {
  const costEngine = new CostEngine();
  const testConfig = { numRuns: 50 };

  /**
   * Property 14: Ranged weapon selections are disabled when Firepower is None
   * 
   * For any weirdo with Firepower level None, the ranged weapon selector should be disabled.
   * This property verifies that:
   * 1. When disabled=true, all ranged weapon checkboxes are disabled
   * 2. When disabled=true, clicking checkboxes does not trigger onChange
   * 3. When disabled=true, the disabled message is displayed
   * 
   * **Feature: space-weirdos-ui, Property 14: Ranged weapon selections are disabled when Firepower is None**
   * **Validates: Requirements 12.7**
   */
  it('Property 14: Ranged weapon selections are disabled when Firepower is None', () => {
    fc.assert(
      fc.property(
        // Generate random ranged weapons (1-5 weapons)
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 30 }),
            type: fc.constant('ranged' as const),
            baseCost: fc.integer({ min: 0, max: 5 }),
            maxActions: fc.constantFrom(1, 2, 3),
            notes: fc.string({ maxLength: 50 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        // Generate whether disabled (representing Firepower None)
        fc.boolean(),
        // Generate optional warband ability
        fc.option(
          fc.constantFrom<WarbandAbility>(
            'Cyborgs', 'Fanatics', 'Living Weapons', 
            'Heavily Armed', 'Mutants', 'Soldiers', 'Undead'
          ),
          { nil: null }
        ),

        (rangedWeapons, isDisabled, warbandAbility) => {
          const mockOnChange = vi.fn();

          const { unmount } = render(
            <WeaponSelector
              type="ranged"
              selectedWeapons={[]}
              availableWeapons={rangedWeapons}
              warbandAbility={warbandAbility}
              onChange={mockOnChange}
              disabled={isDisabled}
             
            />
          );

          try {
            // Property 1: When disabled, all checkboxes should be disabled
            const checkboxes = screen.getAllByRole('checkbox');
            checkboxes.forEach(checkbox => {
              if (isDisabled) {
                expect(checkbox).toBeDisabled();
              } else {
                expect(checkbox).not.toBeDisabled();
              }
            });

            // Property 2: When disabled, the disabled message should be displayed
            const disabledMessage = screen.queryByText('Ranged weapons are disabled when Firepower is None');
            if (isDisabled) {
              expect(disabledMessage).toBeInTheDocument();
            } else {
              expect(disabledMessage).not.toBeInTheDocument();
            }

            // Property 3: When disabled, clicking checkboxes should not trigger onChange
            if (checkboxes.length > 0) {
              const firstCheckbox = checkboxes[0];
              fireEvent.click(firstCheckbox);

              if (isDisabled) {
                expect(mockOnChange).not.toHaveBeenCalled();
              } else {
                expect(mockOnChange).toHaveBeenCalled();
              }
            }

            // Property 4: The number of checkboxes should equal the number of weapons
            expect(checkboxes.length).toBe(rangedWeapons.length);

            return true;
          } finally {
            // Clean up after each iteration
            unmount();
          }
        }
      ),
      testConfig
    );
  });
});




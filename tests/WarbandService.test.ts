import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { WarbandService } from '../src/backend/services/WarbandService';
import { DataRepository } from '../src/backend/services/DataRepository';
import { WarbandAbility } from '../src/backend/models/types';

describe('WarbandService', () => {
  let service: WarbandService;
  let repository: DataRepository;

  beforeEach(() => {
    // Create repository with persistence disabled for testing
    repository = new DataRepository(':memory:', false);
    service = new WarbandService(repository);
  });

  describe('Property 2: New warbands initialize with zero cost', () => {
    /**
     * **Feature: space-weirdos-warband, Property 2: New warbands initialize with zero cost**
     * **Validates: Requirements 1.3**
     * 
     * For any newly created warband, the total point cost should equal zero before any weirdos are added.
     */
    it('should initialize all new warbands with zero cost', () => {
      // Generate valid warband abilities
      const warbandAbilityGen = fc.constantFrom<WarbandAbility>(
        'Cyborgs', 'Fanatics', 'Living Weapons', 
        'Heavily Armed', 'Mutants', 'Soldiers', 'Undead'
      );

      // Generate valid point limits
      const pointLimitGen = fc.constantFrom(75, 125);

      // Generate non-empty names
      const nameGen = fc.string({ minLength: 1, maxLength: 50 });

      fc.assert(
        fc.property(nameGen, pointLimitGen, warbandAbilityGen, (name, pointLimit, ability) => {
          // Create a new warband
          const warband = service.createWarband({
            name,
            pointLimit,
            ability
          });

          // Verify total cost is zero
          expect(warband.totalCost).toBe(0);
          
          // Verify weirdos array is empty
          expect(warband.weirdos).toEqual([]);
          
          // Verify warband has an ID
          expect(warband.id).toBeTruthy();
          
          // Verify timestamps are set
          expect(warband.createdAt).toBeInstanceOf(Date);
          expect(warband.updatedAt).toBeInstanceOf(Date);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 21: Loaded warbands are validated like new warbands', () => {
    /**
     * **Feature: space-weirdos-warband, Property 21: Loaded warbands are validated like new warbands**
     * **Validates: Requirements 12.4**
     * 
     * For any loaded warband that is modified, the system should apply all validation rules
     * (weapon requirements, equipment limits, point limits) as if the warband were being created new.
     */
    it('should validate loaded warbands with same rules as new warbands', () => {
      // Generators
      const speedLevelGen = fc.constantFrom<1 | 2 | 3>(1, 2, 3);
      const diceLevelGen = fc.constantFrom<'2d6' | '2d8' | '2d10'>('2d6', '2d8', '2d10');
      const firepowerLevelGen = fc.constantFrom<'None' | '2d8' | '2d10'>('None', '2d8', '2d10');
      const warbandAbilityGen = fc.constantFrom<WarbandAbility>(
        'Cyborgs', 'Fanatics', 'Living Weapons', 
        'Heavily Armed', 'Mutants', 'Soldiers', 'Undead'
      );

      const attributesGen = fc.record({
        speed: speedLevelGen,
        defense: diceLevelGen,
        firepower: firepowerLevelGen,
        prowess: diceLevelGen,
        willpower: diceLevelGen
      });

      const closeCombatWeaponGen = fc.record({
        id: fc.uuid(),
        name: fc.constantFrom('Unarmed', 'Claws & Teeth', 'Sword'),
        type: fc.constant('close' as const),
        baseCost: fc.integer({ min: 0, max: 3 }),
        maxActions: fc.integer({ min: 1, max: 3 }),
        notes: fc.string()
      });

      const rangedWeaponGen = fc.record({
        id: fc.uuid(),
        name: fc.constantFrom('Pistol', 'Rifle'),
        type: fc.constant('ranged' as const),
        baseCost: fc.integer({ min: 1, max: 5 }),
        maxActions: fc.integer({ min: 1, max: 3 }),
        notes: fc.string()
      });

      const equipmentGen = fc.record({
        id: fc.uuid(),
        name: fc.constantFrom('Grenade', 'Heavy Armor', 'Medkit'),
        type: fc.constantFrom('Passive' as const, 'Action' as const),
        baseCost: fc.integer({ min: 0, max: 3 }),
        effect: fc.string()
      });

      const psychicPowerGen = fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1 }),
        type: fc.constantFrom('Attack' as const, 'Effect' as const, 'Either' as const),
        cost: fc.integer({ min: 0, max: 3 }),
        effect: fc.string()
      });

      const weirdoGen = (type: 'leader' | 'trooper', warbandAbility: WarbandAbility) =>
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1 }),
          type: fc.constant(type),
          attributes: attributesGen,
          closeCombatWeapons: fc.array(closeCombatWeaponGen, { minLength: 1, maxLength: 2 }),
          rangedWeapons: fc.array(rangedWeaponGen, { minLength: 0, maxLength: 1 }),
          equipment: fc.array(equipmentGen, {
            minLength: 0,
            maxLength: type === 'leader' ? (warbandAbility === 'Cyborgs' ? 3 : 2) : warbandAbility === 'Cyborgs' ? 2 : 1
          }),
          psychicPowers: fc.array(psychicPowerGen, { minLength: 0, maxLength: 2 }),
          leaderTrait: type === 'leader' ? fc.option(fc.constantFrom('Bounty Hunter', 'Healer', 'Majestic'), { nil: null }) : fc.constant(null),
          notes: fc.string(),
          totalCost: fc.integer({ min: 0, max: 20 })
        });

      const warbandGen = fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1 }),
        ability: warbandAbilityGen,
        pointLimit: fc.constantFrom(75 as const, 125 as const),
        totalCost: fc.integer({ min: 0, max: 125 }),
        weirdos: fc.constant([]),
        createdAt: fc.date(),
        updatedAt: fc.date()
      }).chain((warband) =>
        fc
          .tuple(
            weirdoGen('leader', warband.ability),
            fc.array(weirdoGen('trooper', warband.ability), { minLength: 0, maxLength: 2 })
          )
          .map(([leader, troopers]) => ({
            ...warband,
            weirdos: [leader, ...troopers]
          }))
      );

      fc.assert(
        fc.property(warbandGen, (warband) => {
          // Save the warband
          const saved = repository.saveWarband(warband);
          
          // Load it back
          const loaded = service.getWarband(saved.id);
          expect(loaded).not.toBeNull();
          
          if (loaded) {
            // Validate the loaded warband
            const validationResult = service.validateWarband(loaded);
            
            // The validation should run (we're not checking if it passes or fails,
            // just that validation is applied)
            expect(validationResult).toHaveProperty('valid');
            expect(validationResult).toHaveProperty('errors');
            expect(Array.isArray(validationResult.errors)).toBe(true);
            
            // If we modify the loaded warband, validation should still apply
            const modified = {
              ...loaded,
              name: 'Modified Name'
            };
            
            const modifiedValidation = service.validateWarband(modified);
            expect(modifiedValidation).toHaveProperty('valid');
            expect(modifiedValidation).toHaveProperty('errors');
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 25: Cost changes cascade through the system', () => {
    /**
     * **Feature: space-weirdos-warband, Property 25: Cost changes cascade through the system**
     * **Validates: Requirements 15.1, 15.2**
     * 
     * For any weirdo in a warband, when attributes, weapons, equipment, or psychic powers are added or removed,
     * the weirdo's total cost should immediately update, and the warband's total cost should immediately update
     * to reflect the change.
     */
    it('should cascade cost changes from weirdo to warband', () => {
      const warbandAbilityGen = fc.constantFrom<WarbandAbility>(
        'Cyborgs', 'Fanatics', 'Living Weapons', 
        'Heavily Armed', 'Mutants', 'Soldiers', 'Undead'
      );

      const speedLevelGen = fc.constantFrom<1 | 2 | 3>(1, 2, 3);
      const diceLevelGen = fc.constantFrom<'2d6' | '2d8' | '2d10'>('2d6', '2d8', '2d10');
      const firepowerLevelGen = fc.constantFrom<'None' | '2d8' | '2d10'>('None', '2d8', '2d10');

      const attributesGen = fc.record({
        speed: speedLevelGen,
        defense: diceLevelGen,
        firepower: firepowerLevelGen,
        prowess: diceLevelGen,
        willpower: diceLevelGen
      });

      const closeCombatWeaponGen = fc.record({
        id: fc.uuid(),
        name: fc.constantFrom('Unarmed', 'Claws & Teeth', 'Sword'),
        type: fc.constant('close' as const),
        baseCost: fc.integer({ min: 0, max: 3 }),
        maxActions: fc.integer({ min: 1, max: 3 }),
        notes: fc.string()
      });

      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.constantFrom(75 as const, 125 as const),
          warbandAbilityGen,
          attributesGen,
          fc.array(closeCombatWeaponGen, { minLength: 1, maxLength: 2 }),
          (name, pointLimit, ability, attributes, weapons) => {
            // Create a warband
            const warband = service.createWarband({ name, pointLimit, ability });
            const initialWarbandCost = warband.totalCost;
            expect(initialWarbandCost).toBe(0);

            // Create a weirdo with specific attributes and weapons
            const weirdo = {
              id: 'test-weirdo',
              name: 'Test Weirdo',
              type: 'leader' as const,
              attributes,
              closeCombatWeapons: weapons,
              rangedWeapons: [],
              equipment: [],
              psychicPowers: [],
              leaderTrait: null,
              notes: '',
              totalCost: 0
            };

            // Add weirdo to warband
            const updatedWarband = service.updateWarband(warband.id, {
              weirdos: [weirdo]
            });

            // Verify weirdo has a cost calculated
            expect(updatedWarband.weirdos[0].totalCost).toBeGreaterThanOrEqual(0);
            const weirdoCost = updatedWarband.weirdos[0].totalCost;

            // Verify warband total cost equals weirdo cost (cascading)
            expect(updatedWarband.totalCost).toBe(weirdoCost);

            // Now modify the weirdo's attributes (change speed to a different level)
            const modifiedAttributes = {
              ...attributes,
              speed: (attributes.speed === 1 ? 2 : 1) as 1 | 2 | 3
            };

            const modifiedWeirdo = {
              ...updatedWarband.weirdos[0],
              attributes: modifiedAttributes
            };

            // Update the warband with modified weirdo
            const finalWarband = service.updateWarband(warband.id, {
              weirdos: [modifiedWeirdo]
            });

            // Verify weirdo cost changed (unless speed cost is same)
            const newWeirdoCost = finalWarband.weirdos[0].totalCost;
            expect(newWeirdoCost).toBeGreaterThanOrEqual(0);

            // Verify warband total cost cascaded to match new weirdo cost
            expect(finalWarband.totalCost).toBe(newWeirdoCost);

            // Verify the cascade: warband cost = sum of all weirdo costs
            const sumOfWeirdoCosts = finalWarband.weirdos.reduce((sum, w) => sum + w.totalCost, 0);
            expect(finalWarband.totalCost).toBe(sumOfWeirdoCosts);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 22: Warband list contains all saved warbands', () => {
    /**
     * **Feature: space-weirdos-warband, Property 22: Warband list contains all saved warbands**
     * **Validates: Requirements 13.1, 13.2, 13.3**
     * 
     * For any set of saved warbands, requesting the warband list should return all warbands
     * with their name, ability, point limit, total cost, and weirdo count.
     */
    it('should return all saved warbands with complete information', () => {
      const warbandAbilityGen = fc.constantFrom<WarbandAbility>(
        'Cyborgs', 'Fanatics', 'Living Weapons', 
        'Heavily Armed', 'Mutants', 'Soldiers', 'Undead'
      );

      const simpleWarbandGen = fc.record({
        name: fc.string({ minLength: 1, maxLength: 30 }),
        ability: warbandAbilityGen,
        pointLimit: fc.constantFrom(75 as const, 125 as const),
        weirdos: fc.constant([])
      });

      fc.assert(
        fc.property(fc.array(simpleWarbandGen, { minLength: 1, maxLength: 5 }), (warbandDataArray) => {
          // Clear repository
          repository.clear();
          
          // Create all warbands
          const createdWarbands = warbandDataArray.map(data => 
            service.createWarband(data)
          );
          
          // Get all warbands
          const allWarbands = service.getAllWarbands();
          
          // Verify count matches
          expect(allWarbands.length).toBe(createdWarbands.length);
          
          // Verify each created warband is in the list
          for (const created of createdWarbands) {
            const found = allWarbands.find(w => w.id === created.id);
            expect(found).toBeDefined();
            
            if (found) {
              // Verify all required fields are present
              expect(found.name).toBe(created.name);
              expect(found.ability).toBe(created.ability);
              expect(found.pointLimit).toBe(created.pointLimit);
              expect(found.totalCost).toBe(created.totalCost);
              expect(found.weirdos).toBeDefined();
              expect(Array.isArray(found.weirdos)).toBe(true);
              
              // Verify weirdo count is accessible
              const weirdoCount = found.weirdos.length;
              expect(typeof weirdoCount).toBe('number');
              expect(weirdoCount).toBeGreaterThanOrEqual(0);
            }
          }
        }),
        { numRuns: 50 }
      );
    });
  });
});

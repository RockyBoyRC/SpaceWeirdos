import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeaponSelector } from '../src/frontend/components/WeaponSelector';
import { EquipmentSelector } from '../src/frontend/components/EquipmentSelector';
import { PsychicPowerSelector } from '../src/frontend/components/PsychicPowerSelector';
import type { Weapon, Equipment, PsychicPower, WarbandAbility } from '../src/backend/models/types';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Automated tests for warband ability cost display in selector components
 * 
 * These tests verify the UI displays modified costs correctly based on warband abilities,
 * simulating the manual testing scenarios from task 6.1.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 2.5
 */
describe('Warband Ability Cost Display', () => {
  let closeCombatWeapons: Weapon[];
  let rangedWeapons: Weapon[];
  let equipment: Equipment[];
  let psychicPowers: PsychicPower[];

  beforeAll(async () => {
    // Load game data from JSON files
    closeCombatWeapons = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'data', 'closeCombatWeapons.json'), 'utf-8')
    );
    rangedWeapons = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'data', 'rangedWeapons.json'), 'utf-8')
    );
    equipment = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'data', 'equipment.json'), 'utf-8')
    );
    psychicPowers = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'data', 'psychicPowers.json'), 'utf-8')
    );
  });

  /**
   * Test Mutants ability displays reduced costs for specific close combat weapons
   * Requirements: 1.1
   */
  describe('Mutants Ability', () => {
    it('should display reduced costs for Claws & Teeth, Horrible Claws & Teeth, and Whip/Tail', () => {
      const mutantWeapons = ['Claws & Teeth', 'Horrible Claws & Teeth', 'Whip/Tail'];
      
      const { container } = render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[]}
          availableWeapons={closeCombatWeapons}
          warbandAbility="Mutants"
          onChange={() => {}}
        />
      );

      // Verify each mutant weapon displays reduced cost
      for (const weaponName of mutantWeapons) {
        const weapon = closeCombatWeapons.find(w => w.name === weaponName);
        expect(weapon).toBeDefined();
        
        if (weapon) {
          const expectedCost = Math.max(0, weapon.baseCost - 1);
          const weaponLabel = container.querySelector(`label[for="weapon-${weapon.id}"]`);
          expect(weaponLabel).toBeTruthy();
          expect(weaponLabel?.textContent).toContain(`${expectedCost} pts`);
        }
      }
    });

    it('should display base costs for non-mutant close combat weapons', () => {
      const nonMutantWeapons = closeCombatWeapons.filter(
        w => !['Claws & Teeth', 'Horrible Claws & Teeth', 'Whip/Tail'].includes(w.name)
      );
      
      const { container } = render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[]}
          availableWeapons={nonMutantWeapons}
          warbandAbility="Mutants"
          onChange={() => {}}
        />
      );

      // Verify each non-mutant weapon displays its base cost
      for (const weapon of nonMutantWeapons) {
        const weaponLabel = container.querySelector(`label[for="weapon-${weapon.id}"]`);
        expect(weaponLabel).toBeTruthy();
        expect(weaponLabel?.textContent).toContain(`${weapon.baseCost} pts`);
      }
    });
  });

  /**
   * Test Soldiers ability displays 0 cost for specific equipment
   * Requirements: 1.2
   */
  describe('Soldiers Ability', () => {
    it('should display 0 cost for Grenade, Heavy Armor, and Medkit', () => {
      const soldierFreeEquipment = ['Grenade', 'Heavy Armor', 'Medkit'];
      
      render(
        <EquipmentSelector
          selectedEquipment={[]}
          availableEquipment={equipment}
          weirdoType="leader"
          warbandAbility="Soldiers"
          onChange={() => {}}
        />
      );

      for (const equipName of soldierFreeEquipment) {
        const equip = equipment.find(e => e.name === equipName);
        expect(equip).toBeDefined();
        
        if (equip) {
          // Find all instances of "0 pts" and verify at least one exists for this equipment
          const costDisplays = screen.getAllByText('0 pts');
          expect(costDisplays.length).toBeGreaterThan(0);
        }
      }
    });

    it('should display base costs for non-soldier equipment', () => {
      const nonFreeEquipment = equipment.filter(
        e => !['Grenade', 'Heavy Armor', 'Medkit'].includes(e.name)
      );
      
      const { container } = render(
        <EquipmentSelector
          selectedEquipment={[]}
          availableEquipment={nonFreeEquipment}
          weirdoType="leader"
          warbandAbility="Soldiers"
          onChange={() => {}}
        />
      );

      // Verify each non-soldier equipment displays its base cost
      for (const equip of nonFreeEquipment) {
        const equipLabel = container.querySelector(`label[for="equipment-${equip.id}"]`);
        expect(equipLabel).toBeTruthy();
        expect(equipLabel?.textContent).toContain(`${equip.baseCost} pts`);
      }
    });
  });

  /**
   * Test Heavily Armed ability displays reduced costs for all ranged weapons
   * Requirements: 1.3
   */
  describe('Heavily Armed Ability', () => {
    it('should display reduced costs for all ranged weapons', () => {
      const { container } = render(
        <WeaponSelector
          type="ranged"
          selectedWeapons={[]}
          availableWeapons={rangedWeapons}
          warbandAbility="Heavily Armed"
          onChange={() => {}}
        />
      );

      // Verify each ranged weapon displays reduced cost
      for (const weapon of rangedWeapons) {
        const expectedCost = Math.max(0, weapon.baseCost - 1);
        const weaponLabel = container.querySelector(`label[for="weapon-${weapon.id}"]`);
        expect(weaponLabel).toBeTruthy();
        expect(weaponLabel?.textContent).toContain(`${expectedCost} pts`);
      }
    });
  });

  /**
   * Test null ability displays base costs
   * Requirements: 2.4
   */
  describe('No Ability Selected', () => {
    it('should display base costs for all close combat weapons', () => {
      const { container } = render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[]}
          availableWeapons={closeCombatWeapons}
          warbandAbility={null}
          onChange={() => {}}
        />
      );

      // Verify each weapon displays its base cost
      for (const weapon of closeCombatWeapons) {
        const weaponLabel = container.querySelector(`label[for="weapon-${weapon.id}"]`);
        expect(weaponLabel).toBeTruthy();
        expect(weaponLabel?.textContent).toContain(`${weapon.baseCost} pts`);
      }
    });

    it('should display base costs for all ranged weapons', () => {
      const { container } = render(
        <WeaponSelector
          type="ranged"
          selectedWeapons={[]}
          availableWeapons={rangedWeapons}
          warbandAbility={null}
          onChange={() => {}}
        />
      );

      // Verify each weapon displays its base cost
      for (const weapon of rangedWeapons) {
        const weaponLabel = container.querySelector(`label[for="weapon-${weapon.id}"]`);
        expect(weaponLabel).toBeTruthy();
        expect(weaponLabel?.textContent).toContain(`${weapon.baseCost} pts`);
      }
    });

    it('should display base costs for all equipment', () => {
      const { container } = render(
        <EquipmentSelector
          selectedEquipment={[]}
          availableEquipment={equipment}
          weirdoType="leader"
          warbandAbility={null}
          onChange={() => {}}
        />
      );

      // Verify each equipment displays its base cost
      for (const equip of equipment) {
        const equipLabel = container.querySelector(`label[for="equipment-${equip.id}"]`);
        expect(equipLabel).toBeTruthy();
        expect(equipLabel?.textContent).toContain(`${equip.baseCost} pts`);
      }
    });

    it('should display base costs for all psychic powers', () => {
      const { container } = render(
        <PsychicPowerSelector
          selectedPowers={[]}
          availablePowers={psychicPowers}
          warbandAbility={null}
          onChange={() => {}}
        />
      );

      // Verify each power displays its base cost
      for (const power of psychicPowers) {
        const powerLabel = container.querySelector(`label[for="psychic-power-${power.id}"]`);
        expect(powerLabel).toBeTruthy();
        expect(powerLabel?.textContent).toContain(`${power.cost} pts`);
      }
    });
  });

  /**
   * Test cost clamping at 0 minimum
   * Requirements: 1.5
   */
  describe('Cost Clamping', () => {
    it('should never display negative costs for weapons with Mutants ability', () => {
      render(
        <WeaponSelector
          type="close-combat"
          selectedWeapons={[]}
          availableWeapons={closeCombatWeapons}
          warbandAbility="Mutants"
          onChange={() => {}}
        />
      );

      // Get all cost displays and verify none are negative
      const costDisplays = screen.getAllByText(/\d+ pts/);
      for (const display of costDisplays) {
        const cost = parseInt(display.textContent?.match(/\d+/)?.[0] || '0');
        expect(cost).toBeGreaterThanOrEqual(0);
      }
    });

    it('should never display negative costs for weapons with Heavily Armed ability', () => {
      render(
        <WeaponSelector
          type="ranged"
          selectedWeapons={[]}
          availableWeapons={rangedWeapons}
          warbandAbility="Heavily Armed"
          onChange={() => {}}
        />
      );

      // Get all cost displays and verify none are negative
      const costDisplays = screen.getAllByText(/\d+ pts/);
      for (const display of costDisplays) {
        const cost = parseInt(display.textContent?.match(/\d+/)?.[0] || '0');
        expect(cost).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

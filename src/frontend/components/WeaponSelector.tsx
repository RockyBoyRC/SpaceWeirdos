import { memo } from 'react';
import { Weapon, WarbandAbility } from '../../backend/models/types';
import { calculateWeaponCost } from '../utils/costCalculations';
import './WeaponSelector.css';

/**
 * WeaponSelector Component
 * 
 * Multi-select interface for weapons with cost and notes display.
 * Supports both close combat and ranged weapons.
 * Shows base costs for each weapon.
 * Total cost (including warband ability modifications) is calculated by the API.
 * Can be disabled (e.g., ranged weapons when Firepower is None).
 * 
 * Requirements: 5.3, 5.7, 5.8, 12.2, 12.7, 9.2, 9.6
 */

interface WeaponSelectorProps {
  type: 'close-combat' | 'ranged';
  selectedWeapons: Weapon[];
  availableWeapons: Weapon[];
  warbandAbility: WarbandAbility | null;
  onChange: (weapons: Weapon[]) => void;
  disabled?: boolean;
}

const WeaponSelectorComponent = ({
  type,
  selectedWeapons,
  availableWeapons,
  warbandAbility,
  onChange,
  disabled = false
}: WeaponSelectorProps) => {
  const handleToggle = (weapon: Weapon) => {
    // Don't allow changes when disabled
    if (disabled) {
      return;
    }
    
    const isSelected = selectedWeapons.some(w => w.id === weapon.id);
    
    if (isSelected) {
      // Remove weapon
      onChange(selectedWeapons.filter(w => w.id !== weapon.id));
    } else {
      // Add weapon
      onChange([...selectedWeapons, weapon]);
    }
  };

  const formatCostDisplay = (weapon: Weapon): string => {
    // Apply warband ability modifiers to display accurate costs
    const modifiedCost = calculateWeaponCost(weapon, warbandAbility);
    return `${modifiedCost} pts`;
  };

  const title = type === 'close-combat' ? 'Close Combat Weapons' : 'Ranged Weapons';
  const sectionId = `weapon-selector-${type}`;

  return (
    <div className="weapon-selector" role="group" aria-labelledby={`${sectionId}-heading`}>
      <h4 id={`${sectionId}-heading`}>{title}</h4>
      {disabled && (
        <p className="weapon-selector__disabled-message" role="alert">
          Ranged weapons are disabled when Firepower is None
        </p>
      )}
      <ul className="weapon-selector__list" role="list">
        {availableWeapons.map((weapon) => {
          const isSelected = selectedWeapons.some(w => w.id === weapon.id);

          return (
            <li key={weapon.id} className="weapon-selector__item" role="listitem">
              <label 
                className={`weapon-selector__label ${disabled ? 'disabled' : ''}`}
                htmlFor={`weapon-${weapon.id}`}
              >
                <input
                  type="checkbox"
                  id={`weapon-${weapon.id}`}
                  checked={isSelected}
                  onChange={() => handleToggle(weapon)}
                  disabled={disabled}
                  className="weapon-selector__checkbox checkbox"
                  aria-describedby={weapon.notes ? `weapon-notes-${weapon.id}` : undefined}
                />
                <div className="weapon-selector__content">
                  <div className="weapon-selector__header">
                    <span className="weapon-selector__name">{weapon.name}</span>
                    <span 
                      className="weapon-selector__cost"
                      aria-label={`Cost: ${formatCostDisplay(weapon)}`}
                    >
                      {formatCostDisplay(weapon)}
                    </span>
                  </div>
                  {weapon.notes && (
                    <div 
                      className="weapon-selector__notes" 
                      id={`weapon-notes-${weapon.id}`}
                    >
                      {weapon.notes}
                    </div>
                  )}
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// Memoize component for performance
export const WeaponSelector = memo(WeaponSelectorComponent);

import { memo } from 'react';
import { PsychicPower, WarbandAbility } from '../../backend/models/types';
import { calculatePsychicPowerCost } from '../utils/costCalculations';
import './PsychicPowerSelector.css';

/**
 * PsychicPowerSelector Component
 * 
 * Multi-select interface for psychic powers.
 * Displays name, cost, and effect for each power.
 * No limit on selections.
 * 
 * Requirements: 5.5, 12.4, 1.6, 2.3
 */

interface PsychicPowerSelectorProps {
  selectedPowers: PsychicPower[];
  availablePowers: PsychicPower[];
  warbandAbility: WarbandAbility | null;
  onChange: (powers: PsychicPower[]) => void;
}

/**
 * PsychicPowerItem Component
 * 
 * Individual psychic power item that uses useItemCost hook for API-based cost calculation
 */
interface PsychicPowerItemProps {
  power: PsychicPower;
  isSelected: boolean;
  warbandAbility: WarbandAbility | null;
  onToggle: (power: PsychicPower) => void;
}

const PsychicPowerItem = memo(({
  power,
  isSelected,
  warbandAbility,
  onToggle
}: PsychicPowerItemProps) => {
  // Use the useItemCost hook to get cost from API
  const { cost, isLoading, error } = useItemCost({
    itemType: 'psychicPower',
    itemName: power.name,
    warbandAbility,
  });

  const formatCostDisplay = (): string => {
    if (isLoading) {
      return '... pts';
    }
    if (error) {
      return '? pts';
    }
    return `${cost} pts`;
  };

  return (
    <li className="psychic-power-selector__item" role="listitem">
      <label 
        className="psychic-power-selector__label"
        htmlFor={`psychic-power-${power.id}`}
      >
        <input
          type="checkbox"
          id={`psychic-power-${power.id}`}
          checked={isSelected}
          onChange={() => onToggle(power)}
          className="psychic-power-selector__checkbox checkbox"
          aria-describedby={`psychic-power-effect-${power.id}`}
          aria-label={`${power.name}, ${power.cost} points`}
        />
        <div className="psychic-power-selector__content">
          <div className="psychic-power-selector__header">
            <span className="psychic-power-selector__name">{power.name}</span>
            <span 
              className="psychic-power-selector__cost"
              aria-label={`Cost: ${formatCostDisplay()}`}
              data-loading={isLoading}
              data-error={error !== null}
            >
              {formatCostDisplay()}
            </span>
          </div>
          <div 
            className="psychic-power-selector__effect"
            id={`psychic-power-effect-${power.id}`}
          >
            {power.effect}
          </div>
        </div>
      </label>
    </li>
  );
});

PsychicPowerItem.displayName = 'PsychicPowerItem';

const PsychicPowerSelectorComponent = ({
  selectedPowers,
  availablePowers,
  warbandAbility,
  onChange
}: PsychicPowerSelectorProps) => {
  const handleToggle = (power: PsychicPower) => {
    const isSelected = selectedPowers.some(p => p.id === power.id);
    
    if (isSelected) {
      // Remove power
      onChange(selectedPowers.filter(p => p.id !== power.id));
    } else {
      // Add power
      onChange([...selectedPowers, power]);
    }
  };

  const formatCostDisplay = (power: PsychicPower): string => {
    // Apply warband ability modifiers to display accurate costs
    // Currently no abilities modify psychic power costs, but pattern is established
    const modifiedCost = calculatePsychicPowerCost(power, warbandAbility);
    return `${modifiedCost} pts`;
  };

  return (
    <div className="psychic-power-selector" role="group" aria-labelledby="psychic-powers-heading">
      <h4 id="psychic-powers-heading">Psychic Powers</h4>
      <ul className="psychic-power-selector__list" role="list">
        {availablePowers.map((power) => {
          const isSelected = selectedPowers.some(p => p.id === power.id);

          return (
            <li key={power.id} className="psychic-power-selector__item" role="listitem">
              <label 
                className="psychic-power-selector__label"
                htmlFor={`psychic-power-${power.id}`}
              >
                <input
                  type="checkbox"
                  id={`psychic-power-${power.id}`}
                  checked={isSelected}
                  onChange={() => handleToggle(power)}
                  className="psychic-power-selector__checkbox checkbox"
                  aria-describedby={`psychic-power-effect-${power.id}`}
                  aria-label={`${power.name}, ${power.cost} points`}
                />
                <div className="psychic-power-selector__content">
                  <div className="psychic-power-selector__header">
                    <span className="psychic-power-selector__name">{power.name}</span>
                    <span 
                      className="psychic-power-selector__cost"
                      aria-label={`Cost: ${formatCostDisplay(power)}`}
                    >
                      {formatCostDisplay(power)}
                    </span>
                  </div>
                  <div 
                    className="psychic-power-selector__effect"
                    id={`psychic-power-effect-${power.id}`}
                  >
                    {power.effect}
                  </div>
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
export const PsychicPowerSelector = memo(PsychicPowerSelectorComponent);

import { useState, useEffect, memo } from 'react';
import { Weirdo, WarbandAbility } from '../../backend/models/types';
import { apiClient } from '../services/apiClient';
import './WeirdoCostDisplay.css';

/**
 * WeirdoCostDisplay Component
 * 
 * Shows individual weirdo cost with sticky positioning at top of weirdo editor.
 * Provides expandable cost breakdown fetched from API.
 * Displays warning indicators when approaching limits (within 10 points).
 * Displays error indicators when exceeding limits.
 * Uses design system tokens for consistent styling.
 * Animates breakdown expand/collapse with smooth transitions.
 * Memoized for performance optimization.
 * 
 * Requirements: 1.1, 1.3, 2.1, 2.2, 2.5, 2.6, 3.1, 3.3, 3.5, 3.6, 5.1-5.5, 9.2, 9.6
 */

interface WeirdoCostDisplayProps {
  weirdo: Weirdo;
  warbandAbility: WarbandAbility | null;
}

const WeirdoCostDisplayComponent = ({
  weirdo,
  warbandAbility,
}: WeirdoCostDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState<{
    attributeCost: number;
    weaponCost: number;
    equipmentCost: number;
    psychicPowerCost: number;
  } | null>(null);

  // Use the cached total cost from the weirdo object (calculated by API via WarbandContext)
  // Fallback to 0 if totalCost is undefined (shouldn't happen but provides safety)
  const totalCost = weirdo.totalCost ?? 0;

  // Fetch cost breakdown from API when expanded (Requirements 9.2, 9.6)
  useEffect(() => {
    if (isExpanded && !costBreakdown) {
      const fetchBreakdown = async () => {
        try {
          const response = await apiClient.calculateCostRealTime({
            weirdoType: weirdo.type,
            attributes: weirdo.attributes,
            weapons: {
              close: weirdo.closeCombatWeapons.map(w => w.name),
              ranged: weirdo.rangedWeapons.map(w => w.name),
            },
            equipment: weirdo.equipment.map(e => e.name),
            psychicPowers: weirdo.psychicPowers.map(p => p.name),
            warbandAbility: warbandAbility,
          });
          
          setCostBreakdown({
            attributeCost: response.data.breakdown.attributes,
            weaponCost: response.data.breakdown.weapons,
            equipmentCost: response.data.breakdown.equipment,
            psychicPowerCost: response.data.breakdown.psychicPowers,
          });
        } catch (error) {
          console.error('Error fetching cost breakdown:', error);
        }
      };
      
      fetchBreakdown();
    }
  }, [isExpanded, costBreakdown, weirdo, warbandAbility]);

  // Reset breakdown when weirdo changes
  useEffect(() => {
    setCostBreakdown(null);
  }, [weirdo.id, weirdo.attributes, weirdo.closeCombatWeapons, weirdo.rangedWeapons, weirdo.equipment, weirdo.psychicPowers, warbandAbility]);

  // Determine warning/error state (Requirements 2.1, 2.2)
  // Leaders have 25 point limit, troopers have 20 point limit
  const weirdoLimit = weirdo.type === 'leader' ? 25 : 20;
  const remaining = weirdoLimit - totalCost;
  const isApproachingLimit = remaining <= 10 && remaining > 0;
  const isOverLimit = remaining < 0;

  // Build CSS classes based on state (Requirements 2.5, 2.6)
  const displayClasses = [
    'weirdo-cost-display',
    isApproachingLimit && 'weirdo-cost-display--warning',
    isOverLimit && 'weirdo-cost-display--error',
  ]
    .filter(Boolean)
    .join(' ');

  // Build ARIA label for accessibility
  let ariaLabel = `Weirdo cost: ${totalCost} of ${weirdoLimit} points`;
  if (isOverLimit) {
    ariaLabel += `, over limit by ${Math.abs(remaining)} points`;
  } else if (isApproachingLimit) {
    ariaLabel += `, warning: only ${remaining} points remaining`;
  } else {
    ariaLabel += `, ${remaining} points remaining`;
  }

  return (
    <div 
      className={displayClasses}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <div className="weirdo-cost-display__header">
        <div className="weirdo-cost-display__main">
          <span className="weirdo-cost-display__label">Weirdo Cost:</span>
          <span className="weirdo-cost-display__value">
            {totalCost} / {weirdoLimit} pts
          </span>
          {isApproachingLimit && (
            <span className="weirdo-cost-display__indicator weirdo-cost-display__indicator--warning">
              ⚠ Approaching Limit
            </span>
          )}
          {isOverLimit && (
            <span className="weirdo-cost-display__indicator weirdo-cost-display__indicator--error">
              ✕ Over Limit
            </span>
          )}
        </div>
        <button
          className="weirdo-cost-display__toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide cost breakdown' : 'Show cost breakdown'}
        >
          {isExpanded ? '▼' : '▶'} Breakdown
        </button>
      </div>

      {/* Expandable cost breakdown (Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 9.2) */}
      {isExpanded && (
        <div className="weirdo-cost-display__breakdown">
          {costBreakdown ? (
            <>
              <div className="weirdo-cost-display__breakdown-item">
                <span>Attributes:</span>
                <span>{costBreakdown.attributeCost} pts</span>
              </div>
              <div className="weirdo-cost-display__breakdown-item">
                <span>Weapons:</span>
                <span>{costBreakdown.weaponCost} pts</span>
              </div>
              <div className="weirdo-cost-display__breakdown-item">
                <span>Equipment:</span>
                <span>{costBreakdown.equipmentCost} pts</span>
              </div>
              <div className="weirdo-cost-display__breakdown-item">
                <span>Psychic Powers:</span>
                <span>{costBreakdown.psychicPowerCost} pts</span>
              </div>
              <div className="weirdo-cost-display__breakdown-item weirdo-cost-display__breakdown-item--total">
                <span>Total:</span>
                <span>{totalCost} pts</span>
              </div>
            </>
          ) : (
            <div className="weirdo-cost-display__breakdown-item">
              <span>Loading breakdown...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Memoize component for performance
export const WeirdoCostDisplay = memo(WeirdoCostDisplayComponent);

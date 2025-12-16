import { useState, memo } from 'react';
import type { Weirdo, WarbandAbility } from '../../backend/models/types';
import { useCostCalculation } from '../hooks/useCostCalculation';
import './WeirdoCostDisplay.css';

/**
 * WeirdoCostDisplay Component
 * 
 * Shows individual weirdo cost with sticky positioning at top of weirdo editor.
 * Uses centralized API-driven cost calculation and warning system.
 * Provides expandable cost breakdown with real-time updates.
 * Displays context-aware warning indicators based on backend ValidationService.
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

  // Use centralized cost calculation hook with API-driven warnings
  const costResult = useCostCalculation({
    weirdoType: weirdo.type,
    attributes: weirdo.attributes,
    weapons: {
      close: weirdo.closeCombatWeapons.map(w => w.name),
      ranged: weirdo.rangedWeapons.map(w => w.name),
    },
    equipment: weirdo.equipment.map(e => e.name),
    psychicPowers: weirdo.psychicPowers.map(p => p.name),
    warbandAbility: warbandAbility,
  }, weirdo.totalCost);

  // Use API-driven cost and warning states (Requirements 2.1, 2.2, 2.10)
  const totalCost = costResult.totalCost;
  const isApproachingLimit = costResult.isApproachingLimit;
  const isOverLimit = costResult.isOverLimit;
  const warnings = costResult.warnings;

  // Build CSS classes based on API-driven state
  const displayClasses = [
    'weirdo-cost-display',
    isApproachingLimit && 'weirdo-cost-display--warning',
    isOverLimit && 'weirdo-cost-display--error',
  ]
    .filter(Boolean)
    .join(' ');

  // Build ARIA label for accessibility using API-driven warnings
  let ariaLabel = `Weirdo cost: ${totalCost} points`;
  if (isOverLimit) {
    ariaLabel += `, over limit`;
  } else if (isApproachingLimit) {
    ariaLabel += `, warning: approaching limit`;
  }
  
  // Add specific warning messages from API
  if (warnings.length > 0) {
    ariaLabel += `. ${warnings.join('. ')}`;
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
            {totalCost} pts
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
          {costResult.isLoading ? (
            <div className="weirdo-cost-display__breakdown-item">
              <span>Loading breakdown...</span>
            </div>
          ) : costResult.error ? (
            <div className="weirdo-cost-display__breakdown-item">
              <span>Error loading breakdown: {costResult.error}</span>
            </div>
          ) : (
            <>
              <div className="weirdo-cost-display__breakdown-item">
                <span>Attributes:</span>
                <span>{costResult.breakdown.attributes} pts</span>
              </div>
              <div className="weirdo-cost-display__breakdown-item">
                <span>Weapons:</span>
                <span>{costResult.breakdown.weapons} pts</span>
              </div>
              <div className="weirdo-cost-display__breakdown-item">
                <span>Equipment:</span>
                <span>{costResult.breakdown.equipment} pts</span>
              </div>
              <div className="weirdo-cost-display__breakdown-item">
                <span>Psychic Powers:</span>
                <span>{costResult.breakdown.psychicPowers} pts</span>
              </div>
              <div className="weirdo-cost-display__breakdown-item weirdo-cost-display__breakdown-item--total">
                <span>Total:</span>
                <span>{totalCost} pts</span>
              </div>
              {/* Display API-driven warnings */}
              {warnings.length > 0 && (
                <div className="weirdo-cost-display__warnings">
                  {warnings.map((warning, index) => (
                    <div key={index} className="weirdo-cost-display__warning">
                      ⚠ {warning}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Memoize component for performance
export const WeirdoCostDisplay = memo(WeirdoCostDisplayComponent);
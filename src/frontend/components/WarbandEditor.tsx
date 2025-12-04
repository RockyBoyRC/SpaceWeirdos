import { useState, useEffect } from 'react';
import { Warband, Weirdo, WarbandAbility, ValidationError } from '../../backend/models/types';
import { apiClient, ApiError } from '../services/apiClient';
import { WeirdoEditor } from './WeirdoEditor';
import './WarbandEditor.css';

/**
 * WarbandEditorComponent
 * 
 * Manages warband-level properties and weirdos.
 * Provides real-time cost calculations and validation.
 * 
 * Requirements: 1.1, 1.2, 1.4, 9.4, 10.3, 11.1, 11.4, 15.1, 15.2, 15.3, 15.4, 15.5
 */

interface WarbandEditorProps {
  warbandId?: string;
  onBack?: () => void;
}

const WARBAND_ABILITIES: WarbandAbility[] = [
  'Cyborgs',
  'Fanatics',
  'Living Weapons',
  'Heavily Armed',
  'Mutants',
  'Soldiers',
  'Undead'
];

export function WarbandEditor({ warbandId, onBack }: WarbandEditorProps) {
  const [warband, setWarband] = useState<Warband | null>(null);
  const [selectedWeirdoId, setSelectedWeirdoId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  /**
   * Load existing warband or initialize new one
   * Requirements: 11.1, 12.1, 12.2
   */
  useEffect(() => {
    const initializeWarband = async () => {
      if (warbandId) {
        // Load existing warband
        setLoading(true);
        try {
          const loadedWarband = await apiClient.getWarband(warbandId);
          setWarband(loadedWarband);
        } catch (err) {
          if (err instanceof ApiError) {
            setError(`Failed to load warband: ${err.message}`);
          } else {
            setError('An unexpected error occurred while loading the warband');
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Initialize new warband with default values
        // Requirement 1.1, 1.2, 1.4: Name, point limit, and ability required
        setWarband({
          id: '',
          name: '',
          ability: 'Cyborgs',
          pointLimit: 75,
          totalCost: 0,
          weirdos: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    };

    initializeWarband();
  }, [warbandId]);

  /**
   * Handle warband name change
   * Requirements: 1.1, 1.5
   */
  const handleNameChange = (name: string) => {
    if (warband) {
      setWarband({ ...warband, name });
      setSaveSuccess(false);
    }
  };

  /**
   * Handle warband ability change and trigger cost recalculation
   * Requirements: 1.4, 15.1, 15.2
   */
  const handleAbilityChange = async (ability: WarbandAbility) => {
    if (!warband) return;

    setWarband({ ...warband, ability });
    setSaveSuccess(false);

    // Recalculate costs for all weirdos with new ability
    if (warband.id && warband.weirdos.length > 0) {
      try {
        const updatedWarband = await apiClient.updateWarband(warband.id, { ability });
        setWarband(updatedWarband);
      } catch (err) {
        console.error('Failed to recalculate costs:', err);
      }
    }
  };

  /**
   * Handle point limit change
   * Requirements: 1.2
   */
  const handlePointLimitChange = (pointLimit: 75 | 125) => {
    if (warband) {
      setWarband({ ...warband, pointLimit });
      setSaveSuccess(false);
    }
  };

  /**
   * Handle adding a new weirdo (leader or trooper)
   * Requirements: 2.1, 7.1, 9.4, 10.3
   */
  const handleAddWeirdo = async (type: 'leader' | 'trooper') => {
    if (!warband) return;

    // Check if warband already has a leader
    const hasLeader = warband.weirdos.some(w => w.type === 'leader');
    if (type === 'leader' && hasLeader) {
      setError('Warband already has a leader');
      return;
    }

    // Create new weirdo with default values
    const newWeirdo: Weirdo = {
      id: `temp-${Date.now()}`,
      name: type === 'leader' ? 'New Leader' : 'New Trooper',
      type,
      attributes: {
        speed: 1,
        defense: '2d6',
        firepower: 'None',
        prowess: '2d6',
        willpower: '2d6'
      },
      closeCombatWeapons: [],
      rangedWeapons: [],
      equipment: [],
      psychicPowers: [],
      leaderTrait: null,
      notes: '',
      totalCost: 0
    };

    // If warband is saved, add via API
    if (warband.id) {
      try {
        const updatedWarband = await apiClient.addWeirdo(warband.id, newWeirdo);
        setWarband(updatedWarband);
        setSelectedWeirdoId(updatedWarband.weirdos[updatedWarband.weirdos.length - 1].id);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`Failed to add weirdo: ${err.message}`);
        }
      }
    } else {
      // For unsaved warband, add locally
      setWarband({
        ...warband,
        weirdos: [...warband.weirdos, newWeirdo]
      });
      setSelectedWeirdoId(newWeirdo.id);
    }

    setSaveSuccess(false);
  };

  /**
   * Handle removing a weirdo
   * Requirements: 15.1, 15.2
   */
  const handleRemoveWeirdo = async (weirdoId: string) => {
    if (!warband) return;

    const weirdoToRemove = warband.weirdos.find(w => w.id === weirdoId);
    if (!weirdoToRemove) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${weirdoToRemove.name}?`
    );

    if (!confirmed) return;

    // If warband is saved, remove via API
    if (warband.id) {
      try {
        const updatedWarband = await apiClient.removeWeirdo(warband.id, weirdoId);
        setWarband(updatedWarband);
        if (selectedWeirdoId === weirdoId) {
          setSelectedWeirdoId(null);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`Failed to remove weirdo: ${err.message}`);
        }
      }
    } else {
      // For unsaved warband, remove locally
      setWarband({
        ...warband,
        weirdos: warband.weirdos.filter(w => w.id !== weirdoId)
      });
      if (selectedWeirdoId === weirdoId) {
        setSelectedWeirdoId(null);
      }
    }

    setSaveSuccess(false);
  };

  /**
   * Handle saving the warband
   * Requirements: 11.1, 11.4, 15.1, 15.2
   */
  const handleSaveWarband = async () => {
    if (!warband) return;

    // Validate warband name
    if (!warband.name.trim()) {
      setError('Warband name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Validate warband
      const validation = await apiClient.validate({ warband });
      setValidationErrors(validation.errors);

      if (!validation.valid) {
        setError('Please fix validation errors before saving');
        setLoading(false);
        return;
      }

      // Save or update warband
      let savedWarband: Warband;
      if (warband.id) {
        savedWarband = await apiClient.updateWarband(warband.id, warband);
      } else {
        savedWarband = await apiClient.createWarband({
          name: warband.name,
          pointLimit: warband.pointLimit,
          ability: warband.ability
        });
      }

      setWarband(savedWarband);
      setSaveSuccess(true);
      setValidationErrors([]);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to save warband: ${err.message}`);
      } else {
        setError('An unexpected error occurred while saving');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate total cost of all weirdos
   * Requirements: 10.1, 15.2, 15.3
   */
  const calculateTotalCost = (): number => {
    if (!warband) return 0;
    return warband.weirdos.reduce((sum, weirdo) => sum + weirdo.totalCost, 0);
  };

  /**
   * Update warband total cost whenever weirdos change
   * Requirements: 15.1, 15.2
   */
  useEffect(() => {
    if (warband) {
      const newTotalCost = calculateTotalCost();
      if (warband.totalCost !== newTotalCost) {
        setWarband({ ...warband, totalCost: newTotalCost });
      }
    }
  }, [warband?.weirdos]);

  /**
   * Check if warband is approaching point limit
   * Requirements: 15.4, 15.5
   */
  const isApproachingLimit = (): boolean => {
    if (!warband) return false;
    const totalCost = calculateTotalCost();
    const threshold = warband.pointLimit * 0.9; // 90% threshold
    return totalCost >= threshold && totalCost <= warband.pointLimit;
  };

  /**
   * Check if warband exceeds point limit
   * Requirements: 10.3
   */
  const exceedsLimit = (): boolean => {
    if (!warband) return false;
    return calculateTotalCost() > warband.pointLimit;
  };

  if (loading && !warband) {
    return (
      <div className="warband-editor">
        <div className="loading" role="status" aria-live="polite">
          <div className="spinner spinner-large" aria-hidden="true"></div>
          <span>Loading warband...</span>
        </div>
      </div>
    );
  }

  if (!warband) {
    return (
      <div className="warband-editor">
        <div className="error" role="alert" aria-live="assertive">
          Failed to initialize warband
        </div>
      </div>
    );
  }

  const totalCost = calculateTotalCost();
  const approaching = isApproachingLimit();
  const exceeds = exceedsLimit();

  return (
    <div className="warband-editor">
      <div className="editor-header">
        <h1>{warband.id ? 'Edit Warband' : 'Create New Warband'}</h1>
        {onBack && (
          <button onClick={onBack} className="back-button">
            ← Back to List
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {saveSuccess && (
        <div className="success-banner">
          Warband saved successfully!
          <button onClick={() => setSaveSuccess(false)}>×</button>
        </div>
      )}

      <div className="warband-properties">
        <h2>Warband Properties</h2>
        
        <div className="form-group">
          <label htmlFor="warband-name">
            Name <span className="required">*</span>
          </label>
          <input
            id="warband-name"
            type="text"
            value={warband.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter warband name"
            className={validationErrors.some(e => e.field === 'name') ? 'error' : ''}
          />
        </div>

        <div className="form-group">
          <label htmlFor="warband-ability">
            Warband Ability <span className="required">*</span>
          </label>
          <select
            id="warband-ability"
            value={warband.ability}
            onChange={(e) => handleAbilityChange(e.target.value as WarbandAbility)}
          >
            {WARBAND_ABILITIES.map(ability => (
              <option key={ability} value={ability}>
                {ability}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="point-limit">
            Point Limit <span className="required">*</span>
          </label>
          <select
            id="point-limit"
            value={warband.pointLimit}
            onChange={(e) => handlePointLimitChange(Number(e.target.value) as 75 | 125)}
          >
            <option value={75}>75 Points</option>
            <option value={125}>125 Points</option>
          </select>
        </div>

        <div 
          className={`cost-display ${approaching && !exceeds ? 'warning' : ''} ${exceeds ? 'error' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="cost-label">Total Cost:</div>
          <div 
            className={`cost-value ${approaching ? 'warning' : ''} ${exceeds ? 'error' : ''}`}
            aria-label={`${totalCost} points used out of ${warband.pointLimit} points limit`}
          >
            {totalCost} / {warband.pointLimit}
          </div>
          {approaching && !exceeds && (
            <div className="cost-warning" role="alert">
              Approaching point limit
            </div>
          )}
          {exceeds && (
            <div className="cost-error" role="alert">
              Exceeds point limit!
            </div>
          )}
        </div>
      </div>

      <div className="weirdos-section">
        <div className="section-header">
          <h2>Weirdos ({warband.weirdos.length})</h2>
          <div className="add-buttons">
            <button
              onClick={() => handleAddWeirdo('leader')}
              disabled={warband.weirdos.some(w => w.type === 'leader')}
              className="add-leader-button"
              aria-label={warband.weirdos.some(w => w.type === 'leader') ? 'Leader already added' : 'Add a leader to your warband'}
            >
              + Add Leader
            </button>
            <button
              onClick={() => handleAddWeirdo('trooper')}
              className="add-trooper-button"
              aria-label="Add a trooper to your warband"
            >
              + Add Trooper
            </button>
          </div>
        </div>

        {warband.weirdos.length === 0 ? (
          <p className="empty-state">No weirdos yet. Add a leader to get started!</p>
        ) : (
          <div className="weirdos-list">
            {warband.weirdos.map(weirdo => (
              <div
                key={weirdo.id}
                className={`weirdo-card ${selectedWeirdoId === weirdo.id ? 'selected' : ''}`}
                onClick={() => setSelectedWeirdoId(weirdo.id)}
              >
                <div className="weirdo-header">
                  <div className="weirdo-info">
                    <h3>{weirdo.name}</h3>
                    <span className={`weirdo-type ${weirdo.type}`}>
                      {weirdo.type === 'leader' ? '👑 Leader' : '⚔ Trooper'}
                    </span>
                  </div>
                  <div className="weirdo-cost">
                    {weirdo.totalCost} pts
                  </div>
                </div>
                <div className="weirdo-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWeirdoId(weirdo.id);
                    }}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWeirdo(weirdo.id);
                    }}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h3>Validation Errors:</h3>
          <ul>
            {validationErrors.map((err, idx) => (
              <li key={idx}>
                <strong>{err.field}:</strong> {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="editor-actions">
        <button
          onClick={handleSaveWarband}
          disabled={loading || !warband.name.trim()}
          className="save-button"
        >
          {loading ? 'Saving...' : warband.id ? 'Save Changes' : 'Create Warband'}
        </button>
        {onBack && (
          <button onClick={onBack} className="cancel-button">
            Cancel
          </button>
        )}
      </div>

      {selectedWeirdoId && (() => {
        const selectedWeirdo = warband.weirdos.find(w => w.id === selectedWeirdoId);
        if (!selectedWeirdo) return null;
        
        return (
          <div className="weirdo-editor-modal">
            <div className="modal-overlay" onClick={() => setSelectedWeirdoId(null)} />
            <div className="modal-content">
              <WeirdoEditor
                weirdo={selectedWeirdo}
                warbandAbility={warband.ability}
                onChange={async (updatedWeirdo) => {
                  // Update weirdo in warband and cascade cost changes
                  // Requirements: 15.1, 15.2
                  if (warband.id) {
                    try {
                      const updatedWarband = await apiClient.updateWeirdo(
                        warband.id,
                        updatedWeirdo.id,
                        updatedWeirdo
                      );
                      // Backend returns warband with recalculated total cost
                      setWarband(updatedWarband);
                    } catch (err) {
                      console.error('Failed to update weirdo:', err);
                    }
                  } else {
                    // For unsaved warband, update locally and recalculate total
                    const updatedWeirdos = warband.weirdos.map(w =>
                      w.id === updatedWeirdo.id ? updatedWeirdo : w
                    );
                    const newTotalCost = updatedWeirdos.reduce((sum, w) => sum + w.totalCost, 0);
                    setWarband({
                      ...warband,
                      weirdos: updatedWeirdos,
                      totalCost: newTotalCost
                    });
                  }
                }}
                onClose={() => setSelectedWeirdoId(null)}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

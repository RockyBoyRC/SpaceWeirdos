import { useState, useEffect } from 'react';
import {
  Weirdo,
  WarbandAbility,
  Attributes,
  Weapon,
  Equipment,
  PsychicPower,
  LeaderTrait,
  ValidationError,
  SpeedLevel,
  DiceLevel,
  FirepowerLevel
} from '../../backend/models/types';
import { apiClient } from '../services/apiClient';
import './WeirdoEditor.css';

/**
 * WeirdoEditorComponent
 * 
 * Handles creation and editing of individual weirdos (leader or trooper).
 * Provides real-time cost calculations and validation.
 * 
 * Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 4.2, 4.4, 5.1, 6.1, 6.2, 6.3, 7.1-7.7, 9.4, 15.1, 15.2, 15.3, 15.4
 */

interface WeirdoEditorProps {
  weirdo: Weirdo;
  warbandAbility: WarbandAbility;
  onChange: (weirdo: Weirdo) => void;
  onClose?: () => void;
}

// Load game data
const SPEED_LEVELS: SpeedLevel[] = [1, 2, 3];
const DICE_LEVELS: DiceLevel[] = ['2d6', '2d8', '2d10'];
const FIREPOWER_LEVELS: FirepowerLevel[] = ['None', '2d8', '2d10'];
const LEADER_TRAITS: LeaderTrait[] = [
  'Bounty Hunter',
  'Healer',
  'Majestic',
  'Monstrous',
  'Political Officer',
  'Sorcerer',
  'Tactician'
];

export function WeirdoEditor({ weirdo, warbandAbility, onChange, onClose }: WeirdoEditorProps) {
  const [localWeirdo, setLocalWeirdo] = useState<Weirdo>(weirdo);
  const [pointCost, setPointCost] = useState<number>(weirdo.totalCost);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [availableCloseCombatWeapons, setAvailableCloseCombatWeapons] = useState<Weapon[]>([]);
  const [availableRangedWeapons, setAvailableRangedWeapons] = useState<Weapon[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [availablePsychicPowers, setAvailablePsychicPowers] = useState<PsychicPower[]>([]);
  const [leaderTraitDescriptions, setLeaderTraitDescriptions] = useState<Record<string, string>>({});

  /**
   * Load game data on mount
   */
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const [ccWeapons, rWeapons, equipment, powers, traits] = await Promise.all([
          fetch('/data/closeCombatWeapons.json').then(r => r.json()),
          fetch('/data/rangedWeapons.json').then(r => r.json()),
          fetch('/data/equipment.json').then(r => r.json()),
          fetch('/data/psychicPowers.json').then(r => r.json()),
          fetch('/data/leaderTraits.json').then(r => r.json())
        ]);

        setAvailableCloseCombatWeapons(ccWeapons);
        setAvailableRangedWeapons(rWeapons);
        setAvailableEquipment(equipment);
        setAvailablePsychicPowers(powers);

        // Build leader trait descriptions map
        const traitMap: Record<string, string> = {};
        traits.forEach((trait: any) => {
          traitMap[trait.name] = trait.description;
        });
        setLeaderTraitDescriptions(traitMap);
      } catch (error) {
        console.error('Failed to load game data:', error);
      }
    };

    loadGameData();
  }, []);

  /**
   * Sync local weirdo with prop changes
   */
  useEffect(() => {
    setLocalWeirdo(weirdo);
    setPointCost(weirdo.totalCost);
  }, [weirdo]);

  /**
   * Recalculate cost when weirdo changes
   * Requirements: 15.1, 15.2
   */
  const recalculateCost = async (updatedWeirdo: Weirdo) => {
    try {
      const result = await apiClient.calculateCost({
        weirdo: updatedWeirdo,
        warbandAbility
      });
      setPointCost(result.cost);
      
      // Update weirdo with new cost
      const weirdoWithCost = { ...updatedWeirdo, totalCost: result.cost };
      setLocalWeirdo(weirdoWithCost);
      onChange(weirdoWithCost);

      // Validate weirdo
      const validation = await apiClient.validate({ weirdo: weirdoWithCost });
      setValidationErrors(validation.errors);
    } catch (error) {
      console.error('Failed to recalculate cost:', error);
    }
  };

  /**
   * Handle attribute change
   * Requirements: 2.1, 2.2, 7.2, 15.1
   */
  const handleAttributeChange = (attribute: keyof Attributes, level: SpeedLevel | DiceLevel | FirepowerLevel) => {
    const updatedWeirdo = {
      ...localWeirdo,
      attributes: {
        ...localWeirdo.attributes,
        [attribute]: level
      }
    };
    recalculateCost(updatedWeirdo);
  };

  /**
   * Handle adding a weapon
   * Requirements: 3.1, 3.2, 3.3, 7.3, 7.4, 15.1
   */
  const handleAddWeapon = (weapon: Weapon, weaponType: 'close' | 'ranged') => {
    const updatedWeirdo = { ...localWeirdo };
    
    if (weaponType === 'close') {
      updatedWeirdo.closeCombatWeapons = [...updatedWeirdo.closeCombatWeapons, weapon];
    } else {
      updatedWeirdo.rangedWeapons = [...updatedWeirdo.rangedWeapons, weapon];
    }
    
    recalculateCost(updatedWeirdo);
  };

  /**
   * Handle removing a weapon
   * Requirements: 15.1
   */
  const handleRemoveWeapon = (weaponId: string, weaponType: 'close' | 'ranged') => {
    const updatedWeirdo = { ...localWeirdo };
    
    if (weaponType === 'close') {
      updatedWeirdo.closeCombatWeapons = updatedWeirdo.closeCombatWeapons.filter(w => w.id !== weaponId);
    } else {
      updatedWeirdo.rangedWeapons = updatedWeirdo.rangedWeapons.filter(w => w.id !== weaponId);
    }
    
    recalculateCost(updatedWeirdo);
  };

  /**
   * Handle adding equipment
   * Requirements: 4.1, 4.2, 4.4, 7.5, 7.6, 15.1
   */
  const handleAddEquipment = (equipment: Equipment) => {
    // Check equipment limit
    const maxEquipment = getMaxEquipment();
    if (localWeirdo.equipment.length >= maxEquipment) {
      return; // Silently reject if at limit
    }

    const updatedWeirdo = {
      ...localWeirdo,
      equipment: [...localWeirdo.equipment, equipment]
    };
    
    recalculateCost(updatedWeirdo);
  };

  /**
   * Handle removing equipment
   * Requirements: 15.1
   */
  const handleRemoveEquipment = (equipmentId: string) => {
    const updatedWeirdo = {
      ...localWeirdo,
      equipment: localWeirdo.equipment.filter(e => e.id !== equipmentId)
    };
    
    recalculateCost(updatedWeirdo);
  };

  /**
   * Handle adding psychic power
   * Requirements: 5.1, 5.2, 5.3, 7.7, 15.1
   */
  const handleAddPsychicPower = (power: PsychicPower) => {
    const updatedWeirdo = {
      ...localWeirdo,
      psychicPowers: [...localWeirdo.psychicPowers, power]
    };
    
    recalculateCost(updatedWeirdo);
  };

  /**
   * Handle removing psychic power
   * Requirements: 15.1
   */
  const handleRemovePsychicPower = (powerId: string) => {
    const updatedWeirdo = {
      ...localWeirdo,
      psychicPowers: localWeirdo.psychicPowers.filter(p => p.id !== powerId)
    };
    
    recalculateCost(updatedWeirdo);
  };

  /**
   * Handle leader trait change
   * Requirements: 6.1, 6.2, 6.3
   */
  const handleLeaderTraitChange = (trait: LeaderTrait | null) => {
    if (localWeirdo.type !== 'leader') {
      return; // Only leaders can have traits
    }

    const updatedWeirdo = {
      ...localWeirdo,
      leaderTrait: trait
    };
    
    setLocalWeirdo(updatedWeirdo);
    onChange(updatedWeirdo);
  };

  /**
   * Handle name change
   * Requirements: 2.1, 7.1
   */
  const handleNameChange = (name: string) => {
    const updatedWeirdo = {
      ...localWeirdo,
      name
    };
    
    setLocalWeirdo(updatedWeirdo);
    onChange(updatedWeirdo);
  };

  /**
   * Handle notes change
   */
  const handleNotesChange = (notes: string) => {
    const updatedWeirdo = {
      ...localWeirdo,
      notes
    };
    
    setLocalWeirdo(updatedWeirdo);
    onChange(updatedWeirdo);
  };

  /**
   * Get maximum equipment allowed
   * Requirements: 4.1, 4.2, 4.4, 7.5, 7.6
   */
  const getMaxEquipment = (): number => {
    if (localWeirdo.type === 'leader') {
      return warbandAbility === 'Cyborgs' ? 3 : 2;
    } else {
      return warbandAbility === 'Cyborgs' ? 2 : 1;
    }
  };

  /**
   * Check if weirdo is approaching point limit
   * Requirements: 15.4
   */
  const isApproachingLimit = (): boolean => {
    const limit = localWeirdo.type === 'trooper' ? 20 : 25;
    const threshold = limit * 0.9; // 90% threshold
    return pointCost >= threshold && pointCost <= limit;
  };

  /**
   * Check if weirdo exceeds point limit
   * Requirements: 9.4
   */
  const exceedsLimit = (): boolean => {
    const limit = localWeirdo.type === 'trooper' ? 20 : 25;
    return pointCost > limit;
  };

  const maxEquipment = getMaxEquipment();
  const approaching = isApproachingLimit();
  const exceeds = exceedsLimit();

  return (
    <div className="weirdo-editor">
      <div className="editor-header">
        <h2>
          {localWeirdo.type === 'leader' ? '👑 ' : '⚔ '}
          Edit {localWeirdo.type === 'leader' ? 'Leader' : 'Trooper'}
        </h2>
        {onClose && (
          <button onClick={onClose} className="close-button">
            ×
          </button>
        )}
      </div>

      <div className="cost-display">
        <div className="cost-label">Point Cost:</div>
        <div className={`cost-value ${approaching ? 'warning' : ''} ${exceeds ? 'error' : ''}`}>
          {pointCost} pts
        </div>
        {approaching && !exceeds && (
          <div className="cost-warning">⚠ Approaching limit</div>
        )}
        {exceeds && (
          <div className="cost-error">✗ Exceeds {localWeirdo.type === 'trooper' ? '20' : '25'} point limit!</div>
        )}
      </div>

      {/* Name */}
      <div className="form-section">
        <h3>Basic Info</h3>
        <div className="form-group">
          <label htmlFor="weirdo-name">
            Name <span className="required">*</span>
          </label>
          <input
            id="weirdo-name"
            type="text"
            value={localWeirdo.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter weirdo name"
            className={validationErrors.some(e => e.field === 'name') ? 'error' : ''}
          />
        </div>
      </div>

      {/* Attributes */}
      <div className="form-section">
        <h3>Attributes</h3>
        
        <div className="form-group">
          <label htmlFor="attr-speed">Speed</label>
          <select
            id="attr-speed"
            value={localWeirdo.attributes.speed}
            onChange={(e) => handleAttributeChange('speed', Number(e.target.value) as SpeedLevel)}
          >
            {SPEED_LEVELS.map(level => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="attr-defense">Defense</label>
          <select
            id="attr-defense"
            value={localWeirdo.attributes.defense}
            onChange={(e) => handleAttributeChange('defense', e.target.value as DiceLevel)}
          >
            {DICE_LEVELS.map(level => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="attr-firepower">Firepower</label>
          <select
            id="attr-firepower"
            value={localWeirdo.attributes.firepower}
            onChange={(e) => handleAttributeChange('firepower', e.target.value as FirepowerLevel)}
          >
            {FIREPOWER_LEVELS.map(level => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="attr-prowess">Prowess</label>
          <select
            id="attr-prowess"
            value={localWeirdo.attributes.prowess}
            onChange={(e) => handleAttributeChange('prowess', e.target.value as DiceLevel)}
          >
            {DICE_LEVELS.map(level => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="attr-willpower">Willpower</label>
          <select
            id="attr-willpower"
            value={localWeirdo.attributes.willpower}
            onChange={(e) => handleAttributeChange('willpower', e.target.value as DiceLevel)}
          >
            {DICE_LEVELS.map(level => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Close Combat Weapons */}
      <div className="form-section">
        <h3>Close Combat Weapons</h3>
        
        {localWeirdo.closeCombatWeapons.length > 0 ? (
          <ul className="item-list">
            {localWeirdo.closeCombatWeapons.map((weapon, index) => (
              <li key={`${weapon.id}-${index}`} className="item">
                <span className="item-name">{weapon.name}</span>
                <span className="item-cost">{weapon.baseCost} pts</span>
                <button
                  onClick={() => handleRemoveWeapon(weapon.id, 'close')}
                  className="remove-item-button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No close combat weapons selected</p>
        )}

        <div className="form-group">
          <label htmlFor="add-cc-weapon">Add Weapon</label>
          <select
            id="add-cc-weapon"
            onChange={(e) => {
              const weapon = availableCloseCombatWeapons.find(w => w.id === e.target.value);
              if (weapon) {
                handleAddWeapon(weapon, 'close');
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>Select a weapon...</option>
            {availableCloseCombatWeapons.map(weapon => (
              <option key={weapon.id} value={weapon.id}>
                {weapon.name} ({weapon.baseCost} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ranged Weapons */}
      <div className="form-section">
        <h3>Ranged Weapons</h3>
        
        {localWeirdo.rangedWeapons.length > 0 ? (
          <ul className="item-list">
            {localWeirdo.rangedWeapons.map((weapon, index) => (
              <li key={`${weapon.id}-${index}`} className="item">
                <span className="item-name">{weapon.name}</span>
                <span className="item-cost">{weapon.baseCost} pts</span>
                <button
                  onClick={() => handleRemoveWeapon(weapon.id, 'ranged')}
                  className="remove-item-button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No ranged weapons selected</p>
        )}

        <div className="form-group">
          <label htmlFor="add-ranged-weapon">Add Weapon</label>
          <select
            id="add-ranged-weapon"
            onChange={(e) => {
              const weapon = availableRangedWeapons.find(w => w.id === e.target.value);
              if (weapon) {
                handleAddWeapon(weapon, 'ranged');
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>Select a weapon...</option>
            {availableRangedWeapons.map(weapon => (
              <option key={weapon.id} value={weapon.id}>
                {weapon.name} ({weapon.baseCost} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment */}
      <div className="form-section">
        <h3>Equipment (Max: {maxEquipment})</h3>
        
        {localWeirdo.equipment.length > 0 ? (
          <ul className="item-list">
            {localWeirdo.equipment.map((equip, index) => (
              <li key={`${equip.id}-${index}`} className="item">
                <span className="item-name">{equip.name}</span>
                <span className="item-cost">{equip.baseCost} pts</span>
                <button
                  onClick={() => handleRemoveEquipment(equip.id)}
                  className="remove-item-button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No equipment selected</p>
        )}

        <div className="form-group">
          <label htmlFor="add-equipment">Add Equipment</label>
          <select
            id="add-equipment"
            onChange={(e) => {
              const equip = availableEquipment.find(eq => eq.id === e.target.value);
              if (equip) {
                handleAddEquipment(equip);
                e.target.value = '';
              }
            }}
            defaultValue=""
            disabled={localWeirdo.equipment.length >= maxEquipment}
          >
            <option value="" disabled>
              {localWeirdo.equipment.length >= maxEquipment 
                ? 'Equipment limit reached' 
                : 'Select equipment...'}
            </option>
            {availableEquipment.map(equip => (
              <option key={equip.id} value={equip.id}>
                {equip.name} ({equip.baseCost} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Psychic Powers */}
      <div className="form-section">
        <h3>Psychic Powers</h3>
        
        {localWeirdo.psychicPowers.length > 0 ? (
          <ul className="item-list">
            {localWeirdo.psychicPowers.map((power, index) => (
              <li key={`${power.id}-${index}`} className="item">
                <span className="item-name">{power.name}</span>
                <span className="item-cost">{power.cost} pts</span>
                <button
                  onClick={() => handleRemovePsychicPower(power.id)}
                  className="remove-item-button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No psychic powers selected</p>
        )}

        <div className="form-group">
          <label htmlFor="add-psychic-power">Add Psychic Power</label>
          <select
            id="add-psychic-power"
            onChange={(e) => {
              const power = availablePsychicPowers.find(p => p.id === e.target.value);
              if (power) {
                handleAddPsychicPower(power);
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>Select a power...</option>
            {availablePsychicPowers.map(power => (
              <option key={power.id} value={power.id}>
                {power.name} ({power.cost} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leader Trait (only for leaders) */}
      {localWeirdo.type === 'leader' && (
        <div className="form-section">
          <h3>Leader Trait (Optional)</h3>
          
          <div className="form-group">
            <label htmlFor="leader-trait">Trait</label>
            <select
              id="leader-trait"
              value={localWeirdo.leaderTrait || ''}
              onChange={(e) => handleLeaderTraitChange(e.target.value ? e.target.value as LeaderTrait : null)}
            >
              <option value="">None</option>
              {LEADER_TRAITS.map(trait => (
                <option key={trait} value={trait}>
                  {trait}
                </option>
              ))}
            </select>
          </div>

          {localWeirdo.leaderTrait && leaderTraitDescriptions[localWeirdo.leaderTrait] && (
            <p className="trait-description">
              {leaderTraitDescriptions[localWeirdo.leaderTrait]}
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="form-section">
        <h3>Notes</h3>
        <div className="form-group">
          <label htmlFor="weirdo-notes">Notes (Optional)</label>
          <textarea
            id="weirdo-notes"
            value={localWeirdo.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes about this weirdo..."
            rows={3}
          />
        </div>
      </div>

      {/* Validation Errors */}
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
    </div>
  );
}

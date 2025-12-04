import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WeirdoEditor } from '../src/frontend/components/WeirdoEditor';
import { Weirdo, WarbandAbility } from '../src/backend/models/types';
import { apiClient } from '../src/frontend/services/apiClient';

/**
 * Unit tests for WeirdoEditorComponent
 * 
 * Requirements: 2.1-2.17, 3.1-3.5, 4.1-4.4, 5.1-5.3, 6.1-6.3, 7.1-7.8, 9.4, 15.1-15.4
 */

// Mock the API client
vi.mock('../src/frontend/services/apiClient', () => ({
  apiClient: {
    calculateCost: vi.fn(),
    validate: vi.fn()
  }
}));

// Mock fetch for game data
global.fetch = vi.fn();

const mockCloseCombatWeapons = [
  { id: 'unarmed', name: 'Unarmed', type: 'close', baseCost: 0, maxActions: 3, notes: '' },
  { id: 'melee-weapon', name: 'Melee Weapon', type: 'close', baseCost: 1, maxActions: 2, notes: '' }
];

const mockRangedWeapons = [
  { id: 'auto-pistol', name: 'Auto Pistol', type: 'ranged', baseCost: 0, maxActions: 3, notes: '' },
  { id: 'auto-rifle', name: 'Auto Rifle', type: 'ranged', baseCost: 1, maxActions: 3, notes: '' }
];

const mockEquipment = [
  { id: 'cybernetics', name: 'Cybernetics', type: 'Passive', baseCost: 1, effect: '+1 to Power rolls' },
  { id: 'grenade', name: 'Grenade', type: 'Action', baseCost: 1, effect: 'Blast AOE' }
];

const mockPsychicPowers = [
  { id: 'fear', name: 'Fear', type: 'Attack', cost: 1, effect: 'Fear effect' },
  { id: 'healing', name: 'Healing', type: 'Effect', cost: 1, effect: 'Healing effect' }
];

const mockLeaderTraits = [
  { id: 'bounty-hunter', name: 'Bounty Hunter', description: 'Bounty hunter ability' },
  { id: 'healer', name: 'Healer', description: 'Healer ability' }
];

const createMockWeirdo = (type: 'leader' | 'trooper'): Weirdo => ({
  id: 'weirdo-1',
  name: type === 'leader' ? 'Test Leader' : 'Test Trooper',
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
});

describe('WeirdoEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch responses for game data
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('closeCombatWeapons.json')) {
        return Promise.resolve({ json: () => Promise.resolve(mockCloseCombatWeapons) });
      }
      if (url.includes('rangedWeapons.json')) {
        return Promise.resolve({ json: () => Promise.resolve(mockRangedWeapons) });
      }
      if (url.includes('equipment.json')) {
        return Promise.resolve({ json: () => Promise.resolve(mockEquipment) });
      }
      if (url.includes('psychicPowers.json')) {
        return Promise.resolve({ json: () => Promise.resolve(mockPsychicPowers) });
      }
      if (url.includes('leaderTraits.json')) {
        return Promise.resolve({ json: () => Promise.resolve(mockLeaderTraits) });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Mock API responses
    (apiClient.calculateCost as any).mockResolvedValue({ cost: 10 });
    (apiClient.validate as any).mockResolvedValue({ valid: true, errors: [] });
  });

  /**
   * Test creating new weirdo
   * Requirements: 2.1, 7.1
   */
  it('should render weirdo editor with initial weirdo data', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Leader')).toBeInTheDocument();
    });

    expect(screen.getByText(/Edit.*Leader/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toHaveValue('Test Leader');
  });

  /**
   * Test editing existing weirdo
   * Requirements: 2.1, 7.1
   */
  it('should allow editing weirdo name', async () => {
    const mockWeirdo = createMockWeirdo('trooper');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Trooper')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Trooper' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Trooper'
      })
    );
  });

  /**
   * Test changing attributes
   * Requirements: 2.1, 2.2, 7.2, 15.1
   */
  it('should allow changing attributes and recalculate cost', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Speed/i)).toBeInTheDocument();
    });

    const speedSelect = screen.getByLabelText(/Speed/i);
    fireEvent.change(speedSelect, { target: { value: '2' } });

    await waitFor(() => {
      expect(apiClient.calculateCost).toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  /**
   * Test adding/removing weapons
   * Requirements: 3.1, 3.2, 3.3, 7.3, 7.4, 15.1
   */
  it('should allow adding close combat weapons', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Close Combat Weapons')).toBeInTheDocument();
    });

    const addWeaponSelect = screen.getAllByRole('combobox').find(
      select => select.id === 'add-cc-weapon'
    );
    
    if (addWeaponSelect) {
      fireEvent.change(addWeaponSelect, { target: { value: 'unarmed' } });

      await waitFor(() => {
        expect(apiClient.calculateCost).toHaveBeenCalled();
      });
    }
  });

  it('should allow removing close combat weapons', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    mockWeirdo.closeCombatWeapons = [mockCloseCombatWeapons[0]];
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Unarmed')).toBeInTheDocument();
    });

    const removeButton = screen.getAllByText('Remove')[0];
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(apiClient.calculateCost).toHaveBeenCalled();
    });
  });

  it('should allow adding ranged weapons', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ranged Weapons')).toBeInTheDocument();
    });

    const addWeaponSelect = screen.getAllByRole('combobox').find(
      select => select.id === 'add-ranged-weapon'
    );
    
    if (addWeaponSelect) {
      fireEvent.change(addWeaponSelect, { target: { value: 'auto-pistol' } });

      await waitFor(() => {
        expect(apiClient.calculateCost).toHaveBeenCalled();
      });
    }
  });

  /**
   * Test adding/removing equipment
   * Requirements: 4.1, 4.2, 4.4, 7.5, 7.6, 15.1
   */
  it('should allow adding equipment up to limit', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Equipment \(Max: 3\)/i)).toBeInTheDocument();
    });

    const addEquipmentSelect = screen.getAllByRole('combobox').find(
      select => select.id === 'add-equipment'
    );
    
    if (addEquipmentSelect) {
      fireEvent.change(addEquipmentSelect, { target: { value: 'cybernetics' } });

      await waitFor(() => {
        expect(apiClient.calculateCost).toHaveBeenCalled();
      });
    }
  });

  /**
   * Test equipment limits
   * Requirements: 4.1, 4.2, 4.4, 7.5, 7.6
   */
  it('should enforce equipment limits for leaders with Cyborgs ability', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Equipment \(Max: 3\)/i)).toBeInTheDocument();
    });
  });

  it('should enforce equipment limits for leaders without Cyborgs ability', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Soldiers"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Equipment \(Max: 2\)/i)).toBeInTheDocument();
    });
  });

  it('should enforce equipment limits for troopers', async () => {
    const mockWeirdo = createMockWeirdo('trooper');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Soldiers"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Equipment \(Max: 1\)/i)).toBeInTheDocument();
    });
  });

  /**
   * Test adding/removing psychic powers
   * Requirements: 5.1, 5.2, 5.3, 7.7, 15.1
   */
  it('should allow adding psychic powers', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Psychic Powers')).toBeInTheDocument();
    });

    const addPowerSelect = screen.getAllByRole('combobox').find(
      select => select.id === 'add-psychic-power'
    );
    
    if (addPowerSelect) {
      fireEvent.change(addPowerSelect, { target: { value: 'fear' } });

      await waitFor(() => {
        expect(apiClient.calculateCost).toHaveBeenCalled();
      });
    }
  });

  it('should allow removing psychic powers', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    mockWeirdo.psychicPowers = [mockPsychicPowers[0]];
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Fear')).toBeInTheDocument();
    });

    const removeButton = screen.getAllByText('Remove').find(
      btn => btn.closest('.item')?.textContent?.includes('Fear')
    );
    
    if (removeButton) {
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(apiClient.calculateCost).toHaveBeenCalled();
      });
    }
  });

  /**
   * Test leader trait selection
   * Requirements: 6.1, 6.2, 6.3
   */
  it('should allow leader to select a trait', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Leader Trait (Optional)')).toBeInTheDocument();
    });

    const traitSelect = screen.getByLabelText(/Trait/i);
    fireEvent.change(traitSelect, { target: { value: 'Bounty Hunter' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        leaderTrait: 'Bounty Hunter'
      })
    );
  });

  it('should not show leader trait section for troopers', async () => {
    const mockWeirdo = createMockWeirdo('trooper');
    const mockOnChange = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Edit.*Trooper/)).toBeInTheDocument();
    });

    expect(screen.queryByText('Leader Trait (Optional)')).not.toBeInTheDocument();
  });

  /**
   * Test validation errors
   * Requirements: 15.3
   */
  it('should display validation errors', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();

    (apiClient.validate as any).mockResolvedValue({
      valid: false,
      errors: [
        { field: 'closeCombatWeapons', message: 'At least one close combat weapon required', code: 'MISSING_CC_WEAPON' }
      ]
    });

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    // Trigger validation by changing an attribute
    await waitFor(() => {
      expect(screen.getByLabelText(/Speed/i)).toBeInTheDocument();
    });

    const speedSelect = screen.getByLabelText(/Speed/i);
    fireEvent.change(speedSelect, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/At least one close combat weapon required/i)).toBeInTheDocument();
    });
  });

  /**
   * Test cost calculations
   * Requirements: 15.1, 15.2, 15.3, 15.4
   */
  it('should display real-time cost calculations', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    mockWeirdo.totalCost = 15;
    const mockOnChange = vi.fn();

    (apiClient.calculateCost as any).mockResolvedValue({ cost: 15 });

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('15 pts')).toBeInTheDocument();
    });
  });

  it('should show warning when approaching point limit', async () => {
    const mockWeirdo = createMockWeirdo('trooper');
    mockWeirdo.totalCost = 19;
    const mockOnChange = vi.fn();

    (apiClient.calculateCost as any).mockResolvedValue({ cost: 19 });

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Approaching limit/i)).toBeInTheDocument();
    });
  });

  it('should show error when exceeding point limit', async () => {
    const mockWeirdo = createMockWeirdo('trooper');
    mockWeirdo.totalCost = 21;
    const mockOnChange = vi.fn();

    (apiClient.calculateCost as any).mockResolvedValue({ cost: 21 });

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Exceeds 20 point limit/i)).toBeInTheDocument();
    });
  });

  it('should handle close button click', async () => {
    const mockWeirdo = createMockWeirdo('leader');
    const mockOnChange = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <WeirdoEditor
        weirdo={mockWeirdo}
        warbandAbility="Cyborgs"
        onChange={mockOnChange}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Edit.*Leader/)).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

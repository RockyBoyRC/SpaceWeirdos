import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { WarbandEditor } from '../src/frontend/components/WarbandEditor';
import { apiClient } from '../src/frontend/services/apiClient';
import type { Warband, Weirdo, ValidationResult } from '../src/backend/models/types';

// Mock the API client
vi.mock('../src/frontend/services/apiClient', () => ({
  apiClient: {
    getWarband: vi.fn(),
    createWarband: vi.fn(),
    updateWarband: vi.fn(),
    addWeirdo: vi.fn(),
    removeWeirdo: vi.fn(),
    validate: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public statusCode?: number, public details?: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.window.confirm = mockConfirm;

describe('WarbandEditor Component', () => {
  const mockLeader: Weirdo = {
    id: 'w1',
    name: 'Leader',
    type: 'leader',
    attributes: {
      speed: 2,
      defense: '2d8',
      firepower: '2d8',
      prowess: '2d8',
      willpower: '2d8',
    },
    closeCombatWeapons: [],
    rangedWeapons: [],
    equipment: [],
    psychicPowers: [],
    leaderTrait: null,
    notes: '',
    totalCost: 20,
  };

  const mockTrooper: Weirdo = {
    id: 'w2',
    name: 'Trooper',
    type: 'trooper',
    attributes: {
      speed: 1,
      defense: '2d6',
      firepower: 'None',
      prowess: '2d6',
      willpower: '2d6',
    },
    closeCombatWeapons: [],
    rangedWeapons: [],
    equipment: [],
    psychicPowers: [],
    leaderTrait: null,
    notes: '',
    totalCost: 10,
  };

  const mockWarband: Warband = {
    id: '1',
    name: 'Test Warband',
    ability: 'Cyborgs',
    pointLimit: 75,
    totalCost: 30,
    weirdos: [mockLeader, mockTrooper],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockValidationSuccess: ValidationResult = {
    valid: true,
    errors: [],
  };

  const mockValidationError: ValidationResult = {
    valid: false,
    errors: [
      {
        field: 'name',
        message: 'Warband name is required',
        code: 'REQUIRED_FIELD',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockClear();
  });

  describe('Creating new warband', () => {
    it('should initialize with default values for new warband', async () => {
      // Requirement 1.1, 1.2, 1.4: Initialize with defaults
      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      const abilitySelect = screen.getByLabelText(/Warband Ability/i) as HTMLSelectElement;
      const pointLimitSelect = screen.getByLabelText(/Point Limit/i) as HTMLSelectElement;

      expect(nameInput.value).toBe('');
      expect(abilitySelect.value).toBe('Cyborgs');
      expect(pointLimitSelect.value).toBe('75');
    });

    it('should display total cost as 0 for new warband', async () => {
      // Requirement 1.3: Initialize with zero cost
      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText(/0 \/ 75/)).toBeInTheDocument();
      });
    });

    it('should display empty weirdos list', async () => {
      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText(/No weirdos yet/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading existing warband', () => {
    it('should load warband data when warbandId is provided', async () => {
      // Requirement 11.1, 12.1, 12.2: Load existing warband
      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(mockWarband);

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(apiClient.getWarband).toHaveBeenCalledWith('1');
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Warband')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Test Warband');
    });

    it('should display loading state while fetching warband', () => {
      vi.mocked(apiClient.getWarband).mockImplementation(
        () => new Promise(() => {})
      );

      render(<WarbandEditor warbandId="1" />);

      expect(screen.getByText('Loading warband...')).toBeInTheDocument();
    });

    it('should display error when loading fails', async () => {
      vi.mocked(apiClient.getWarband).mockRejectedValueOnce(
        new Error('Failed to load')
      );

      render(<WarbandEditor warbandId="1" />);

      // When loading fails, warband is null so it shows the fallback error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to initialize warband/)).toBeInTheDocument();
      });
    });
  });

  describe('Changing warband name', () => {
    it('should update warband name when input changes', async () => {
      // Requirement 1.1, 1.5: Name change
      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'New Warband Name' } });

      expect(nameInput.value).toBe('New Warband Name');
    });
  });

  describe('Changing warband ability', () => {
    it('should update warband ability when selection changes', async () => {
      // Requirement 1.4: Ability change
      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const abilitySelect = screen.getByLabelText(/Warband Ability/i) as HTMLSelectElement;
      fireEvent.change(abilitySelect, { target: { value: 'Mutants' } });

      expect(abilitySelect.value).toBe('Mutants');
    });

    it('should recalculate costs when ability changes for existing warband', async () => {
      // Requirement 15.1, 15.2: Cost recalculation
      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(mockWarband);
      vi.mocked(apiClient.updateWarband).mockResolvedValueOnce({
        ...mockWarband,
        ability: 'Mutants',
        totalCost: 28,
      });

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(screen.getByText('Edit Warband')).toBeInTheDocument();
      });

      const abilitySelect = screen.getByLabelText(/Warband Ability/i) as HTMLSelectElement;
      fireEvent.change(abilitySelect, { target: { value: 'Mutants' } });

      await waitFor(() => {
        expect(apiClient.updateWarband).toHaveBeenCalledWith('1', { ability: 'Mutants' });
      });
    });
  });

  describe('Changing point limit', () => {
    it('should update point limit when selection changes', async () => {
      // Requirement 1.2: Point limit change
      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const pointLimitSelect = screen.getByLabelText(/Point Limit/i) as HTMLSelectElement;
      fireEvent.change(pointLimitSelect, { target: { value: '125' } });

      expect(pointLimitSelect.value).toBe('125');

      await waitFor(() => {
        expect(screen.getByText(/0 \/ 125/)).toBeInTheDocument();
      });
    });
  });

  describe('Adding weirdos', () => {
    it('should add leader when Add Leader button is clicked', async () => {
      // Requirement 2.1, 7.1: Add weirdo
      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const addLeaderButton = screen.getByText('+ Add Leader');
      fireEvent.click(addLeaderButton);

      await waitFor(() => {
        expect(screen.getByText('New Leader')).toBeInTheDocument();
      });
    });

    it('should add trooper when Add Trooper button is clicked', async () => {
      // Requirement 7.1: Add trooper
      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const addTrooperButton = screen.getByText('+ Add Trooper');
      fireEvent.click(addTrooperButton);

      await waitFor(() => {
        expect(screen.getByText('New Trooper')).toBeInTheDocument();
      });
    });

    it('should disable Add Leader button when leader already exists', async () => {
      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(mockWarband);

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(screen.getByText('Edit Warband')).toBeInTheDocument();
      });

      const addLeaderButton = screen.getByText('+ Add Leader') as HTMLButtonElement;
      expect(addLeaderButton.disabled).toBe(true);
    });

    it('should add weirdo via API for saved warband', async () => {
      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(mockWarband);
      vi.mocked(apiClient.addWeirdo).mockResolvedValueOnce({
        ...mockWarband,
        weirdos: [...mockWarband.weirdos, mockTrooper],
      });

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(screen.getByText('Edit Warband')).toBeInTheDocument();
      });

      const addTrooperButton = screen.getByText('+ Add Trooper');
      fireEvent.click(addTrooperButton);

      await waitFor(() => {
        expect(apiClient.addWeirdo).toHaveBeenCalled();
      });
    });
  });

  describe('Removing weirdos', () => {
    it('should prompt for confirmation when removing weirdo', async () => {
      // Requirement 15.1, 15.2: Remove weirdo
      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(mockWarband);
      mockConfirm.mockReturnValueOnce(false);

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(screen.getByText('Leader')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Leader')
      );
    });

    it('should remove weirdo when confirmed', async () => {
      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(mockWarband);
      vi.mocked(apiClient.removeWeirdo).mockResolvedValueOnce({
        ...mockWarband,
        weirdos: [mockLeader],
      });
      mockConfirm.mockReturnValueOnce(true);

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(screen.getByText('Trooper')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[1]);

      await waitFor(() => {
        expect(apiClient.removeWeirdo).toHaveBeenCalledWith('1', 'w2');
      });
    });

    it('should not remove weirdo when cancelled', async () => {
      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(mockWarband);
      mockConfirm.mockReturnValueOnce(false);

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(screen.getByText('Trooper')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[1]);

      expect(mockConfirm).toHaveBeenCalled();
      expect(apiClient.removeWeirdo).not.toHaveBeenCalled();
    });
  });

  describe('Saving warband', () => {
    it('should create new warband when saving without ID', async () => {
      // Requirement 11.1, 11.4: Save warband
      vi.mocked(apiClient.validate).mockResolvedValueOnce(mockValidationSuccess);
      vi.mocked(apiClient.createWarband).mockResolvedValueOnce(mockWarband);

      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Warband' } });

      const saveButton = screen.getByText('Create Warband');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiClient.validate).toHaveBeenCalled();
        expect(apiClient.createWarband).toHaveBeenCalledWith({
          name: 'New Warband',
          pointLimit: 75,
          ability: 'Cyborgs',
        });
      });
    });

    it('should update existing warband when saving with ID', async () => {
      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(mockWarband);
      vi.mocked(apiClient.validate).mockResolvedValueOnce(mockValidationSuccess);
      vi.mocked(apiClient.updateWarband).mockResolvedValueOnce(mockWarband);

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(screen.getByText('Edit Warband')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiClient.validate).toHaveBeenCalled();
        expect(apiClient.updateWarband).toHaveBeenCalled();
      });
    });

    it('should display success message after saving', async () => {
      vi.mocked(apiClient.validate).mockResolvedValueOnce(mockValidationSuccess);
      vi.mocked(apiClient.createWarband).mockResolvedValueOnce(mockWarband);

      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Warband' } });

      const saveButton = screen.getByText('Create Warband');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Warband saved successfully!')).toBeInTheDocument();
      });
    });

    it('should prevent saving when name is empty', async () => {
      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Create Warband') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(true);
    });
  });

  describe('Validation errors', () => {
    it('should display validation errors when save fails validation', async () => {
      vi.mocked(apiClient.validate).mockResolvedValueOnce(mockValidationError);

      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const saveButton = screen.getByText('Create Warband');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Validation Errors/)).toBeInTheDocument();
        expect(screen.getByText(/Warband name is required/)).toBeInTheDocument();
      });
    });

    it('should not save when validation fails', async () => {
      vi.mocked(apiClient.validate).mockResolvedValueOnce(mockValidationError);

      render(<WarbandEditor />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const saveButton = screen.getByText('Create Warband');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiClient.validate).toHaveBeenCalled();
      });

      expect(apiClient.createWarband).not.toHaveBeenCalled();
    });
  });

  describe('Cost calculations', () => {
    it('should display total cost of all weirdos', async () => {
      // Requirement 10.1, 15.2, 15.3: Calculate total cost
      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(mockWarband);

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(screen.getByText(/30 \/ 75/)).toBeInTheDocument();
      });
    });

    it('should display warning when approaching point limit', async () => {
      // Requirement 15.4, 15.5: Warning indicators
      const nearLimitWarband = {
        ...mockWarband,
        totalCost: 70,
        weirdos: [{ ...mockLeader, totalCost: 70 }],
      };

      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(nearLimitWarband);

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(screen.getByText(/Approaching point limit/)).toBeInTheDocument();
      });
    });

    it('should display error when exceeding point limit', async () => {
      // Requirement 10.3: Exceeds limit
      const overLimitWarband = {
        ...mockWarband,
        totalCost: 80,
        weirdos: [{ ...mockLeader, totalCost: 80 }],
      };

      vi.mocked(apiClient.getWarband).mockResolvedValueOnce(overLimitWarband);

      render(<WarbandEditor warbandId="1" />);

      await waitFor(() => {
        expect(screen.getByText(/Exceeds point limit!/)).toBeInTheDocument();
      });
    });
  });

  describe('Back navigation', () => {
    it('should call onBack when back button is clicked', async () => {
      const mockOnBack = vi.fn();

      render(<WarbandEditor onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const backButton = screen.getByText('← Back to List');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should call onBack when cancel button is clicked', async () => {
      const mockOnBack = vi.fn();

      render(<WarbandEditor onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });
});

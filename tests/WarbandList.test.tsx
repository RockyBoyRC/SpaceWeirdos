import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { WarbandList } from '../src/frontend/components/WarbandList';
import { apiClient } from '../src/frontend/services/apiClient';
import type { Warband } from '../src/backend/models/types';

// Mock the API client
vi.mock('../src/frontend/services/apiClient', () => ({
  apiClient: {
    getAllWarbands: vi.fn(),
    deleteWarband: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public statusCode?: number, public details?: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Mock window.alert and window.confirm
const mockAlert = vi.fn();
const mockConfirm = vi.fn();
global.window.alert = mockAlert;
global.window.confirm = mockConfirm;

describe('WarbandList Component', () => {
  const mockWarbands: Warband[] = [
    {
      id: '1',
      name: 'The Cyborg Squad',
      ability: 'Cyborgs',
      pointLimit: 75,
      totalCost: 50,
      weirdos: [
        {
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
          totalCost: 25,
        },
        {
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
          totalCost: 25,
        },
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Mutant Horde',
      ability: 'Mutants',
      pointLimit: 125,
      totalCost: 100,
      weirdos: [
        {
          id: 'w3',
          name: 'Alpha',
          type: 'leader',
          attributes: {
            speed: 3,
            defense: '2d10',
            firepower: '2d10',
            prowess: '2d10',
            willpower: '2d10',
          },
          closeCombatWeapons: [],
          rangedWeapons: [],
          equipment: [],
          psychicPowers: [],
          leaderTrait: 'Monstrous',
          notes: '',
          totalCost: 100,
        },
      ],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockAlert.mockClear();
    mockConfirm.mockClear();
  });

  describe('Loading warbands', () => {
    it('should display loading state initially', () => {
      // Mock API to never resolve
      vi.mocked(apiClient.getAllWarbands).mockImplementation(
        () => new Promise(() => {})
      );

      render(<WarbandList />);

      expect(screen.getByText('Loading warbands...')).toBeInTheDocument();
    });

    it('should load and display warbands successfully', async () => {
      // Requirement 13.1: Display all saved warbands
      vi.mocked(apiClient.getAllWarbands).mockResolvedValueOnce(mockWarbands);

      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
        expect(screen.getByText('Mutant Horde')).toBeInTheDocument();
      });

      expect(apiClient.getAllWarbands).toHaveBeenCalledTimes(1);
    });

    it('should display error state when loading fails', async () => {
      const errorMessage = 'Network error';
      vi.mocked(apiClient.getAllWarbands).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      render(<WarbandList />);

      await waitFor(() => {
        expect(
          screen.getByText(/An unexpected error occurred while loading warbands/)
        ).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      vi.mocked(apiClient.getAllWarbands)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockWarbands);

      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
      });

      expect(apiClient.getAllWarbands).toHaveBeenCalledTimes(2);
    });
  });

  describe('Displaying warband list', () => {
    beforeEach(() => {
      vi.mocked(apiClient.getAllWarbands).mockResolvedValue(mockWarbands);
    });

    it('should display warband name', async () => {
      // Requirement 13.2: Show warband name
      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
        expect(screen.getByText('Mutant Horde')).toBeInTheDocument();
      });
    });

    it('should display warband ability', async () => {
      // Requirement 13.2: Show warband ability
      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText('Cyborgs')).toBeInTheDocument();
        expect(screen.getByText('Mutants')).toBeInTheDocument();
      });
    });

    it('should display point limit', async () => {
      // Requirement 13.2: Show point limit
      render(<WarbandList />);

      await waitFor(() => {
        const pointLimits = screen.getAllByText(/75|125/);
        expect(pointLimits.length).toBeGreaterThan(0);
      });
    });

    it('should display total cost', async () => {
      // Requirement 13.2: Show total point cost
      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    it('should display weirdo count', async () => {
      // Requirement 13.3: Show number of weirdos
      render(<WarbandList />);

      await waitFor(() => {
        const weirdoCounts = screen.getAllByText(/1|2/);
        // Should find at least the weirdo counts (2 and 1)
        expect(weirdoCounts.length).toBeGreaterThan(0);
      });
    });

    it('should display Load and Delete buttons for each warband', async () => {
      render(<WarbandList />);

      await waitFor(() => {
        const loadButtons = screen.getAllByText('Load');
        const deleteButtons = screen.getAllByText('Delete');
        
        expect(loadButtons).toHaveLength(2);
        expect(deleteButtons).toHaveLength(2);
      });
    });
  });

  describe('Empty state', () => {
    it('should display message when no warbands exist', async () => {
      // Requirement 13.4: Display message when no warbands exist
      vi.mocked(apiClient.getAllWarbands).mockResolvedValueOnce([]);

      render(<WarbandList />);

      await waitFor(() => {
        expect(
          screen.getByText(/No warbands found. Create your first warband to get started!/)
        ).toBeInTheDocument();
      });
    });

    it('should display create button in empty state', async () => {
      vi.mocked(apiClient.getAllWarbands).mockResolvedValueOnce([]);

      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText('Create New Warband')).toBeInTheDocument();
      });
    });
  });

  describe('Loading a warband', () => {
    beforeEach(() => {
      vi.mocked(apiClient.getAllWarbands).mockResolvedValue(mockWarbands);
    });

    it('should call handleLoadWarband when Load button is clicked', async () => {
      // Requirement 13.1: Load warband functionality
      const mockOnLoadWarband = vi.fn();
      render(<WarbandList onLoadWarband={mockOnLoadWarband} />);

      await waitFor(() => {
        expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
      });

      const loadButtons = screen.getAllByText('Load');
      fireEvent.click(loadButtons[0]);

      expect(mockOnLoadWarband).toHaveBeenCalledWith('1');
    });
  });

  describe('Deleting a warband', () => {
    beforeEach(() => {
      vi.mocked(apiClient.getAllWarbands).mockResolvedValue(mockWarbands);
    });

    it('should prompt for confirmation when Delete button is clicked', async () => {
      // Requirement 14.1: Prompt for confirmation
      mockConfirm.mockReturnValueOnce(false);

      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('The Cyborg Squad')
      );
    });

    it('should delete warband when confirmed', async () => {
      // Requirement 14.2: Remove warband from storage
      mockConfirm.mockReturnValueOnce(true);
      vi.mocked(apiClient.deleteWarband).mockResolvedValueOnce(undefined);
      vi.mocked(apiClient.getAllWarbands)
        .mockResolvedValueOnce(mockWarbands)
        .mockResolvedValueOnce([mockWarbands[1]]); // After deletion

      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(apiClient.deleteWarband).toHaveBeenCalledWith('1');
      });

      // Requirement 14.3: Confirm successful deletion
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('The Cyborg Squad')
      );
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('deleted successfully')
      );

      // List should be reloaded
      await waitFor(() => {
        expect(apiClient.getAllWarbands).toHaveBeenCalledTimes(2);
      });
    });

    it('should not delete warband when cancelled', async () => {
      // Requirement 14.4: Deletion cancellation preserves warband
      mockConfirm.mockReturnValueOnce(false);

      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalled();
      expect(apiClient.deleteWarband).not.toHaveBeenCalled();
      
      // Warband should still be visible
      expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
    });

    it('should display error when deletion fails', async () => {
      mockConfirm.mockReturnValueOnce(true);
      vi.mocked(apiClient.deleteWarband).mockRejectedValueOnce(
        new Error('Delete failed')
      );

      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText(/An unexpected error occurred while deleting/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Create New Warband button', () => {
    it('should display create button when warbands exist', async () => {
      vi.mocked(apiClient.getAllWarbands).mockResolvedValueOnce(mockWarbands);

      render(<WarbandList />);

      await waitFor(() => {
        expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
      });

      const createButtons = screen.getAllByText('Create New Warband');
      expect(createButtons.length).toBeGreaterThan(0);
    });

    it('should call onCreateWarband when create button is clicked', async () => {
      vi.mocked(apiClient.getAllWarbands).mockResolvedValueOnce(mockWarbands);
      const mockOnCreateWarband = vi.fn();

      render(<WarbandList onCreateWarband={mockOnCreateWarband} />);

      await waitFor(() => {
        expect(screen.getByText('The Cyborg Squad')).toBeInTheDocument();
      });

      const createButton = screen.getAllByText('Create New Warband')[0];
      fireEvent.click(createButton);

      expect(mockOnCreateWarband).toHaveBeenCalled();
    });
  });
});

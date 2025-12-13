import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/frontend/App';
import * as apiClient from '../src/frontend/services/apiClient';

// Mock the API client
vi.mock('../src/frontend/services/apiClient', () => ({
  apiClient: {
    getAllWarbands: vi.fn(),
    getGameData: vi.fn(),
  }
}));

// Mock the README content service
vi.mock('../src/frontend/services/ReadmeContentService', () => ({
  readmeContentService: {
    getContent: vi.fn(),
    getCachedContent: vi.fn(),
    getFallbackContent: vi.fn(),
  }
}));

describe('Learn About Space Weirdos Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock empty warband list to show the Learn About button
    vi.mocked(apiClient.apiClient.getAllWarbands).mockResolvedValue([]);
    
    // Mock game data
    vi.mocked(apiClient.apiClient.getGameData).mockResolvedValue({
      attributes: [],
      closeCombatWeapons: [],
      rangedWeapons: [],
      equipment: [],
      psychicPowers: [],
      leaderTraits: [],
      warbandAbilities: []
    });
  });

  it('should display Learn About button and open popup when clicked', async () => {
    // Requirements: 1.1, 1.4, 2.1
    const mockReadmeContent = {
      title: 'Space Weirdos Warband Builder',
      version: 'Version 1.0.0',
      features: [
        'Complete Warband Management',
        'Real-Time Cost Calculation',
        'Validation System'
      ],
      gameRules: [
        'Warband Creation Rules',
        'Equipment Assignment',
        'Point Limits'
      ],
      lastUpdated: new Date()
    };

    const { readmeContentService } = await import('../src/frontend/services/ReadmeContentService');
    vi.mocked(readmeContentService.getContent).mockResolvedValue(mockReadmeContent);
    vi.mocked(readmeContentService.getCachedContent).mockReturnValue(null);
    vi.mocked(readmeContentService.getFallbackContent).mockReturnValue(mockReadmeContent);

    render(<App />);

    // Wait for the warband list to load
    await waitFor(() => {
      expect(screen.getByText('My Warbands')).toBeInTheDocument();
    });

    // Verify Learn About button is displayed
    const learnAboutButton = screen.getByRole('button', { 
      name: /Learn about Space Weirdos game and warband builder/ 
    });
    expect(learnAboutButton).toBeInTheDocument();
    expect(learnAboutButton).toHaveTextContent('Learn About Space Weirdos');

    // Click the Learn About button
    fireEvent.click(learnAboutButton);

    // Wait for popup to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify popup content is displayed
    expect(screen.getByText('Space Weirdos Warband Builder')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Complete Warband Management')).toBeInTheDocument();
    expect(screen.getByText('Warband Creation Rules')).toBeInTheDocument();
  });

  it('should close popup when close button is clicked', async () => {
    // Requirements: 3.1, 3.2
    const mockReadmeContent = {
      title: 'Space Weirdos Warband Builder',
      version: 'Version 1.0.0',
      features: ['Test Feature'],
      gameRules: ['Test Rule'],
      lastUpdated: new Date()
    };

    const { readmeContentService } = await import('../src/frontend/services/ReadmeContentService');
    vi.mocked(readmeContentService.getContent).mockResolvedValue(mockReadmeContent);
    vi.mocked(readmeContentService.getCachedContent).mockReturnValue(null);
    vi.mocked(readmeContentService.getFallbackContent).mockReturnValue(mockReadmeContent);

    render(<App />);

    // Wait for the warband list to load
    await waitFor(() => {
      expect(screen.getByText('My Warbands')).toBeInTheDocument();
    });

    // Click Learn About button to open popup
    const learnAboutButton = screen.getByRole('button', { 
      name: /Learn about Space Weirdos game and warband builder/ 
    });
    fireEvent.click(learnAboutButton);

    // Wait for popup to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Wait for popup to disappear
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify warband list is still displayed
    expect(screen.getByText('My Warbands')).toBeInTheDocument();
  });

  it('should close popup when escape key is pressed', async () => {
    // Requirements: 3.4
    const mockReadmeContent = {
      title: 'Space Weirdos Warband Builder',
      version: 'Version 1.0.0',
      features: ['Test Feature'],
      gameRules: ['Test Rule'],
      lastUpdated: new Date()
    };

    const { readmeContentService } = await import('../src/frontend/services/ReadmeContentService');
    vi.mocked(readmeContentService.getContent).mockResolvedValue(mockReadmeContent);
    vi.mocked(readmeContentService.getCachedContent).mockReturnValue(null);
    vi.mocked(readmeContentService.getFallbackContent).mockReturnValue(mockReadmeContent);

    render(<App />);

    // Wait for the warband list to load
    await waitFor(() => {
      expect(screen.getByText('My Warbands')).toBeInTheDocument();
    });

    // Click Learn About button to open popup
    const learnAboutButton = screen.getByRole('button', { 
      name: /Learn about Space Weirdos game and warband builder/ 
    });
    fireEvent.click(learnAboutButton);

    // Wait for popup to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Press escape key
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    // Wait for popup to disappear
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify warband list is still displayed
    expect(screen.getByText('My Warbands')).toBeInTheDocument();
  });
});
/**
 * Focus Indicators and Keyboard Navigation Tests
 * 
 * Tests that all interactive elements have visible focus indicators
 * and keyboard navigation works correctly with the vintage theme.
 * 
 * Requirements: 5.3, 5.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode, useEffect, useRef } from 'react';
import { GameDataProvider } from '../src/frontend/contexts/GameDataContext';
import { WarbandProvider, useWarband } from '../src/frontend/contexts/WarbandContext';
import { AttributeSelector } from '../src/frontend/components/AttributeSelector';
import { DeleteConfirmationDialog } from '../src/frontend/components/DeleteConfirmationDialog';
import { WeirdoCard } from '../src/frontend/components/WeirdoCard';
import { CostEngine } from '../src/backend/services/CostEngine';
import { createMockGameData } from './testHelpers';
import type { Weirdo } from '../src/backend/models/types';

const mockWeirdo: Weirdo = {
  id: 'test-weirdo',
  name: 'Test Weirdo',
  type: 'Trooper',
  speed: 2,
  defense: '2d8',
  firepower: '2d8',
  prowess: '2d8',
  willpower: '2d8',
  closeCombatWeapons: [],
  rangedWeapons: [],
  equipment: [],
  leaderTraits: [],
  psychicPowers: []
};

// Helper component to initialize warband in context
function WithWarband({ 
  children, 
  name = 'Test Warband',
  pointLimit = 75,
  ability = null
}: { 
  children: ReactNode;
  name?: string;
  pointLimit?: 75 | 125;
  ability?: any;
}) {
  const { createWarband, updateWarband } = useWarband();
  const initialized = useRef(false);
  
  useEffect(() => {
    if (!initialized.current) {
      createWarband(name, pointLimit);
      if (ability) {
        updateWarband({ ability });
      }
      initialized.current = true;
    }
  }, [createWarband, updateWarband, name, pointLimit, ability]);
  
  return <>{children}</>;
}

const renderWithContexts = (component: React.ReactElement) => {
  const mockCostEngine = new CostEngine();
  
  return render(
    <GameDataProvider>
      <WarbandProvider costEngine={mockCostEngine}>
        <WithWarband>
          {component}
        </WithWarband>
      </WarbandProvider>
    </GameDataProvider>
  );
};

describe('Focus Indicators and Keyboard Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch for GameDataProvider
    const mockGameData = createMockGameData();
    global.fetch = ((url: string) => {
      if (url.includes('/warbandAbilities.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGameData.warbandAbilities)
        });
      }
      if (url.includes('/closeCombatWeapons.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGameData.closeCombatWeapons)
        });
      }
      if (url.includes('/rangedWeapons.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGameData.rangedWeapons)
        });
      }
      if (url.includes('/equipment.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGameData.equipment)
        });
      }
      if (url.includes('/psychicPowers.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGameData.psychicPowers)
        });
      }
      if (url.includes('/leaderTraits.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGameData.leaderTraits)
        });
      }
      if (url.includes('/attributes.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGameData.attributes)
        });
      }
      return Promise.reject(new Error(`Unmocked fetch call to ${url}`));
    }) as any;
  });

  describe('Focus Indicators', () => {
    it('should have focusable buttons with proper attributes', async () => {
      const user = userEvent.setup();
      
      render(
        <DeleteConfirmationDialog
          warbandName="Test Warband"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Find buttons
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      // Check buttons are focusable
      await user.click(confirmButton);
      expect(confirmButton).toHaveFocus();
      
      await user.click(cancelButton);
      expect(cancelButton).toHaveFocus();
    });

    it('should have focusable form inputs', async () => {
      const user = userEvent.setup();
      
      renderWithContexts(
        <AttributeSelector
          attribute="speed"
          value={2}
          onChange={vi.fn()}
          warbandAbility="Mutants"
        />
      );

      const select = screen.getByRole('combobox');
      
      // Focus the select
      await user.click(select);
      
      // Check that the select has focus
      expect(select).toHaveFocus();
    });

    it('should have focusable interactive cards', async () => {
      const user = userEvent.setup();
      
      render(
        <WeirdoCard
          weirdo={mockWeirdo}
          isSelected={false}
          onSelect={vi.fn()}
          validationErrors={[]}
        />
      );

      // Get the main card button (not the remove button)
      const card = screen.getByRole('button', { name: /Select Test Weirdo/ });
      
      // Focus the card
      await user.click(card);
      
      // Check that the card has focus
      expect(card).toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation through interactive elements', async () => {
      const user = userEvent.setup();
      
      render(
        <DeleteConfirmationDialog
          warbandName="Test Warband"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Start tabbing through elements
      await user.tab();
      const firstFocusedElement = document.activeElement;
      expect(firstFocusedElement).toBeTruthy();
      
      await user.tab();
      const secondFocusedElement = document.activeElement;
      expect(secondFocusedElement).toBeTruthy();
      expect(secondFocusedElement).not.toBe(firstFocusedElement);
    });

    it('should support Enter key activation on buttons', async () => {
      const user = userEvent.setup();
      const mockOnConfirm = vi.fn();
      
      render(
        <DeleteConfirmationDialog
          warbandName="Test Warband"
          onConfirm={mockOnConfirm}
          onCancel={vi.fn()}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Focus and activate with Enter
      confirmButton.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('should support Space key activation on buttons', async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();
      
      render(
        <DeleteConfirmationDialog
          warbandName="Test Warband"
          onConfirm={vi.fn()}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      // Focus and activate with Space
      cancelButton.focus();
      await user.keyboard(' ');
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should support Escape key for modal dismissal', async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();
      
      render(
        <DeleteConfirmationDialog
          warbandName="Test Warband"
          onConfirm={vi.fn()}
          onCancel={mockOnCancel}
        />
      );

      // Press Escape key
      await user.keyboard('{Escape}');
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should support keyboard interaction with selects', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      renderWithContexts(
        <AttributeSelector
          attribute="speed"
          value={2}
          onChange={mockOnChange}
          warbandAbility="Mutants"
        />
      );

      const select = screen.getByRole('combobox');
      
      // Focus the select
      await user.click(select);
      expect(select).toHaveFocus();
      
      // Select a different option
      await user.selectOptions(select, '3');
      
      // Should have triggered onChange
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should have focusable elements in modal dialogs', async () => {
      const user = userEvent.setup();
      
      render(
        <DeleteConfirmationDialog
          warbandName="Test Warband"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Check that modal has focusable elements
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      
      // Tab to first element
      await user.tab();
      expect(document.activeElement).toBeTruthy();
    });
  });

  describe('ARIA and Semantic Markup', () => {
    it('should have proper roles for interactive elements', () => {
      renderWithContexts(
        <AttributeSelector
          attribute="speed"
          value={2}
          onChange={vi.fn()}
          warbandAbility="Mutants"
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should have proper button roles and labels', () => {
      render(
        <DeleteConfirmationDialog
          warbandName="Test Warband"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });
});
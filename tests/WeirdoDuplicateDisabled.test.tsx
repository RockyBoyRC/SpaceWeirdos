/**
 * Weirdo Duplicate Button Disabled State Tests
 * 
 * Tests that the duplicate button is properly disabled when the warband
 * hasn't been saved yet, preventing user confusion.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeirdoCard } from '../src/frontend/components/WeirdoCard';
import type { Weirdo } from '../src/backend/models/types';

describe('WeirdoCard Duplicate Button Disabled State', () => {
  const mockWeirdo: Weirdo = {
    id: 'test-weirdo',
    name: 'Test Trooper',
    type: 'trooper',
    attributes: {
      speed: 2,
      defense: '1d6',
      firepower: 'None',
      prowess: '1d6',
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

  const mockProps = {
    weirdo: mockWeirdo,
    cost: 10,
    isSelected: false,
    hasErrors: false,
    validationErrors: [],
    onClick: vi.fn(),
    onRemove: vi.fn(),
    onDuplicate: vi.fn(),
  };

  it('should enable duplicate button when canDuplicate is true', () => {
    render(<WeirdoCard {...mockProps} canDuplicate={true} />);
    
    const duplicateButton = screen.getByRole('button', { name: /duplicate test trooper/i });
    expect(duplicateButton).not.toBeDisabled();
    expect(duplicateButton).toHaveAttribute('title', 'Duplicate this weirdo');
  });

  it('should disable duplicate button when canDuplicate is false', () => {
    render(<WeirdoCard {...mockProps} canDuplicate={false} />);
    
    const duplicateButton = screen.getByRole('button', { name: /cannot duplicate test trooper/i });
    expect(duplicateButton).toBeDisabled();
    expect(duplicateButton).toHaveAttribute('title', 'Save the warband first to enable duplication');
  });

  it('should enable duplicate button by default when canDuplicate is not specified', () => {
    render(<WeirdoCard {...mockProps} />);
    
    const duplicateButton = screen.getByRole('button', { name: /duplicate test trooper/i });
    expect(duplicateButton).not.toBeDisabled();
    expect(duplicateButton).toHaveAttribute('title', 'Duplicate this weirdo');
  });

  it('should have proper CSS classes when disabled', () => {
    render(<WeirdoCard {...mockProps} canDuplicate={false} />);
    
    const duplicateButton = screen.getByRole('button', { name: /cannot duplicate test trooper/i });
    expect(duplicateButton).toHaveClass('weirdo-card__duplicate--disabled');
  });
});
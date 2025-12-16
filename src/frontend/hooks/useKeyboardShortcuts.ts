/**
 * Keyboard Shortcuts Hook
 * 
 * Provides keyboard shortcuts for common import/export operations.
 * Ensures proper focus management and accessibility.
 * 
 * Requirements: 4.1, 4.2
 */

import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onImport?: () => void;
  onCreateNew?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts in the application
 * 
 * Shortcuts:
 * - Ctrl/Cmd + I: Import warband
 * - Ctrl/Cmd + N: Create new warband
 * - Escape: Cancel current operation
 */
export function useKeyboardShortcuts({
  onImport,
  onCreateNew,
  onCancel,
  disabled = false
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field or modal
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        document.querySelector('[role="dialog"]') ||
        document.querySelector('.modal') ||
        document.querySelector('.file-operation-status') ||
        document.querySelector('.import-export-error-display')
      ) {
        return;
      }

      // Ctrl+I or Cmd+I for Import
      if ((event.ctrlKey || event.metaKey) && event.key === 'i' && onImport) {
        event.preventDefault();
        onImport();
      }

      // Ctrl+N or Cmd+N for New Warband
      if ((event.ctrlKey || event.metaKey) && event.key === 'n' && onCreateNew) {
        event.preventDefault();
        onCreateNew();
      }

      // Escape to cancel operations
      if (event.key === 'Escape' && onCancel) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onImport, onCreateNew, onCancel, disabled]);
}

/**
 * Focus management utilities for import/export operations
 */
export const focusUtils = {
  /**
   * Focus the import button after successful operations
   */
  focusImportButton: () => {
    const importButton = document.querySelector('.import-button') as HTMLButtonElement;
    if (importButton) {
      importButton.focus();
    }
  },

  /**
   * Focus the create button after successful operations
   */
  focusCreateButton: () => {
    const createButton = document.querySelector('.create-button') as HTMLButtonElement;
    if (createButton) {
      createButton.focus();
    }
  },

  /**
   * Focus the first warband in the list
   */
  focusFirstWarband: () => {
    const firstWarband = document.querySelector('.warband-card .load-button') as HTMLButtonElement;
    if (firstWarband) {
      firstWarband.focus();
    }
  },

  /**
   * Restore focus to the previously focused element
   */
  restoreFocus: (previousElement: Element | null) => {
    if (previousElement && previousElement instanceof HTMLElement) {
      previousElement.focus();
    }
  }
};
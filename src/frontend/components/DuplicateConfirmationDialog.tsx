import { useEffect, useRef } from 'react';
import './DuplicateConfirmationDialog.css';

/**
 * DuplicateConfirmationDialog Component
 * 
 * Modal dialog for confirming warband duplication.
 * Implements focus trap and escape key handling for accessibility.
 * 
 * Requirements: 7.2, 7.3, 7.5
 */

interface DuplicateConfirmationDialogProps {
  warbandName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateConfirmationDialog({ 
  warbandName, 
  onConfirm, 
  onCancel 
}: DuplicateConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Handle escape key press
   * Requirements: 7.5
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  /**
   * Focus trap implementation
   * Requirements: 7.5
   */
  useEffect(() => {
    // Focus the confirm button when dialog opens
    confirmButtonRef.current?.focus();

    // Trap focus within dialog
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      // Type assertions are safe: querySelectorAll returns Elements, but we know they're HTMLElements
      // because we're querying for interactive elements that are always HTMLElements
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  /**
   * Handle overlay click (close dialog)
   */
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="dialog-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-dialog-title"
      aria-describedby="duplicate-dialog-description"
    >
      <div className="dialog-content" ref={dialogRef}>
        <h2 id="duplicate-dialog-title">Confirm Duplication</h2>
        <p id="duplicate-dialog-description">
          Are you sure you want to duplicate the warband <strong>"{warbandName}"</strong>? 
          This will create a copy with all weirdos and settings.
        </p>
        <div className="dialog-actions">
          <button 
            onClick={onCancel}
            className="cancel-button"
            aria-label="Cancel duplication"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="duplicate-confirm-button"
            ref={confirmButtonRef}
            aria-label={`Confirm duplication of ${warbandName}`}
          >
            Duplicate
          </button>
        </div>
      </div>
    </div>
  );
}
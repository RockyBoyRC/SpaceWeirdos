import { useState, useEffect, useRef } from 'react';
import './NameConflictDialog.css';

/**
 * NameConflictDialog Component
 * 
 * Modal dialog for resolving warband name conflicts during import.
 * Provides rename and replace options with proper validation,
 * focus management, and accessibility features.
 * 
 * Requirements: 2.4, 5.1, 5.2, 5.3
 */

export interface NameConflictDialogProps {
  /** Name of the existing warband that conflicts */
  existingWarbandName: string;
  /** Name of the warband being imported */
  importedWarbandName: string;
  /** Callback when user chooses to rename */
  onRename: (newName: string) => void;
  /** Callback when user chooses to replace */
  onReplace: () => void;
  /** Callback when user cancels the operation */
  onCancel: () => void;
}

export function NameConflictDialog({
  existingWarbandName,
  importedWarbandName,
  onRename,
  onReplace,
  onCancel
}: NameConflictDialogProps) {
  const [newName, setNewName] = useState(importedWarbandName);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showReplaceConfirmation, setShowReplaceConfirmation] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const renameButtonRef = useRef<HTMLButtonElement>(null);
  const replaceButtonRef = useRef<HTMLButtonElement>(null);
  const confirmReplaceButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Focus management for accessibility
   * Requirements: 5.3
   */
  useEffect(() => {
    // Focus the name input when dialog opens
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, []);

  /**
   * Handle escape key press
   * Requirements: 5.3
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showReplaceConfirmation) {
          setShowReplaceConfirmation(false);
        } else {
          onCancel();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel, showReplaceConfirmation]);

  /**
   * Focus trap implementation
   * Requirements: 5.3
   */
  useEffect(() => {
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

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
  }, [showReplaceConfirmation]);

  /**
   * Validate the new warband name
   * Requirements: 5.2
   */
  const validateName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'Warband name cannot be empty';
    }
    
    if (trimmedName.length < 2) {
      return 'Warband name must be at least 2 characters long';
    }
    
    if (trimmedName.length > 50) {
      return 'Warband name must be 50 characters or less';
    }
    
    if (trimmedName === existingWarbandName) {
      return 'This name is already taken';
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(trimmedName)) {
      return 'Name contains invalid characters';
    }
    
    return null;
  };

  /**
   * Handle name input change with validation
   * Requirements: 5.2
   */
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewName(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  /**
   * Handle rename submission
   * Requirements: 5.1, 5.2
   */
  const handleRename = async () => {
    const trimmedName = newName.trim();
    const error = validateName(trimmedName);
    
    if (error) {
      setValidationError(error);
      nameInputRef.current?.focus();
      return;
    }

    setIsValidating(true);
    try {
      // Simulate validation delay (in real implementation, this might check against database)
      await new Promise(resolve => setTimeout(resolve, 100));
      onRename(trimmedName);
    } catch (err) {
      setValidationError('Failed to validate name. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle replace confirmation
   * Requirements: 5.1, 5.3
   */
  const handleReplaceClick = () => {
    setShowReplaceConfirmation(true);
    // Focus will be managed by useEffect
    setTimeout(() => {
      confirmReplaceButtonRef.current?.focus();
    }, 0);
  };

  /**
   * Handle confirmed replace
   * Requirements: 5.1
   */
  const handleConfirmReplace = () => {
    onReplace();
  };

  /**
   * Handle cancel replace confirmation
   */
  const handleCancelReplace = () => {
    setShowReplaceConfirmation(false);
    replaceButtonRef.current?.focus();
  };

  /**
   * Handle overlay click (close dialog)
   */
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      if (showReplaceConfirmation) {
        setShowReplaceConfirmation(false);
      } else {
        onCancel();
      }
    }
  };

  /**
   * Handle form submission (Enter key in input)
   */
  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidating && !validationError) {
      handleRename();
    }
  };

  /**
   * Generate a suggested alternative name
   * Requirements: 5.2
   */
  const generateSuggestedName = (): string => {
    const baseName = importedWarbandName;
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `${baseName} (imported ${timestamp})`;
  };

  /**
   * Use suggested name
   */
  const useSuggestedName = () => {
    const suggested = generateSuggestedName();
    setNewName(suggested);
    setValidationError(null);
    nameInputRef.current?.focus();
  };

  return (
    <div 
      className="name-conflict-dialog-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-dialog-title"
      aria-describedby="conflict-dialog-description"
    >
      <div className="name-conflict-dialog" ref={dialogRef}>
        {!showReplaceConfirmation ? (
          <>
            <div className="name-conflict-dialog__header">
              <h2 id="conflict-dialog-title" className="name-conflict-dialog__title">
                Name Conflict
              </h2>
              <p id="conflict-dialog-description" className="name-conflict-dialog__description">
                A warband named <strong>"{existingWarbandName}"</strong> already exists. 
                Choose how to resolve this conflict:
              </p>
            </div>

            <div className="name-conflict-dialog__content">
              <div className="name-conflict-dialog__option">
                <h3 className="name-conflict-dialog__option-title">
                  Option 1: Rename the imported warband
                </h3>
                <form onSubmit={handleFormSubmit} className="name-conflict-dialog__rename-form">
                  <div className="name-conflict-dialog__input-group">
                    <label htmlFor="new-warband-name" className="name-conflict-dialog__label">
                      New name:
                    </label>
                    <input
                      id="new-warband-name"
                      type="text"
                      value={newName}
                      onChange={handleNameChange}
                      className={`name-conflict-dialog__input ${
                        validationError ? 'name-conflict-dialog__input--error' : ''
                      }`}
                      ref={nameInputRef}
                      disabled={isValidating}
                      aria-describedby={validationError ? 'name-error' : undefined}
                      aria-invalid={validationError ? 'true' : 'false'}
                    />
                    {validationError && (
                      <div id="name-error" className="name-conflict-dialog__error" role="alert">
                        {validationError}
                      </div>
                    )}
                  </div>
                  <div className="name-conflict-dialog__suggestions">
                    <button
                      type="button"
                      onClick={useSuggestedName}
                      className="name-conflict-dialog__suggestion-button"
                      disabled={isValidating}
                    >
                      Use suggested name: "{generateSuggestedName()}"
                    </button>
                  </div>
                </form>
              </div>

              <div className="name-conflict-dialog__divider">
                <span>OR</span>
              </div>

              <div className="name-conflict-dialog__option">
                <h3 className="name-conflict-dialog__option-title">
                  Option 2: Replace the existing warband
                </h3>
                <p className="name-conflict-dialog__warning">
                  ⚠️ This will permanently delete the existing warband "{existingWarbandName}" 
                  and replace it with the imported one. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="name-conflict-dialog__actions">
              <button
                onClick={onCancel}
                className="name-conflict-dialog__button name-conflict-dialog__button--cancel"
                aria-label="Cancel import operation"
              >
                Cancel
              </button>
              <button
                onClick={handleReplaceClick}
                className="name-conflict-dialog__button name-conflict-dialog__button--replace"
                ref={replaceButtonRef}
                aria-label={`Replace existing warband "${existingWarbandName}"`}
              >
                Replace Existing
              </button>
              <button
                onClick={handleRename}
                className="name-conflict-dialog__button name-conflict-dialog__button--rename"
                ref={renameButtonRef}
                disabled={isValidating || !!validationError || !newName.trim()}
                aria-label="Import with new name"
              >
                {isValidating ? 'Validating...' : 'Import with New Name'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="name-conflict-dialog__header">
              <h2 className="name-conflict-dialog__title">
                Confirm Replacement
              </h2>
              <p className="name-conflict-dialog__description">
                Are you sure you want to replace the existing warband 
                <strong> "{existingWarbandName}"</strong>?
              </p>
            </div>

            <div className="name-conflict-dialog__content">
              <div className="name-conflict-dialog__confirmation-warning">
                <div className="name-conflict-dialog__warning-icon">⚠️</div>
                <div className="name-conflict-dialog__warning-text">
                  <p><strong>This action cannot be undone.</strong></p>
                  <p>The existing warband and all its data will be permanently deleted.</p>
                </div>
              </div>
            </div>

            <div className="name-conflict-dialog__actions">
              <button
                onClick={handleCancelReplace}
                className="name-conflict-dialog__button name-conflict-dialog__button--cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReplace}
                className="name-conflict-dialog__button name-conflict-dialog__button--confirm-replace"
                ref={confirmReplaceButtonRef}
                aria-label={`Confirm replacement of "${existingWarbandName}"`}
              >
                Yes, Replace It
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
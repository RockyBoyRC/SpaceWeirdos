import { useEffect, useRef } from 'react';
import './FileOperationStatus.css';

/**
 * FileOperationStatus Component
 * 
 * Displays real-time progress for file import/export operations.
 * Supports both determinate and indeterminate progress indicators,
 * cancellation options, and comprehensive accessibility features.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

export type FileOperationState = 
  | 'idle'
  | 'selecting'
  | 'reading'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'downloading'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface FileOperationStatusProps {
  /** Type of operation being performed */
  operation: 'import' | 'export';
  /** Current state of the operation */
  state: FileOperationState;
  /** Progress percentage (0-100) for determinate progress, undefined for indeterminate */
  progress?: number;
  /** Current status message */
  message?: string;
  /** Name of the file being processed */
  fileName?: string;
  /** Callback for cancellation (if cancellation is supported) */
  onCancel?: () => void;
}

export function FileOperationStatus({
  operation,
  state,
  progress,
  message,
  fileName,
  onCancel
}: FileOperationStatusProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Focus management for accessibility
   * Requirements: 4.3
   */
  useEffect(() => {
    // Focus the cancel button when operation starts (if available)
    if (state !== 'idle' && state !== 'complete' && state !== 'error' && onCancel) {
      cancelButtonRef.current?.focus();
    }
  }, [state, onCancel]);

  /**
   * Handle escape key for cancellation
   * Requirements: 4.2, 4.3
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onCancel && isCancellable(state)) {
        onCancel();
      }
    };

    if (state !== 'idle' && state !== 'complete' && state !== 'error') {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [state, onCancel]);

  /**
   * Determines if the current operation state allows cancellation
   * Requirements: 4.2
   */
  const isCancellable = (currentState: FileOperationState): boolean => {
    return currentState !== 'idle' && 
           currentState !== 'complete' && 
           currentState !== 'error' && 
           currentState !== 'cancelled' &&
           currentState !== 'downloading'; // Downloads typically can't be cancelled
  };

  /**
   * Gets the appropriate icon for the current state
   */
  const getStateIcon = (): string => {
    switch (state) {
      case 'complete':
        return '✓';
      case 'error':
        return '✕';
      case 'cancelled':
        return '⊘';
      case 'selecting':
        return '📁';
      case 'reading':
        return '📖';
      case 'validating':
        return '🔍';
      case 'uploading':
        return '⬆️';
      case 'processing':
        return '⚙️';
      case 'downloading':
        return '⬇️';
      default:
        return '⏳';
    }
  };

  /**
   * Gets the default message for the current state
   */
  const getDefaultMessage = (): string => {
    const operationType = operation === 'import' ? 'Importing' : 'Exporting';
    const fileText = fileName ? ` ${fileName}` : '';

    switch (state) {
      case 'idle':
        return `Ready to ${operation}`;
      case 'selecting':
        return 'Select a file to import';
      case 'reading':
        return `Reading file${fileText}...`;
      case 'validating':
        return `Validating${fileText}...`;
      case 'uploading':
        return `Uploading${fileText}...`;
      case 'processing':
        return `${operationType}${fileText}...`;
      case 'downloading':
        return `Downloading${fileText}...`;
      case 'complete':
        return `${operationType} completed successfully`;
      case 'error':
        return `${operationType} failed`;
      case 'cancelled':
        return `${operationType} cancelled`;
      default:
        return `${operationType}${fileText}...`;
    }
  };

  /**
   * Determines if progress should be shown
   */
  const shouldShowProgress = (): boolean => {
    return state !== 'idle' && 
           state !== 'complete' && 
           state !== 'error' && 
           state !== 'cancelled' &&
           state !== 'selecting';
  };

  /**
   * Gets CSS classes for the current state
   */
  const getStateClasses = (): string => {
    const baseClass = 'file-operation-status';
    const stateClass = `${baseClass}--${state}`;
    const operationClass = `${baseClass}--${operation}`;
    
    return `${baseClass} ${stateClass} ${operationClass}`;
  };

  // Don't render anything if idle
  if (state === 'idle') {
    return null;
  }

  const displayMessage = message || getDefaultMessage();
  const showProgress = shouldShowProgress();
  const canCancel = isCancellable(state) && onCancel;
  const isIndeterminate = progress === undefined;

  return (
    <div 
      className={getStateClasses()}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="file-operation-status__content">
        <div className="file-operation-status__header">
          <span 
            className="file-operation-status__icon" 
            aria-hidden="true"
          >
            {getStateIcon()}
          </span>
          <div className="file-operation-status__text">
            <div className="file-operation-status__message">
              {displayMessage}
            </div>
            {fileName && (
              <div className="file-operation-status__filename">
                {fileName}
              </div>
            )}
          </div>
        </div>

        {showProgress && (
          <div className="file-operation-status__progress-container">
            <div 
              className={`file-operation-status__progress ${
                isIndeterminate ? 'file-operation-status__progress--indeterminate' : ''
              }`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={isIndeterminate ? undefined : progress}
              aria-label={`${operation} progress`}
              ref={progressRef}
            >
              {!isIndeterminate && (
                <div 
                  className="file-operation-status__progress-fill"
                  style={{ width: `${progress}%` }}
                />
              )}
            </div>
            {!isIndeterminate && typeof progress === 'number' && (
              <span className="file-operation-status__progress-text">
                {Math.round(progress)}%
              </span>
            )}
          </div>
        )}
      </div>

      {canCancel && (
        <button
          className="file-operation-status__cancel"
          onClick={onCancel}
          ref={cancelButtonRef}
          aria-label={`Cancel ${operation} operation`}
          title="Press Escape or click to cancel"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
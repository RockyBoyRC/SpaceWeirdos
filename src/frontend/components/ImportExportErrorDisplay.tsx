import { useState, useEffect, useRef } from 'react';
import { ImportExportError, ValidationError, ImportExportErrorHandler } from '../services/ImportExportErrorHandler';
import './ImportExportErrorDisplay.css';

/**
 * ImportExportErrorDisplay Component
 * 
 * Displays categorized error information with field-specific details,
 * retry mechanisms, and user-friendly suggestions for import/export operations.
 * 
 * Requirements: 2.5, 4.4, 7.3, 7.4
 */

export interface ImportExportErrorDisplayProps {
  /** The error to display */
  error: ImportExportError;
  /** The operation that failed */
  operation: 'import' | 'export';
  /** Optional retry callback */
  onRetry?: () => void;
  /** Callback to dismiss the error display */
  onDismiss: () => void;
  /** Additional context for error display */
  context?: {
    fileName?: string;
    fileSize?: number;
    retryCount?: number;
  };
}

export function ImportExportErrorDisplay({
  error,
  operation,
  onRetry,
  onDismiss,
  context
}: ImportExportErrorDisplayProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const retryButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Focus management for accessibility
   * Requirements: 7.4
   */
  useEffect(() => {
    // Focus the error container when it appears
    errorRef.current?.focus();
  }, []);

  /**
   * Handle retry with loading state
   * Requirements: 4.4, 7.3
   */
  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Handle escape key to dismiss
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onDismiss]);

  /**
   * Get error icon based on type and severity
   */
  const getErrorIcon = (): string => {
    switch (error.type) {
      case 'NETWORK_ERROR':
        return '🌐';
      case 'FILE_READ_ERROR':
        return '📄';
      case 'VALIDATION_ERROR':
        return '⚠️';
      case 'SERVER_ERROR':
        return '🖥️';
      case 'TIMEOUT_ERROR':
        return '⏱️';
      case 'SECURITY_ERROR':
        return '🔒';
      default:
        return '❌';
    }
  };

  /**
   * Get CSS classes based on error type and severity
   */
  const getErrorClasses = (): string => {
    const baseClass = 'import-export-error';
    const typeClass = `${baseClass}--${error.type.toLowerCase().replace('_', '-')}`;
    const severityClass = `${baseClass}--${error.severity}`;
    
    return `${baseClass} ${typeClass} ${severityClass}`;
  };

  /**
   * Categorize validation errors for better display
   * Requirements: 2.5, 7.3
   */
  const categorizeValidationErrors = () => {
    if (!error.validationErrors || error.validationErrors.length === 0) {
      return null;
    }

    return ImportExportErrorHandler.categorizeValidationErrors(error.validationErrors);
  };

  /**
   * Render validation error category
   */
  const renderValidationCategory = (
    title: string, 
    errors: ValidationError[], 
    description: string
  ) => {
    if (errors.length === 0) return null;

    return (
      <div className="import-export-error__validation-category">
        <h4 className="import-export-error__category-title">
          {title} ({errors.length})
        </h4>
        <p className="import-export-error__category-description">
          {description}
        </p>
        <ul className="import-export-error__validation-list">
          {errors.map((validationError, index) => (
            <li key={index} className="import-export-error__validation-item">
              <strong>{validationError.field}:</strong> {validationError.message}
              {validationError.expected && (
                <div className="import-export-error__validation-details">
                  Expected: <code>{validationError.expected}</code>
                  {validationError.received !== undefined && (
                    <span>, Received: <code>{String(validationError.received)}</code></span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  /**
   * Render validation errors with categorization
   * Requirements: 2.5, 7.3
   */
  const renderValidationErrors = () => {
    const categorized = categorizeValidationErrors();
    if (!categorized) return null;

    return (
      <div className="import-export-error__validation-section">
        <h3 className="import-export-error__section-title">Validation Issues</h3>
        
        {renderValidationCategory(
          'Structural Issues',
          categorized.structural,
          'Problems with the file format or required fields'
        )}
        
        {renderValidationCategory(
          'Game Data Issues',
          categorized.gameData,
          'References to weapons, equipment, or abilities that no longer exist'
        )}
        
        {renderValidationCategory(
          'Rule Violations',
          categorized.businessLogic,
          'Warband configuration violates game rules'
        )}
        
        {renderValidationCategory(
          'Other Issues',
          categorized.other,
          'Additional validation problems'
        )}
      </div>
    );
  };

  /**
   * Get contextual suggestions
   * Requirements: 7.3, 7.4
   */
  const getContextualSuggestions = (): string[] => {
    return ImportExportErrorHandler.generateContextualSuggestions(
      error,
      operation,
      context
    );
  };

  /**
   * Render suggestions list
   */
  const renderSuggestions = () => {
    const suggestions = getContextualSuggestions();
    if (suggestions.length === 0) return null;

    return (
      <div className="import-export-error__suggestions">
        <h3 className="import-export-error__section-title">Suggestions</h3>
        <ul className="import-export-error__suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="import-export-error__suggestion-item">
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  /**
   * Render technical details section
   */
  const renderTechnicalDetails = () => {
    if (!showTechnicalDetails) return null;

    // Generate technical message manually since it's a private method
    let technicalMessage = `[${error.code || error.type}] ${error.message}`;
    
    if (error.details) {
      technicalMessage += ` | Details: ${error.details}`;
    }

    if (context) {
      const contextParts = [];
      if (context.fileName) contextParts.push(`file: ${context.fileName}`);
      if (context.fileSize) contextParts.push(`size: ${context.fileSize} bytes`);
      if (context.retryCount !== undefined) contextParts.push(`retries: ${context.retryCount}`);
      
      if (contextParts.length > 0) {
        technicalMessage += ` | Context: ${contextParts.join(', ')}`;
      }
    }

    if (error.originalError && error.originalError.stack) {
      technicalMessage += ` | Stack: ${error.originalError.stack}`;
    }

    return (
      <div className="import-export-error__technical">
        <h3 className="import-export-error__section-title">Technical Details</h3>
        <pre className="import-export-error__technical-message">
          {technicalMessage}
        </pre>
        {error.originalError?.stack && (
          <details className="import-export-error__stack-trace">
            <summary>Stack Trace</summary>
            <pre>{error.originalError.stack}</pre>
          </details>
        )}
      </div>
    );
  };

  const shouldShowTechnicalToggle = ImportExportErrorHandler.shouldShowTechnicalDetails(error);
  const operationText = operation === 'import' ? 'Import' : 'Export';

  return (
    <div 
      className={getErrorClasses()}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      ref={errorRef}
      tabIndex={-1}
    >
      <div className="import-export-error__header">
        <div className="import-export-error__title-section">
          <span className="import-export-error__icon" aria-hidden="true">
            {getErrorIcon()}
          </span>
          <div className="import-export-error__title-text">
            <h2 className="import-export-error__title">
              {operationText} Failed
            </h2>
            <p className="import-export-error__subtitle">
              {error.message}
            </p>
          </div>
        </div>
        <button
          className="import-export-error__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
          title="Press Escape or click to dismiss"
        >
          ×
        </button>
      </div>

      {error.details && (
        <div className="import-export-error__details">
          {error.details}
        </div>
      )}

      {renderValidationErrors()}
      {renderSuggestions()}

      <div className="import-export-error__actions">
        {error.retryable && onRetry && (
          <button
            className="import-export-error__retry"
            onClick={handleRetry}
            disabled={isRetrying}
            ref={retryButtonRef}
            aria-label={`Retry ${operation} operation`}
          >
            {isRetrying ? (
              <>
                <span className="import-export-error__retry-spinner" aria-hidden="true">
                  ⟳
                </span>
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </button>
        )}

        {shouldShowTechnicalToggle && (
          <button
            className="import-export-error__technical-toggle"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            aria-expanded={showTechnicalDetails}
            aria-controls="technical-details"
          >
            {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
          </button>
        )}
      </div>

      {renderTechnicalDetails()}
    </div>
  );
}
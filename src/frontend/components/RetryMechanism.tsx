import { useState, useCallback, useEffect } from 'react';
import './RetryMechanism.css';

/**
 * RetryMechanism Component
 * 
 * Provides intelligent retry functionality for failed operations.
 * Implements exponential backoff and retry limits.
 * 
 * Requirements: 4.4, 4.5, 5.5
 */

interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

interface RetryMechanismProps {
  onRetry: () => Promise<void>;
  config?: Partial<RetryConfig>;
  disabled?: boolean;
  className?: string;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

export function RetryMechanism({
  onRetry,
  config = {},
  disabled = false,
  className = ''
}: RetryMechanismProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);
  const [autoRetryEnabled, setAutoRetryEnabled] = useState(false);

  const finalConfig = { ...defaultConfig, ...config };

  /**
   * Calculate delay for next retry using exponential backoff
   */
  const calculateDelay = useCallback((attempt: number): number => {
    const delay = finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
    return Math.min(delay, finalConfig.maxDelay);
  }, [finalConfig]);

  /**
   * Handle manual retry
   */
  const handleManualRetry = useCallback(async () => {
    if (disabled || isRetrying || retryCount >= finalConfig.maxRetries) {
      return;
    }

    setIsRetrying(true);
    setNextRetryIn(null);

    try {
      await onRetry();
      // Success - reset retry count
      setRetryCount(0);
    } catch (error) {
      // Failure - increment retry count
      setRetryCount(prev => prev + 1);
      
      // If auto-retry is enabled and we haven't exceeded max retries, schedule next retry
      if (autoRetryEnabled && retryCount + 1 < finalConfig.maxRetries) {
        const delay = calculateDelay(retryCount + 1);
        setNextRetryIn(delay);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [disabled, isRetrying, retryCount, finalConfig.maxRetries, onRetry, autoRetryEnabled, calculateDelay]);

  /**
   * Handle auto retry countdown
   */
  useEffect(() => {
    if (nextRetryIn === null || !autoRetryEnabled) return;

    const interval = setInterval(() => {
      setNextRetryIn(prev => {
        if (prev === null || prev <= 1000) {
          // Time to retry
          handleManualRetry();
          return null;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRetryIn, autoRetryEnabled, handleManualRetry]);

  /**
   * Toggle auto-retry
   */
  const toggleAutoRetry = useCallback(() => {
    setAutoRetryEnabled(prev => !prev);
    if (!autoRetryEnabled && retryCount > 0 && retryCount < finalConfig.maxRetries) {
      // Start auto-retry countdown
      const delay = calculateDelay(retryCount);
      setNextRetryIn(delay);
    } else {
      setNextRetryIn(null);
    }
  }, [autoRetryEnabled, retryCount, finalConfig.maxRetries, calculateDelay]);

  /**
   * Reset retry state
   */
  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    setNextRetryIn(null);
    setAutoRetryEnabled(false);
  }, []);

  /**
   * Check if retry is available
   */
  const canRetry = retryCount < finalConfig.maxRetries && !disabled;

  /**
   * Format countdown time
   */
  const formatCountdown = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <div className={`retry-mechanism ${className}`}>
      <div className="retry-mechanism__info">
        <span className="retry-mechanism__count">
          Attempts: {retryCount}/{finalConfig.maxRetries}
        </span>
        {nextRetryIn && (
          <span className="retry-mechanism__countdown">
            Next retry in {formatCountdown(nextRetryIn)}
          </span>
        )}
      </div>

      <div className="retry-mechanism__actions">
        {canRetry && (
          <>
            <button
              className="retry-mechanism__manual-retry"
              onClick={handleManualRetry}
              disabled={isRetrying || nextRetryIn !== null}
              aria-label="Retry operation manually"
            >
              {isRetrying ? 'Retrying...' : 'Retry Now'}
            </button>

            <label className="retry-mechanism__auto-retry">
              <input
                type="checkbox"
                checked={autoRetryEnabled}
                onChange={toggleAutoRetry}
                disabled={isRetrying}
              />
              <span>Auto-retry</span>
            </label>
          </>
        )}

        {retryCount >= finalConfig.maxRetries && (
          <div className="retry-mechanism__exhausted">
            <span>Maximum retries reached</span>
            <button
              className="retry-mechanism__reset"
              onClick={reset}
              aria-label="Reset retry counter"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {nextRetryIn && (
        <div className="retry-mechanism__progress">
          <div 
            className="retry-mechanism__progress-bar"
            style={{
              width: `${100 - (nextRetryIn / calculateDelay(retryCount)) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing retry state
 */
export function useRetryMechanism(config?: Partial<RetryConfig>) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const finalConfig = { ...defaultConfig, ...config };

  const executeWithRetry = useCallback(async (
    operation: () => Promise<void>,
    onError?: (error: unknown, attempt: number) => void
  ) => {
    let attempt = 0;
    
    while (attempt <= finalConfig.maxRetries) {
      try {
        setIsRetrying(true);
        setRetryCount(attempt);
        
        await operation();
        
        // Success - reset and return
        setRetryCount(0);
        setIsRetrying(false);
        return;
        
      } catch (error) {
        attempt++;
        
        if (onError) {
          onError(error, attempt);
        }
        
        if (attempt > finalConfig.maxRetries) {
          setIsRetrying(false);
          throw error; // Re-throw the last error
        }
        
        // Wait before next retry (exponential backoff)
        const delay = finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1);
        const actualDelay = Math.min(delay, finalConfig.maxDelay);
        
        await new Promise(resolve => setTimeout(resolve, actualDelay));
      }
    }
  }, [finalConfig]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retryCount,
    isRetrying,
    executeWithRetry,
    reset,
    canRetry: retryCount < finalConfig.maxRetries
  };
}
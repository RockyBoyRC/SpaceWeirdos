/**
 * Toast Service
 * 
 * Enhanced toast notification service for import/export operations.
 * Provides success, error, and progress notifications with retry options.
 * 
 * Requirements: 4.3, 4.4
 */

import { ImportExportError, ImportExportErrorHandler } from './ImportExportErrorHandler';

export type ToastType = 'success' | 'error' | 'progress' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  progress?: number;
  canRetry?: boolean;
  onRetry?: () => void;
  suggestions?: string[];
  showTechnicalDetails?: boolean;
  technicalDetails?: string;
}

export interface ToastServiceState {
  toasts: ToastMessage[];
}

/**
 * Toast Service for managing import/export notifications
 */
export class ToastService {
  private static instance: ToastService;
  private listeners: ((state: ToastServiceState) => void)[] = [];
  private state: ToastServiceState = { toasts: [] };
  private nextId = 1;

  static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  /**
   * Subscribe to toast state changes
   */
  subscribe(listener: (state: ToastServiceState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current state
   */
  getState(): ToastServiceState {
    return this.state;
  }

  /**
   * Notify all listeners of state changes
   */
  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Add a toast message
   */
  private addToast(toast: Omit<ToastMessage, 'id'>): string {
    const id = `toast-${this.nextId++}`;
    const newToast: ToastMessage = { ...toast, id };
    
    this.state = {
      ...this.state,
      toasts: [...this.state.toasts, newToast]
    };
    
    this.notify();

    // Auto-dismiss after duration (except for error toasts with retry)
    if (toast.duration !== 0 && !(toast.type === 'error' && toast.canRetry)) {
      const duration = toast.duration || (toast.type === 'error' ? 6000 : 4000);
      setTimeout(() => {
        this.dismissToast(id);
      }, duration);
    }

    return id;
  }

  /**
   * Dismiss a toast message
   */
  dismissToast(id: string): void {
    this.state = {
      ...this.state,
      toasts: this.state.toasts.filter(toast => toast.id !== id)
    };
    this.notify();
  }

  /**
   * Clear all toast messages
   */
  clearAll(): void {
    this.state = { toasts: [] };
    this.notify();
  }

  /**
   * Show success notification for import/export operations
   * Requirements: 4.3
   */
  showImportExportSuccess(operation: 'import' | 'export', warbandName: string): string {
    const operationText = operation === 'import' ? 'Import' : 'Export';
    return this.addToast({
      type: 'success',
      title: `${operationText} Successful`,
      message: `"${warbandName}" ${operation}ed successfully!`,
      duration: 4000
    });
  }

  /**
   * Show error notification for import/export operations with retry options
   * Requirements: 4.4
   */
  showImportExportError(
    operation: 'import' | 'export',
    error: ImportExportError,
    context?: { fileName?: string; fileSize?: number; retryCount?: number },
    onRetry?: () => void
  ): string {
    const userFriendlyMessage = ImportExportErrorHandler.createUserFriendlyMessage(
      error,
      operation,
      context
    );

    return this.addToast({
      type: 'error',
      title: userFriendlyMessage.title,
      message: userFriendlyMessage.message,
      duration: userFriendlyMessage.canRetry ? 0 : 8000, // Don't auto-dismiss if retry is available
      canRetry: userFriendlyMessage.canRetry,
      onRetry,
      suggestions: userFriendlyMessage.suggestions,
      showTechnicalDetails: userFriendlyMessage.showTechnicalDetails,
      technicalDetails: error.details
    });
  }

  /**
   * Show progress notification for long-running operations
   * Requirements: 4.3
   */
  showImportExportProgress(
    operation: 'import' | 'export',
    message: string,
    progress?: number
  ): string {
    const operationText = operation === 'import' ? 'Import' : 'Export';
    return this.addToast({
      type: 'progress',
      title: `${operationText} in Progress`,
      message,
      duration: 0, // Don't auto-dismiss progress notifications
      progress
    });
  }

  /**
   * Update progress for an existing toast
   */
  updateProgress(id: string, progress: number, message?: string): void {
    this.state = {
      ...this.state,
      toasts: this.state.toasts.map(toast => 
        toast.id === id 
          ? { ...toast, progress, message: message || toast.message }
          : toast
      )
    };
    this.notify();
  }

  /**
   * Show general success notification
   */
  showSuccess(title: string, message: string, duration = 4000): string {
    return this.addToast({
      type: 'success',
      title,
      message,
      duration
    });
  }

  /**
   * Show general error notification
   */
  showError(title: string, message: string, duration = 6000, onRetry?: () => void): string {
    return this.addToast({
      type: 'error',
      title,
      message,
      duration: onRetry ? 0 : duration,
      canRetry: !!onRetry,
      onRetry
    });
  }

  /**
   * Show info notification
   */
  showInfo(title: string, message: string, duration = 4000): string {
    return this.addToast({
      type: 'info',
      title,
      message,
      duration
    });
  }

  /**
   * Convert generic error to import/export error and show notification
   */
  showGenericImportExportError(
    operation: 'import' | 'export',
    error: unknown,
    context?: { fileName?: string; fileSize?: number },
    onRetry?: () => void
  ): string {
    const classification = ImportExportErrorHandler.classifyError(error, operation, context);
    return this.showImportExportError(operation, classification.error, context, onRetry);
  }
}

/**
 * Hook for using toast service in React components
 */
export function useToastService() {
  return ToastService.getInstance();
}
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileOperationStatus } from '../src/frontend/components/FileOperationStatus';

/**
 * FileOperationStatus Component Tests
 * 
 * Tests for file operation progress tracking component.
 * Verifies state management, progress display, and cancellation functionality.
 */

describe('FileOperationStatus', () => {
  it('should not render when state is idle', () => {
    const { container } = render(
      <FileOperationStatus
        operation="import"
        state="idle"
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render progress indicator for active operations', () => {
    render(
      <FileOperationStatus
        operation="import"
        state="processing"
        progress={50}
        message="Processing warband..."
        fileName="test-warband.json"
      />
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Processing warband...')).toBeInTheDocument();
    expect(screen.getByText('test-warband.json')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should show indeterminate progress when progress is undefined', () => {
    render(
      <FileOperationStatus
        operation="export"
        state="validating"
        message="Validating data..."
      />
    );
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('file-operation-status__progress--indeterminate');
    expect(progressBar).not.toHaveAttribute('aria-valuenow');
  });

  it('should render cancel button when onCancel is provided and state is cancellable', () => {
    const mockCancel = vi.fn();
    
    render(
      <FileOperationStatus
        operation="import"
        state="processing"
        onCancel={mockCancel}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel import operation/i });
    expect(cancelButton).toBeInTheDocument();
    
    fireEvent.click(cancelButton);
    expect(mockCancel).toHaveBeenCalledOnce();
  });

  it('should not render cancel button for non-cancellable states', () => {
    const mockCancel = vi.fn();
    
    render(
      <FileOperationStatus
        operation="export"
        state="downloading"
        onCancel={mockCancel}
      />
    );
    
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('should show appropriate state styling for completed operations', () => {
    render(
      <FileOperationStatus
        operation="import"
        state="complete"
        message="Import completed successfully"
      />
    );
    
    const container = screen.getByRole('status');
    expect(container).toHaveClass('file-operation-status--complete');
    expect(screen.getByText('Import completed successfully')).toBeInTheDocument();
  });

  it('should show appropriate state styling for error operations', () => {
    render(
      <FileOperationStatus
        operation="export"
        state="error"
        message="Export failed"
      />
    );
    
    const container = screen.getByRole('status');
    expect(container).toHaveClass('file-operation-status--error');
    expect(screen.getByText('Export failed')).toBeInTheDocument();
  });

  it('should use default message when no message is provided', () => {
    render(
      <FileOperationStatus
        operation="import"
        state="reading"
        fileName="warband.json"
      />
    );
    
    expect(screen.getByText('Reading file warband.json...')).toBeInTheDocument();
  });

  it('should handle escape key for cancellation', () => {
    const mockCancel = vi.fn();
    
    render(
      <FileOperationStatus
        operation="import"
        state="processing"
        onCancel={mockCancel}
      />
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockCancel).toHaveBeenCalledOnce();
  });
});
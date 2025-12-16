/**
 * Tests for useKeyboardShortcuts Hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHandler = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register and trigger a simple keyboard shortcut', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        shortcuts: {
          'ctrl+z': mockHandler,
        },
      })
    );

    // Simulate Ctrl+Z
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({ key: 'z', ctrlKey: true }));
  });

  it('should not trigger shortcut when disabled', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: false,
        shortcuts: {
          'ctrl+z': mockHandler,
        },
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should handle Cmd (Meta) key on Mac', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        shortcuts: {
          'ctrl+z': mockHandler,
        },
      })
    );

    // Simulate Cmd+Z (Mac)
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should handle Shift modifier', () => {
    const shiftHandler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        shortcuts: {
          'ctrl+shift+z': shiftHandler,
        },
      })
    );

    // Simulate Ctrl+Shift+Z
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(shiftHandler).toHaveBeenCalledTimes(1);
  });

  it('should not trigger shortcut in input fields', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        shortcuts: {
          'ctrl+z': mockHandler,
        },
      })
    );

    // Create a mock input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    input.dispatchEvent(event);

    expect(mockHandler).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should handle delete key', () => {
    const deleteHandler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        shortcuts: {
          'delete': deleteHandler,
        },
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(deleteHandler).toHaveBeenCalledTimes(1);
  });

  it('should handle escape key', () => {
    const escapeHandler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        shortcuts: {
          'escape': escapeHandler,
        },
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(escapeHandler).toHaveBeenCalledTimes(1);
  });

  it('should respect shouldDisable callback', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        shortcuts: {
          'ctrl+z': mockHandler,
        },
        shouldDisable: () => true, // Always disabled
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should handle multiple shortcuts', () => {
    const undoHandler = vi.fn();
    const redoHandler = vi.fn();
    const copyHandler = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        shortcuts: {
          'ctrl+z': undoHandler,
          'ctrl+y': redoHandler,
          'ctrl+c': copyHandler,
        },
      })
    );

    // Test Ctrl+Z
    const undoEvent = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(undoEvent);
    expect(undoHandler).toHaveBeenCalledTimes(1);

    // Test Ctrl+Y
    const redoEvent = new KeyboardEvent('keydown', {
      key: 'y',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(redoEvent);
    expect(redoHandler).toHaveBeenCalledTimes(1);

    // Test Ctrl+C
    const copyEvent = new KeyboardEvent('keydown', {
      key: 'c',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(copyEvent);
    expect(copyHandler).toHaveBeenCalledTimes(1);
  });
});


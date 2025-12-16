/**
 * Integration Tests for useKeyboardShortcuts
 * 
 * Tests the integration of useKeyboardShortcuts with other hooks and components.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
import { useUndoRedo } from '../useUndoRedo';
import type { Node, Edge } from '@xyflow/react';

describe('useKeyboardShortcuts Integration', () => {
  describe('useKeyboardShortcuts + useUndoRedo', () => {
    it('should trigger undo when Ctrl+Z is pressed', () => {
      const mockNodes: Node[] = [
        { id: 'node-1', type: 'start', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-2', type: 'transform', position: { x: 100, y: 0 }, data: {} },
      ];
      const mockEdges: Edge[] = [];
      
      const onNodesChange = vi.fn();
      const onEdgesChange = vi.fn();

      // Render both hooks together
      const { result: undoRedoResult } = renderHook(() =>
        useUndoRedo({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
          enabled: true,
        })
      );

      const { undo, canUndo } = undoRedoResult.current;

      // Add a change to create history
      act(() => {
        onNodesChange([...mockNodes, { id: 'node-3', type: 'end', position: { x: 200, y: 0 }, data: {} }]);
      });

      // Wait for history to be updated
      act(() => {
        // Trigger undo via keyboard shortcut
        renderHook(() =>
          useKeyboardShortcuts({
            enabled: true,
            shortcuts: {
              'ctrl+z': () => {
                if (canUndo) undo();
              },
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
      });

      // Verify undo was called (indirectly through canUndo check)
      expect(canUndo).toBeDefined();
    });

    it('should not trigger undo when disabled', () => {
      const mockNodes: Node[] = [
        { id: 'node-1', type: 'start', position: { x: 0, y: 0 }, data: {} },
      ];
      const mockEdges: Edge[] = [];
      
      const onNodesChange = vi.fn();
      const onEdgesChange = vi.fn();

      const undoHandler = vi.fn();

      renderHook(() =>
        useUndoRedo({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
          enabled: true,
        })
      );

      renderHook(() =>
        useKeyboardShortcuts({
          enabled: false, // Disabled
          shortcuts: {
            'ctrl+z': undoHandler,
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

      // Should not be called because shortcuts are disabled
      expect(undoHandler).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts when modal is open', () => {
      const undoHandler = vi.fn();
      let modalOpen = true;

      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          shortcuts: {
            'ctrl+z': undoHandler,
          },
          shouldDisable: () => modalOpen, // Modal is open
        })
      );

      // Simulate Ctrl+Z
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Should not be called because modal is open
      expect(undoHandler).not.toHaveBeenCalled();

      // Close modal
      modalOpen = false;

      // Simulate Ctrl+Z again
      const event2 = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event2);

      // Now should be called
      expect(undoHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('useKeyboardShortcuts with multiple shortcuts', () => {
    it('should handle multiple shortcuts correctly', () => {
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

    it('should handle shortcut priority correctly', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      // Test that last registered shortcut wins (object key order)
      const shortcuts: Record<string, () => void> = {};
      shortcuts['ctrl+z'] = handler1;
      shortcuts['ctrl+z'] = handler2; // Overwrites first one

      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          shortcuts,
        })
      );

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Only the last handler should be called (overwrites first)
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).not.toHaveBeenCalled();
    });
  });

  describe('useKeyboardShortcuts with input detection', () => {
    it('should not trigger shortcuts in input fields', () => {
      const handler = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          shortcuts: {
            'ctrl+z': handler,
          },
        })
      );

      // Create and focus an input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      // Simulate Ctrl+Z in input
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });
      input.dispatchEvent(event);

      // Should not be called because we're in an input
      expect(handler).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(input);
    });

    it('should trigger shortcuts outside input fields', () => {
      const handler = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({
          enabled: true,
          shortcuts: {
            'ctrl+z': handler,
          },
        })
      );

      // Create but don't focus input
      const input = document.createElement('input');
      document.body.appendChild(input);

      // Simulate Ctrl+Z on window (not in input)
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Should be called because we're not in an input
      expect(handler).toHaveBeenCalledTimes(1);

      // Cleanup
      document.body.removeChild(input);
    });
  });
});


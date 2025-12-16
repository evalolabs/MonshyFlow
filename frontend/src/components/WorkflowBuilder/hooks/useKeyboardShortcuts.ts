/**
 * useKeyboardShortcuts Hook
 * 
 * Centralized keyboard shortcut management for the workflow builder.
 * Handles all keyboard events and provides a clean API for registering shortcuts.
 * 
 * Features:
 * - Input/Textarea detection (prevents shortcuts in form fields)
 * - Modal/Popup detection (prevents shortcuts when modals are open)
 * - Conflict resolution for multiple handlers
 * - Support for Ctrl (Windows/Linux) and Cmd (Mac) modifiers
 * 
 * Usage:
 * ```tsx
 * useKeyboardShortcuts({
 *   enabled: true,
 *   shortcuts: {
 *     'ctrl+z': () => undo(),
 *     'ctrl+y': () => redo(),
 *     'ctrl+c': () => copyNodes(),
 *     'ctrl+v': () => pasteNodes(),
 *     'delete': () => deleteNodes(),
 *   }
 * });
 * ```
 */

import { useEffect, useRef } from 'react';

export type KeyboardShortcut = string; // e.g., 'ctrl+z', 'ctrl+shift+z', 'delete', 'escape'
export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface UseKeyboardShortcutsProps {
  /**
   * Whether keyboard shortcuts are enabled
   */
  enabled?: boolean;
  
  /**
   * Map of keyboard shortcuts to their handlers
   * Format: 'modifier+key' or just 'key'
   * Examples: 'ctrl+z', 'ctrl+shift+c', 'delete', 'escape'
   */
  shortcuts: Record<KeyboardShortcut, ShortcutHandler>;
  
  /**
   * Optional: Custom function to check if shortcuts should be disabled
   * (e.g., when a modal is open)
   */
  shouldDisable?: () => boolean;
  
  /**
   * Optional: Custom function to check if the target element should allow shortcuts
   * Default: Blocks shortcuts in INPUT, TEXTAREA, and contenteditable elements
   */
  shouldBlockTarget?: (target: HTMLElement) => boolean;
}

/**
 * Normalize keyboard shortcut string to a consistent format
 */
function normalizeShortcut(shortcut: string): string {
  return shortcut.toLowerCase().trim().replace(/\s+/g, '');
}

/**
 * Parse a keyboard shortcut string into modifiers and key
 */
function parseShortcut(shortcut: string): {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
} {
  const normalized = normalizeShortcut(shortcut);
  const parts = normalized.split('+');
  
  let ctrl = false;
  let shift = false;
  let alt = false;
  let meta = false;
  let key = '';
  
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'ctrl' || lower === 'control') {
      ctrl = true;
    } else if (lower === 'shift') {
      shift = true;
    } else if (lower === 'alt') {
      alt = true;
    } else if (lower === 'meta' || lower === 'cmd' || lower === 'command') {
      meta = true;
    } else {
      key = part;
    }
  }
  
  return { ctrl, shift, alt, meta, key };
}

/**
 * Check if a keyboard event matches a shortcut pattern
 */
function matchesShortcut(
  event: KeyboardEvent,
  pattern: { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean; key: string }
): boolean {
  // Handle Ctrl (Windows/Linux) and Cmd (Mac) as equivalent
  // If pattern specifies ctrl, accept either ctrl or meta (for Mac compatibility)
  // If pattern specifies meta, only accept meta
  const hasCtrlModifier = pattern.ctrl;
  const hasMetaModifier = pattern.meta;
  const hasModifier = hasCtrlModifier || hasMetaModifier;
  
  // For ctrl shortcuts, accept either ctrl or meta (Mac compatibility)
  // For meta shortcuts, only accept meta
  let modifierPressed = false;
  if (hasCtrlModifier) {
    modifierPressed = event.ctrlKey || event.metaKey; // Accept both for ctrl shortcuts
  } else if (hasMetaModifier) {
    modifierPressed = event.metaKey; // Only meta for meta shortcuts
  }
  
  // If shortcut requires modifier, check if modifier is pressed
  if (hasModifier) {
    if (!modifierPressed) return false;
  } else {
    // If shortcut doesn't require modifier, ensure no modifier is pressed (unless explicitly required)
    if (pattern.shift && !event.shiftKey) return false;
    if (pattern.alt && !event.altKey) return false;
    if (!pattern.shift && event.shiftKey && pattern.key !== 'shift') return false;
    if (!pattern.alt && event.altKey && pattern.key !== 'alt') return false;
    if ((event.ctrlKey || event.metaKey) && !hasModifier) return false;
  }
  
  // Check shift
  if (pattern.shift !== event.shiftKey && pattern.key !== 'shift') {
    return false;
  }
  
  // Check alt
  if (pattern.alt !== event.altKey && pattern.key !== 'alt') {
    return false;
  }
  
  // Check key (case-insensitive)
  const eventKey = event.key.toLowerCase();
  const patternKey = pattern.key.toLowerCase();
  
  // Handle special keys
  if (patternKey === 'delete' || patternKey === 'del') {
    return eventKey === 'delete' || eventKey === 'backspace';
  }
  
  if (patternKey === 'backspace') {
    return eventKey === 'backspace';
  }
  
  if (patternKey === 'escape' || patternKey === 'esc') {
    return eventKey === 'escape';
  }
  
  if (patternKey === 'enter' || patternKey === 'return') {
    return eventKey === 'enter';
  }
  
  return eventKey === patternKey;
}

/**
 * Default function to check if target should block shortcuts
 */
function defaultShouldBlockTarget(target: HTMLElement): boolean {
  // Safety check: if target is null or doesn't have tagName, allow shortcuts
  if (!target || !target.tagName) {
    return false;
  }
  
  const tagName = target.tagName.toLowerCase();
  
  // Block shortcuts in form elements
  if (tagName === 'input' || tagName === 'textarea') {
    return true;
  }
  
  // Block shortcuts in contenteditable elements
  if (target.isContentEditable) {
    return true;
  }
  
  // Allow shortcuts in other elements
  return false;
}

export function useKeyboardShortcuts({
  enabled = true,
  shortcuts,
  shouldDisable,
  shouldBlockTarget = defaultShouldBlockTarget,
}: UseKeyboardShortcutsProps): void {
  const shortcutsRef = useRef(shortcuts);
  const shouldDisableRef = useRef(shouldDisable);
  const shouldBlockTargetRef = useRef(shouldBlockTarget);
  
  // Keep refs up to date
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    shouldDisableRef.current = shouldDisable;
    shouldBlockTargetRef.current = shouldBlockTarget;
  }, [shortcuts, shouldDisable, shouldBlockTarget]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if shortcuts should be disabled (e.g., modal is open)
      if (shouldDisableRef.current?.()) {
        return;
      }
      
      // Check if target should block shortcuts
      const target = event.target as HTMLElement | null;
      if (target && shouldBlockTargetRef.current(target)) {
        return;
      }
      
      // Try to match event against all registered shortcuts
      for (const [shortcutString, handler] of Object.entries(shortcutsRef.current)) {
        const pattern = parseShortcut(shortcutString);
        
        if (matchesShortcut(event, pattern)) {
          event.preventDefault();
          event.stopPropagation();
          handler(event);
          return; // Only handle first matching shortcut
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase for better control
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled]);
}


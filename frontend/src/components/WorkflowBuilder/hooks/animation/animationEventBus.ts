/**
 * Animation Event Bus
 * 
 * Abstracts event handling for animations.
 * Allows for easy testing and future extensions (loops, conditionals, parallel).
 * 
 * Extension Points:
 * - Can be extended with loop event handlers
 * - Can be extended with conditional branch handlers
 * - Can be extended with parallel execution handlers
 */

import type { SSEConnection } from '../../../../services/sseService';
import type { AnimationEventType } from './animationStateMachine';

/**
 * Event Bus Handler
 */
export type EventHandler = (payload: any) => void;

/**
 * Event Bus Interface
 * 
 * This interface allows for easy mocking in tests and future extensions.
 */
export interface IAnimationEventBus {
  /**
   * Register an event handler
   */
  on(event: AnimationEventType, handler: EventHandler): void;

  /**
   * Unregister an event handler
   */
  off(event: AnimationEventType, handler: EventHandler): void;

  /**
   * Emit an event
   */
  emit(event: AnimationEventType, payload?: any): void;

  /**
   * Check if event bus is connected
   */
  isConnected(): boolean;

  /**
   * Disconnect event bus
   */
  disconnect(): void;
}

/**
 * SSE Event Bus Adapter
 * 
 * Adapts SSEConnection to IAnimationEventBus interface.
 */
export class SSEAnimationEventBus implements IAnimationEventBus {
  private sseConnection: SSEConnection | null;
  private handlers: Map<AnimationEventType, Set<EventHandler>> = new Map();
  private bufferedEvents: Map<string, any[]> = new Map(); // Buffer for early events

  constructor(sseConnection: SSEConnection | null) {
    this.sseConnection = sseConnection;
    this.setupSSEHandlers();
  }

  /**
   * Setup SSE event handlers
   */
  private setupSSEHandlers(): void {
    if (!this.sseConnection) return;

    // Handle node.start events
    this.sseConnection.on('node.start', (event: any) => {
      const nodeId = event.data?.node_id || event.data?.nodeId;
      this.emit('node_start_received', { nodeId, event });
    });

    // Handle node.end events
    this.sseConnection.on('node.end', (event: any) => {
      const nodeId = event.data?.node_id || event.data?.nodeId;
      this.emit('node_end_received', { nodeId, event });
    });
  }

  /**
   * Register an event handler
   */
  on(event: AnimationEventType, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  /**
   * Unregister an event handler
   */
  off(event: AnimationEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event
   */
  emit(event: AnimationEventType, payload?: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          // Error handling without logging
        }
      });
    }
  }

  /**
   * Buffer an event for later processing
   * 
   * Extension Point: Can be used for loop iterations, conditional branches, etc.
   */
  bufferEvent(key: string, event: AnimationEventType, payload: any): void {
    if (!this.bufferedEvents.has(key)) {
      this.bufferedEvents.set(key, []);
    }
    this.bufferedEvents.get(key)!.push({ event, payload });
  }

  /**
   * Get and clear buffered events for a key
   */
  getBufferedEvents(key: string): Array<{ event: AnimationEventType; payload: any }> {
    const events = this.bufferedEvents.get(key) || [];
    this.bufferedEvents.delete(key);
    return events;
  }

  /**
   * Check if there are buffered events for a key
   */
  hasBufferedEvents(key: string): boolean {
    return (this.bufferedEvents.get(key)?.length || 0) > 0;
  }

  /**
   * Check if event bus is connected
   */
  isConnected(): boolean {
    return this.sseConnection !== null;
  }

  /**
   * Disconnect event bus
   */
  disconnect(): void {
    // SSEConnection cleanup is handled by the connection itself
    this.handlers.clear();
    this.bufferedEvents.clear();
    this.sseConnection = null;
  }
}

/**
 * Mock Event Bus for Testing
 */
export class MockAnimationEventBus implements IAnimationEventBus {
  private handlers: Map<AnimationEventType, Set<EventHandler>> = new Map();
  private emittedEvents: Array<{ event: AnimationEventType; payload?: any }> = [];

  on(event: AnimationEventType, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: AnimationEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: AnimationEventType, payload?: any): void {
    this.emittedEvents.push({ event, payload });
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          // Error handling without logging
        }
      });
    }
  }

  isConnected(): boolean {
    return true; // Mock is always "connected"
  }

  disconnect(): void {
    this.handlers.clear();
    this.emittedEvents = [];
  }

  /**
   * Get all emitted events (for testing)
   */
  getEmittedEvents(): Array<{ event: AnimationEventType; payload?: any }> {
    return [...this.emittedEvents];
  }

  /**
   * Clear emitted events (for testing)
   */
  clearEmittedEvents(): void {
    this.emittedEvents = [];
  }
}


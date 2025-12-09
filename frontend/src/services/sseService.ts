/**
 * Server-Sent Events (SSE) Service
 * 
 * Handles real-time streaming updates from the backend
 */

export interface SSEEvent {
  type: string;
  data: any;
}

export type SSEHandler = (event: SSEEvent) => void;
export type SSEErrorHandler = (error: Error) => void;

export class SSEConnection {
  private eventSource: EventSource | null = null;
  private handlers: Map<string, SSEHandler[]> = new Map();
  private errorHandlers: SSEErrorHandler[] = [];
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to SSE endpoint
   */
  connect(): void {
    if (this.eventSource) {
      console.warn('SSE already connected');
      return;
    }

    console.log('📡 Connecting to SSE:', this.url);
    this.eventSource = new EventSource(this.url);

    // Listen to all event types
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    // Custom event listeners
    ['run.created', 'run.started', 'run.completed', 'run.failed', 'run.cancelled',
     'node.start', 'node.end', 'message.delta', 'tool.call', 'tool.result', 'progress'].forEach(eventType => {
      this.eventSource!.addEventListener(eventType, (event: any) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(eventType, data);
        } catch (error) {
          console.error(`Failed to parse ${eventType} event:`, error);
        }
      });
    });

    // Error handling
    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.errorHandlers.forEach(handler => handler(new Error('SSE connection error')));
      
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        console.log('🔄 Reconnecting SSE...');
        this.disconnect();
        this.connect();
      }, 3000);
    };

    // Connection opened
    this.eventSource.onopen = () => {
      console.log('✅ SSE connected');
    };
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: SSEHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Register error handler
   */
  onError(handler: SSEErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Emit event to handlers
   */
  private emit(eventType: string, data: any): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.forEach(handler => {
      try {
        handler({ type: eventType, data });
      } catch (error) {
        console.error(`Error in ${eventType} handler:`, error);
      }
    });
  }

  /**
   * Disconnect from SSE
   */
  disconnect(): void {
    if (this.eventSource) {
      console.log('👋 Disconnecting SSE');
      this.eventSource.close();
      this.eventSource = null;
    }
    this.handlers.clear();
    this.errorHandlers = [];
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}

/**
 * Create SSE connection
 */
export function createSSEConnection(url: string): SSEConnection {
  return new SSEConnection(url);
}


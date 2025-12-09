/**
 * Events Controller
 * 
 * Provides SSE endpoint for streaming Redis events to frontend
 * Used for real-time animation during node tests and workflow execution
 */

import { Request, Response } from 'express';
import { createClient, RedisClientType } from 'redis';
import { config } from '../config/config';

// Global Redis subscriber for events (shared across all SSE connections)
let globalSubscriber: RedisClientType | null = null;
const eventHandlers: Map<string, Set<(data: any) => void>> = new Map();

/**
 * Initialize global Redis subscriber for events
 */
async function initializeGlobalSubscriber(): Promise<void> {
    if (globalSubscriber) return;

    globalSubscriber = createClient({ url: config.redisUrl });
    await globalSubscriber.connect();
    console.log('[EventsController] ✅ Global Redis subscriber connected');

    // Subscribe to channels using PubSubListener
    // The listener receives (message, channel) parameters
    await globalSubscriber.subscribe('node.start', (message: string, channel: string) => {
        console.log('[EventsController] 📥 Received node.start message from Redis channel:', channel);
        try {
            const data = JSON.parse(message);
            console.log('[EventsController] 📥 Parsed node.start data:', JSON.stringify(data, null, 2));
            const handlers = eventHandlers.get('node.start') || new Set();
            console.log('[EventsController] 📥 Found', handlers.size, 'handlers for node.start');
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[EventsController] Error in node.start handler:', error);
                }
            });
        } catch (error) {
            console.error('[EventsController] Error parsing node.start event:', error, 'Raw message:', message);
        }
    });

    await globalSubscriber.subscribe('node.end', (message: string, channel: string) => {
        console.log('[EventsController] 📥 Received node.end message from Redis channel:', channel);
        try {
            const data = JSON.parse(message);
            console.log('[EventsController] 📥 Parsed node.end data:', JSON.stringify(data, null, 2));
            const handlers = eventHandlers.get('node.end') || new Set();
            console.log('[EventsController] 📥 Found', handlers.size, 'handlers for node.end');
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[EventsController] Error in node.end handler:', error);
                }
            });
        } catch (error) {
            console.error('[EventsController] Error parsing node.end event:', error, 'Raw message:', message);
        }
    });

    console.log('[EventsController] ✅ Subscribed to node.start and node.end channels');
}

/**
 * SSE endpoint for streaming Redis events
 * GET /api/events/stream
 * 
 * Streams all node.start and node.end events from Redis to frontend
 */
export async function streamEvents(req: Request, res: Response): Promise<void> {
    // Initialize global subscriber if not already done
    await initializeGlobalSubscriber();

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    console.log('[EventsController] 📡 New SSE connection for events stream');

    // Send initial connection event
    sendSSE(res, 'connected', {
        message: 'Connected to events stream',
        timestamp: new Date().toISOString()
    });

    // Create event handlers for this connection
    const nodeStartHandler = (data: any) => {
        try {
            console.log('[EventsController] 📤 Sending node.start SSE event to client:', data.nodeId);
            sendSSE(res, 'node.start', data);
            console.log('[EventsController] ✅ Successfully sent node.start SSE event to client');
        } catch (error) {
            console.error('[EventsController] ❌ Error sending node.start SSE event:', error);
        }
    };

    const nodeEndHandler = (data: any) => {
        try {
            console.log('[EventsController] 📤 Sending node.end SSE event to client:', data.nodeId, 'duration:', data.duration);
            sendSSE(res, 'node.end', data);
            console.log('[EventsController] ✅ Successfully sent node.end SSE event to client');
        } catch (error) {
            console.error('[EventsController] ❌ Error sending node.end SSE event:', error);
        }
    };

    // Register handlers
    if (!eventHandlers.has('node.start')) {
        eventHandlers.set('node.start', new Set());
    }
    if (!eventHandlers.has('node.end')) {
        eventHandlers.set('node.end', new Set());
    }
    eventHandlers.get('node.start')!.add(nodeStartHandler);
    eventHandlers.get('node.end')!.add(nodeEndHandler);

    // Keep connection alive with periodic ping
    const keepAliveInterval = setInterval(() => {
        try {
            sendSSE(res, 'ping', { timestamp: new Date().toISOString() });
        } catch (error) {
            clearInterval(keepAliveInterval);
        }
    }, 30000); // Every 30 seconds

    // Handle client disconnect
    req.on('close', () => {
        console.log('[EventsController] 👋 Client disconnected from events stream');
        clearInterval(keepAliveInterval);
        // Remove handlers
        eventHandlers.get('node.start')?.delete(nodeStartHandler);
        eventHandlers.get('node.end')?.delete(nodeEndHandler);
        res.end();
    });
}

/**
 * Send SSE event
 */
function sendSSE(res: Response, event: string, data: any): void {
    try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
        console.error(`[EventsController] Error sending SSE event ${event}:`, error);
    }
}


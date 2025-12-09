/**
 * Debug Panel Test Component
 * 
 * Simple test component to verify the Debug Panel works
 */

import { useState } from 'react';
import { DebugPanel } from './DebugPanel';
import type { ExecutionStep } from '../../types/workflow';

// Mock debug steps for testing
const mockDebugSteps: ExecutionStep[] = [
  {
    nodeId: 'start',
    nodeType: 'start',
    status: 'completed',
    input: { message: 'Workflow started' },
    output: { message: 'Workflow started' },
    debugInfo: {
      inputSchema: { type: 'object', keys: ['message'], keyCount: 1 },
      outputSchema: { type: 'object', keys: ['message'], keyCount: 1 },
      inputPreview: '{"message": "Workflow started"}',
      outputPreview: '{"message": "Workflow started"}',
      dataType: 'object',
      size: 32
    },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    duration: 0
  },
  {
    nodeId: 'api-call',
    nodeType: 'api',
    status: 'completed',
    input: { message: 'Workflow started' },
    output: {
      id: 1,
      title: 'Sample API Response',
      body: 'This is a sample response from the API',
      userId: 123,
      data: {
        timestamp: '2024-01-15T10:30:00Z',
        status: 'success',
        metadata: {
          version: '1.0',
          source: 'external-api'
        }
      }
    },
    debugInfo: {
      inputSchema: { 
        type: 'object', 
        keys: ['message'], 
        keyCount: 1,
        sample: { message: 'Workflow started' }
      },
      outputSchema: { 
        type: 'object', 
        keys: ['id', 'title', 'body', 'userId', 'data'], 
        keyCount: 5,
        sample: {
          id: 1,
          title: 'Sample API Response',
          body: 'This is a sample response...',
          userId: 123,
          data: { timestamp: '2024-01-15T10:30:00Z', status: 'success' }
        }
      },
      inputPreview: '{"message": "Workflow started"}',
      outputPreview: '{\n  "id": 1,\n  "title": "Sample API Response",\n  "body": "This is a sample response from the API",\n  "userId": 123,\n  "data": {\n    "timestamp": "2024-01-15T10:30:00Z",\n    "status": "success",\n    "metadata": {\n      "version": "1.0",\n      "source": "external-api"\n    }\n  }\n}',
      dataType: 'object',
      size: 256
    },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    duration: 150
  },
  {
    nodeId: 'transform',
    nodeType: 'transform',
    status: 'completed',
    input: {
      id: 1,
      title: 'Sample API Response',
      body: 'This is a sample response from the API',
      userId: 123
    },
    output: {
      processedTitle: 'SAMPLE API RESPONSE',
      processedBody: 'This is a sample response from the API',
      userId: 123,
      processedAt: '2024-01-15T10:30:00Z'
    },
    debugInfo: {
      inputSchema: { 
        type: 'object', 
        keys: ['id', 'title', 'body', 'userId'], 
        keyCount: 4
      },
      outputSchema: { 
        type: 'object', 
        keys: ['processedTitle', 'processedBody', 'userId', 'processedAt'], 
        keyCount: 4
      },
      inputPreview: '{\n  "id": 1,\n  "title": "Sample API Response",\n  "body": "This is a sample response from the API",\n  "userId": 123\n}',
      outputPreview: '{\n  "processedTitle": "SAMPLE API RESPONSE",\n  "processedBody": "This is a sample response from the API",\n  "userId": 123,\n  "processedAt": "2024-01-15T10:30:00Z"\n}',
      dataType: 'object',
      size: 180
    },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    duration: 25
  },
  {
    nodeId: 'llm',
    nodeType: 'llm',
    status: 'completed',
    input: {
      processedTitle: 'SAMPLE API RESPONSE',
      processedBody: 'This is a sample response from the API',
      userId: 123
    },
    output: {
      summary: 'The API returned a sample response with title "SAMPLE API RESPONSE" and body content about a sample response from the API.',
      sentiment: 'neutral',
      keyPoints: [
        'Title was processed to uppercase',
        'Body content is about API responses',
        'User ID is 123'
      ],
      confidence: 0.95
    },
    debugInfo: {
      inputSchema: { 
        type: 'object', 
        keys: ['processedTitle', 'processedBody', 'userId'], 
        keyCount: 3
      },
      outputSchema: { 
        type: 'object', 
        keys: ['summary', 'sentiment', 'keyPoints', 'confidence'], 
        keyCount: 4
      },
      inputPreview: '{\n  "processedTitle": "SAMPLE API RESPONSE",\n  "processedBody": "This is a sample response from the API",\n  "userId": 123\n}',
      outputPreview: '{\n  "summary": "The API returned a sample response...",\n  "sentiment": "neutral",\n  "keyPoints": ["Title was processed to uppercase", "Body content is about API responses", "User ID is 123"],\n  "confidence": 0.95\n}',
      dataType: 'object',
      size: 320
    },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    duration: 1200
  }
];

export function DebugPanelTest() {
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  return (
    <div className="w-full h-screen relative bg-gray-100">
      {/* Test Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800">Debug Panel Test</h1>
        <p className="text-gray-600">Click the button below to test the Debug Panel</p>
        
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
        >
          {showDebugPanel ? 'Hide Debug Panel' : 'Show Debug Panel'}
        </button>
      </div>

      {/* Debug Panel */}
      <DebugPanel
        executionSteps={mockDebugSteps}
        isVisible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
    </div>
  );
}

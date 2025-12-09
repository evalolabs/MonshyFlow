export interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  category: 'common' | 'ai' | 'api' | 'webhook' | 'custom';
  inputSchema: any;
  outputSchema: any;
  exampleInput: any;
  exampleOutput: any;
}

export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  // AI/Chat Templates
  {
    id: 'chat-request',
    name: 'Chat Request',
    description: 'Simple chat with AI (id + prompt)',
    category: 'ai',
    inputSchema: {
      type: 'object',
      required: ['id', 'prompt'],
      properties: {
        id: { 
          type: 'string',
          description: 'User identifier'
        },
        prompt: { 
          type: 'string',
          minLength: 1,
          description: 'User question or message'
        },
        context: {
          type: 'object',
          description: 'Optional context data'
        }
      }
    },
    outputSchema: {
      type: 'object',
      required: ['response'],
      properties: {
        response: {
          type: 'string',
          description: 'AI response'
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence score'
        },
        tokens: {
          type: 'number',
          description: 'Number of tokens used'
        }
      }
    },
    exampleInput: {
      id: 'user123',
      prompt: 'Explain machine learning',
      context: { source: 'web' }
    },
    exampleOutput: {
      response: 'Machine learning is a subset of artificial intelligence...',
      confidence: 0.95,
      tokens: 150
    }
  },

  // API Templates
  {
    id: 'api-query',
    name: 'API Query',
    description: 'Generic API request with query parameters',
    category: 'api',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: {
          type: 'string',
          description: 'Search query or question'
        },
        filters: {
          type: 'object',
          description: 'Optional filters'
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          default: 10,
          description: 'Maximum results to return'
        }
      }
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'array',
          items: { type: 'object' },
          description: 'Query results'
        },
        total: {
          type: 'number',
          description: 'Total number of results'
        },
        page: {
          type: 'number',
          description: 'Current page number'
        }
      }
    },
    exampleInput: {
      query: 'weather in Berlin',
      filters: { country: 'DE' },
      limit: 5
    },
    exampleOutput: {
      results: [
        { city: 'Berlin', temperature: 15, condition: 'sunny' }
      ],
      total: 1,
      page: 1
    }
  },

  // Webhook Templates
  {
    id: 'webhook-data',
    name: 'Webhook Data',
    description: 'Generic webhook payload',
    category: 'webhook',
    inputSchema: {
      type: 'object',
      required: ['event', 'data'],
      properties: {
        event: {
          type: 'string',
          description: 'Event type'
        },
        data: {
          type: 'object',
          description: 'Event data payload'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Event timestamp'
        },
        source: {
          type: 'string',
          description: 'Event source'
        }
      }
    },
    outputSchema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['success', 'error'],
          description: 'Processing status'
        },
        message: {
          type: 'string',
          description: 'Status message'
        },
        processedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Processing timestamp'
        }
      }
    },
    exampleInput: {
      event: 'user.created',
      data: { userId: '123', email: 'user@example.com' },
      timestamp: '2024-01-15T10:30:00Z',
      source: 'auth-service'
    },
    exampleOutput: {
      status: 'success',
      message: 'User created successfully',
      processedAt: '2024-01-15T10:30:01Z'
    }
  },

  // Email Templates
  {
    id: 'email-send',
    name: 'Email Send',
    description: 'Send email request',
    category: 'common',
    inputSchema: {
      type: 'object',
      required: ['to', 'subject', 'body'],
      properties: {
        to: {
          type: 'string',
          format: 'email',
          description: 'Recipient email address'
        },
        subject: {
          type: 'string',
          description: 'Email subject'
        },
        body: {
          type: 'string',
          description: 'Email body content'
        },
        cc: {
          type: 'array',
          items: { type: 'string', format: 'email' },
          description: 'CC recipients'
        },
        attachments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Attachment URLs'
        }
      }
    },
    outputSchema: {
      type: 'object',
      required: ['messageId', 'status'],
      properties: {
        messageId: {
          type: 'string',
          description: 'Unique message identifier'
        },
        status: {
          type: 'string',
          enum: ['sent', 'queued', 'failed'],
          description: 'Send status'
        },
        sentAt: {
          type: 'string',
          format: 'date-time',
          description: 'Send timestamp'
        }
      }
    },
    exampleInput: {
      to: 'user@example.com',
      subject: 'Welcome!',
      body: 'Thank you for signing up.',
      cc: ['admin@example.com']
    },
    exampleOutput: {
      messageId: 'msg_123456',
      status: 'sent',
      sentAt: '2024-01-15T10:30:00Z'
    }
  },

  // File Upload Templates
  {
    id: 'file-upload',
    name: 'File Upload',
    description: 'File upload request',
    category: 'common',
    inputSchema: {
      type: 'object',
      required: ['file', 'type'],
      properties: {
        file: {
          type: 'string',
          description: 'Base64 encoded file data'
        },
        type: {
          type: 'string',
          description: 'MIME type of the file'
        },
        filename: {
          type: 'string',
          description: 'Original filename'
        },
        size: {
          type: 'number',
          description: 'File size in bytes'
        }
      }
    },
    outputSchema: {
      type: 'object',
      required: ['fileId', 'url'],
      properties: {
        fileId: {
          type: 'string',
          description: 'Unique file identifier'
        },
        url: {
          type: 'string',
          format: 'uri',
          description: 'File access URL'
        },
        size: {
          type: 'number',
          description: 'File size in bytes'
        },
        uploadedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Upload timestamp'
        }
      }
    },
    exampleInput: {
      file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
      type: 'image/png',
      filename: 'screenshot.png',
      size: 1024000
    },
    exampleOutput: {
      fileId: 'file_123456',
      url: 'https://storage.example.com/files/file_123456.png',
      size: 1024000,
      uploadedAt: '2024-01-15T10:30:00Z'
    }
  }
];

export const getTemplatesByCategory = (category: string) => {
  return SCHEMA_TEMPLATES.filter(template => template.category === category);
};

export const getTemplateById = (id: string) => {
  return SCHEMA_TEMPLATES.find(template => template.id === id);
};

export const getCategories = () => {
  return Array.from(new Set(SCHEMA_TEMPLATES.map(t => t.category)));
};

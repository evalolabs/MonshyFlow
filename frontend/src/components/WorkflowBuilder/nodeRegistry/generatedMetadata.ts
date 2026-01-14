/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from shared/registry.json
 * Run: npm run generate:registry
 * 
 * Last generated: 2025-12-26T15:05:55.701Z
 */

import type { NodeCategoryId } from './nodeMetadata';

export const GENERATED_NODE_METADATA = {
  'start': {
    id: 'start',
    name: 'Start',
    icon: '🚀',
    description: 'Entry point for external tools (Webhook, API, etc.)',
    category: 'core' as NodeCategoryId,
    animationSpeed: 'fast',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: false,
    isUnique: true,
    canDuplicate: false,
    hasInput: false,
    hasOutput: true,
    
    inputSchema: {
            "type": "object",
            "description": "Input schema is optional and can be customized per workflow. If not defined, any input is accepted.",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "properties": {
                  "entryType": {
                        "type": "string",
                        "description": "Type of entry: webhook, schedule, or manual"
                  },
                  "method": {
                        "type": "string",
                        "description": "HTTP method used"
                  },
                  "input": {
                        "description": "The original input data"
                  },
                  "message": {
                        "type": "string",
                        "description": "Workflow start message"
                  },
                  "label": {
                        "type": "string",
                        "description": "Node label"
                  },
                  "description": {
                        "type": "string",
                        "description": "Node description"
                  }
            },
            "required": [
                  "entryType",
                  "method",
                  "input",
                  "message"
            ]
      },
  },
  'end': {
    id: 'end',
    name: 'End',
    icon: '⬜',
    description: 'Workflow exit point',
    category: 'core' as NodeCategoryId,
    animationSpeed: 'fast',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: false,
    useAutoConfigForm: false,
    
    
    hasInput: true,
    hasOutput: false,
    
    inputSchema: {
            "type": "object",
            "description": "Accepts any input from previous nodes",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "description": "End node returns the input as output (workflow result)",
            "additionalProperties": true
      },
  },
  'transform': {
    id: 'transform',
    name: 'Transform',
    icon: '🔄',
    description: 'Transform or extract data from previous nodes',
    category: 'core' as NodeCategoryId,
    animationSpeed: 'fast',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: false,
    isUnique: false,
    canDuplicate: true,
    hasInput: true,
    hasOutput: true,
    
    inputSchema: {
            "type": "object",
            "description": "Accepts any input from previous nodes",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "description": "Output depends on transformation mode",
            "additionalProperties": true
      },
  },
  'agent': {
    id: 'agent',
    name: 'Agent',
    icon: '👤',
    description: 'Define instructions, tools, and model configuration',
    category: 'ai' as NodeCategoryId,
    animationSpeed: 'slow',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: false,
    
    
    
    
    fields: {
              "agentName": {
                      "type": "text",
                      "placeholder": "Enter agent name"
              },
              "systemPrompt": {
                      "type": "expression",
                      "multiline": true,
                      "rows": 4,
                      "placeholder": "Enter system prompt for the agent. Use {{variables}} for dynamic content"
              },
              "userPrompt": {
                      "type": "expression",
                      "multiline": true,
                      "rows": 3,
                      "placeholder": "Define the user message that will be sent to the agent. Use {{input.userPrompt}} or {{steps.nodeId.json}} for dynamic content"
              }
      },
    inputSchema: {
            "type": "object",
            "description": "Accepts any input. Typically a string prompt or structured data.",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "properties": {
                  "output": {
                        "description": "The agent's response/output",
                        "oneOf": [
                              {
                                    "type": "string"
                              },
                              {
                                    "type": "object"
                              },
                              {
                                    "type": "array"
                              }
                        ]
                  },
                  "trace": {
                        "type": "array",
                        "description": "Execution trace with tool calls and reasoning steps",
                        "items": {
                              "type": "object"
                        }
                  },
                  "usage": {
                        "type": "object",
                        "description": "Token usage information",
                        "properties": {
                              "prompt_tokens": {
                                    "type": "number"
                              },
                              "completion_tokens": {
                                    "type": "number"
                              },
                              "total_tokens": {
                                    "type": "number"
                              }
                        }
                  }
            },
            "required": [
                  "output"
            ]
      },
  },
  'llm': {
    id: 'llm',
    name: 'LLM',
    icon: '🤖',
    description: 'Call OpenAI GPT models (GPT-4, GPT-3.5)',
    category: 'ai' as NodeCategoryId,
    animationSpeed: 'slow',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: false,
    
    
    
    
    fields: {
              "label": {
                      "type": "text",
                      "placeholder": "LLM Name"
              },
              "prompt": {
                      "type": "expression",
                      "multiline": true,
                      "rows": 6,
                      "placeholder": "Enter prompt... Use {{variables}} for dynamic content"
              },
              "model": {
                      "type": "select",
                      "options": [
                              {
                                      "value": "gpt-4",
                                      "label": "GPT-4"
                              },
                              {
                                      "value": "gpt-3.5-turbo",
                                      "label": "GPT-3.5 Turbo"
                              },
                              {
                                      "value": "gpt-4-turbo",
                                      "label": "GPT-4 Turbo"
                              },
                              {
                                      "value": "claude-3",
                                      "label": "Claude 3"
                              }
                      ]
              },
              "temperature": {
                      "type": "number",
                      "min": 0,
                      "max": 2,
                      "step": 0.1
              }
      },
    inputSchema: {
            "type": "object",
            "description": "Accepts string prompts or structured data. Variables like {{steps.nodeId.data}} are resolved.",
            "oneOf": [
                  {
                        "type": "string"
                  },
                  {
                        "type": "object",
                        "additionalProperties": true
                  }
            ]
      },
    outputSchema: {
            "type": "object",
            "properties": {
                  "response": {
                        "type": "string",
                        "description": "The LLM's text response"
                  },
                  "model": {
                        "type": "string",
                        "description": "The model used for generation"
                  },
                  "usage": {
                        "type": "object",
                        "description": "Token usage information",
                        "properties": {
                              "prompt_tokens": {
                                    "type": "number"
                              },
                              "completion_tokens": {
                                    "type": "number"
                              },
                              "total_tokens": {
                                    "type": "number"
                              }
                        }
                  },
                  "finish_reason": {
                        "type": "string",
                        "description": "Reason why generation stopped",
                        "enum": [
                              "stop",
                              "length",
                              "content_filter",
                              "tool_calls"
                        ]
                  }
            },
            "required": [
                  "response"
            ]
      },
  },
  'email': {
    id: 'email',
    name: 'Email',
    icon: '📧',
    description: 'Send email via SMTP',
    category: 'integration' as NodeCategoryId,
    animationSpeed: 'slow',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: true,
    isUnique: false,
    canDuplicate: true,
    hasInput: true,
    hasOutput: true,
    fields: {
              "label": {
                      "type": "text",
                      "placeholder": "Email Node Name"
              },
              "fromEmail": {
                      "type": "expression",
                      "placeholder": "sender@example.com or {{steps.start.data.email}}",
                      "required": true
              },
              "to": {
                      "type": "expression",
                      "placeholder": "recipient@example.com or {{steps.start.data.email}}",
                      "required": true
              },
              "cc": {
                      "type": "expression",
                      "placeholder": "cc@example.com (optional)"
              },
              "bcc": {
                      "type": "expression",
                      "placeholder": "bcc@example.com (optional)"
              },
              "subject": {
                      "type": "expression",
                      "placeholder": "Email subject or {{steps.agent.data}}",
                      "required": true
              },
              "emailFormat": {
                      "type": "select",
                      "options": [
                              {
                                      "value": "text",
                                      "label": "Text"
                              },
                              {
                                      "value": "html",
                                      "label": "HTML"
                              },
                              {
                                      "value": "both",
                                      "label": "Both"
                              }
                      ],
                      "default": "html"
              },
              "text": {
                      "type": "expression",
                      "multiline": true,
                      "rows": 8,
                      "placeholder": "Plain text message or {{steps.agent.data}}",
                      "displayCondition": {
                              "field": "emailFormat",
                              "operator": "in",
                              "value": [
                                      "text",
                                      "both"
                              ]
                      }
              },
              "html": {
                      "type": "expression",
                      "multiline": true,
                      "rows": 8,
                      "placeholder": "HTML message or {{steps.agent.data}}",
                      "displayCondition": {
                              "field": "emailFormat",
                              "operator": "in",
                              "value": [
                                      "html",
                                      "both"
                              ]
                      }
              },
              "smtpProfileSecret": {
                      "type": "smtpProfile",
                      "placeholder": "Select or create an SMTP profile"
              },
              "smtpHost": {
                      "type": "expression",
                      "placeholder": "smtp.gmail.com or {{steps.start.data.smtpHost}}",
                      "displayCondition": {
                              "field": "smtpProfileSecret",
                              "operator": "equals",
                              "value": ""
                      }
              },
              "smtpPort": {
                      "type": "number",
                      "default": "587",
                      "placeholder": "587",
                      "displayCondition": {
                              "field": "smtpProfileSecret",
                              "operator": "equals",
                              "value": ""
                      }
              },
              "smtpUsername": {
                      "type": "expression",
                      "placeholder": "your-email@gmail.com or {{steps.start.data.smtpUsername}}",
                      "displayCondition": {
                              "field": "smtpProfileSecret",
                              "operator": "equals",
                              "value": ""
                      }
              },
              "smtpPassword": {
                      "type": "expression",
                      "placeholder": "your-password or {{steps.start.data.smtpPassword}}",
                      "displayCondition": {
                              "field": "smtpProfileSecret",
                              "operator": "equals",
                              "value": ""
                      }
              },
              "smtpHostSecret": {
                      "type": "secret",
                      "secretType": "Generic",
                      "placeholder": "Legacy: Select SMTP Host secret (optional)",
                      "hideWhenEmpty": true
              },
              "smtpUsernameSecret": {
                      "type": "secret",
                      "secretType": "Generic",
                      "placeholder": "Legacy: Select SMTP Username secret (optional)",
                      "hideWhenEmpty": true
              },
              "smtpPasswordSecret": {
                      "type": "secret",
                      "secretType": "Password",
                      "placeholder": "Legacy: Select SMTP Password secret (optional)",
                      "hideWhenEmpty": true
              },
              "fromNameSecret": {
                      "type": "secret",
                      "secretType": "Generic",
                      "placeholder": "Select From Name secret (optional)"
              }
      },
    inputSchema: {
            "type": "object",
            "description": "Accepts any input. Email fields can use expressions like {{steps.nodeId.data}}",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "properties": {
                  "success": {
                        "type": "boolean",
                        "description": "Whether the email was sent successfully"
                  },
                  "messageId": {
                        "type": "string",
                        "description": "Unique message ID"
                  },
                  "message": {
                        "type": "string",
                        "description": "Status message"
                  }
            },
            "required": [
                  "success"
            ]
      },
  },
  'http-request': {
    id: 'http-request',
    name: 'HTTP Request',
    icon: '🌐',
    description: 'Send HTTP request to external URL (useful for testing scheduled workflows)',
    category: 'integration' as NodeCategoryId,
    animationSpeed: 'slow',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: true,
    
    
    
    
    fields: {
              "label": {
                      "type": "text",
                      "placeholder": "HTTP Request Name"
              },
              "url": {
                      "type": "expression",
                      "placeholder": "https://webhook.site/your-unique-url or {{steps.agent-1.output}}"
              },
              "method": {
                      "type": "select",
                      "options": [
                              {
                                      "value": "GET",
                                      "label": "GET"
                              },
                              {
                                      "value": "POST",
                                      "label": "POST"
                              },
                              {
                                      "value": "PUT",
                                      "label": "PUT"
                              },
                              {
                                      "value": "DELETE",
                                      "label": "DELETE"
                              },
                              {
                                      "value": "PATCH",
                                      "label": "PATCH"
                              }
                      ]
              },
              "sendInput": {
                      "type": "select",
                      "options": [
                              {
                                      "value": "true",
                                      "label": "Yes"
                              },
                              {
                                      "value": "false",
                                      "label": "No"
                              }
                      ]
              },
              "headers": {
                      "type": "expression",
                      "multiline": true,
                      "rows": 4,
                      "placeholder": "{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer {{secrets.TOKEN}}\"} or leave empty for auto-generation"
              },
              "body": {
                      "type": "expression",
                      "multiline": true,
                      "rows": 4,
                      "placeholder": "Custom request body (JSON or text) or {{steps.agent-1.output}}"
              }
      },
    inputSchema: {
            "type": "object",
            "description": "Accepts any data. If sendInput is true, this data is sent as request body.",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "properties": {
                  "status": {
                        "type": "number",
                        "description": "HTTP status code (200, 404, 500, etc.)"
                  },
                  "statusText": {
                        "type": "string",
                        "description": "HTTP status text (OK, Not Found, etc.)"
                  },
                  "data": {
                        "description": "Response body (parsed JSON if possible, otherwise string)"
                  },
                  "headers": {
                        "type": "object",
                        "description": "Response headers",
                        "additionalProperties": {
                              "type": "string"
                        }
                  },
                  "url": {
                        "type": "string",
                        "description": "The URL that was called"
                  },
                  "method": {
                        "type": "string",
                        "description": "HTTP method used",
                        "enum": [
                              "GET",
                              "POST",
                              "PUT",
                              "DELETE",
                              "PATCH"
                        ]
                  }
            },
            "required": [
                  "status",
                  "data"
            ]
      },
  },
  'delay': {
    id: 'delay',
    name: 'Delay',
    icon: '⏱️',
    description: 'Wait for a specified amount of time before continuing',
    category: 'utility' as NodeCategoryId,
    animationSpeed: 'slow',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: true,
    isUnique: false,
    canDuplicate: true,
    hasInput: true,
    hasOutput: true,
    fields: {
              "label": {
                      "type": "text",
                      "placeholder": "Delay Node Name"
              },
              "delaySeconds": {
                      "type": "number",
                      "placeholder": "Delay in seconds",
                      "default": 1,
                      "min": 0,
                      "max": 3600,
                      "required": true
              }
      },
    inputSchema: {
            "type": "object",
            "description": "Accepts any input. The input will be passed through after the delay.",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "description": "Returns the input data unchanged after the delay",
            "additionalProperties": true
      },
  },
  'while': {
    id: 'while',
    name: 'While Loop',
    icon: '🔄',
    description: 'Execute a block of nodes repeatedly while a condition is true',
    category: 'logic' as NodeCategoryId,
    animationSpeed: 'slow',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: true,
    
    
    hasInput: true,
    hasOutput: true,
    fields: {
              "label": {
                      "type": "text",
                      "placeholder": "While Loop Name"
              },
              "condition": {
                      "type": "expression",
                      "multiline": false,
                      "placeholder": "Enter condition (e.g., {{steps.nodeId.count}} < 10)",
                      "required": true
              },
              "maxIterations": {
                      "type": "number",
                      "placeholder": "Maximum iterations (safety limit)",
                      "default": 100,
                      "min": 1,
                      "max": 10000,
                      "required": true
              }
      },
    inputSchema: {
            "type": "object",
            "description": "Accepts any input. The condition is evaluated on each iteration.",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "properties": {
                  "iterations": {
                        "type": "number",
                        "description": "Number of loop iterations executed"
                  },
                  "finalOutput": {
                        "description": "Output from the last iteration"
                  },
                  "exitedEarly": {
                        "type": "boolean",
                        "description": "Whether loop exited due to max iterations"
                  }
            }
      },
  },
  'foreach': {
    id: 'foreach',
    name: 'For Each',
    icon: '🔁',
    description: 'Iterate over an array and execute a block of nodes for each item',
    category: 'logic' as NodeCategoryId,
    animationSpeed: 'slow',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: true,
    
    
    hasInput: true,
    hasOutput: true,
    fields: {
              "label": {
                      "type": "text",
                      "placeholder": "For Each Name"
              },
              "arrayPath": {
                      "type": "expression",
                      "multiline": false,
                      "placeholder": "Enter array path (e.g., {{steps.nodeId.data}} or {{steps.nodeId.json.data}})",
                      "required": true
              }
      },
    inputSchema: {
            "type": "object",
            "description": "Accepts any input. The arrayPath specifies which array to iterate over.",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "properties": {
                  "iterations": {
                        "type": "number",
                        "description": "Number of iterations executed"
                  },
                  "results": {
                        "type": "array",
                        "description": "Array of outputs from each iteration"
                  },
                  "finalOutput": {
                        "description": "Output from the last iteration"
                  }
            }
      },
  },
  'loop': {
    id: 'loop',
    name: 'Loop',
    icon: '🔁',
    description: 'Start of a loop block (container for loop body)',
    category: 'logic' as NodeCategoryId,
    animationSpeed: 'slow',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: true,
    
    
    hasInput: true,
    hasOutput: true,
    fields: {
              "label": {
                      "type": "text",
                      "placeholder": "Loop Name"
              },
              "loopType": {
                      "type": "select",
                      "options": [
                              {
                                      "value": "while",
                                      "label": "While Loop (condition-based)"
                              },
                              {
                                      "value": "foreach",
                                      "label": "For Each (array iteration)"
                              }
                      ],
                      "default": "while",
                      "required": true
              },
              "condition": {
                      "type": "expression",
                      "multiline": false,
                      "placeholder": "Enter condition (e.g., {{steps.nodeId.count}} < 10)",
                      "required": true,
                      "displayCondition": {
                              "field": "loopType",
                              "operator": "equals",
                              "value": "while"
                      }
              },
              "arrayPath": {
                      "type": "expression",
                      "multiline": false,
                      "placeholder": "Enter array path (e.g., {{steps.nodeId.data}} or {{steps.nodeId.json.items}})",
                      "required": true,
                      "displayCondition": {
                              "field": "loopType",
                              "operator": "equals",
                              "value": "foreach"
                      }
              },
              "maxIterations": {
                      "type": "number",
                      "placeholder": "Maximum iterations (safety limit)",
                      "default": 100,
                      "min": 1,
                      "max": 10000,
                      "required": true
              }
      },
    inputSchema: {
            "type": "object",
            "description": "Accepts any input. Loop type determines iteration behavior.",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "properties": {
                  "iterations": {
                        "type": "number",
                        "description": "Number of loop iterations executed"
                  },
                  "finalOutput": {
                        "description": "Output from the last iteration"
                  }
            }
      },
  },
  'end-loop': {
    id: 'end-loop',
    name: 'End Loop',
    icon: '🔚',
    description: 'End of a loop block (paired with Loop node)',
    category: 'logic' as NodeCategoryId,
    animationSpeed: 'fast',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: true,
    
    
    hasInput: true,
    hasOutput: true,
    fields: {
              "label": {
                      "type": "text",
                      "placeholder": "End Loop"
              }
      },
    
    
  },
  'ifelse': {
    id: 'ifelse',
    name: 'If / Else',
    icon: '↗️',
    description: 'Execute different paths based on a condition',
    category: 'logic' as NodeCategoryId,
    animationSpeed: 'fast',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    useAutoConfigForm: true,
    
    
    hasInput: true,
    hasOutput: false,
    fields: {
              "label": {
                      "type": "text",
                      "placeholder": "If / Else Name"
              },
              "condition": {
                      "type": "expression",
                      "multiline": false,
                      "placeholder": "Enter condition (e.g., {{loop.current.id}} === 5)",
                      "required": true
              }
      },
    inputSchema: {
            "type": "object",
            "description": "Accepts any input. The condition is evaluated to determine which branch to execute.",
            "additionalProperties": true
      },
    outputSchema: {
            "type": "object",
            "properties": {
                  "condition": {
                        "type": "string",
                        "description": "The evaluated condition"
                  },
                  "result": {
                        "type": "boolean",
                        "description": "Whether the condition was true or false"
                  },
                  "output": {
                        "description": "Output from the executed branch"
                  }
            }
      },
  },
};

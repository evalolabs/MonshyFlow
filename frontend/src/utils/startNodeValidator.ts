import type { StartNodeConfig, StartNodeValidationResult } from '../types/startNode';
import { DEFAULT_START_NODE_CONFIG } from '../types/startNode';

export class StartNodeValidator {
  static validate(config: StartNodeConfig): StartNodeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validations
    if (!config.label || config.label.trim() === '') {
      errors.push('Label is required');
    }

    if (!config.entryType) {
      errors.push('Entry type is required');
    } else if (!['webhook', 'schedule', 'manual'].includes(config.entryType)) {
      errors.push('Invalid entry type. Must be one of: webhook, schedule, manual');
    }

    // Endpoint URL and HTTP Method are only required for schedule and manual entry types
    // For webhook, the actual URL is always /api/webhook/{workflowId}
    if (config.entryType !== 'webhook') {
      if (!config.endpoint || config.endpoint.trim() === '') {
        errors.push('Endpoint is required');
      } else if (!config.endpoint.startsWith('/')) {
        errors.push('Endpoint must start with "/"');
      }

      if (!config.baseUrl || config.baseUrl.trim() === '') {
        errors.push('Base URL is required');
      } else if (!this.isValidUrl(config.baseUrl)) {
        errors.push('Base URL must be a valid URL');
      }

      if (!config.method) {
        errors.push('HTTP method is required');
      } else if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
        errors.push('Invalid HTTP method');
      }
    }

    // Entry type specific validations
    // Note: For webhook entry type, all HTTP methods (GET, POST, PUT, PATCH, DELETE) are supported
    // The actual endpoint is always /api/webhook/{workflowId}

    // Execution mode validations
    if (config.executionMode && !['sync', 'stream', 'background'].includes(config.executionMode)) {
      errors.push('Invalid execution mode. Must be one of: sync, stream, background');
    }

    // Timeout validations
    if (config.timeout !== undefined) {
      if (config.timeout < 1000) {
        errors.push('Timeout must be at least 1000ms');
      }
      if (config.timeout > 600000) {
        warnings.push('Timeout is very high (>10 minutes). Consider using background execution mode');
      }
    }

    // Webhook URL validation (for background mode)
    if (config.executionMode === 'background' && config.webhookUrl && !this.isValidUrl(config.webhookUrl)) {
      errors.push('Webhook URL must be a valid URL');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validatePartial(config: Partial<StartNodeConfig>): StartNodeValidationResult {
    const fullConfig = { ...DEFAULT_START_NODE_CONFIG, ...config };
    return this.validate(fullConfig);
  }

  static sanitize(config: StartNodeConfig): StartNodeConfig {
    return {
      ...config,
      label: config.label?.trim() || DEFAULT_START_NODE_CONFIG.label,
      endpoint: config.endpoint?.trim() || DEFAULT_START_NODE_CONFIG.endpoint,
      baseUrl: config.baseUrl?.trim() || DEFAULT_START_NODE_CONFIG.baseUrl,
      description: config.description?.trim() || '',
      webhookUrl: config.webhookUrl?.trim() || ''
    };
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static getValidationMessage(result: StartNodeValidationResult): string {
    if (result.isValid) {
      if (result.warnings.length > 0) {
        return `✅ Valid with warnings:\n${result.warnings.map(w => `⚠️ ${w}`).join('\n')}`;
      }
      return '✅ Configuration is valid';
    }

    return `❌ Validation errors:\n${result.errors.map(e => `• ${e}`).join('\n')}${
      result.warnings.length > 0 ? `\n\n⚠️ Warnings:\n${result.warnings.map(w => `• ${w}`).join('\n')}` : ''
    }`;
  }
}

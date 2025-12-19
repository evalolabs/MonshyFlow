/**
 * Node Validation Utilities
 * 
 * Validates node configuration and provides compile notes
 */

import type { Node } from '@xyflow/react';
import { getApiIntegration } from '../../../config/apiIntegrations';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
}

export interface NodeValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

/**
 * Validate URL format and syntax
 */
function isValidUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is empty' };
  }

  // Check if it's an expression (contains {{ }})
  if (url.includes('{{') && url.includes('}}')) {
    // For expressions, do basic syntax check
    // Check for balanced braces
    let openBraces = 0;
    for (const char of url) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (openBraces < 0) {
        return { isValid: false, error: 'Invalid expression syntax: unmatched closing brace' };
      }
    }
    if (openBraces !== 0) {
      return { isValid: false, error: 'Invalid expression syntax: unmatched opening brace' };
    }
    return { isValid: true };
  }

  // Validate actual URL syntax
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return { isValid: false, error: 'URL must use http:// or https:// protocol' };
    }
    if (!urlObj.hostname || urlObj.hostname.trim() === '') {
      return { isValid: false, error: 'URL must have a valid hostname' };
    }
    return { isValid: true };
  } catch (error: any) {
    return { isValid: false, error: `Invalid URL format: ${error.message || 'malformed URL'}` };
  }
}

/**
 * Normalize URL by removing query params, hash, and trailing slashes
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Get protocol + hostname + port + pathname (without query params or hash)
    let normalized = `${urlObj.protocol}//${urlObj.hostname}`;
    if (urlObj.port && urlObj.port !== '80' && urlObj.port !== '443') {
      normalized += `:${urlObj.port}`;
    }
    normalized += urlObj.pathname;
    // Remove trailing slashes
    normalized = normalized.replace(/\/+$/, '');
    return normalized.toLowerCase();
  } catch {
    // If URL parsing fails, return normalized version of input
    return url.toLowerCase().split('?')[0].split('#')[0].replace(/\/+$/, '');
  }
}

/**
 * Extract and validate hostname from URL
 * 
 * Compares the hostname of the user's URL with the expected base URL hostname.
 * Handles placeholders in expected hostname (e.g., {instance}.salesforce.com).
 */
function validateHostname(url: string, expectedBaseUrl: string): boolean {
  try {
    const userUrlObj = new URL(url);
    const expectedUrlObj = new URL(expectedBaseUrl);
    
    const userHostname = userUrlObj.hostname.toLowerCase();
    const expectedHostname = expectedUrlObj.hostname.toLowerCase();
    
    // Check if hostname matches (handle placeholders in expected hostname)
    if (expectedHostname.includes('{')) {
      // If expected hostname has placeholders, we can't validate exactly
      // But we can check if the structure matches (e.g., *.microsoft.com)
      const expectedPattern = expectedHostname.replace(/\{[^}]+\}/g, '*');
      const regexPattern = expectedPattern.replace(/\*/g, '[^.]+').replace(/\./g, '\\.');
      const regex = new RegExp('^' + regexPattern + '$', 'i');
      return regex.test(userHostname);
    }
    
    return userHostname === expectedHostname;
  } catch {
    return true; // Can't parse, assume valid
  }
}

/**
 * Check if URL matches expected API base URL
 * 
 * Validates that the user's URL matches the expected base URL for the API integration.
 * 
 * Handles:
 * - Hostname validation (always checked, even with expressions in path)
 * - Query parameters (ignored)
 * - Trailing slashes (normalized)
 * - Case differences (normalized)
 * - Expressions in path (hostname still validated, path validation skipped)
 * 
 * Examples:
 * - User URL: "https://api.bannerbear.com/v2/templates?limit=10"
 * - Expected: "https://api.bannerbear.com/v2"
 * - Should match because normalized user URL starts with normalized expected URL
 */
function urlMatchesApiBaseUrl(url: string, expectedBaseUrl: string): boolean {
  if (!expectedBaseUrl) {
    return true; // No base URL to compare
  }
  
  // Always validate hostname first, even if there are expressions in the path
  const hostnameMatches = validateHostname(url, expectedBaseUrl);
  
  if (!hostnameMatches) {
    return false; // Hostname doesn't match, definitely wrong
  }
  
  // Handle expressions - check if URL contains actual expressions ({{...}})
  // Only skip path validation if the expression is in the hostname/path part, not in query params
  const urlWithoutQuery = url.split('?')[0].split('#')[0];
  const hasExpressionInPath = urlWithoutQuery.includes('{{') && urlWithoutQuery.includes('}}');
  
  if (hasExpressionInPath) {
    return true; // Hostname matches, path has expressions (assume valid)
  }
  
  try {
    // Normalize both URLs (remove query params, hash, trailing slashes, lowercase)
    const normalizedUser = normalizeUrl(url);
    const normalizedExpected = normalizeUrl(expectedBaseUrl);
    
    // Simple check: does user URL start with expected base URL?
    // Also check if they're exactly equal (for cases where URL equals baseUrl)
    const isExactMatch = normalizedUser === normalizedExpected;
    const startsWithMatch = normalizedUser.startsWith(normalizedExpected + '/');
    return isExactMatch || startsWithMatch;
  } catch (error) {
    // If URL parsing fails, assume valid (might be a valid expression or custom format)
    return true;
  }
}

/**
 * Extract secret keys from a string (e.g., "{{secrets.API_KEY}}")
 */
function extractSecretKeys(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  const secretPattern = /{{secrets\.(\w+)}}/g;
  const matches = Array.from(text.matchAll(secretPattern));
  return matches.map(match => match[1]);
}

/**
 * Check if a secret exists and is active
 */
function hasSecret(secrets: Array<{ key: string; isActive: boolean }>, secretKey: string): boolean {
  return secrets.some(secret => secret.key === secretKey && secret.isActive);
}

/**
 * Validate HTTP Request node
 */
export function validateHttpRequestNode(
  node: Node,
  secrets: Array<{ key: string; isActive: boolean }> = []
): NodeValidationResult {
  const issues: ValidationIssue[] = [];
  const data = node.data || {};
  const url = (data.url || data.endpoint || '') as string;
  const apiId = data.apiId as string | undefined;

  // Check URL syntax
  let urlValidation: { isValid: boolean; error?: string } | null = null;
  if (!url || url.trim() === '') {
    issues.push({
      type: 'error',
      message: 'URL is required',
    });
  } else {
    urlValidation = isValidUrl(url);
    if (!urlValidation.isValid) {
      issues.push({
        type: 'error',
        message: urlValidation.error || 'URL format is invalid',
      });
    }
  }

  // Check secrets and URL matching if API integration is used
  if (apiId) {
    const apiIntegration = getApiIntegration(apiId);
    
    // Check if URL matches expected API base URL
    // Only check if URL is valid (already validated above)
    if (apiIntegration?.baseUrl && url && url.trim() !== '' && urlValidation?.isValid) {
      // Always validate hostname, even if there are expressions in the path
      const matches = urlMatchesApiBaseUrl(url, apiIntegration.baseUrl);
      
      if (!matches) {
        issues.push({
          type: 'warning',
          message: `URL does not match expected base URL for ${apiIntegration.name} (expected: ${apiIntegration.baseUrl})`,
        });
      }
    }
    
    if (apiIntegration?.authentication) {
      const auth = apiIntegration.authentication;
      const requiredSecretKey = auth.secretKey;
      const providerName = apiIntegration.name || 'API';
      
      if (requiredSecretKey) {
        // Check if secret exists
        const secretExists = hasSecret(secrets, requiredSecretKey);
        
        if (!secretExists) {
          // Use provider context for better UX: "OpenAI API Key fehlt" instead of "Secret X missing"
          issues.push({
            type: 'error',
            message: `${providerName} API Key "${requiredSecretKey}" is missing or inactive`,
          });
        } else {
          issues.push({
            type: 'info',
            message: `${providerName} API Key "${requiredSecretKey}" is configured`,
          });
        }
      }

      // Check for username secret if needed
      if (auth.usernameSecretKey) {
        const usernameSecretExists = hasSecret(secrets, auth.usernameSecretKey);
        
        if (!usernameSecretExists) {
          issues.push({
            type: 'warning',
            message: `${providerName} username secret "${auth.usernameSecretKey}" is missing`,
          });
        }
      }
    }
  } else {
    // For custom HTTP requests, check if URL contains secret references
    const secretKeys = extractSecretKeys(url);
    const headers = (data.headers as Record<string, string>) || {};
    const headerValues = Object.values(headers).join(' ');
    const allSecretKeys = [...secretKeys, ...extractSecretKeys(headerValues)];
    
    for (const secretKey of allSecretKeys) {
      if (!hasSecret(secrets, secretKey)) {
        issues.push({
          type: 'warning',
          message: `Secret "${secretKey}" referenced but not found`,
        });
      }
    }
  }

  // Check HTTP method
  const method = (data.method || 'POST') as string;
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  if (!validMethods.includes(method.toUpperCase())) {
    issues.push({
      type: 'warning',
      message: `HTTP method "${method}" may not be supported`,
    });
  }

  return {
    isValid: issues.filter(i => i.type === 'error').length === 0,
    issues,
  };
}

/**
 * Validate any node type
 */
export function validateNode(
  node: Node,
  secrets: Array<{ key: string; isActive: boolean }> = []
): NodeValidationResult {
  if (node.type === 'http-request') {
    return validateHttpRequestNode(node, secrets);
  }

  // Default: no validation issues
  return {
    isValid: true,
    issues: [],
  };
}

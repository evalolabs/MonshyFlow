/**
 * Template Engine
 * Transforms data using template strings with {{variable}} syntax
 */

/**
 * Transforms data using a mapping template
 * @param data Source data (e.g. incoming request)
 * @param mapping Template mapping with {{variable}} syntax
 * @returns Transformed data
 */
export function transformData(data: any, mapping: any): any {
  if (typeof mapping === 'string') {
    return resolveTemplate(mapping, data);
  }

  if (Array.isArray(mapping)) {
    return mapping.map(item => transformData(data, item));
  }

  if (mapping && typeof mapping === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(mapping)) {
      result[key] = transformData(data, value);
    }
    return result;
  }

  return mapping;
}

/**
 * Resolves a template string with {{variable}} placeholders
 * @param template Template string (e.g. "{{user.name}}")
 * @param data Source data
 * @returns Resolved value
 */
function resolveTemplate(template: string, data: any): any {
  // Check if it's a simple template: {{variable}}
  const simpleMatch = template.match(/^\{\{(.+?)\}\}$/);
  if (simpleMatch) {
    const path = simpleMatch[1].trim();
    return resolvePath(data, path);
  }

  // Check if it contains multiple templates
  if (template.includes('{{')) {
    return template.replace(/\{\{(.+?)\}\}/g, (_, path) => {
      const value = resolvePath(data, path.trim());
      return value !== undefined ? String(value) : '';
    });
  }

  // No template, return as is
  return template;
}

/**
 * Resolves a path in an object (e.g. "user.profile.name")
 * Supports:
 * - Dot notation: user.name
 * - Array access: items[0]
 * - Default values: field || 'default'
 */
function resolvePath(obj: any, path: string): any {
  // Handle default values: {{field || 'default'}}
  if (path.includes('||')) {
    const [mainPath, defaultValue] = path.split('||').map(s => s.trim());
    const value = resolvePath(obj, mainPath);
    if (value === undefined || value === null || value === '') {
      // Parse default value (remove quotes if string)
      const cleaned = defaultValue.replace(/^['"]|['"]$/g, '');
      return cleaned;
    }
    return value;
  }

  // Handle ternary: {{condition ? 'yes' : 'no'}}
  if (path.includes('?') && path.includes(':')) {
    const condMatch = path.match(/(.+?)\s*\?\s*(.+?)\s*:\s*(.+)/);
    if (condMatch) {
      const [, condPath, trueVal, falseVal] = condMatch;
      const condition = resolvePath(obj, condPath.trim());
      const value = condition ? trueVal.trim() : falseVal.trim();
      return value.replace(/^['"]|['"]$/g, '');
    }
  }

  // Split path by dots and brackets
  const parts = path.split(/\.|\[|\]/).filter(Boolean);
  
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }

    // Handle array index
    if (/^\d+$/.test(part)) {
      current = current[parseInt(part)];
    } else {
      current = current[part];
    }
  }

  return current;
}

/**
 * Parse JSON mapping string to object
 * @param mappingString JSON string with mapping
 * @returns Parsed mapping object or null if invalid
 */
export function parseMapping(mappingString: string): any {
  if (!mappingString || mappingString.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(mappingString);
  } catch (error) {
    console.error('Invalid mapping JSON:', error);
    return null;
  }
}

/**
 * Validate mapping syntax
 * @param mappingString JSON string with mapping
 * @returns Validation result
 */
export function validateMapping(mappingString: string): { valid: boolean; error?: string } {
  if (!mappingString || mappingString.trim() === '') {
    return { valid: true };
  }

  try {
    JSON.parse(mappingString);
    return { valid: true };
  } catch (error: any) {
    return { 
      valid: false, 
      error: error.message || 'Invalid JSON syntax' 
    };
  }
}

/**
 * Preview transformation result
 * @param sourceData Source data to transform
 * @param mappingString JSON mapping string
 * @returns Transformed result or error
 */
export function previewTransformation(
  sourceData: any,
  mappingString: string
): { success: boolean; result?: any; error?: string } {
  try {
    const mapping = parseMapping(mappingString);
    if (!mapping) {
      return { success: true, result: sourceData };
    }

    const result = transformData(sourceData, mapping);
    return { success: true, result };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Transformation failed' 
    };
  }
}

/**
 * Get available variables from data
 * Useful for showing available fields in UI
 */
export function getAvailableVariables(data: any, prefix = ''): string[] {
  const variables: string[] = [];

  if (!data || typeof data !== 'object') {
    return variables;
  }

  for (const [key, value] of Object.entries(data)) {
    const path = prefix ? `${prefix}.${key}` : key;
    variables.push(path);

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursive for nested objects (limit depth to 3)
      if (prefix.split('.').length < 3) {
        variables.push(...getAvailableVariables(value, path));
      }
    }

    if (Array.isArray(value) && value.length > 0) {
      variables.push(`${path}[0]`);
      if (typeof value[0] === 'object') {
        const arrayVars = getAvailableVariables(value[0], `${path}[0]`);
        variables.push(...arrayVars);
      }
    }
  }

  return variables;
}



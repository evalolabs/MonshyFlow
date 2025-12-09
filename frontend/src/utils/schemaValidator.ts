/**
 * JSON Schema Validator
 * Validates data against JSON Schema (simplified implementation)
 */

export type ValidationError = {
  path: string;
  message: string;
  expected?: any;
  actual?: any;
}

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
}

export function validateJsonSchema(data: any, schemaString: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Parse schema
  let schema: any;
  try {
    schema = JSON.parse(schemaString);
  } catch (error) {
    return {
      valid: false,
      errors: [{ path: '$', message: 'Invalid JSON Schema format' }]
    };
  }

  // Validate against schema
  validateValue(data, schema, '', errors);

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateValue(
  data: any,
  schema: any,
  path: string,
  errors: ValidationError[]
): void {
  // Check type
  if (schema.type) {
    const actualType = getType(data);
    const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];

    if (!expectedTypes.includes(actualType)) {
      errors.push({
        path: path || '$',
        message: `Expected type ${expectedTypes.join(' or ')}, got ${actualType}`,
        expected: expectedTypes.join(' or '),
        actual: actualType
      });
      return; // Stop validation if type is wrong
    }
  }

  // Validate based on type
  switch (schema.type) {
    case 'object':
      validateObject(data, schema, path, errors);
      break;
    case 'array':
      validateArray(data, schema, path, errors);
      break;
    case 'string':
      validateString(data, schema, path, errors);
      break;
    case 'number':
    case 'integer':
      validateNumber(data, schema, path, errors);
      break;
    case 'boolean':
      // Boolean is already validated by type check
      break;
  }
}

function validateObject(
  data: any,
  schema: any,
  path: string,
  errors: ValidationError[]
): void {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return;
  }

  // Check required properties
  if (schema.required && Array.isArray(schema.required)) {
    schema.required.forEach((requiredProp: string) => {
      if (!(requiredProp in data)) {
        errors.push({
          path: joinPath(path, requiredProp),
          message: `Missing required property: ${requiredProp}`,
          expected: 'required',
          actual: 'missing'
        });
      }
    });
  }

  // Validate properties
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      if (key in data) {
        validateValue(data[key], propSchema, joinPath(path, key), errors);
      }
    });
  }

  // Check for additional properties
  if (schema.additionalProperties === false) {
    const allowedProps = new Set(Object.keys(schema.properties || {}));
    Object.keys(data).forEach(key => {
      if (!allowedProps.has(key)) {
        errors.push({
          path: joinPath(path, key),
          message: `Additional property not allowed: ${key}`,
          expected: 'not present',
          actual: 'present'
        });
      }
    });
  }
}

function validateArray(
  data: any,
  schema: any,
  path: string,
  errors: ValidationError[]
): void {
  if (!Array.isArray(data)) {
    return;
  }

  // Check minItems
  if (schema.minItems !== undefined && data.length < schema.minItems) {
    errors.push({
      path,
      message: `Array should have at least ${schema.minItems} items`,
      expected: `>= ${schema.minItems}`,
      actual: data.length
    });
  }

  // Check maxItems
  if (schema.maxItems !== undefined && data.length > schema.maxItems) {
    errors.push({
      path,
      message: `Array should have at most ${schema.maxItems} items`,
      expected: `<= ${schema.maxItems}`,
      actual: data.length
    });
  }

  // Validate items
  if (schema.items) {
    data.forEach((item, index) => {
      validateValue(item, schema.items, `${path}[${index}]`, errors);
    });
  }
}

function validateString(
  data: any,
  schema: any,
  path: string,
  errors: ValidationError[]
): void {
  if (typeof data !== 'string') {
    return;
  }

  // Check minLength
  if (schema.minLength !== undefined && data.length < schema.minLength) {
    errors.push({
      path,
      message: `String should be at least ${schema.minLength} characters`,
      expected: `>= ${schema.minLength}`,
      actual: data.length
    });
  }

  // Check maxLength
  if (schema.maxLength !== undefined && data.length > schema.maxLength) {
    errors.push({
      path,
      message: `String should be at most ${schema.maxLength} characters`,
      expected: `<= ${schema.maxLength}`,
      actual: data.length
    });
  }

  // Check pattern
  if (schema.pattern) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(data)) {
      errors.push({
        path,
        message: `String does not match pattern: ${schema.pattern}`,
        expected: schema.pattern,
        actual: data
      });
    }
  }

  // Check enum
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push({
      path,
      message: `Value must be one of: ${schema.enum.join(', ')}`,
      expected: schema.enum.join(', '),
      actual: data
    });
  }

  // Check format (basic)
  if (schema.format) {
    validateFormat(data, schema.format, path, errors);
  }
}

function validateNumber(
  data: any,
  schema: any,
  path: string,
  errors: ValidationError[]
): void {
  if (typeof data !== 'number') {
    return;
  }

  // Check integer
  if (schema.type === 'integer' && !Number.isInteger(data)) {
    errors.push({
      path,
      message: 'Value must be an integer',
      expected: 'integer',
      actual: data
    });
  }

  // Check minimum
  if (schema.minimum !== undefined && data < schema.minimum) {
    errors.push({
      path,
      message: `Value should be >= ${schema.minimum}`,
      expected: `>= ${schema.minimum}`,
      actual: data
    });
  }

  // Check maximum
  if (schema.maximum !== undefined && data > schema.maximum) {
    errors.push({
      path,
      message: `Value should be <= ${schema.maximum}`,
      expected: `<= ${schema.maximum}`,
      actual: data
    });
  }

  // Check multipleOf
  if (schema.multipleOf !== undefined && data % schema.multipleOf !== 0) {
    errors.push({
      path,
      message: `Value should be multiple of ${schema.multipleOf}`,
      expected: `multiple of ${schema.multipleOf}`,
      actual: data
    });
  }
}

function validateFormat(
  data: string,
  format: string,
  path: string,
  errors: ValidationError[]
): void {
  let isValid = true;
  let message = '';

  switch (format) {
    case 'email':
      isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data);
      message = 'Invalid email format';
      break;
    case 'uri':
    case 'url':
      try {
        new URL(data);
      } catch {
        isValid = false;
        message = 'Invalid URL format';
      }
      break;
    case 'date':
      isValid = /^\d{4}-\d{2}-\d{2}$/.test(data);
      message = 'Invalid date format (expected: YYYY-MM-DD)';
      break;
    case 'date-time':
      isValid = !isNaN(Date.parse(data));
      message = 'Invalid date-time format';
      break;
    case 'uuid':
      isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data);
      message = 'Invalid UUID format';
      break;
  }

  if (!isValid) {
    errors.push({
      path,
      message,
      expected: format,
      actual: data
    });
  }
}

function getType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  return typeof value;
}

function joinPath(parent: string, child: string): string {
  if (!parent) return child;
  if (child.startsWith('[')) return `${parent}${child}`;
  return `${parent}.${child}`;
}


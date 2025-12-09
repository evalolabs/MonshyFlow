/**
 * JSON Schema Generator (Frontend)
 * 
 * Generates JSON Schema from actual data
 * Same implementation as backend for consistency
 */

export interface JSONSchema7 {
	type?: string | string[];
	properties?: Record<string, JSONSchema7>;
	items?: JSONSchema7 | JSONSchema7[];
	required?: string[];
	description?: string;
	[key: string]: any;
}

/**
 * Generates a JSON Schema from actual data
 * 
 * @param json - The data to generate a schema from
 * @returns JSONSchema7 schema
 * 
 * @example
 * generateJsonSchema({ name: "John", age: 30 })
 * // Returns: { type: "object", properties: { name: { type: "string" }, age: { type: "number" } } }
 */
export function generateJsonSchema(json: unknown): JSONSchema7 {
	return inferType(json);
}

function isPrimitive(type: string): type is 'string' | 'number' | 'boolean' {
	return ['string', 'number', 'boolean'].includes(type);
}

function inferType(value: unknown): JSONSchema7 {
	if (value === null) {
		return { type: 'null' };
	}

	const type = typeof value;
	if (isPrimitive(type)) {
		return { type };
	}

	if (Array.isArray(value)) {
		return inferArrayType(value);
	}

	if (value && type === 'object') {
		return inferObjectType(value as Record<string, unknown>);
	}

	// Fallback for undefined or unknown types
	return { type: 'string' };
}

function inferArrayType(arr: unknown[]): JSONSchema7 {
	return {
		type: 'array',
		items: arr.length > 0 ? inferType(arr[0]) : {},
	};
}

function inferObjectType(obj: Record<string, unknown>): JSONSchema7 {
	const properties: JSONSchema7['properties'] = {};

	Object.entries(obj).forEach(([key, value]) => {
		properties[key] = inferType(value);
	});

	return {
		type: 'object',
		properties,
	};
}

/**
 * Generates a JSON Schema from NodeData
 * Extracts the main data field and generates schema from it
 * Prefers json, falls back to data (backward compatibility)
 * 
 * @param nodeData - NodeData object with json/data field
 * @returns JSONSchema7 schema
 */
export function generateSchemaFromNodeData(nodeData: any): JSONSchema7 {
	// Prefer json, fallback to data (backward compatibility)
	const data = nodeData?.json ?? nodeData?.data ?? nodeData;
	return generateJsonSchema(data);
}

/**
 * Generates schemas for an array of NodeData items
 * Merges all schemas to create a comprehensive schema
 * 
 * @param items - Array of NodeData items
 * @returns JSONSchema7 schema representing all items
 */
export function generateSchemaFromItems(items: any[]): JSONSchema7 {
	if (items.length === 0) {
		return { type: 'object', properties: {} };
	}

	// If all items have the same structure, use first item
	// Otherwise, merge all properties
	const schemas = items.map(item => generateSchemaFromNodeData(item));
	
	// For now, use the first item's schema
	// TODO: Implement schema merging for more complex cases
	return schemas[0] || { type: 'object', properties: {} };
}


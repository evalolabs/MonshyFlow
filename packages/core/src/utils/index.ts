// Utility Functions

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  keysToRemove: string[]
): Partial<T> {
  const sanitized = { ...obj };
  keysToRemove.forEach(key => delete sanitized[key]);
  return sanitized;
}

export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}


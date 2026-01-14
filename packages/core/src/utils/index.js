"use strict";
// Utility Functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = sleep;
exports.generateId = generateId;
exports.sanitizeObject = sanitizeObject;
exports.isObject = isObject;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function sanitizeObject(obj, keysToRemove) {
    const sanitized = { ...obj };
    keysToRemove.forEach(key => delete sanitized[key]);
    return sanitized;
}
function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
//# sourceMappingURL=index.js.map
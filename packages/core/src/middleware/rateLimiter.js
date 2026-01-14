"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Rate Limiting Strategy:
// - Development/Testing: Disabled (Kong handles rate limiting)
// - Production: Defense-in-depth (backup if Kong is bypassed)
const isDevelopment = process.env.NODE_ENV !== 'production';
// No-op middleware for development (Kong handles rate limiting)
const noOpLimiter = (req, res, next) => {
    next();
};
// In development, disable service-level rate limiting (Kong handles it)
// In production, keep it as defense-in-depth with reasonable limits
exports.apiLimiter = isDevelopment
    ? noOpLimiter
    : (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // 100 requests per 15 minutes (defense-in-depth)
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Skip rate limiting for health checks
            return req.path === '/health';
        },
    });
// In development, disable service-level rate limiting (Kong handles it)
// In production, keep it as defense-in-depth with reasonable limits
exports.authLimiter = isDevelopment
    ? noOpLimiter
    : (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 5 login attempts per 15 minutes
        message: 'Too many authentication attempts, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
//# sourceMappingURL=rateLimiter.js.map
"use strict";
// Constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_METHODS = exports.ROLES = exports.HTTP_STATUS = void 0;
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};
exports.ROLES = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    USER: 'user',
};
exports.AUTH_METHODS = {
    JWT: 'JWT',
    API_KEY: 'ApiKey',
};
//# sourceMappingURL=index.js.map
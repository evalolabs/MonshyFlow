"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddleware = ValidationMiddleware;
const zod_1 = require("zod");
const errors_1 = require("../errors");
const logger_1 = require("../logger");
function ValidationMiddleware(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                logger_1.logger.warn({ errors: error.errors }, 'Validation failed');
                // Convert ZodError to format expected by ValidationError
                const errorMap = {};
                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!errorMap[path]) {
                        errorMap[path] = [];
                    }
                    errorMap[path].push(err.message);
                });
                throw new errors_1.ValidationError('Validation failed', errorMap);
            }
            next(error);
        }
    };
}
//# sourceMappingURL=index.js.map
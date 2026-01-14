import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare function ValidationMiddleware(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=index.d.ts.map
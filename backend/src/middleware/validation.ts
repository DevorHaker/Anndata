import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export interface RequestValidationSchemas {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}

export function validateRequest(schema: RequestValidationSchemas | ZodSchema<any>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema && typeof (schema as any).parseAsync === 'function') {
        const parsed = await (schema as ZodSchema<any>).parseAsync({
          body: req.body,
          query: req.query,
          params: req.params
        });
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) req.query = parsed.query;
        if (parsed.params) req.params = parsed.params;
      } else {
        const s = schema as RequestValidationSchemas;
        if (s.body) req.body = await s.body.parseAsync(req.body);
        if (s.query) req.query = await s.query.parseAsync(req.query);
        if (s.params) req.params = await s.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        next(new ValidationError('Request validation failed', 'VALIDATION_ERROR', details));
      } else {
        next(error);
      }
    }
  };
}

export const validate = validateRequest;

import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

export interface ValidationSchema {
  body?: Record<string, any>;
  params?: Record<string, any>;
  query?: Record<string, any>;
}

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        const bodyValidation = validateObject(req.body, schema.body, 'body');
        if (!bodyValidation.isValid) {
          throw createError(
            `Request body validation failed: ${bodyValidation.errors.join(', ')}`,
            400,
            'VALIDATION_ERROR'
          );
        }
      }

      // Validate request parameters
      if (schema.params) {
        const paramsValidation = validateObject(req.params, schema.params, 'params');
        if (!paramsValidation.isValid) {
          throw createError(
            `Request parameters validation failed: ${paramsValidation.errors.join(', ')}`,
            400,
            'VALIDATION_ERROR'
          );
        }
      }

      // Validate query parameters
      if (schema.query) {
        const queryValidation = validateObject(req.query, schema.query, 'query');
        if (!queryValidation.isValid) {
          throw createError(
            `Query parameters validation failed: ${queryValidation.errors.join(', ')}`,
            400,
            'VALIDATION_ERROR'
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

function validateObject(
  obj: any, 
  schema: Record<string, any>, 
  context: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  for (const [key, rules] of Object.entries(schema)) {
    if (rules.required && (obj[key] === undefined || obj[key] === null)) {
      errors.push(`${context}.${key} is required`);
      continue;
    }

    // Skip validation if field is not present and not required
    if (obj[key] === undefined || obj[key] === null) {
      continue;
    }

    // Type validation
    if (rules.type) {
      const actualType = Array.isArray(obj[key]) ? 'array' : typeof obj[key];
      if (actualType !== rules.type) {
        errors.push(`${context}.${key} must be of type ${rules.type}, got ${actualType}`);
        continue;
      }
    }

    // String validations
    if (rules.type === 'string') {
      if (rules.minLength && obj[key].length < rules.minLength) {
        errors.push(`${context}.${key} must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength && obj[key].length > rules.maxLength) {
        errors.push(`${context}.${key} must be at most ${rules.maxLength} characters long`);
      }
      if (rules.pattern && !rules.pattern.test(obj[key])) {
        errors.push(`${context}.${key} format is invalid`);
      }
    }

    // Number validations
    if (rules.type === 'number') {
      if (rules.min !== undefined && obj[key] < rules.min) {
        errors.push(`${context}.${key} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && obj[key] > rules.max) {
        errors.push(`${context}.${key} must be at most ${rules.max}`);
      }
    }

    // Array validations
    if (rules.type === 'array') {
      if (rules.minItems && obj[key].length < rules.minItems) {
        errors.push(`${context}.${key} must have at least ${rules.minItems} items`);
      }
      if (rules.maxItems && obj[key].length > rules.maxItems) {
        errors.push(`${context}.${key} must have at most ${rules.maxItems} items`);
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(obj[key])) {
      errors.push(`${context}.${key} must be one of: ${rules.enum.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Common validation schemas
export const commonSchemas = {
  id: {
    type: 'string',
    required: true,
    minLength: 1
  },
  name: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 255
  },
  description: {
    type: 'string',
    maxLength: 1000
  },
  weight: {
    type: 'number',
    required: true,
    min: 0,
    max: 100
  },
  optionType: {
    type: 'string',
    required: true,
    enum: ['api', 'cloud-service', 'tech-stack', 'tool', 'custom']
  },
  criterionType: {
    type: 'string',
    required: true,
    enum: ['cost', 'performance', 'scalability', 'ease-of-use', 'custom']
  },
  scaleType: {
    type: 'string',
    required: true,
    enum: ['numeric', 'ordinal', 'boolean']
  }
};
import fc from 'fast-check';
import { validateRequiredString, validateNumberRange } from '../utils/validation';

describe('Core Types Property-Based Tests', () => {
  describe('validateRequiredString property tests', () => {
    it('should never return error for non-empty strings', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1 }),
        (validString, fieldName) => {
          const result = validateRequiredString(validString, fieldName);
          return result === null;
        }
      ));
    });

    it('should always return error for empty or whitespace-only strings', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(''),
          fc.string().filter(s => s.trim().length === 0 && s.length > 0)
        ),
        fc.string({ minLength: 1 }),
        (invalidString, fieldName) => {
          const result = validateRequiredString(invalidString, fieldName);
          return result !== null && result.severity === 'error';
        }
      ));
    });
  });

  describe('validateNumberRange property tests', () => {
    it('should return null for numbers within range', () => {
      fc.assert(fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 150, max: 200 }),
        fc.string({ minLength: 1 }),
        (value, min, max, fieldName) => {
          // Ensure min < max
          const actualMin = Math.min(min, max);
          const actualMax = Math.max(min, max);
          const validValue = actualMin + (value % (actualMax - actualMin + 1));
          
          const result = validateNumberRange(validValue, actualMin, actualMax, fieldName);
          return result === null;
        }
      ));
    });
  });
});
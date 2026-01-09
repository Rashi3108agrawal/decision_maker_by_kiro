import { 
  createValidationResult, 
  createValidationError, 
  validateRequiredString, 
  validateNumberRange,
  validateWeightSum 
} from './validation';

describe('Validation Utilities', () => {
  describe('createValidationResult', () => {
    it('should create valid result with no errors', () => {
      const result = createValidationResult();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.qualityScore).toBe(100);
    });

    it('should create invalid result with errors', () => {
      const errors = [createValidationError('field1', 'Error message')];
      const result = createValidationResult(errors);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.qualityScore).toBe(90); // 100 - (1 * 10)
    });
  });

  describe('validateRequiredString', () => {
    it('should return null for valid string', () => {
      const result = validateRequiredString('valid string', 'testField');
      expect(result).toBeNull();
    });

    it('should return error for empty string', () => {
      const result = validateRequiredString('', 'testField');
      expect(result).not.toBeNull();
      expect(result?.field).toBe('testField');
      expect(result?.severity).toBe('error');
    });

    it('should return error for whitespace-only string', () => {
      const result = validateRequiredString('   ', 'testField');
      expect(result).not.toBeNull();
      expect(result?.message).toContain('required and cannot be empty');
    });
  });

  describe('validateNumberRange', () => {
    it('should return null for number in range', () => {
      const result = validateNumberRange(50, 0, 100, 'testField');
      expect(result).toBeNull();
    });

    it('should return error for number below range', () => {
      const result = validateNumberRange(-5, 0, 100, 'testField');
      expect(result).not.toBeNull();
      expect(result?.message).toContain('must be between 0 and 100');
    });

    it('should return error for number above range', () => {
      const result = validateNumberRange(150, 0, 100, 'testField');
      expect(result).not.toBeNull();
      expect(result?.message).toContain('must be between 0 and 100');
    });
  });

  describe('validateWeightSum', () => {
    it('should return null for weights that sum to 100', () => {
      const weights = { criterion1: 30, criterion2: 70 };
      const result = validateWeightSum(weights);
      expect(result).toBeNull();
    });

    it('should return error for weights that do not sum to 100', () => {
      const weights = { criterion1: 30, criterion2: 60 };
      const result = validateWeightSum(weights);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('must sum to 100');
    });

    it('should allow small floating point tolerance', () => {
      const weights = { criterion1: 33.33, criterion2: 66.67 };
      const result = validateWeightSum(weights);
      expect(result).toBeNull();
    });
  });
});
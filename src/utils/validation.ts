import { ValidationResult, ValidationError } from '../types/core';

/**
 * Creates a validation result with the given errors and warnings
 */
export function createValidationResult(
  errors: ValidationError[] = [],
  warnings: ValidationError[] = []
): ValidationResult {
  const isValid = errors.length === 0;
  const totalIssues = errors.length + warnings.length;
  const qualityScore = Math.max(0, 100 - (totalIssues * 10));

  return {
    isValid,
    errors,
    warnings,
    qualityScore
  };
}

/**
 * Creates a validation error
 */
export function createValidationError(
  field: string,
  message: string,
  severity: 'error' | 'warning' = 'error'
): ValidationError {
  return {
    field,
    message,
    severity
  };
}

/**
 * Validates that a string is not empty or just whitespace
 */
export function validateRequiredString(value: string, fieldName: string): ValidationError | null {
  if (!value || value.trim().length === 0) {
    return createValidationError(fieldName, `${fieldName} is required and cannot be empty`);
  }
  return null;
}

/**
 * Validates that a number is within a specified range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationError | null {
  if (value < min || value > max) {
    return createValidationError(
      fieldName,
      `${fieldName} must be between ${min} and ${max}, got ${value}`
    );
  }
  return null;
}

/**
 * Validates that weights sum to approximately 100 (allowing for small floating point errors)
 */
export function validateWeightSum(weights: Record<string, number>): ValidationError | null {
  const sum = Object.values(weights).reduce((acc, weight) => acc + weight, 0);
  const tolerance = 0.01; // Allow 1% tolerance for floating point errors
  
  if (Math.abs(sum - 100) > tolerance) {
    return createValidationError(
      'weights',
      `Weights must sum to 100, current sum is ${sum.toFixed(2)}`
    );
  }
  return null;
}
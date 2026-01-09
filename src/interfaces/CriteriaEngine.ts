import { Criterion, ValidationResult } from '../types/core';

export interface CriteriaEngine {
  addCriterion(criterion: Omit<Criterion, 'id'>): Promise<Criterion>;
  updateWeights(weights: Record<string, number>): Promise<void>;
  validateCriteria(criteria: Criterion[]): ValidationResult;
  normalizeWeights(weights: Record<string, number>): Record<string, number>;
  getCriterion(id: string): Promise<Criterion | null>;
  getAllCriteria(): Promise<Criterion[]>;
}
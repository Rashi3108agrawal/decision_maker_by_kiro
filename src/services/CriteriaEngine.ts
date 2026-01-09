import { Criterion, CriterionType, ScaleType, ValidationResult, ValidationError } from '../types/core';
import { CriteriaEngine as ICriteriaEngine } from '../interfaces/CriteriaEngine';
import { 
  createValidationResult, 
  createValidationError, 
  validateRequiredString,
  validateNumberRange,
  validateWeightSum
} from '../utils/validation';

export class CriteriaEngine implements ICriteriaEngine {
  private criteria: Map<string, Criterion> = new Map();
  private nextId = 1;

  /**
   * Adds a new criterion to the engine
   * Requirements: 2.1, 2.2
   */
  async addCriterion(criterion: Omit<Criterion, 'id'>): Promise<Criterion> {
    const newCriterion: Criterion = {
      ...criterion,
      id: this.generateId()
    };

    const validation = this.validateSingleCriterion(newCriterion);
    if (!validation.isValid) {
      throw new Error(`Invalid criterion: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.criteria.set(newCriterion.id, newCriterion);
    return newCriterion;
  }

  /**
   * Updates weights for multiple criteria and normalizes them
   * Requirements: 2.3, 2.5
   */
  async updateWeights(weights: Record<string, number>): Promise<void> {
    // Validate that all provided criterion IDs exist
    for (const criterionId of Object.keys(weights)) {
      if (!this.criteria.has(criterionId)) {
        throw new Error(`Criterion with id ${criterionId} not found`);
      }
    }

    // Validate individual weight values
    for (const [criterionId, weight] of Object.entries(weights)) {
      if (weight < 0 || weight > 100) {
        throw new Error(`Weight for criterion ${criterionId} must be between 0 and 100, got ${weight}`);
      }
    }

    // Normalize weights to ensure they sum to exactly 100
    const normalizedWeights = this.normalizeWeights(weights);

    // Update the criteria with normalized weights
    for (const [criterionId, normalizedWeight] of Object.entries(normalizedWeights)) {
      const criterion = this.criteria.get(criterionId)!;
      criterion.weight = normalizedWeight;
      this.criteria.set(criterionId, criterion);
    }
  }

  /**
   * Validates a collection of criteria
   * Requirements: 2.4
   */
  validateCriteria(criteria: Criterion[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate each criterion individually
    for (const criterion of criteria) {
      const validation = this.validateSingleCriterion(criterion);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }

    // Validate weight distribution across all criteria
    if (criteria.length > 0) {
      const weights = criteria.reduce((acc, criterion) => {
        acc[criterion.id] = criterion.weight;
        return acc;
      }, {} as Record<string, number>);

      const weightSumError = validateWeightSum(weights);
      if (weightSumError) {
        errors.push(weightSumError);
      }
    }

    // Check for duplicate criterion names
    const names = criteria.map(c => c.name.toLowerCase());
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      warnings.push(createValidationError(
        'criteria',
        `Duplicate criterion names found: ${[...new Set(duplicateNames)].join(', ')}`,
        'warning'
      ));
    }

    // Validate criterion type distribution
    const typeValidation = this.validateCriterionTypeDistribution(criteria);
    warnings.push(...typeValidation.warnings);

    return createValidationResult(errors, warnings);
  }

  /**
   * Normalizes weights to sum to exactly 100
   * Requirements: 2.3
   */
  normalizeWeights(weights: Record<string, number>): Record<string, number> {
    const sum = Object.values(weights).reduce((acc, weight) => acc + weight, 0);
    
    if (sum === 0) {
      // If all weights are 0, distribute equally
      const equalWeight = 100 / Object.keys(weights).length;
      return Object.keys(weights).reduce((acc, id) => {
        acc[id] = equalWeight;
        return acc;
      }, {} as Record<string, number>);
    }

    // Normalize to sum to 100
    const normalizedWeights: Record<string, number> = {};
    for (const [id, weight] of Object.entries(weights)) {
      normalizedWeights[id] = (weight / sum) * 100;
    }

    return normalizedWeights;
  }

  /**
   * Retrieves a criterion by ID
   */
  async getCriterion(id: string): Promise<Criterion | null> {
    return this.criteria.get(id) || null;
  }

  /**
   * Retrieves all criteria
   */
  async getAllCriteria(): Promise<Criterion[]> {
    return Array.from(this.criteria.values());
  }

  /**
   * Validates a single criterion
   * Requirements: 2.1, 2.2, 2.4
   */
  private validateSingleCriterion(criterion: Criterion): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate required fields
    const nameError = validateRequiredString(criterion.name, 'name');
    if (nameError) errors.push(nameError);

    // Validate criterion type
    if (!this.isValidCriterionType(criterion.type)) {
      errors.push(createValidationError(
        'type',
        `Invalid criterion type: ${criterion.type}. Must be one of: cost, performance, scalability, ease-of-use, custom`
      ));
    }

    // Validate weight range
    const weightError = validateNumberRange(criterion.weight, 0, 100, 'weight');
    if (weightError) errors.push(weightError);

    // Validate scale type
    if (!this.isValidScaleType(criterion.scale)) {
      errors.push(createValidationError(
        'scale',
        `Invalid scale type: ${criterion.scale}. Must be one of: numeric, ordinal, boolean`
      ));
    }

    // Validate scale definition if provided
    if (criterion.scaleDefinition) {
      const scaleValidation = this.validateScaleDefinition(criterion.scale, criterion.scaleDefinition);
      errors.push(...scaleValidation.errors);
      warnings.push(...scaleValidation.warnings);
    } else {
      // Warn if scale definition is missing for non-boolean scales
      if (criterion.scale !== 'boolean') {
        warnings.push(createValidationError(
          'scaleDefinition',
          `Scale definition recommended for ${criterion.scale} scale type`,
          'warning'
        ));
      }
    }

    return createValidationResult(errors, warnings);
  }

  /**
   * Validates criterion type
   */
  private isValidCriterionType(type: string): type is CriterionType {
    const validTypes: CriterionType[] = ['cost', 'performance', 'scalability', 'ease-of-use', 'custom'];
    return validTypes.includes(type as CriterionType);
  }

  /**
   * Validates scale type
   */
  private isValidScaleType(scale: string): scale is ScaleType {
    const validScales: ScaleType[] = ['numeric', 'ordinal', 'boolean'];
    return validScales.includes(scale as ScaleType);
  }

  /**
   * Validates scale definition based on scale type
   */
  private validateScaleDefinition(scaleType: ScaleType, scaleDefinition: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    switch (scaleType) {
      case 'numeric':
        if (scaleDefinition.min !== undefined && scaleDefinition.max !== undefined) {
          if (scaleDefinition.min >= scaleDefinition.max) {
            errors.push(createValidationError(
              'scaleDefinition.min',
              'Minimum value must be less than maximum value'
            ));
          }
        }
        if (scaleDefinition.unit && typeof scaleDefinition.unit !== 'string') {
          errors.push(createValidationError(
            'scaleDefinition.unit',
            'Unit must be a string'
          ));
        }
        break;

      case 'ordinal':
        if (!scaleDefinition.labels || !Array.isArray(scaleDefinition.labels)) {
          errors.push(createValidationError(
            'scaleDefinition.labels',
            'Ordinal scale must have labels array'
          ));
        } else if (scaleDefinition.labels.length < 2) {
          errors.push(createValidationError(
            'scaleDefinition.labels',
            'Ordinal scale must have at least 2 labels'
          ));
        }
        break;

      case 'boolean':
        // Boolean scales don't need scale definitions
        if (Object.keys(scaleDefinition).length > 0) {
          warnings.push(createValidationError(
            'scaleDefinition',
            'Boolean scales do not require scale definitions',
            'warning'
          ));
        }
        break;
    }

    return createValidationResult(errors, warnings);
  }

  /**
   * Validates the distribution of criterion types for balance
   */
  private validateCriterionTypeDistribution(criteria: Criterion[]): ValidationResult {
    const warnings: ValidationError[] = [];

    if (criteria.length === 0) {
      return createValidationResult([], warnings);
    }

    const typeCounts = criteria.reduce((acc, criterion) => {
      acc[criterion.type] = (acc[criterion.type] || 0) + 1;
      return acc;
    }, {} as Record<CriterionType, number>);

    // Warn if all criteria are of the same type (except for single criterion)
    if (criteria.length > 1 && Object.keys(typeCounts).length === 1) {
      warnings.push(createValidationError(
        'criteria',
        'Consider adding criteria of different types for more balanced evaluation',
        'warning'
      ));
    }

    // Warn if cost criterion has very high weight
    const costCriteria = criteria.filter(c => c.type === 'cost');
    if (costCriteria.length > 0) {
      const totalCostWeight = costCriteria.reduce((sum, c) => sum + c.weight, 0);
      if (totalCostWeight > 60) {
        warnings.push(createValidationError(
          'criteria',
          'Cost criteria have very high weight (>60%). Consider balancing with other factors',
          'warning'
        ));
      }
    }

    return createValidationResult([], warnings);
  }

  /**
   * Generates a unique ID for new criteria
   */
  private generateId(): string {
    return `criterion_${this.nextId++}`;
  }

  /**
   * Gets the current criteria count
   */
  getCriteriaCount(): number {
    return this.criteria.size;
  }

  /**
   * Clears all criteria (useful for testing)
   */
  clear(): void {
    this.criteria.clear();
    this.nextId = 1;
  }
}
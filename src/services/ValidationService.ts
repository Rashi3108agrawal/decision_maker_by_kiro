import { 
  Option, 
  Criterion, 
  ComparisonSession, 
  ValidationResult, 
  ValidationError,
  AttributeValue,
  ScoreMatrix
} from '../types/core';
import { 
  createValidationResult, 
  createValidationError, 
  validateRequiredString 
} from '../utils/validation';

export interface DataQualityReport {
  overallScore: number; // 0-100
  completenessScore: number; // 0-100
  consistencyScore: number; // 0-100
  issues: ValidationError[];
  suggestions: string[];
}

export interface ComparisonValidationResult extends ValidationResult {
  qualityReport: DataQualityReport;
}

/**
 * ValidationService provides comprehensive data checking and quality scoring
 * for comparison sessions, options, and criteria.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export class ValidationService {
  
  /**
   * Validates a complete comparison session with comprehensive quality analysis
   * Requirements: 7.1, 7.2, 7.4
   */
  validateComparisonSession(session: ComparisonSession): ComparisonValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    // Validate session metadata
    const sessionValidation = this.validateSessionMetadata(session);
    errors.push(...sessionValidation.errors);
    warnings.push(...sessionValidation.warnings);

    // Validate options
    const optionsValidation = this.validateOptionsCompleteness(session.options);
    errors.push(...optionsValidation.errors);
    warnings.push(...optionsValidation.warnings);
    suggestions.push(...optionsValidation.suggestions);

    // Validate criteria
    const criteriaValidation = this.validateCriteriaCompleteness(session.criteria);
    errors.push(...criteriaValidation.errors);
    warnings.push(...criteriaValidation.warnings);
    suggestions.push(...criteriaValidation.suggestions);

    // Validate consistency between options and criteria
    const consistencyValidation = this.validateDataConsistency(session.options, session.criteria);
    errors.push(...consistencyValidation.errors);
    warnings.push(...consistencyValidation.warnings);
    suggestions.push(...consistencyValidation.suggestions);

    // Calculate quality scores
    const qualityReport = this.calculateDataQuality(session.options, session.criteria, errors, warnings);

    const baseResult = createValidationResult(errors, warnings);
    
    return {
      ...baseResult,
      qualityReport: {
        ...qualityReport,
        suggestions
      }
    };
  }

  /**
   * Validates session metadata
   * Requirements: 7.1
   */
  private validateSessionMetadata(session: ComparisonSession): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate required session fields
    const nameError = validateRequiredString(session.name, 'session.name');
    if (nameError) errors.push(nameError);

    // Validate session has minimum required data
    if (session.options.length < 2) {
      errors.push(createValidationError(
        'session.options',
        'Session must have at least 2 options for comparison'
      ));
    }

    if (session.criteria.length === 0) {
      errors.push(createValidationError(
        'session.criteria',
        'Session must have at least 1 criterion for evaluation'
      ));
    }

    // Warn about missing description
    if (!session.description || session.description.trim().length === 0) {
      warnings.push(createValidationError(
        'session.description',
        'Session description is recommended for better context',
        'warning'
      ));
    }

    return createValidationResult(errors, warnings);
  }

  /**
   * Validates options for completeness and consistency
   * Requirements: 7.1, 7.2, 7.3
   */
  private validateOptionsCompleteness(options: Option[]): ValidationResult & { suggestions: string[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    if (options.length === 0) {
      return { 
        ...createValidationResult(errors, warnings), 
        suggestions 
      };
    }

    // Check for missing attributes across options
    const allAttributeKeys = new Set<string>();
    options.forEach(option => {
      Object.keys(option.attributes).forEach(key => allAttributeKeys.add(key));
    });

    // Validate each option has consistent attributes
    options.forEach((option, index) => {
      const missingAttributes: string[] = [];
      const emptyAttributes: string[] = [];

      allAttributeKeys.forEach(key => {
        if (!(key in option.attributes)) {
          missingAttributes.push(key);
        } else if (this.isEmptyAttributeValue(option.attributes[key])) {
          emptyAttributes.push(key);
        }
      });

      if (missingAttributes.length > 0) {
        warnings.push(createValidationError(
          `options[${index}].attributes`,
          `Option "${option.name}" missing attributes: ${missingAttributes.join(', ')}`,
          'warning'
        ));
        suggestions.push(`Add missing attributes to "${option.name}": ${missingAttributes.join(', ')}`);
      }

      if (emptyAttributes.length > 0) {
        warnings.push(createValidationError(
          `options[${index}].attributes`,
          `Option "${option.name}" has empty attributes: ${emptyAttributes.join(', ')}`,
          'warning'
        ));
        suggestions.push(`Provide values for empty attributes in "${option.name}": ${emptyAttributes.join(', ')}`);
      }

      // Check for metadata completeness
      if (!option.metadata || !option.metadata.description) {
        warnings.push(createValidationError(
          `options[${index}].metadata`,
          `Option "${option.name}" missing description`,
          'warning'
        ));
        suggestions.push(`Add a description to "${option.name}" for better context`);
      }
    });

    // Check for attribute type consistency across options
    const attributeTypeInconsistencies = this.checkAttributeTypeConsistency(options);
    warnings.push(...attributeTypeInconsistencies.warnings);
    suggestions.push(...attributeTypeInconsistencies.suggestions);

    return { 
      ...createValidationResult(errors, warnings), 
      suggestions 
    };
  }

  /**
   * Validates criteria for completeness
   * Requirements: 7.1, 7.2
   */
  private validateCriteriaCompleteness(criteria: Criterion[]): ValidationResult & { suggestions: string[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    if (criteria.length === 0) {
      return { 
        ...createValidationResult(errors, warnings), 
        suggestions 
      };
    }

    // Check for missing scale definitions
    criteria.forEach((criterion, index) => {
      if (criterion.scale !== 'boolean' && !criterion.scaleDefinition) {
        warnings.push(createValidationError(
          `criteria[${index}].scaleDefinition`,
          `Criterion "${criterion.name}" missing scale definition`,
          'warning'
        ));
        suggestions.push(`Define scale for "${criterion.name}" to improve evaluation accuracy`);
      }

      // Check for very low or zero weights
      if (criterion.weight === 0) {
        warnings.push(createValidationError(
          `criteria[${index}].weight`,
          `Criterion "${criterion.name}" has zero weight`,
          'warning'
        ));
        suggestions.push(`Consider assigning weight to "${criterion.name}" or remove if not needed`);
      }
    });

    // Check for balanced criterion types
    const typeDistribution = this.analyzeCriterionTypeDistribution(criteria);
    if (typeDistribution.warnings.length > 0) {
      warnings.push(...typeDistribution.warnings);
      suggestions.push(...typeDistribution.suggestions);
    }

    return { 
      ...createValidationResult(errors, warnings), 
      suggestions 
    };
  }

  /**
   * Validates consistency between options and criteria
   * Requirements: 7.2, 7.3
   */
  private validateDataConsistency(options: Option[], criteria: Criterion[]): ValidationResult & { suggestions: string[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    if (options.length === 0 || criteria.length === 0) {
      return { 
        ...createValidationResult(errors, warnings), 
        suggestions 
      };
    }

    // Check if options have attributes that match criteria requirements
    criteria.forEach(criterion => {
      const matchingAttributeKey = this.findMatchingAttributeKey(criterion, options);
      
      if (!matchingAttributeKey) {
        warnings.push(createValidationError(
          'data.consistency',
          `No matching attribute found for criterion "${criterion.name}"`,
          'warning'
        ));
        suggestions.push(`Add attribute data for criterion "${criterion.name}" to all options`);
      } else {
        // Check if all options have this attribute
        const optionsWithoutAttribute = options.filter(option => 
          !(matchingAttributeKey in option.attributes) || 
          this.isEmptyAttributeValue(option.attributes[matchingAttributeKey])
        );

        if (optionsWithoutAttribute.length > 0) {
          warnings.push(createValidationError(
            'data.consistency',
            `Some options missing data for criterion "${criterion.name}": ${optionsWithoutAttribute.map(o => o.name).join(', ')}`,
            'warning'
          ));
          suggestions.push(`Provide "${matchingAttributeKey}" data for: ${optionsWithoutAttribute.map(o => o.name).join(', ')}`);
        }
      }
    });

    return { 
      ...createValidationResult(errors, warnings), 
      suggestions 
    };
  }

  /**
   * Calculates overall data quality score
   * Requirements: 7.4
   */
  private calculateDataQuality(options: Option[], criteria: Criterion[], errors: ValidationError[], warnings: ValidationError[]): DataQualityReport {
    const completenessScore = this.calculateCompletenessScore(options, criteria);
    const consistencyScore = this.calculateConsistencyScore(options, criteria);
    
    // Overall score is weighted average of completeness and consistency
    const overallScore = Math.round((completenessScore * 0.6) + (consistencyScore * 0.4));
    
    // Reduce score based on errors and warnings
    const errorPenalty = errors.length * 15; // 15 points per error
    const warningPenalty = warnings.length * 5; // 5 points per warning
    const finalScore = Math.max(0, overallScore - errorPenalty - warningPenalty);

    return {
      overallScore: finalScore,
      completenessScore,
      consistencyScore,
      issues: [...errors, ...warnings],
      suggestions: [] // Will be populated by calling method
    };
  }

  /**
   * Calculates completeness score based on data availability
   * Requirements: 7.4
   */
  private calculateCompletenessScore(options: Option[], criteria: Criterion[]): number {
    if (options.length === 0 || criteria.length === 0) {
      return 0;
    }

    let totalDataPoints = 0;
    let filledDataPoints = 0;

    // Count attribute completeness
    const allAttributeKeys = new Set<string>();
    options.forEach(option => {
      Object.keys(option.attributes).forEach(key => allAttributeKeys.add(key));
    });

    options.forEach(option => {
      allAttributeKeys.forEach(key => {
        totalDataPoints++;
        if (key in option.attributes && !this.isEmptyAttributeValue(option.attributes[key])) {
          filledDataPoints++;
        }
      });

      // Count metadata completeness
      totalDataPoints += 2; // description and url
      if (option.metadata?.description) filledDataPoints++;
      if (option.metadata?.url) filledDataPoints++;
    });

    // Count criteria completeness
    criteria.forEach(criterion => {
      totalDataPoints += 2; // scale definition and weight
      if (criterion.scaleDefinition) filledDataPoints++;
      if (criterion.weight > 0) filledDataPoints++;
    });

    return totalDataPoints > 0 ? Math.round((filledDataPoints / totalDataPoints) * 100) : 0;
  }

  /**
   * Calculates consistency score based on data uniformity
   * Requirements: 7.4
   */
  private calculateConsistencyScore(options: Option[], criteria: Criterion[]): number {
    if (options.length === 0 || criteria.length === 0) {
      return 0;
    }

    let consistencyPoints = 0;
    let totalChecks = 0;

    // Check attribute type consistency
    const allAttributeKeys = new Set<string>();
    options.forEach(option => {
      Object.keys(option.attributes).forEach(key => allAttributeKeys.add(key));
    });

    allAttributeKeys.forEach(key => {
      totalChecks++;
      const types = new Set<string>();
      options.forEach(option => {
        if (key in option.attributes && option.attributes[key] !== null) {
          types.add(typeof option.attributes[key]);
        }
      });
      if (types.size <= 1) {
        consistencyPoints++;
      }
    });

    // Check criteria-option alignment
    criteria.forEach(criterion => {
      totalChecks++;
      const matchingKey = this.findMatchingAttributeKey(criterion, options);
      if (matchingKey) {
        consistencyPoints++;
      }
    });

    return totalChecks > 0 ? Math.round((consistencyPoints / totalChecks) * 100) : 100;
  }

  /**
   * Checks if an attribute value is considered empty
   */
  private isEmptyAttributeValue(value: AttributeValue): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim().length === 0) return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }

  /**
   * Checks for attribute type consistency across options
   */
  private checkAttributeTypeConsistency(options: Option[]): { warnings: ValidationError[], suggestions: string[] } {
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    const allAttributeKeys = new Set<string>();
    options.forEach(option => {
      Object.keys(option.attributes).forEach(key => allAttributeKeys.add(key));
    });

    allAttributeKeys.forEach(key => {
      const types = new Set<string>();
      const optionsWithAttribute: string[] = [];

      options.forEach(option => {
        if (key in option.attributes && option.attributes[key] !== null) {
          types.add(typeof option.attributes[key]);
          optionsWithAttribute.push(option.name);
        }
      });

      if (types.size > 1) {
        warnings.push(createValidationError(
          'attributes.consistency',
          `Attribute "${key}" has inconsistent types across options`,
          'warning'
        ));
        suggestions.push(`Ensure "${key}" attribute has consistent data type across all options`);
      }
    });

    return { warnings, suggestions };
  }

  /**
   * Analyzes criterion type distribution for balance
   */
  private analyzeCriterionTypeDistribution(criteria: Criterion[]): { warnings: ValidationError[], suggestions: string[] } {
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    const typeCounts = criteria.reduce((acc, criterion) => {
      acc[criterion.type] = (acc[criterion.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check for over-concentration in one type
    const totalCriteria = criteria.length;
    Object.entries(typeCounts).forEach(([type, count]) => {
      const percentage = (count / totalCriteria) * 100;
      if (percentage > 70 && totalCriteria > 2) {
        warnings.push(createValidationError(
          'criteria.distribution',
          `Over-concentration in ${type} criteria (${percentage.toFixed(0)}%)`,
          'warning'
        ));
        suggestions.push(`Consider adding criteria of different types to balance the evaluation`);
      }
    });

    return { warnings, suggestions };
  }

  /**
   * Finds matching attribute key for a criterion
   */
  private findMatchingAttributeKey(criterion: Criterion, options: Option[]): string | null {
    // Direct name match
    const directMatch = criterion.name.toLowerCase().replace(/\s+/g, '');
    
    for (const option of options) {
      const attributeKeys = Object.keys(option.attributes);
      
      // Check for exact match
      if (attributeKeys.includes(criterion.name)) {
        return criterion.name;
      }
      
      // Check for normalized match
      const normalizedMatch = attributeKeys.find(key => 
        key.toLowerCase().replace(/\s+/g, '') === directMatch
      );
      if (normalizedMatch) {
        return normalizedMatch;
      }
      
      // Check for partial match based on criterion type
      const typeBasedMatch = this.findTypeBasedMatch(criterion.type, attributeKeys);
      if (typeBasedMatch) {
        return typeBasedMatch;
      }
    }

    return null;
  }

  /**
   * Finds attribute key based on criterion type
   */
  private findTypeBasedMatch(criterionType: string, attributeKeys: string[]): string | null {
    const typeKeywords: Record<string, string[]> = {
      'cost': ['cost', 'price', 'pricing', 'fee', 'charge'],
      'performance': ['performance', 'speed', 'latency', 'throughput', 'response'],
      'scalability': ['scalability', 'scale', 'capacity', 'limit'],
      'ease-of-use': ['ease', 'usability', 'complexity', 'learning', 'documentation']
    };

    const keywords = typeKeywords[criterionType] || [];
    
    for (const keyword of keywords) {
      const match = attributeKeys.find(key => 
        key.toLowerCase().includes(keyword.toLowerCase())
      );
      if (match) {
        return match;
      }
    }

    return null;
  }

  /**
   * Generates improvement suggestions for incomplete data
   * Requirements: 7.5
   */
  generateImprovementSuggestions(session: ComparisonSession): string[] {
    const validation = this.validateComparisonSession(session);
    return validation.qualityReport.suggestions;
  }

  /**
   * Validates data for analysis readiness
   * Requirements: 7.3
   */
  validateAnalysisReadiness(options: Option[], criteria: Criterion[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check minimum requirements for analysis
    if (options.length < 2) {
      errors.push(createValidationError(
        'analysis.options',
        'At least 2 options required for analysis'
      ));
    }

    if (criteria.length === 0) {
      errors.push(createValidationError(
        'analysis.criteria',
        'At least 1 criterion required for analysis'
      ));
    }

    // Check that each criterion has corresponding data in options
    criteria.forEach(criterion => {
      const matchingKey = this.findMatchingAttributeKey(criterion, options);
      if (!matchingKey) {
        errors.push(createValidationError(
          'analysis.data',
          `No data available for criterion "${criterion.name}"`
        ));
      } else {
        // Check if enough options have data for this criterion
        const optionsWithData = options.filter(option => 
          matchingKey in option.attributes && 
          !this.isEmptyAttributeValue(option.attributes[matchingKey])
        );

        if (optionsWithData.length < 2) {
          errors.push(createValidationError(
            'analysis.data',
            `Insufficient data for criterion "${criterion.name}" (need at least 2 options with data)`
          ));
        }
      }
    });

    // Check weight distribution
    const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push(createValidationError(
        'analysis.weights',
        `Criterion weights must sum to 100, current sum is ${totalWeight.toFixed(2)}`
      ));
    }

    return createValidationResult(errors, warnings);
  }
}
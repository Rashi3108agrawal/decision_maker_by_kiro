import { Option, OptionType, ValidationResult, ValidationError } from '../types/core';
import { OptionManager as IOptionManager } from '../interfaces/OptionManager';
import { 
  createValidationResult, 
  createValidationError, 
  validateRequiredString 
} from '../utils/validation';

export class OptionManager implements IOptionManager {
  private options: Map<string, Option> = new Map();
  private nextId = 1;

  /**
   * Adds a new option to the manager
   * Requirements: 1.1, 1.2, 1.5
   */
  async addOption(option: Omit<Option, 'id'>): Promise<Option> {
    const newOption: Option = {
      ...option,
      id: this.generateId()
    };

    const validation = this.validateOption(newOption);
    if (!validation.isValid) {
      throw new Error(`Invalid option: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Check option count constraint (2-10 options) - Requirement 1.3
    if (this.options.size >= 10) {
      throw new Error('Cannot add more than 10 options for comparison');
    }

    this.options.set(newOption.id, newOption);
    return newOption;
  }

  /**
   * Updates an existing option
   * Requirements: 1.4
   */
  async updateOption(id: string, updates: Partial<Option>): Promise<Option> {
    const existingOption = this.options.get(id);
    if (!existingOption) {
      throw new Error(`Option with id ${id} not found`);
    }

    const updatedOption: Option = {
      ...existingOption,
      ...updates,
      id // Ensure ID cannot be changed
    };

    const validation = this.validateOption(updatedOption);
    if (!validation.isValid) {
      throw new Error(`Invalid option update: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.options.set(id, updatedOption);
    return updatedOption;
  }

  /**
   * Removes an option from the manager
   * Requirements: 1.4
   */
  async removeOption(id: string): Promise<void> {
    if (!this.options.has(id)) {
      throw new Error(`Option with id ${id} not found`);
    }

    // Check minimum option count constraint (at least 2 options) - Requirement 1.3
    if (this.options.size <= 2) {
      throw new Error('Cannot remove option: minimum of 2 options required for comparison');
    }

    this.options.delete(id);
  }

  /**
   * Retrieves an option by ID
   */
  async getOption(id: string): Promise<Option | null> {
    return this.options.get(id) || null;
  }

  /**
   * Retrieves all options
   */
  async getAllOptions(): Promise<Option[]> {
    return Array.from(this.options.values());
  }

  /**
   * Validates an option according to requirements
   * Requirements: 1.2, 1.5
   */
  validateOption(option: Option): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate required fields
    const nameError = validateRequiredString(option.name, 'name');
    if (nameError) errors.push(nameError);

    // Validate option type
    if (!this.isValidOptionType(option.type)) {
      errors.push(createValidationError(
        'type',
        `Invalid option type: ${option.type}. Must be one of: api, cloud-service, tech-stack, tool, custom`
      ));
    }

    // Validate attributes object exists
    if (!option.attributes || typeof option.attributes !== 'object') {
      errors.push(createValidationError(
        'attributes',
        'Option must have an attributes object'
      ));
    } else {
      // Validate attributes based on option type
      const attributeValidation = this.validateAttributesByType(option.type, option.attributes);
      errors.push(...attributeValidation.errors);
      warnings.push(...attributeValidation.warnings);
    }

    // Validate metadata if provided
    if (option.metadata) {
      const metadataValidation = this.validateMetadata(option.metadata);
      errors.push(...metadataValidation.errors);
      warnings.push(...metadataValidation.warnings);
    }

    return createValidationResult(errors, warnings);
  }

  /**
   * Validates option type
   */
  private isValidOptionType(type: string): type is OptionType {
    const validTypes: OptionType[] = ['api', 'cloud-service', 'tech-stack', 'tool', 'custom'];
    return validTypes.includes(type as OptionType);
  }

  /**
   * Validates attributes based on option type
   * Requirements: 1.5 - Support different option types
   */
  private validateAttributesByType(type: OptionType, attributes: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    switch (type) {
      case 'api':
        this.validateApiAttributes(attributes, errors, warnings);
        break;
      case 'cloud-service':
        this.validateCloudServiceAttributes(attributes, errors, warnings);
        break;
      case 'tech-stack':
        this.validateTechStackAttributes(attributes, errors, warnings);
        break;
      case 'tool':
        this.validateToolAttributes(attributes, errors, warnings);
        break;
      case 'custom':
        // Custom options have flexible attributes, just warn if empty
        if (Object.keys(attributes).length === 0) {
          warnings.push(createValidationError(
            'attributes',
            'Custom option has no attributes defined',
            'warning'
          ));
        }
        break;
    }

    return createValidationResult(errors, warnings);
  }

  /**
   * Validates API-specific attributes
   */
  private validateApiAttributes(attributes: Record<string, any>, errors: ValidationError[], warnings: ValidationError[]): void {
    const recommendedFields = ['endpoint', 'authentication', 'rateLimit', 'pricing', 'documentation'];
    const missingRecommended = recommendedFields.filter(field => !attributes[field]);
    
    if (missingRecommended.length > 0) {
      warnings.push(createValidationError(
        'attributes',
        `API option missing recommended attributes: ${missingRecommended.join(', ')}`,
        'warning'
      ));
    }
  }

  /**
   * Validates cloud service-specific attributes
   */
  private validateCloudServiceAttributes(attributes: Record<string, any>, errors: ValidationError[], warnings: ValidationError[]): void {
    const recommendedFields = ['provider', 'region', 'pricing', 'sla', 'features'];
    const missingRecommended = recommendedFields.filter(field => !attributes[field]);
    
    if (missingRecommended.length > 0) {
      warnings.push(createValidationError(
        'attributes',
        `Cloud service option missing recommended attributes: ${missingRecommended.join(', ')}`,
        'warning'
      ));
    }
  }

  /**
   * Validates tech stack-specific attributes
   */
  private validateTechStackAttributes(attributes: Record<string, any>, errors: ValidationError[], warnings: ValidationError[]): void {
    const recommendedFields = ['language', 'framework', 'database', 'deployment', 'community'];
    const missingRecommended = recommendedFields.filter(field => !attributes[field]);
    
    if (missingRecommended.length > 0) {
      warnings.push(createValidationError(
        'attributes',
        `Tech stack option missing recommended attributes: ${missingRecommended.join(', ')}`,
        'warning'
      ));
    }
  }

  /**
   * Validates tool-specific attributes
   */
  private validateToolAttributes(attributes: Record<string, any>, errors: ValidationError[], warnings: ValidationError[]): void {
    const recommendedFields = ['category', 'platform', 'license', 'support', 'integrations'];
    const missingRecommended = recommendedFields.filter(field => !attributes[field]);
    
    if (missingRecommended.length > 0) {
      warnings.push(createValidationError(
        'attributes',
        `Tool option missing recommended attributes: ${missingRecommended.join(', ')}`,
        'warning'
      ));
    }
  }

  /**
   * Validates metadata object
   */
  private validateMetadata(metadata: Option['metadata']): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (metadata?.url && !this.isValidUrl(metadata.url)) {
      warnings.push(createValidationError(
        'metadata.url',
        'Invalid URL format',
        'warning'
      ));
    }

    if (metadata?.tags && !Array.isArray(metadata.tags)) {
      errors.push(createValidationError(
        'metadata.tags',
        'Tags must be an array of strings'
      ));
    }

    return createValidationResult(errors, warnings);
  }

  /**
   * Basic URL validation
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generates a unique ID for new options
   */
  private generateId(): string {
    return `option_${this.nextId++}`;
  }

  /**
   * Gets the current option count
   */
  getOptionCount(): number {
    return this.options.size;
  }

  /**
   * Clears all options (useful for testing)
   */
  clear(): void {
    this.options.clear();
    this.nextId = 1;
  }
}
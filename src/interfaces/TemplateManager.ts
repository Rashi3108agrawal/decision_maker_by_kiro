import { ComparisonTemplate, ValidationResult, Criterion, Option } from '../types/core';

export interface TemplateManager {
  // Template retrieval
  getTemplate(id: string): Promise<ComparisonTemplate | null>;
  getAllTemplates(): Promise<ComparisonTemplate[]>;
  getTemplatesByCategory(category: string): Promise<ComparisonTemplate[]>;
  
  // Template creation and management
  createTemplate(template: Omit<ComparisonTemplate, 'id'>): Promise<ComparisonTemplate>;
  updateTemplate(id: string, updates: Partial<ComparisonTemplate>): Promise<ComparisonTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Template application
  applyTemplate(templateId: string, customizations?: TemplateCustomizations): Promise<TemplateApplication>;
  
  // Template validation
  validateTemplate(template: ComparisonTemplate): ValidationResult;
}

export interface TemplateCustomizations {
  criteriaWeights?: Record<string, number>;
  additionalCriteria?: Omit<Criterion, 'id'>[];
  excludedCriteria?: string[]; // criterion IDs to exclude
  customOptions?: Partial<Option>[];
}

export interface TemplateApplication {
  criteria: Criterion[];
  sampleOptions: Option[];
  guidance: string[];
  customizations: TemplateCustomizations;
}
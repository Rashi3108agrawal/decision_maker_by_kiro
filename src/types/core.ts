// Core type definitions for the Decision Helper Tool

export type OptionType = 'api' | 'cloud-service' | 'tech-stack' | 'tool' | 'custom';
export type CriterionType = 'cost' | 'performance' | 'scalability' | 'ease-of-use' | 'custom';
export type ScaleType = 'numeric' | 'ordinal' | 'boolean';
export type AttributeValue = string | number | boolean | string[] | number[] | null;

export interface ScaleDefinition {
  min?: number;
  max?: number;
  labels?: string[]; // For ordinal scales
  unit?: string; // For numeric scales (e.g., "$", "ms", "%")
}

export interface Option {
  id: string;
  name: string;
  type: OptionType;
  attributes: Record<string, AttributeValue>;
  metadata?: {
    url?: string;
    description?: string;
    tags?: string[];
  };
}

export interface Criterion {
  id: string;
  name: string;
  type: CriterionType;
  weight: number; // 0-100
  scale: ScaleType;
  scaleDefinition?: ScaleDefinition;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  qualityScore: number; // 0-100
}

export interface ComparisonSession {
  id: string;
  name: string;
  description?: string;
  options: Option[];
  criteria: Criterion[];
  analysis?: AnalysisResult;
  createdAt: Date;
  updatedAt: Date;
}

// Analysis-related interfaces
export interface ScoreMatrix {
  [optionId: string]: {
    [criterionId: string]: {
      rawValue: AttributeValue;
      normalizedScore: number; // 0-100
      weightedScore: number;
    };
  };
}

export interface RankedOption {
  optionId: string;
  optionName: string;
  rank: number;
  overallScore: number;
}

export interface TradeOffAnalysis {
  criterionId: string;
  criterionName: string;
  winner: {
    optionId: string;
    optionName: string;
    score: number;
  };
  loser: {
    optionId: string;
    optionName: string;
    score: number;
  };
  gap: number; // percentage difference
  significance: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  optionId: string;
  optionName: string;
  rank: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[]; // scenarios where this option excels
  reasoning: string;
}

export interface AnalysisResult {
  scores: Record<string, number>; // optionId -> weighted score
  rankings: RankedOption[];
  tradeOffs: TradeOffAnalysis[];
  recommendations: Recommendation[];
  qualityScore: number; // 0-100, based on data completeness
}

// Template-related interfaces
export interface ComparisonTemplate {
  id: string;
  name: string;
  description: string;
  category: string; // 'api-comparison' | 'cloud-services' | 'tech-stack'
  defaultCriteria: Criterion[];
  sampleOptions?: Partial<Option>[];
  guidance: string[];
}

// Export-related interfaces
export interface ExportOptions {
  includeRawData?: boolean;
  includeCharts?: boolean;
  format?: 'detailed' | 'summary';
}

export interface ComparisonExport {
  session: ComparisonSession;
  analysis: AnalysisResult;
  exportedAt: Date;
  version: string;
}
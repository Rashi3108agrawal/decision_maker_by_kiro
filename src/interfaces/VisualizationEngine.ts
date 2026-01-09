import { 
  Option, 
  Criterion, 
  ScoreMatrix, 
  TradeOffAnalysis, 
  Recommendation 
} from '../types/core';

export type SortDirection = 'asc' | 'desc';
export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'poor' | 'missing';

export interface MatrixCell {
  optionId: string;
  criterionId: string;
  rawValue: any;
  normalizedScore: number;
  weightedScore: number;
  performanceLevel: PerformanceLevel;
  displayValue: string;
  details?: string;
}

export interface MatrixVisualizationConfig {
  showWeights: boolean;
  highlightBest: boolean;
  highlightWorst: boolean;
  sortBy?: string; // criterionId or 'overall'
  sortDirection: SortDirection;
  expandedCells: Set<string>; // Set of "optionId-criterionId" keys
}

export interface ComparisonMatrix {
  options: Option[];
  criteria: Criterion[];
  scores: ScoreMatrix;
  cells: MatrixCell[][];
  visualConfig: MatrixVisualizationConfig;
  sortedOptions: Option[];
}

export interface MatrixComponent {
  matrix: ComparisonMatrix;
  render(): string; // HTML representation
  sort(criterionId: string, direction?: SortDirection): ComparisonMatrix;
  toggleCellDetails(optionId: string, criterionId: string): ComparisonMatrix;
  updateConfig(config: Partial<MatrixVisualizationConfig>): ComparisonMatrix;
}

export interface ChartComponent {
  tradeOffs: TradeOffAnalysis[];
  render(): string; // HTML representation
}

export interface RecommendationComponent {
  recommendations: Recommendation[];
  render(): string; // HTML representation
}

export interface VisualizationEngine {
  renderMatrix(
    options: Option[], 
    criteria: Criterion[], 
    scores: ScoreMatrix, 
    config?: Partial<MatrixVisualizationConfig>
  ): MatrixComponent;
  
  renderTradeOffChart(tradeOffs: TradeOffAnalysis[]): ChartComponent;
  
  renderRecommendations(recommendations: Recommendation[]): RecommendationComponent;
  
  createComparisonMatrix(
    options: Option[], 
    criteria: Criterion[], 
    scores: ScoreMatrix, 
    config?: Partial<MatrixVisualizationConfig>
  ): ComparisonMatrix;

  updateMatrixWithNewWeights(
    matrix: ComparisonMatrix,
    updatedCriteria: Criterion[]
  ): ComparisonMatrix;
}
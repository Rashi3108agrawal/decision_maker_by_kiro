import { 
  Option, 
  Criterion, 
  AnalysisResult, 
  ScoreMatrix, 
  TradeOffAnalysis, 
  Recommendation 
} from '../types/core';

export interface AnalysisEngine {
  analyze(options: Option[], criteria: Criterion[]): Promise<AnalysisResult>;
  calculateScores(options: Option[], criteria: Criterion[]): ScoreMatrix;
  identifyTradeOffs(scoreMatrix: ScoreMatrix, options: Option[], criteria: Criterion[]): TradeOffAnalysis[];
  generateRecommendations(analysis: AnalysisResult, options: Option[], criteria: Criterion[]): Recommendation[];
}
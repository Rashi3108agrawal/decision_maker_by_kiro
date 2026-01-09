import { 
  Option, 
  Criterion, 
  AnalysisResult, 
  ScoreMatrix, 
  TradeOffAnalysis, 
  Recommendation,
  RankedOption,
  AttributeValue
} from '../types/core';
import { AnalysisEngine as IAnalysisEngine } from '../interfaces/AnalysisEngine';

export class AnalysisEngine implements IAnalysisEngine {
  
  /**
   * Main analysis method that orchestrates the complete analysis process
   */
  async analyze(options: Option[], criteria: Criterion[]): Promise<AnalysisResult> {
    // Calculate the score matrix using WSM
    const scoreMatrix = this.calculateScores(options, criteria);
    
    // Calculate overall weighted scores for each option
    const scores = this.calculateOverallScores(scoreMatrix, criteria);
    
    // Generate rankings based on overall scores
    const rankings = this.generateRankings(options, scores);
    
    // Identify trade-offs between options with enhanced analysis
    const tradeOffs = this.identifyTradeOffs(scoreMatrix, options, criteria);
    
    // Calculate data quality score
    const qualityScore = this.calculateQualityScore(options, criteria);
    
    const analysisResult: AnalysisResult = {
      scores,
      rankings,
      tradeOffs,
      recommendations: [], // Will be populated by generateRecommendations
      qualityScore
    };
    
    // Generate recommendations based on the complete analysis
    analysisResult.recommendations = this.generateRecommendations(analysisResult, options, criteria);
    
    return analysisResult;
  }

  /**
   * Implements Weighted Sum Model (WSM) calculation
   * Normalizes scores to 0-100 scale and applies criterion weights
   */
  calculateScores(options: Option[], criteria: Criterion[]): ScoreMatrix {
    const scoreMatrix: ScoreMatrix = {};
    
    // Initialize score matrix structure
    options.forEach(option => {
      scoreMatrix[option.id] = {};
    });
    
    // Process each criterion
    criteria.forEach(criterion => {
      // Extract raw values for this criterion from all options
      const rawValues = options.map(option => ({
        optionId: option.id,
        value: option.attributes[criterion.id] || null
      }));
      
      // Normalize scores for this criterion
      const normalizedScores = this.normalizeScores(rawValues, criterion);
      
      // Apply weights and store in matrix
      normalizedScores.forEach(({ optionId, normalizedScore }) => {
        const weightedScore = (normalizedScore * criterion.weight) / 100;
        
        scoreMatrix[optionId][criterion.id] = {
          rawValue: options.find(o => o.id === optionId)?.attributes[criterion.id] || null,
          normalizedScore,
          weightedScore
        };
      });
    });
    
    return scoreMatrix;
  }

  /**
   * Normalizes raw values to 0-100 scale based on criterion type and scale
   */
  private normalizeScores(
    rawValues: { optionId: string; value: AttributeValue | null }[], 
    criterion: Criterion
  ): { optionId: string; normalizedScore: number }[] {
    
    switch (criterion.scale) {
      case 'numeric':
        return this.normalizeNumericScores(rawValues, criterion);
      case 'ordinal':
        return this.normalizeOrdinalScores(rawValues, criterion);
      case 'boolean':
        return this.normalizeBooleanScores(rawValues);
      default:
        throw new Error(`Unsupported scale type: ${criterion.scale}`);
    }
  }

  private normalizeNumericScores(
    rawValues: { optionId: string; value: AttributeValue | null }[], 
    criterion: Criterion
  ): { optionId: string; normalizedScore: number }[] {
    
    const numericValues = rawValues
      .filter(rv => rv.value !== null && typeof rv.value === 'number')
      .map(rv => ({ optionId: rv.optionId, value: rv.value as number }));
    
    if (numericValues.length === 0) {
      return rawValues.map(rv => ({ optionId: rv.optionId, normalizedScore: 0 }));
    }
    
    const values = numericValues.map(nv => nv.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    return rawValues.map(rv => {
      if (rv.value === null || typeof rv.value !== 'number') {
        return { optionId: rv.optionId, normalizedScore: 0 };
      }
      
      // For cost-type criteria, lower is better (invert the score)
      const normalizedScore = range === 0 ? 100 : 
        criterion.type === 'cost' ? 
          ((max - (rv.value as number)) / range) * 100 :
          (((rv.value as number) - min) / range) * 100;
      
      return { optionId: rv.optionId, normalizedScore: Math.max(0, Math.min(100, normalizedScore)) };
    });
  }

  private normalizeOrdinalScores(
    rawValues: { optionId: string; value: AttributeValue | null }[], 
    criterion: Criterion
  ): { optionId: string; normalizedScore: number }[] {
    
    const labels = criterion.scaleDefinition?.labels || [];
    if (labels.length === 0) {
      return rawValues.map(rv => ({ optionId: rv.optionId, normalizedScore: 0 }));
    }
    
    return rawValues.map(rv => {
      if (rv.value === null || typeof rv.value !== 'string') {
        return { optionId: rv.optionId, normalizedScore: 0 };
      }
      
      const index = labels.indexOf(rv.value as string);
      const normalizedScore = index === -1 ? 0 : (index / (labels.length - 1)) * 100;
      
      return { optionId: rv.optionId, normalizedScore };
    });
  }

  private normalizeBooleanScores(
    rawValues: { optionId: string; value: AttributeValue | null }[]
  ): { optionId: string; normalizedScore: number }[] {
    
    return rawValues.map(rv => {
      const normalizedScore = rv.value === true ? 100 : rv.value === false ? 0 : 0;
      return { optionId: rv.optionId, normalizedScore };
    });
  }

  /**
   * Calculates overall weighted scores for each option
   */
  private calculateOverallScores(scoreMatrix: ScoreMatrix, criteria: Criterion[]): Record<string, number> {
    const scores: Record<string, number> = {};
    
    Object.keys(scoreMatrix).forEach(optionId => {
      let totalWeightedScore = 0;
      let totalWeight = 0;
      
      criteria.forEach(criterion => {
        const scoreData = scoreMatrix[optionId][criterion.id];
        if (scoreData) {
          totalWeightedScore += scoreData.weightedScore;
          totalWeight += criterion.weight;
        }
      });
      
      // Normalize by total weight to handle cases where weights don't sum to 100
      scores[optionId] = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
    });
    
    return scores;
  }

  /**
   * Generates rankings based on overall scores
   */
  private generateRankings(options: Option[], scores: Record<string, number>): RankedOption[] {
    const rankings = options.map(option => ({
      optionId: option.id,
      optionName: option.name,
      rank: 0, // Will be set after sorting
      overallScore: scores[option.id] || 0
    }));
    
    // Sort by score (descending) and assign ranks
    rankings.sort((a, b) => b.overallScore - a.overallScore);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });
    
    return rankings;
  }

  /**
   * Calculates data quality score based on completeness
   */
  private calculateQualityScore(options: Option[], criteria: Criterion[]): number {
    if (options.length === 0 || criteria.length === 0) {
      return 0;
    }
    
    let totalDataPoints = 0;
    let completeDataPoints = 0;
    
    options.forEach(option => {
      criteria.forEach(criterion => {
        totalDataPoints++;
        const value = option.attributes[criterion.id];
        if (value !== null && value !== undefined && value !== '') {
          completeDataPoints++;
        }
      });
    });
    
    return totalDataPoints > 0 ? (completeDataPoints / totalDataPoints) * 100 : 0;
  }

  /**
   * Identifies trade-offs between options for each criterion with enhanced analysis
   * Implements winner/loser identification and significant difference detection
   */
  identifyTradeOffs(scoreMatrix: ScoreMatrix, options: Option[], criteria: Criterion[]): TradeOffAnalysis[] {
    const tradeOffs: TradeOffAnalysis[] = [];
    const optionIds = Object.keys(scoreMatrix);
    
    if (optionIds.length < 2) {
      return tradeOffs;
    }
    
    // Create lookup maps for option and criterion names
    const optionNameMap = new Map(options.map(opt => [opt.id, opt.name]));
    const criterionNameMap = new Map(criteria.map(crit => [crit.id, crit.name]));
    
    criteria.forEach(criterion => {
      // Find winner and loser for this criterion
      let winner = { optionId: '', score: -1 };
      let loser = { optionId: '', score: 101 };
      
      // Collect all scores for this criterion to calculate statistics
      const scores: number[] = [];
      
      optionIds.forEach(optionId => {
        const scoreData = scoreMatrix[optionId][criterion.id];
        if (scoreData && scoreData.normalizedScore !== null && scoreData.normalizedScore !== undefined) {
          const score = scoreData.normalizedScore;
          scores.push(score);
          
          if (score > winner.score) {
            winner = { optionId, score };
          }
          if (score < loser.score) {
            loser = { optionId, score };
          }
        }
      });
      
      // Only create trade-off analysis if we have valid winner and loser
      if (winner.optionId && loser.optionId && winner.optionId !== loser.optionId && scores.length >= 2) {
        const gap = winner.score - loser.score;
        
        // Enhanced significance detection based on gap size and distribution
        const significance = this.calculateSignificance(gap, scores);
        
        tradeOffs.push({
          criterionId: criterion.id,
          criterionName: criterionNameMap.get(criterion.id) || criterion.id,
          winner: {
            optionId: winner.optionId,
            optionName: optionNameMap.get(winner.optionId) || winner.optionId,
            score: winner.score
          },
          loser: {
            optionId: loser.optionId,
            optionName: optionNameMap.get(loser.optionId) || loser.optionId,
            score: loser.score
          },
          gap,
          significance
        });
      }
    });
    
    // Sort trade-offs by significance and gap size for better insights
    return tradeOffs.sort((a, b) => {
      const significanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const sigDiff = significanceOrder[b.significance] - significanceOrder[a.significance];
      return sigDiff !== 0 ? sigDiff : b.gap - a.gap;
    });
  }

  /**
   * Calculates significance of differences based on gap size and score distribution
   */
  private calculateSignificance(gap: number, scores: number[]): 'high' | 'medium' | 'low' {
    if (scores.length < 2) return 'low';
    
    // Calculate standard deviation to understand score distribution
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Significance based on both absolute gap and relative to distribution
    if (gap >= 40 || (gap >= 25 && gap > 2 * stdDev)) {
      return 'high';
    } else if (gap >= 20 || (gap >= 10 && gap > stdDev)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generates recommendations based on analysis results with enhanced insights
   */
  generateRecommendations(analysis: AnalysisResult, options: Option[], criteria: Criterion[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Create lookup maps
    const optionMap = new Map(options.map(opt => [opt.id, opt]));
    const criterionMap = new Map(criteria.map(crit => [crit.id, crit]));
    
    analysis.rankings.forEach(ranking => {
      const option = optionMap.get(ranking.optionId);
      if (!option) return;
      
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const bestFor: string[] = [];
      
      // Analyze trade-offs to identify strengths and weaknesses
      analysis.tradeOffs.forEach(tradeOff => {
        const criterion = criterionMap.get(tradeOff.criterionId);
        const criterionName = criterion?.name || tradeOff.criterionName;
        
        if (tradeOff.winner.optionId === ranking.optionId) {
          if (tradeOff.significance === 'high') {
            strengths.push(`Exceptional ${criterionName.toLowerCase()}`);
            bestFor.push(`High ${criterionName.toLowerCase()} requirements`);
          } else if (tradeOff.significance === 'medium') {
            strengths.push(`Strong ${criterionName.toLowerCase()}`);
          }
        }
        
        if (tradeOff.loser.optionId === ranking.optionId) {
          if (tradeOff.significance === 'high') {
            weaknesses.push(`Limited ${criterionName.toLowerCase()}`);
          } else if (tradeOff.significance === 'medium') {
            weaknesses.push(`Below-average ${criterionName.toLowerCase()}`);
          }
        }
      });
      
      // Add insights based on criterion weights
      const highWeightCriteria = criteria
        .filter(c => c.weight >= 25)
        .sort((a, b) => b.weight - a.weight);
      
      highWeightCriteria.forEach(criterion => {
        const winnerTradeOff = analysis.tradeOffs.find(
          t => t.criterionId === criterion.id && t.winner.optionId === ranking.optionId
        );
        if (winnerTradeOff && winnerTradeOff.significance !== 'low') {
          bestFor.push(`Scenarios prioritizing ${criterion.name.toLowerCase()}`);
        }
      });
      
      // Generate contextual reasoning
      const reasoning = this.generateRecommendationReasoning(
        ranking, 
        strengths, 
        weaknesses, 
        analysis.rankings.length,
        analysis.qualityScore
      );
      
      recommendations.push({
        optionId: ranking.optionId,
        optionName: ranking.optionName,
        rank: ranking.rank,
        overallScore: ranking.overallScore,
        strengths: [...new Set(strengths)], // Remove duplicates
        weaknesses: [...new Set(weaknesses)], // Remove duplicates
        bestFor: [...new Set(bestFor)], // Remove duplicates
        reasoning
      });
    });
    
    return recommendations;
  }

  /**
   * Generates contextual reasoning for recommendations
   */
  private generateRecommendationReasoning(
    ranking: RankedOption,
    strengths: string[],
    weaknesses: string[],
    totalOptions: number,
    qualityScore: number
  ): string {
    let reasoning = '';
    
    // Base reasoning on rank and score
    if (ranking.rank === 1) {
      reasoning = `Top recommendation with the highest overall score (${ranking.overallScore.toFixed(1)}/100). `;
      if (strengths.length > 0) {
        reasoning += `Particularly strong in ${strengths.slice(0, 2).join(' and ')}.`;
      } else {
        reasoning += `Provides well-balanced performance across all criteria.`;
      }
    } else if (ranking.rank <= Math.ceil(totalOptions / 3)) {
      reasoning = `Strong alternative (rank ${ranking.rank}) with a score of ${ranking.overallScore.toFixed(1)}/100. `;
      if (strengths.length > 0) {
        reasoning += `Consider this option if ${strengths[0].toLowerCase()} is a key priority.`;
      } else {
        reasoning += `Solid choice with competitive performance.`;
      }
    } else {
      reasoning = `Lower-ranked option (rank ${ranking.rank}) scoring ${ranking.overallScore.toFixed(1)}/100. `;
      if (weaknesses.length > 0) {
        reasoning += `May not be suitable if ${weaknesses[0].toLowerCase()} is critical.`;
      } else {
        reasoning += `Consider for specific use cases or budget constraints.`;
      }
    }
    
    // Add data quality context if relevant
    if (qualityScore < 70) {
      reasoning += ` Note: Analysis based on limited data (${qualityScore.toFixed(0)}% complete).`;
    }
    
    return reasoning;
  }
}
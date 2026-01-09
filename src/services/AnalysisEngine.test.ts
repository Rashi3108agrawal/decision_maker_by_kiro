import { AnalysisEngine } from './AnalysisEngine';
import { Option, Criterion } from '../types/core';

describe('AnalysisEngine', () => {
  let analysisEngine: AnalysisEngine;
  let sampleOptions: Option[];
  let sampleCriteria: Criterion[];

  beforeEach(() => {
    analysisEngine = new AnalysisEngine();
    
    sampleOptions = [
      {
        id: 'option1',
        name: 'Option A',
        type: 'api',
        attributes: {
          cost: 100,
          performance: 80,
          ease_of_use: true
        }
      },
      {
        id: 'option2',
        name: 'Option B',
        type: 'api',
        attributes: {
          cost: 200,
          performance: 95,
          ease_of_use: false
        }
      }
    ];

    sampleCriteria = [
      {
        id: 'cost',
        name: 'Cost',
        type: 'cost',
        weight: 40,
        scale: 'numeric'
      },
      {
        id: 'performance',
        name: 'Performance',
        type: 'performance',
        weight: 40,
        scale: 'numeric'
      },
      {
        id: 'ease_of_use',
        name: 'Ease of Use',
        type: 'ease-of-use',
        weight: 20,
        scale: 'boolean'
      }
    ];
  });

  describe('calculateScores', () => {
    it('should calculate normalized scores correctly', () => {
      const scoreMatrix = analysisEngine.calculateScores(sampleOptions, sampleCriteria);
      
      expect(scoreMatrix).toHaveProperty('option1');
      expect(scoreMatrix).toHaveProperty('option2');
      
      // Check that scores are normalized to 0-100 range
      Object.values(scoreMatrix).forEach(optionScores => {
        Object.values(optionScores).forEach(scoreData => {
          expect(scoreData.normalizedScore).toBeGreaterThanOrEqual(0);
          expect(scoreData.normalizedScore).toBeLessThanOrEqual(100);
        });
      });
    });

    it('should handle cost criteria correctly (lower is better)', () => {
      const scoreMatrix = analysisEngine.calculateScores(sampleOptions, sampleCriteria);
      
      // Option1 has lower cost (100) so should have higher normalized score
      // Option2 has higher cost (200) so should have lower normalized score
      expect(scoreMatrix.option1.cost.normalizedScore).toBeGreaterThan(
        scoreMatrix.option2.cost.normalizedScore
      );
    });

    it('should handle performance criteria correctly (higher is better)', () => {
      const scoreMatrix = analysisEngine.calculateScores(sampleOptions, sampleCriteria);
      
      // Option2 has higher performance (95) so should have higher normalized score
      // Option1 has lower performance (80) so should have lower normalized score
      expect(scoreMatrix.option2.performance.normalizedScore).toBeGreaterThan(
        scoreMatrix.option1.performance.normalizedScore
      );
    });

    it('should handle boolean criteria correctly', () => {
      const scoreMatrix = analysisEngine.calculateScores(sampleOptions, sampleCriteria);
      
      // Option1 has ease_of_use = true, should get 100
      // Option2 has ease_of_use = false, should get 0
      expect(scoreMatrix.option1.ease_of_use.normalizedScore).toBe(100);
      expect(scoreMatrix.option2.ease_of_use.normalizedScore).toBe(0);
    });
  });

  describe('identifyTradeOffs', () => {
    it('should identify winners and losers for each criterion', () => {
      const scoreMatrix = analysisEngine.calculateScores(sampleOptions, sampleCriteria);
      const tradeOffs = analysisEngine.identifyTradeOffs(scoreMatrix, sampleOptions, sampleCriteria);
      
      expect(tradeOffs).toHaveLength(3); // One for each criterion
      
      tradeOffs.forEach(tradeOff => {
        expect(tradeOff).toHaveProperty('winner');
        expect(tradeOff).toHaveProperty('loser');
        expect(tradeOff).toHaveProperty('gap');
        expect(tradeOff).toHaveProperty('significance');
        expect(tradeOff.winner.optionId).not.toBe(tradeOff.loser.optionId);
      });
    });

    it('should calculate significance correctly', () => {
      const scoreMatrix = analysisEngine.calculateScores(sampleOptions, sampleCriteria);
      const tradeOffs = analysisEngine.identifyTradeOffs(scoreMatrix, sampleOptions, sampleCriteria);
      
      tradeOffs.forEach(tradeOff => {
        expect(['high', 'medium', 'low']).toContain(tradeOff.significance);
        expect(tradeOff.gap).toBeGreaterThanOrEqual(0);
        expect(tradeOff.gap).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('analyze', () => {
    it('should perform complete analysis', async () => {
      const result = await analysisEngine.analyze(sampleOptions, sampleCriteria);
      
      expect(result).toHaveProperty('scores');
      expect(result).toHaveProperty('rankings');
      expect(result).toHaveProperty('tradeOffs');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('qualityScore');
      
      // Check rankings
      expect(result.rankings).toHaveLength(2);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].rank).toBe(2);
      
      // Check recommendations
      expect(result.recommendations).toHaveLength(2);
      result.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('strengths');
        expect(rec).toHaveProperty('weaknesses');
        expect(rec).toHaveProperty('bestFor');
        expect(rec).toHaveProperty('reasoning');
      });
    });

    it('should calculate quality score based on data completeness', async () => {
      const result = await analysisEngine.analyze(sampleOptions, sampleCriteria);
      
      // All data is complete, so quality score should be 100
      expect(result.qualityScore).toBe(100);
    });

    it('should handle missing data gracefully', async () => {
      const incompleteOptions: Option[] = [
        {
          id: 'option1',
          name: 'Option A',
          type: 'api',
          attributes: {
            cost: 100
            // missing performance and ease_of_use
          }
        },
        {
          id: 'option2',
          name: 'Option B',
          type: 'api',
          attributes: {
            cost: 200,
            performance: 95
            // missing ease_of_use
          }
        }
      ];

      const result = await analysisEngine.analyze(incompleteOptions, sampleCriteria);
      
      expect(result.qualityScore).toBeLessThan(100);
      expect(result.rankings).toHaveLength(2);
      expect(result.recommendations).toHaveLength(2);
    });
  });
});
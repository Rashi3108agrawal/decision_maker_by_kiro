import { VisualizationEngine } from './VisualizationEngine';
import { Option, Criterion, ScoreMatrix } from '../types/core';

describe('VisualizationEngine', () => {
  let engine: VisualizationEngine;
  let mockOptions: Option[];
  let mockCriteria: Criterion[];
  let mockScores: ScoreMatrix;

  beforeEach(() => {
    engine = new VisualizationEngine();
    
    mockOptions = [
      {
        id: 'opt1',
        name: 'Option 1',
        type: 'api',
        attributes: {
          cost: 100,
          performance: 85,
          ease_of_use: true
        }
      },
      {
        id: 'opt2',
        name: 'Option 2',
        type: 'api',
        attributes: {
          cost: 200,
          performance: 95,
          ease_of_use: false
        }
      }
    ];

    mockCriteria = [
      {
        id: 'cost',
        name: 'Cost',
        type: 'cost',
        weight: 30,
        scale: 'numeric',
        scaleDefinition: { unit: '$' }
      },
      {
        id: 'performance',
        name: 'Performance',
        type: 'performance',
        weight: 50,
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

    mockScores = {
      opt1: {
        cost: { rawValue: 100, normalizedScore: 100, weightedScore: 30 },
        performance: { rawValue: 85, normalizedScore: 0, weightedScore: 0 },
        ease_of_use: { rawValue: true, normalizedScore: 100, weightedScore: 20 }
      },
      opt2: {
        cost: { rawValue: 200, normalizedScore: 0, weightedScore: 0 },
        performance: { rawValue: 95, normalizedScore: 100, weightedScore: 50 },
        ease_of_use: { rawValue: false, normalizedScore: 0, weightedScore: 0 }
      }
    };
  });

  describe('createComparisonMatrix', () => {
    it('should create a comparison matrix with correct structure', () => {
      const matrix = engine.createComparisonMatrix(mockOptions, mockCriteria, mockScores);
      
      expect(matrix.options).toEqual(mockOptions);
      expect(matrix.criteria).toEqual(mockCriteria);
      expect(matrix.scores).toEqual(mockScores);
      expect(matrix.cells).toHaveLength(2); // 2 options
      expect(matrix.cells[0]).toHaveLength(3); // 3 criteria
      expect(matrix.visualConfig.showWeights).toBe(true);
    });

    it('should create matrix cells with correct performance levels', () => {
      const matrix = engine.createComparisonMatrix(mockOptions, mockCriteria, mockScores);
      
      // Check first option's cost cell (score 100 = excellent)
      expect(matrix.cells[0][0].performanceLevel).toBe('excellent');
      expect(matrix.cells[0][0].displayValue).toBe('100$');
      
      // Check second option's performance cell (score 100 = excellent)
      expect(matrix.cells[1][1].performanceLevel).toBe('excellent');
      expect(matrix.cells[1][1].displayValue).toBe('95');
    });

    it('should handle boolean values correctly', () => {
      const matrix = engine.createComparisonMatrix(mockOptions, mockCriteria, mockScores);
      
      // Check boolean display values
      expect(matrix.cells[0][2].displayValue).toBe('✓'); // true
      expect(matrix.cells[1][2].displayValue).toBe('✗'); // false
    });
  });

  describe('renderMatrix', () => {
    it('should create a matrix component', () => {
      const matrixComponent = engine.renderMatrix(mockOptions, mockCriteria, mockScores);
      
      expect(matrixComponent).toBeDefined();
      expect(matrixComponent.matrix).toBeDefined();
      expect(typeof matrixComponent.render).toBe('function');
    });

    it('should render HTML with weight indicators when showWeights is true', () => {
      const matrixComponent = engine.renderMatrix(mockOptions, mockCriteria, mockScores, {
        showWeights: true
      });
      
      const html = matrixComponent.render();
      expect(html).toContain('weight-indicator');
      expect(html).toContain('30%'); // Cost weight
      expect(html).toContain('50%'); // Performance weight
      expect(html).toContain('20%'); // Ease of use weight
    });

    it('should not show weight indicators when showWeights is false', () => {
      const matrixComponent = engine.renderMatrix(mockOptions, mockCriteria, mockScores, {
        showWeights: false
      });
      
      const html = matrixComponent.render();
      expect(html).not.toContain('<div class="weight-indicator">');
    });
  });

  describe('updateMatrixWithNewWeights', () => {
    it('should update weighted scores when weights change', () => {
      const originalMatrix = engine.createComparisonMatrix(mockOptions, mockCriteria, mockScores);
      
      // Update criteria weights
      const updatedCriteria = mockCriteria.map(c => 
        c.id === 'cost' ? { ...c, weight: 60 } : c
      );
      
      const updatedMatrix = engine.updateMatrixWithNewWeights(originalMatrix, updatedCriteria);
      
      // Check that the cost criterion now has 60% weight
      expect(updatedMatrix.criteria.find(c => c.id === 'cost')?.weight).toBe(60);
      
      // Check that weighted scores were recalculated
      expect(updatedMatrix.scores.opt1.cost.weightedScore).toBe(60); // 100 * 60/100
    });
  });

  describe('renderTradeOffChart', () => {
    it('should create a trade-off chart component', () => {
      const tradeOffs = [
        {
          criterionId: 'cost',
          criterionName: 'Cost',
          winner: { optionId: 'opt1', optionName: 'Option 1', score: 100 },
          loser: { optionId: 'opt2', optionName: 'Option 2', score: 0 },
          gap: 100,
          significance: 'high' as const
        }
      ];
      
      const chartComponent = engine.renderTradeOffChart(tradeOffs);
      
      expect(chartComponent).toBeDefined();
      expect(typeof chartComponent.render).toBe('function');
      
      const html = chartComponent.render();
      expect(html).toContain('trade-off-chart');
      expect(html).toContain('Option 1');
      expect(html).toContain('Option 2');
      expect(html).toContain('100.0% gap');
    });
  });

  describe('renderRecommendations', () => {
    it('should create a recommendations component', () => {
      const recommendations = [
        {
          optionId: 'opt1',
          optionName: 'Option 1',
          rank: 1,
          overallScore: 85.5,
          strengths: ['Low cost', 'Easy to use'],
          weaknesses: ['Lower performance'],
          bestFor: ['Budget-conscious projects'],
          reasoning: 'Best overall value for money'
        }
      ];
      
      const recComponent = engine.renderRecommendations(recommendations);
      
      expect(recComponent).toBeDefined();
      expect(typeof recComponent.render).toBe('function');
      
      const html = recComponent.render();
      expect(html).toContain('recommendations');
      expect(html).toContain('Option 1');
      expect(html).toContain('85.5/100');
      expect(html).toContain('🥇'); // Gold medal for rank 1
    });
  });
});
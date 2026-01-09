import { ValidationService } from './ValidationService';
import { Option, Criterion, ComparisonSession } from '../types/core';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateComparisonSession', () => {
    it('should validate a complete comparison session', () => {
      const options: Option[] = [
        {
          id: '1',
          name: 'Option A',
          type: 'api',
          attributes: {
            cost: 10,
            performance: 90,
            documentation: 'excellent'
          },
          metadata: {
            description: 'A great API option',
            url: 'https://example.com'
          }
        },
        {
          id: '2',
          name: 'Option B',
          type: 'api',
          attributes: {
            cost: 20,
            performance: 80,
            documentation: 'good'
          },
          metadata: {
            description: 'Another API option'
          }
        }
      ];

      const criteria: Criterion[] = [
        {
          id: '1',
          name: 'cost',
          type: 'cost',
          weight: 40,
          scale: 'numeric',
          scaleDefinition: { min: 0, max: 100, unit: '$' }
        },
        {
          id: '2',
          name: 'performance',
          type: 'performance',
          weight: 60,
          scale: 'numeric',
          scaleDefinition: { min: 0, max: 100, unit: 'ms' }
        }
      ];

      const session: ComparisonSession = {
        id: 'session1',
        name: 'API Comparison',
        description: 'Comparing different API options',
        options,
        criteria,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validationService.validateComparisonSession(session);

      expect(result.isValid).toBe(true);
      expect(result.qualityReport.overallScore).toBeGreaterThan(70);
      expect(result.qualityReport.completenessScore).toBeGreaterThan(0);
      expect(result.qualityReport.consistencyScore).toBeGreaterThan(0);
    });

    it('should identify missing data and provide suggestions', () => {
      const options: Option[] = [
        {
          id: '1',
          name: 'Option A',
          type: 'api',
          attributes: {
            cost: 10
            // Missing performance data
          }
        },
        {
          id: '2',
          name: 'Option B',
          type: 'api',
          attributes: {
            cost: 20,
            performance: 80
          }
        }
      ];

      const criteria: Criterion[] = [
        {
          id: '1',
          name: 'cost',
          type: 'cost',
          weight: 50,
          scale: 'numeric'
        },
        {
          id: '2',
          name: 'performance',
          type: 'performance',
          weight: 50,
          scale: 'numeric'
        }
      ];

      const session: ComparisonSession = {
        id: 'session1',
        name: 'Incomplete Session',
        options,
        criteria,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validationService.validateComparisonSession(session);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.qualityReport.suggestions.length).toBeGreaterThan(0);
      expect(result.qualityReport.suggestions.some(s => s.includes('performance'))).toBe(true);
    });

    it('should validate analysis readiness', () => {
      const options: Option[] = [
        {
          id: '1',
          name: 'Option A',
          type: 'api',
          attributes: { cost: 10 }
        },
        {
          id: '2',
          name: 'Option B',
          type: 'api',
          attributes: { cost: 20 }
        }
      ];

      const criteria: Criterion[] = [
        {
          id: '1',
          name: 'cost',
          type: 'cost',
          weight: 100,
          scale: 'numeric'
        }
      ];

      const result = validationService.validateAnalysisReadiness(options, criteria);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect insufficient data for analysis', () => {
      const options: Option[] = [
        {
          id: '1',
          name: 'Option A',
          type: 'api',
          attributes: {}
        }
      ];

      const criteria: Criterion[] = [
        {
          id: '1',
          name: 'cost',
          type: 'cost',
          weight: 100,
          scale: 'numeric'
        }
      ];

      const result = validationService.validateAnalysisReadiness(options, criteria);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('At least 2 options'))).toBe(true);
    });

    it('should generate improvement suggestions', () => {
      const session: ComparisonSession = {
        id: 'session1',
        name: 'Test Session',
        options: [
          {
            id: '1',
            name: 'Option A',
            type: 'api',
            attributes: { cost: 10 }
          },
          {
            id: '2',
            name: 'Option B',
            type: 'api',
            attributes: { performance: 80 }
          }
        ],
        criteria: [
          {
            id: '1',
            name: 'cost',
            type: 'cost',
            weight: 50,
            scale: 'numeric'
          },
          {
            id: '2',
            name: 'performance',
            type: 'performance',
            weight: 50,
            scale: 'numeric'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const suggestions = validationService.generateImprovementSuggestions(session);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('cost') || s.includes('performance'))).toBe(true);
    });
  });
});
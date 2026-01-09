import { ExportServiceImpl } from './ExportService';
import { AnalysisResult, ExportOptions } from '../types/core';

describe('ExportService', () => {
  let exportService: ExportServiceImpl;
  let mockAnalysisResult: AnalysisResult;

  beforeEach(() => {
    exportService = new ExportServiceImpl();
    
    // Create comprehensive mock analysis result
    mockAnalysisResult = {
      scores: {
        'option1': 85.5,
        'option2': 72.3,
        'option3': 91.2
      },
      rankings: [
        {
          optionId: 'option3',
          optionName: 'Option C',
          rank: 1,
          overallScore: 91.2
        },
        {
          optionId: 'option1',
          optionName: 'Option A',
          rank: 2,
          overallScore: 85.5
        },
        {
          optionId: 'option2',
          optionName: 'Option B',
          rank: 3,
          overallScore: 72.3
        }
      ],
      tradeOffs: [
        {
          criterionId: 'cost',
          criterionName: 'Cost',
          winner: {
            optionId: 'option2',
            optionName: 'Option B',
            score: 95.0
          },
          loser: {
            optionId: 'option3',
            optionName: 'Option C',
            score: 60.0
          },
          gap: 35.0,
          significance: 'high'
        },
        {
          criterionId: 'performance',
          criterionName: 'Performance',
          winner: {
            optionId: 'option3',
            optionName: 'Option C',
            score: 98.0
          },
          loser: {
            optionId: 'option2',
            optionName: 'Option B',
            score: 70.0
          },
          gap: 28.0,
          significance: 'medium'
        }
      ],
      recommendations: [
        {
          optionId: 'option3',
          optionName: 'Option C',
          rank: 1,
          overallScore: 91.2,
          strengths: ['Excellent performance', 'High scalability'],
          weaknesses: ['Higher cost', 'Complex setup'],
          bestFor: ['High-performance applications', 'Enterprise use'],
          reasoning: 'Best overall choice for performance-critical applications despite higher cost.'
        },
        {
          optionId: 'option1',
          optionName: 'Option A',
          rank: 2,
          overallScore: 85.5,
          strengths: ['Good balance', 'Easy to use'],
          weaknesses: ['Average performance'],
          bestFor: ['General purpose', 'Quick deployment'],
          reasoning: 'Solid middle-ground option with good balance of features.'
        }
      ],
      qualityScore: 87
    };
  });

  describe('generateMarkdown', () => {
    it('should generate valid markdown with all required sections', () => {
      const markdown = exportService.generateMarkdown(mockAnalysisResult);
      
      expect(markdown).toContain('# Decision Analysis Report');
      expect(markdown).toContain('## Rankings');
      expect(markdown).toContain('## Recommendations');
      expect(markdown).toContain('## Trade-off Analysis');
      expect(markdown).toContain('## Detailed Scores');
      expect(markdown).toContain('Quality Score: 87/100');
    });

    it('should include all rankings in correct order', () => {
      const markdown = exportService.generateMarkdown(mockAnalysisResult);
      
      expect(markdown).toContain('| 1 | Option C | 91.20 |');
      expect(markdown).toContain('| 2 | Option A | 85.50 |');
      expect(markdown).toContain('| 3 | Option B | 72.30 |');
    });

    it('should include recommendation details', () => {
      const markdown = exportService.generateMarkdown(mockAnalysisResult);
      
      expect(markdown).toContain('### 1. Option C (Rank 1)');
      expect(markdown).toContain('**Strengths:**');
      expect(markdown).toContain('- Excellent performance');
      expect(markdown).toContain('**Weaknesses:**');
      expect(markdown).toContain('- Higher cost');
      expect(markdown).toContain('**Best For:**');
      expect(markdown).toContain('- High-performance applications');
      expect(markdown).toContain('**Reasoning:** Best overall choice');
    });

    it('should include trade-off analysis', () => {
      const markdown = exportService.generateMarkdown(mockAnalysisResult);
      
      expect(markdown).toContain('### Cost');
      expect(markdown).toContain('**Winner:** Option B (95.00)');
      expect(markdown).toContain('**Loser:** Option C (60.00)');
      expect(markdown).toContain('**Gap:** 35.0% (high significance)');
    });

    it('should handle empty recommendations gracefully', () => {
      const emptyAnalysis = {
        ...mockAnalysisResult,
        recommendations: []
      };
      
      const markdown = exportService.generateMarkdown(emptyAnalysis);
      expect(markdown).toContain('## Recommendations');
      expect(markdown).toBeDefined();
      expect(typeof markdown).toBe('string');
    });
  });

  describe('generateJSON', () => {
    it('should generate valid JSON export with all required fields', () => {
      const jsonExport = exportService.generateJSON(mockAnalysisResult);
      
      expect(jsonExport).toHaveProperty('session');
      expect(jsonExport).toHaveProperty('analysis');
      expect(jsonExport).toHaveProperty('exportedAt');
      expect(jsonExport).toHaveProperty('version');
      
      expect(jsonExport.analysis).toEqual(mockAnalysisResult);
      expect(jsonExport.version).toBe('1.0.0');
      expect(jsonExport.exportedAt).toBeInstanceOf(Date);
    });

    it('should create a valid session structure', () => {
      const jsonExport = exportService.generateJSON(mockAnalysisResult);
      
      expect(jsonExport.session).toHaveProperty('id');
      expect(jsonExport.session).toHaveProperty('name');
      expect(jsonExport.session).toHaveProperty('options');
      expect(jsonExport.session).toHaveProperty('criteria');
      expect(jsonExport.session).toHaveProperty('createdAt');
      expect(jsonExport.session).toHaveProperty('updatedAt');
      
      expect(jsonExport.session.analysis).toEqual(mockAnalysisResult);
    });
  });

  describe('createShareableLink', () => {
    it('should create a unique shareable link', async () => {
      const comparisonId = 'test-comparison-123';
      const shareableLink = await exportService.createShareableLink(comparisonId);
      
      expect(shareableLink).toMatch(/^https:\/\/decision-helper\.app\/shared\/[a-f0-9-]{36}$/);
    });

    it('should create different links for different comparison IDs', async () => {
      const link1 = await exportService.createShareableLink('comparison-1');
      const link2 = await exportService.createShareableLink('comparison-2');
      
      expect(link1).not.toBe(link2);
    });

    it('should allow retrieval of comparison ID from shareable link', async () => {
      const comparisonId = 'test-comparison-456';
      const shareableLink = await exportService.createShareableLink(comparisonId);
      
      // Extract the shareable ID from the URL
      const shareableId = shareableLink.split('/').pop()!;
      const retrievedId = exportService.getComparisonByShareableLink(shareableId);
      
      expect(retrievedId).toBe(comparisonId);
    });
  });

  describe('generatePDF', () => {
    // Note: PDF generation tests are disabled due to puppeteer resource requirements
    // These would be better as integration tests in a CI environment
    
    it.skip('should generate PDF buffer when puppeteer is available', async () => {
      const pdfBuffer = await exportService.generatePDF(mockAnalysisResult);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }, 30000);

    it.skip('should accept export options', async () => {
      const options: ExportOptions = {
        includeRawData: false,
        format: 'summary'
      };

      const pdfBuffer = await exportService.generatePDF(mockAnalysisResult, options);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    }, 30000);

    it('should have generatePDF method available', () => {
      expect(typeof exportService.generatePDF).toBe('function');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle analysis with no trade-offs', () => {
      const analysisWithoutTradeOffs = {
        ...mockAnalysisResult,
        tradeOffs: []
      };
      
      const markdown = exportService.generateMarkdown(analysisWithoutTradeOffs);
      expect(markdown).toContain('## Trade-off Analysis');
      expect(markdown).toBeDefined();
      expect(typeof markdown).toBe('string');
    });

    it('should handle analysis with no rankings', () => {
      const analysisWithoutRankings = {
        ...mockAnalysisResult,
        rankings: []
      };
      
      const markdown = exportService.generateMarkdown(analysisWithoutRankings);
      expect(markdown).toContain('## Rankings');
      expect(markdown).toBeDefined();
      expect(typeof markdown).toBe('string');
    });

    it('should handle empty scores object', () => {
      const analysisWithoutScores = {
        ...mockAnalysisResult,
        scores: {}
      };
      
      const markdown = exportService.generateMarkdown(analysisWithoutScores);
      expect(markdown).toContain('## Detailed Scores');
      expect(markdown).toBeDefined();
      expect(typeof markdown).toBe('string');
    });

    it('should handle recommendations without optional fields', () => {
      const minimalRecommendation = {
        ...mockAnalysisResult,
        recommendations: [{
          optionId: 'option1',
          optionName: 'Option A',
          rank: 1,
          overallScore: 85.5,
          strengths: [],
          weaknesses: [],
          bestFor: [],
          reasoning: 'Simple recommendation'
        }]
      };
      
      const markdown = exportService.generateMarkdown(minimalRecommendation);
      expect(markdown).toContain('**Reasoning:** Simple recommendation');
      expect(markdown).not.toContain('**Strengths:**');
      expect(markdown).not.toContain('**Weaknesses:**');
      expect(markdown).not.toContain('**Best For:**');
    });
  });
});
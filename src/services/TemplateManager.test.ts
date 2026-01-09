import { TemplateManager } from './TemplateManager';
import { ComparisonTemplate } from '../types/core';

describe('TemplateManager', () => {
  let templateManager: TemplateManager;

  beforeEach(() => {
    templateManager = new TemplateManager();
  });

  describe('Built-in Templates', () => {
    test('should load all built-in templates', async () => {
      const templates = await templateManager.getAllTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(4);
      
      const templateIds = templates.map(t => t.id);
      expect(templateIds).toContain('api-comparison');
      expect(templateIds).toContain('cloud-services');
      expect(templateIds).toContain('tech-stack');
      expect(templateIds).toContain('tool-comparison');
    });

    test('should retrieve specific built-in template', async () => {
      const apiTemplate = await templateManager.getTemplate('api-comparison');
      expect(apiTemplate).toBeDefined();
      expect(apiTemplate!.name).toBe('API Comparison');
      expect(apiTemplate!.category).toBe('api-comparison');
      expect(apiTemplate!.defaultCriteria.length).toBeGreaterThan(0);
    });

    test('should filter templates by category', async () => {
      const apiTemplates = await templateManager.getTemplatesByCategory('api-comparison');
      expect(apiTemplates.length).toBe(1);
      expect(apiTemplates[0].id).toBe('api-comparison');
    });
  });

  describe('Template Validation', () => {
    test('should validate a valid template', () => {
      const validTemplate: ComparisonTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        category: 'test',
        defaultCriteria: [
          {
            id: 'test-criterion',
            name: 'Test Criterion',
            type: 'cost',
            weight: 100,
            scale: 'numeric'
          }
        ],
        guidance: ['Test guidance']
      };

      const result = templateManager.validateTemplate(validTemplate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject template with missing required fields', () => {
      const invalidTemplate: ComparisonTemplate = {
        id: '',
        name: '',
        description: '',
        category: '',
        defaultCriteria: [],
        guidance: []
      };

      const result = templateManager.validateTemplate(invalidTemplate);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should warn about incorrect weight totals', () => {
      const templateWithBadWeights: ComparisonTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        category: 'test',
        defaultCriteria: [
          {
            id: 'criterion1',
            name: 'Criterion 1',
            type: 'cost',
            weight: 60,
            scale: 'numeric'
          },
          {
            id: 'criterion2',
            name: 'Criterion 2',
            type: 'performance',
            weight: 60,
            scale: 'numeric'
          }
        ],
        guidance: ['Test guidance']
      };

      const result = templateManager.validateTemplate(templateWithBadWeights);
      expect(result.isValid).toBe(true); // Should still be valid
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('120%');
    });
  });

  describe('Custom Template Management', () => {
    test('should create a custom template', async () => {
      const customTemplate = {
        name: 'Custom Template',
        description: 'A custom template for testing',
        category: 'custom',
        defaultCriteria: [
          {
            id: 'custom-criterion',
            name: 'Custom Criterion',
            type: 'cost' as const,
            weight: 100,
            scale: 'numeric' as const
          }
        ],
        guidance: ['Custom guidance']
      };

      const created = await templateManager.createTemplate(customTemplate);
      expect(created.id).toBeDefined();
      expect(created.name).toBe(customTemplate.name);

      // Should be able to retrieve it
      const retrieved = await templateManager.getTemplate(created.id);
      expect(retrieved).toEqual(created);
    });

    test('should update a custom template', async () => {
      const customTemplate = {
        name: 'Custom Template',
        description: 'A custom template for testing',
        category: 'custom',
        defaultCriteria: [
          {
            id: 'custom-criterion',
            name: 'Custom Criterion',
            type: 'cost' as const,
            weight: 100,
            scale: 'numeric' as const
          }
        ],
        guidance: ['Custom guidance']
      };

      const created = await templateManager.createTemplate(customTemplate);
      const updated = await templateManager.updateTemplate(created.id, {
        name: 'Updated Custom Template'
      });

      expect(updated.name).toBe('Updated Custom Template');
      expect(updated.id).toBe(created.id);
    });

    test('should delete a custom template', async () => {
      const customTemplate = {
        name: 'Custom Template',
        description: 'A custom template for testing',
        category: 'custom',
        defaultCriteria: [
          {
            id: 'custom-criterion',
            name: 'Custom Criterion',
            type: 'cost' as const,
            weight: 100,
            scale: 'numeric' as const
          }
        ],
        guidance: ['Custom guidance']
      };

      const created = await templateManager.createTemplate(customTemplate);
      await templateManager.deleteTemplate(created.id);

      const retrieved = await templateManager.getTemplate(created.id);
      expect(retrieved).toBeNull();
    });

    test('should not allow updating built-in templates', async () => {
      await expect(
        templateManager.updateTemplate('api-comparison', { name: 'Modified API Template' })
      ).rejects.toThrow('Cannot update built-in templates');
    });

    test('should not allow deleting built-in templates', async () => {
      await expect(
        templateManager.deleteTemplate('api-comparison')
      ).rejects.toThrow('Cannot delete built-in templates');
    });
  });

  describe('Template Application', () => {
    test('should apply template without customizations', async () => {
      const application = await templateManager.applyTemplate('api-comparison');
      
      expect(application.criteria.length).toBeGreaterThan(0);
      expect(application.sampleOptions.length).toBeGreaterThan(0);
      expect(application.guidance.length).toBeGreaterThan(0);
      expect(application.customizations).toEqual({});
    });

    test('should apply template with weight customizations', async () => {
      const customizations = {
        criteriaWeights: {
          'performance': 50,
          'cost': 50
        }
      };

      const application = await templateManager.applyTemplate('api-comparison', customizations);
      
      const performanceCriterion = application.criteria.find(c => c.id === 'performance');
      const costCriterion = application.criteria.find(c => c.id === 'cost');
      
      expect(performanceCriterion?.weight).toBe(50);
      expect(costCriterion?.weight).toBe(50);
    });

    test('should apply template with additional criteria', async () => {
      const customizations = {
        additionalCriteria: [
          {
            name: 'Custom Criterion',
            type: 'custom' as const,
            weight: 10,
            scale: 'ordinal' as const,
            scaleDefinition: { labels: ['Low', 'High'] }
          }
        ]
      };

      const application = await templateManager.applyTemplate('api-comparison', customizations);
      
      const originalTemplate = await templateManager.getTemplate('api-comparison');
      expect(application.criteria.length).toBe(originalTemplate!.defaultCriteria.length + 1);
      
      const customCriterion = application.criteria.find(c => c.name === 'Custom Criterion');
      expect(customCriterion).toBeDefined();
    });

    test('should apply template with excluded criteria', async () => {
      const customizations = {
        excludedCriteria: ['performance']
      };

      const application = await templateManager.applyTemplate('api-comparison', customizations);
      
      const performanceCriterion = application.criteria.find(c => c.id === 'performance');
      expect(performanceCriterion).toBeUndefined();
    });

    test('should throw error for non-existent template', async () => {
      await expect(
        templateManager.applyTemplate('non-existent-template')
      ).rejects.toThrow('Template with id non-existent-template not found');
    });
  });

  describe('Template Content Validation', () => {
    test('API comparison template should have appropriate criteria', async () => {
      const template = await templateManager.getTemplate('api-comparison');
      expect(template).toBeDefined();
      
      const criteriaNames = template!.defaultCriteria.map(c => c.name);
      expect(criteriaNames).toContain('Performance');
      expect(criteriaNames).toContain('Cost');
      expect(criteriaNames).toContain('Documentation Quality');
    });

    test('Cloud services template should have appropriate criteria', async () => {
      const template = await templateManager.getTemplate('cloud-services');
      expect(template).toBeDefined();
      
      const criteriaNames = template!.defaultCriteria.map(c => c.name);
      expect(criteriaNames).toContain('Compute Cost');
      expect(criteriaNames).toContain('Performance');
      expect(criteriaNames).toContain('Global Presence');
    });

    test('Tech stack template should have appropriate criteria', async () => {
      const template = await templateManager.getTemplate('tech-stack');
      expect(template).toBeDefined();
      
      const criteriaNames = template!.defaultCriteria.map(c => c.name);
      expect(criteriaNames).toContain('Development Speed');
      expect(criteriaNames).toContain('Runtime Performance');
      expect(criteriaNames).toContain('Learning Curve');
    });

    test('Tool comparison template should have appropriate criteria', async () => {
      const template = await templateManager.getTemplate('tool-comparison');
      expect(template).toBeDefined();
      
      const criteriaNames = template!.defaultCriteria.map(c => c.name);
      expect(criteriaNames).toContain('Feature Completeness');
      expect(criteriaNames).toContain('Ease of Use');
      expect(criteriaNames).toContain('Cost');
    });
  });
});
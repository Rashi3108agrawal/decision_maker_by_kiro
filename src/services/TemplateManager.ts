import { 
  ComparisonTemplate, 
  ValidationResult, 
  Criterion, 
  Option,
  ValidationError 
} from '../types/core';
import { 
  TemplateManager as ITemplateManager, 
  TemplateCustomizations, 
  TemplateApplication 
} from '../interfaces/TemplateManager';

// Simple UUID v4 generator to avoid ES module issues in Jest
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class TemplateManager implements ITemplateManager {
  private templates: Map<string, ComparisonTemplate> = new Map();
  private customTemplates: Map<string, ComparisonTemplate> = new Map();

  constructor() {
    this.initializeBuiltInTemplates();
  }

  private initializeBuiltInTemplates(): void {
    const builtInTemplates = [
      this.createApiComparisonTemplate(),
      this.createCloudServicesTemplate(),
      this.createTechStackTemplate(),
      this.createToolComparisonTemplate()
    ];

    builtInTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private createApiComparisonTemplate(): ComparisonTemplate {
    return {
      id: 'api-comparison',
      name: 'API Comparison',
      description: 'Compare different APIs based on performance, cost, features, and developer experience',
      category: 'api-comparison',
      defaultCriteria: [
        {
          id: 'performance',
          name: 'Performance',
          type: 'performance',
          weight: 25,
          scale: 'numeric',
          scaleDefinition: { min: 0, max: 100, unit: 'ms' }
        },
        {
          id: 'cost',
          name: 'Cost',
          type: 'cost',
          weight: 20,
          scale: 'numeric',
          scaleDefinition: { min: 0, max: 1000, unit: '$' }
        },
        {
          id: 'documentation-quality',
          name: 'Documentation Quality',
          type: 'ease-of-use',
          weight: 15,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Poor', 'Fair', 'Good', 'Excellent'] }
        },
        {
          id: 'rate-limits',
          name: 'Rate Limits',
          type: 'scalability',
          weight: 15,
          scale: 'numeric',
          scaleDefinition: { min: 0, max: 10000, unit: 'req/min' }
        },
        {
          id: 'reliability',
          name: 'Reliability (SLA)',
          type: 'performance',
          weight: 20,
          scale: 'numeric',
          scaleDefinition: { min: 90, max: 100, unit: '%' }
        },
        {
          id: 'community-support',
          name: 'Community Support',
          type: 'ease-of-use',
          weight: 5,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Limited', 'Moderate', 'Strong', 'Excellent'] }
        }
      ],
      sampleOptions: [
        {
          name: 'REST API Example',
          type: 'api',
          attributes: {
            'performance': 150,
            'cost': 50,
            'documentation-quality': 'Good',
            'rate-limits': 1000,
            'reliability': 99.9,
            'community-support': 'Strong'
          },
          metadata: {
            description: 'Sample REST API for comparison',
            tags: ['REST', 'HTTP']
          }
        }
      ],
      guidance: [
        'Consider your expected request volume when evaluating rate limits',
        'Factor in both base costs and overage charges',
        'Test API response times under realistic load conditions',
        'Review SLA terms and downtime compensation policies',
        'Check for SDK availability in your preferred programming language'
      ]
    };
  }

  private createCloudServicesTemplate(): ComparisonTemplate {
    return {
      id: 'cloud-services',
      name: 'Cloud Services Comparison',
      description: 'Compare cloud service providers based on cost, performance, features, and support',
      category: 'cloud-services',
      defaultCriteria: [
        {
          id: 'compute-cost',
          name: 'Compute Cost',
          type: 'cost',
          weight: 25,
          scale: 'numeric',
          scaleDefinition: { min: 0, max: 500, unit: '$/month' }
        },
        {
          id: 'storage-cost',
          name: 'Storage Cost',
          type: 'cost',
          weight: 15,
          scale: 'numeric',
          scaleDefinition: { min: 0, max: 100, unit: '$/GB/month' }
        },
        {
          id: 'performance',
          name: 'Performance',
          type: 'performance',
          weight: 20,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Basic', 'Standard', 'High', 'Premium'] }
        },
        {
          id: 'scalability',
          name: 'Auto-scaling',
          type: 'scalability',
          weight: 15,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Manual', 'Basic', 'Advanced', 'Intelligent'] }
        },
        {
          id: 'global-presence',
          name: 'Global Presence',
          type: 'scalability',
          weight: 10,
          scale: 'numeric',
          scaleDefinition: { min: 1, max: 50, unit: 'regions' }
        },
        {
          id: 'support-quality',
          name: 'Support Quality',
          type: 'ease-of-use',
          weight: 15,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Community', 'Basic', 'Business', 'Enterprise'] }
        }
      ],
      sampleOptions: [
        {
          name: 'Cloud Provider A',
          type: 'cloud-service',
          attributes: {
            'compute-cost': 100,
            'storage-cost': 0.023,
            'performance': 'High',
            'scalability': 'Advanced',
            'global-presence': 25,
            'support-quality': 'Business'
          },
          metadata: {
            description: 'Sample cloud provider for comparison',
            tags: ['IaaS', 'PaaS']
          }
        }
      ],
      guidance: [
        'Calculate total cost including compute, storage, and data transfer',
        'Consider geographic requirements for data residency',
        'Evaluate vendor lock-in risks and migration complexity',
        'Test performance in your target regions',
        'Review compliance certifications for your industry'
      ]
    };
  }

  private createTechStackTemplate(): ComparisonTemplate {
    return {
      id: 'tech-stack',
      name: 'Technology Stack Comparison',
      description: 'Compare technology stacks based on development speed, performance, maintainability, and ecosystem',
      category: 'tech-stack',
      defaultCriteria: [
        {
          id: 'development-speed',
          name: 'Development Speed',
          type: 'ease-of-use',
          weight: 25,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Slow', 'Moderate', 'Fast', 'Very Fast'] }
        },
        {
          id: 'performance',
          name: 'Runtime Performance',
          type: 'performance',
          weight: 20,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Low', 'Moderate', 'High', 'Excellent'] }
        },
        {
          id: 'learning-curve',
          name: 'Learning Curve',
          type: 'ease-of-use',
          weight: 15,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Steep', 'Moderate', 'Gentle', 'Easy'] }
        },
        {
          id: 'ecosystem-maturity',
          name: 'Ecosystem Maturity',
          type: 'scalability',
          weight: 15,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Emerging', 'Growing', 'Mature', 'Established'] }
        },
        {
          id: 'talent-availability',
          name: 'Talent Availability',
          type: 'ease-of-use',
          weight: 15,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Scarce', 'Limited', 'Available', 'Abundant'] }
        },
        {
          id: 'long-term-viability',
          name: 'Long-term Viability',
          type: 'scalability',
          weight: 10,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Uncertain', 'Stable', 'Growing', 'Dominant'] }
        }
      ],
      sampleOptions: [
        {
          name: 'Tech Stack A',
          type: 'tech-stack',
          attributes: {
            'development-speed': 'Fast',
            'performance': 'High',
            'learning-curve': 'Moderate',
            'ecosystem-maturity': 'Mature',
            'talent-availability': 'Available',
            'long-term-viability': 'Growing'
          },
          metadata: {
            description: 'Sample technology stack for comparison',
            tags: ['Web', 'Full-stack']
          }
        }
      ],
      guidance: [
        'Consider your team\'s existing expertise and learning capacity',
        'Evaluate the availability of third-party libraries and tools',
        'Assess the technology\'s roadmap and community activity',
        'Factor in hiring and training costs for new technologies',
        'Consider performance requirements for your specific use case'
      ]
    };
  }

  private createToolComparisonTemplate(): ComparisonTemplate {
    return {
      id: 'tool-comparison',
      name: 'Development Tool Comparison',
      description: 'Compare development tools based on features, usability, cost, and integration capabilities',
      category: 'tool-comparison',
      defaultCriteria: [
        {
          id: 'feature-completeness',
          name: 'Feature Completeness',
          type: 'scalability',
          weight: 25,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Basic', 'Standard', 'Advanced', 'Comprehensive'] }
        },
        {
          id: 'ease-of-use',
          name: 'Ease of Use',
          type: 'ease-of-use',
          weight: 20,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Difficult', 'Moderate', 'Easy', 'Intuitive'] }
        },
        {
          id: 'cost',
          name: 'Cost',
          type: 'cost',
          weight: 20,
          scale: 'numeric',
          scaleDefinition: { min: 0, max: 1000, unit: '$/user/month' }
        },
        {
          id: 'integration-capabilities',
          name: 'Integration Capabilities',
          type: 'scalability',
          weight: 15,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Limited', 'Basic', 'Good', 'Excellent'] }
        },
        {
          id: 'customization',
          name: 'Customization Options',
          type: 'scalability',
          weight: 10,
          scale: 'ordinal',
          scaleDefinition: { labels: ['None', 'Limited', 'Moderate', 'Extensive'] }
        },
        {
          id: 'support-quality',
          name: 'Support Quality',
          type: 'ease-of-use',
          weight: 10,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Poor', 'Fair', 'Good', 'Excellent'] }
        }
      ],
      sampleOptions: [
        {
          name: 'Development Tool A',
          type: 'tool',
          attributes: {
            'feature-completeness': 'Advanced',
            'ease-of-use': 'Easy',
            'cost': 50,
            'integration-capabilities': 'Good',
            'customization': 'Moderate',
            'support-quality': 'Good'
          },
          metadata: {
            description: 'Sample development tool for comparison',
            tags: ['IDE', 'Development']
          }
        }
      ],
      guidance: [
        'Consider the tool\'s integration with your existing workflow',
        'Evaluate the learning curve for your team',
        'Factor in licensing costs for your team size',
        'Test the tool with your actual project requirements',
        'Consider the vendor\'s track record and update frequency'
      ]
    };
  }

  async getTemplate(id: string): Promise<ComparisonTemplate | null> {
    return this.templates.get(id) || this.customTemplates.get(id) || null;
  }

  async getAllTemplates(): Promise<ComparisonTemplate[]> {
    const allTemplates = [
      ...Array.from(this.templates.values()),
      ...Array.from(this.customTemplates.values())
    ];
    return allTemplates.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTemplatesByCategory(category: string): Promise<ComparisonTemplate[]> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.filter(template => template.category === category);
  }

  async createTemplate(template: Omit<ComparisonTemplate, 'id'>): Promise<ComparisonTemplate> {
    const newTemplate: ComparisonTemplate = {
      ...template,
      id: generateId()
    };

    const validation = this.validateTemplate(newTemplate);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.customTemplates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<ComparisonTemplate>): Promise<ComparisonTemplate> {
    const existingTemplate = await this.getTemplate(id);
    if (!existingTemplate) {
      throw new Error(`Template with id ${id} not found`);
    }

    // Don't allow updating built-in templates
    if (this.templates.has(id)) {
      throw new Error('Cannot update built-in templates');
    }

    const updatedTemplate: ComparisonTemplate = {
      ...existingTemplate,
      ...updates,
      id // Ensure ID cannot be changed
    };

    const validation = this.validateTemplate(updatedTemplate);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.customTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    if (this.templates.has(id)) {
      throw new Error('Cannot delete built-in templates');
    }

    if (!this.customTemplates.has(id)) {
      throw new Error(`Template with id ${id} not found`);
    }

    this.customTemplates.delete(id);
  }

  async applyTemplate(templateId: string, customizations?: TemplateCustomizations): Promise<TemplateApplication> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    let criteria = [...template.defaultCriteria];
    let sampleOptions = template.sampleOptions ? 
      template.sampleOptions.map(opt => ({ ...opt, id: generateId() } as Option)) : 
      [];

    if (customizations) {
      // Apply weight customizations
      if (customizations.criteriaWeights) {
        criteria = criteria.map(criterion => ({
          ...criterion,
          weight: customizations.criteriaWeights![criterion.id] ?? criterion.weight
        }));
      }

      // Add additional criteria
      if (customizations.additionalCriteria) {
        const additionalCriteria = customizations.additionalCriteria.map(criterion => ({
          ...criterion,
          id: generateId()
        }));
        criteria.push(...additionalCriteria);
      }

      // Exclude specified criteria
      if (customizations.excludedCriteria) {
        criteria = criteria.filter(criterion => 
          !customizations.excludedCriteria!.includes(criterion.id)
        );
      }

      // Add custom options
      if (customizations.customOptions) {
        const customOptions = customizations.customOptions.map(opt => ({
          ...opt,
          id: generateId()
        } as Option));
        sampleOptions.push(...customOptions);
      }
    }

    return {
      criteria,
      sampleOptions,
      guidance: template.guidance,
      customizations: customizations || {}
    };
  }

  validateTemplate(template: ComparisonTemplate): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate required fields
    if (!template.id || template.id.trim() === '') {
      errors.push({
        field: 'id',
        message: 'Template ID is required',
        severity: 'error'
      });
    }

    if (!template.name || template.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Template name is required',
        severity: 'error'
      });
    }

    if (!template.description || template.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Template description is required',
        severity: 'error'
      });
    }

    if (!template.category || template.category.trim() === '') {
      errors.push({
        field: 'category',
        message: 'Template category is required',
        severity: 'error'
      });
    }

    // Validate criteria
    if (!template.defaultCriteria || template.defaultCriteria.length === 0) {
      errors.push({
        field: 'defaultCriteria',
        message: 'Template must have at least one default criterion',
        severity: 'error'
      });
    } else {
      // Validate individual criteria
      template.defaultCriteria.forEach((criterion, index) => {
        if (!criterion.id || criterion.id.trim() === '') {
          errors.push({
            field: `defaultCriteria[${index}].id`,
            message: 'Criterion ID is required',
            severity: 'error'
          });
        }

        if (!criterion.name || criterion.name.trim() === '') {
          errors.push({
            field: `defaultCriteria[${index}].name`,
            message: 'Criterion name is required',
            severity: 'error'
          });
        }

        if (criterion.weight < 0 || criterion.weight > 100) {
          errors.push({
            field: `defaultCriteria[${index}].weight`,
            message: 'Criterion weight must be between 0 and 100',
            severity: 'error'
          });
        }
      });

      // Check if weights sum to 100
      const totalWeight = template.defaultCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        warnings.push({
          field: 'defaultCriteria',
          message: `Criterion weights sum to ${totalWeight}%, should sum to 100%`,
          severity: 'warning'
        });
      }
    }

    // Validate guidance
    if (!template.guidance || template.guidance.length === 0) {
      warnings.push({
        field: 'guidance',
        message: 'Template should include guidance for users',
        severity: 'warning'
      });
    }

    const qualityScore = Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore
    };
  }
}
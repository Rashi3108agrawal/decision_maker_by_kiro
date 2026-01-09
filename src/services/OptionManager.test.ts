import { OptionManager } from './OptionManager';
import { Option, OptionType } from '../types/core';

describe('OptionManager', () => {
  let optionManager: OptionManager;

  beforeEach(() => {
    optionManager = new OptionManager();
  });

  describe('addOption', () => {
    it('should add a valid option and return it with an ID', async () => {
      const optionData = {
        name: 'Test API',
        type: 'api' as OptionType,
        attributes: {
          endpoint: 'https://api.example.com',
          authentication: 'API Key',
          rateLimit: '1000/hour'
        }
      };

      const result = await optionManager.addOption(optionData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(optionData.name);
      expect(result.type).toBe(optionData.type);
      expect(result.attributes).toEqual(optionData.attributes);
    });

    it('should reject option with empty name', async () => {
      const optionData = {
        name: '',
        type: 'api' as OptionType,
        attributes: { endpoint: 'https://api.example.com' }
      };

      await expect(optionManager.addOption(optionData)).rejects.toThrow('Invalid option');
    });

    it('should reject option with invalid type', async () => {
      const optionData = {
        name: 'Test Option',
        type: 'invalid-type' as OptionType,
        attributes: { test: 'value' }
      };

      await expect(optionManager.addOption(optionData)).rejects.toThrow('Invalid option type');
    });

    it('should reject adding more than 10 options', async () => {
      // Add 10 options
      for (let i = 0; i < 10; i++) {
        await optionManager.addOption({
          name: `Option ${i}`,
          type: 'custom',
          attributes: { value: i }
        });
      }

      // Try to add 11th option
      await expect(optionManager.addOption({
        name: 'Option 11',
        type: 'custom',
        attributes: { value: 11 }
      })).rejects.toThrow('Cannot add more than 10 options');
    });
  });

  describe('updateOption', () => {
    it('should update an existing option', async () => {
      const option = await optionManager.addOption({
        name: 'Original Name',
        type: 'api',
        attributes: { endpoint: 'https://api.example.com' }
      });

      const updated = await optionManager.updateOption(option.id, {
        name: 'Updated Name',
        attributes: { endpoint: 'https://api.updated.com' }
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.attributes.endpoint).toBe('https://api.updated.com');
      expect(updated.id).toBe(option.id); // ID should remain the same
    });

    it('should throw error when updating non-existent option', async () => {
      await expect(optionManager.updateOption('non-existent', {
        name: 'Updated Name'
      })).rejects.toThrow('Option with id non-existent not found');
    });

    it('should validate updated option data', async () => {
      const option = await optionManager.addOption({
        name: 'Test Option',
        type: 'api',
        attributes: { endpoint: 'https://api.example.com' }
      });

      await expect(optionManager.updateOption(option.id, {
        name: '' // Invalid empty name
      })).rejects.toThrow('Invalid option update');
    });
  });

  describe('removeOption', () => {
    it('should remove an existing option', async () => {
      const option1 = await optionManager.addOption({
        name: 'Option 1',
        type: 'api',
        attributes: { endpoint: 'https://api1.example.com' }
      });

      const option2 = await optionManager.addOption({
        name: 'Option 2',
        type: 'api',
        attributes: { endpoint: 'https://api2.example.com' }
      });

      const option3 = await optionManager.addOption({
        name: 'Option 3',
        type: 'api',
        attributes: { endpoint: 'https://api3.example.com' }
      });

      await optionManager.removeOption(option2.id);

      const retrievedOption = await optionManager.getOption(option2.id);
      expect(retrievedOption).toBeNull();

      const allOptions = await optionManager.getAllOptions();
      expect(allOptions).toHaveLength(2);
      expect(allOptions.map(o => o.id)).toEqual([option1.id, option3.id]);
    });

    it('should throw error when removing non-existent option', async () => {
      await expect(optionManager.removeOption('non-existent')).rejects.toThrow('Option with id non-existent not found');
    });

    it('should prevent removing option when only 2 options remain', async () => {
      const option1 = await optionManager.addOption({
        name: 'Option 1',
        type: 'api',
        attributes: { endpoint: 'https://api1.example.com' }
      });

      await optionManager.addOption({
        name: 'Option 2',
        type: 'api',
        attributes: { endpoint: 'https://api2.example.com' }
      });

      await expect(optionManager.removeOption(option1.id)).rejects.toThrow('Cannot remove option: minimum of 2 options required');
    });
  });

  describe('getOption', () => {
    it('should retrieve an existing option', async () => {
      const option = await optionManager.addOption({
        name: 'Test Option',
        type: 'api',
        attributes: { endpoint: 'https://api.example.com' }
      });

      const retrieved = await optionManager.getOption(option.id);
      expect(retrieved).toEqual(option);
    });

    it('should return null for non-existent option', async () => {
      const retrieved = await optionManager.getOption('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('getAllOptions', () => {
    it('should return all options', async () => {
      const option1 = await optionManager.addOption({
        name: 'Option 1',
        type: 'api',
        attributes: { endpoint: 'https://api1.example.com' }
      });

      const option2 = await optionManager.addOption({
        name: 'Option 2',
        type: 'cloud-service',
        attributes: { provider: 'AWS' }
      });

      const allOptions = await optionManager.getAllOptions();
      expect(allOptions).toHaveLength(2);
      expect(allOptions).toContainEqual(option1);
      expect(allOptions).toContainEqual(option2);
    });

    it('should return empty array when no options exist', async () => {
      const allOptions = await optionManager.getAllOptions();
      expect(allOptions).toEqual([]);
    });
  });

  describe('validateOption', () => {
    it('should validate API option with recommended attributes', () => {
      const option: Option = {
        id: 'test-id',
        name: 'Test API',
        type: 'api',
        attributes: {
          endpoint: 'https://api.example.com',
          authentication: 'API Key',
          rateLimit: '1000/hour',
          pricing: '$0.01/request',
          documentation: 'https://docs.example.com'
        }
      };

      const result = optionManager.validateOption(option);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about missing recommended attributes for API', () => {
      const option: Option = {
        id: 'test-id',
        name: 'Test API',
        type: 'api',
        attributes: {
          endpoint: 'https://api.example.com'
        }
      };

      const result = optionManager.validateOption(option);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('missing recommended attributes');
    });

    it('should validate cloud service option', () => {
      const option: Option = {
        id: 'test-id',
        name: 'Test Cloud Service',
        type: 'cloud-service',
        attributes: {
          provider: 'AWS',
          region: 'us-east-1',
          pricing: '$0.10/hour',
          sla: '99.9%',
          features: ['auto-scaling', 'load-balancing']
        }
      };

      const result = optionManager.validateOption(option);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate tech stack option', () => {
      const option: Option = {
        id: 'test-id',
        name: 'Test Tech Stack',
        type: 'tech-stack',
        attributes: {
          language: 'TypeScript',
          framework: 'React',
          database: 'PostgreSQL',
          deployment: 'Docker',
          community: 'Large'
        }
      };

      const result = optionManager.validateOption(option);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate tool option', () => {
      const option: Option = {
        id: 'test-id',
        name: 'Test Tool',
        type: 'tool',
        attributes: {
          category: 'Development',
          platform: 'Cross-platform',
          license: 'MIT',
          support: 'Community',
          integrations: ['GitHub', 'Slack']
        }
      };

      const result = optionManager.validateOption(option);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate custom option with flexible attributes', () => {
      const option: Option = {
        id: 'test-id',
        name: 'Custom Option',
        type: 'custom',
        attributes: {
          customField1: 'value1',
          customField2: 42,
          customField3: true
        }
      };

      const result = optionManager.validateOption(option);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about empty attributes in custom option', () => {
      const option: Option = {
        id: 'test-id',
        name: 'Custom Option',
        type: 'custom',
        attributes: {}
      };

      const result = optionManager.validateOption(option);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('no attributes defined');
    });

    it('should validate metadata when provided', () => {
      const option: Option = {
        id: 'test-id',
        name: 'Test Option',
        type: 'api',
        attributes: { endpoint: 'https://api.example.com' },
        metadata: {
          url: 'https://example.com',
          description: 'A test API',
          tags: ['test', 'api']
        }
      };

      const result = optionManager.validateOption(option);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about invalid URL in metadata', () => {
      const option: Option = {
        id: 'test-id',
        name: 'Test Option',
        type: 'api',
        attributes: { 
          endpoint: 'https://api.example.com',
          authentication: 'API Key',
          rateLimit: '1000/hour',
          pricing: '$0.01/request',
          documentation: 'https://docs.example.com'
        },
        metadata: {
          url: 'invalid-url',
          description: 'A test API'
        }
      };

      const result = optionManager.validateOption(option);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('Invalid URL format'))).toBe(true);
    });
  });

  describe('option count constraints', () => {
    it('should track option count correctly', async () => {
      expect(optionManager.getOptionCount()).toBe(0);

      await optionManager.addOption({
        name: 'Option 1',
        type: 'custom',
        attributes: { test: 'value' }
      });

      expect(optionManager.getOptionCount()).toBe(1);

      await optionManager.addOption({
        name: 'Option 2',
        type: 'custom',
        attributes: { test: 'value' }
      });

      expect(optionManager.getOptionCount()).toBe(2);
    });
  });
});
import fc from 'fast-check';
import { OptionManager } from './OptionManager';
import { Option, OptionType, AttributeValue } from '../types/core';

/**
 * Property-Based Tests for OptionManager
 * Feature: decision-helper, Property 1: Option Storage Integrity
 * Validates: Requirements 1.1
 */
describe('OptionManager Property-Based Tests', () => {
  let optionManager: OptionManager;

  beforeEach(() => {
    optionManager = new OptionManager();
  });

  describe('Property 1: Option Storage Integrity', () => {
    /**
     * For any valid option with key characteristics, storing it in the Decision_Helper 
     * should preserve all characteristics and allow retrieval of equivalent data.
     * Validates: Requirements 1.1
     */
    it('should preserve all option characteristics during storage and retrieval', async () => {
      await fc.assert(fc.asyncProperty(
        generateValidOption(),
        async (optionData) => {
          // Clear the option manager to ensure clean state for each test iteration
          optionManager.clear();
          
          // Store the option
          const storedOption = await optionManager.addOption(optionData);
          
          // Retrieve the option
          const retrievedOption = await optionManager.getOption(storedOption.id);
          
          // Verify storage integrity
          expect(retrievedOption).not.toBeNull();
          if (retrievedOption) {
            // All original characteristics should be preserved
            expect(retrievedOption.name).toBe(optionData.name);
            expect(retrievedOption.type).toBe(optionData.type);
            expect(retrievedOption.attributes).toEqual(optionData.attributes);
            
            // Metadata should be preserved if provided
            if (optionData.metadata) {
              expect(retrievedOption.metadata).toEqual(optionData.metadata);
            }
            
            // ID should be assigned and consistent
            expect(retrievedOption.id).toBe(storedOption.id);
            expect(retrievedOption.id).toBeDefined();
            expect(typeof retrievedOption.id).toBe('string');
            expect(retrievedOption.id.length).toBeGreaterThan(0);
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });
  });

  describe('Property 2: Option Validation Consistency', () => {
    /**
     * For any option details provided by a user, the validation process should 
     * consistently apply the same rules and produce deterministic results.
     * Validates: Requirements 1.2
     */
    it('should consistently validate option details with deterministic results', async () => {
      await fc.assert(fc.property(
        generateOptionForValidation(),
        (option) => {
          // Validate the same option multiple times
          const validation1 = optionManager.validateOption(option);
          const validation2 = optionManager.validateOption(option);
          const validation3 = optionManager.validateOption(option);
          
          // Results should be identical (deterministic)
          expect(validation1.isValid).toBe(validation2.isValid);
          expect(validation1.isValid).toBe(validation3.isValid);
          expect(validation1.errors).toEqual(validation2.errors);
          expect(validation1.errors).toEqual(validation3.errors);
          expect(validation1.warnings).toEqual(validation2.warnings);
          expect(validation1.warnings).toEqual(validation3.warnings);
          expect(validation1.qualityScore).toBe(validation2.qualityScore);
          expect(validation1.qualityScore).toBe(validation3.qualityScore);
          
          // Validation should follow consistent rules
          if (option.name && option.name.trim().length > 0 && 
              option.type && ['api', 'cloud-service', 'tech-stack', 'tool', 'custom'].includes(option.type) &&
              option.attributes && typeof option.attributes === 'object') {
            // Should be valid if basic requirements are met
            expect(validation1.isValid).toBe(true);
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });
  });

  describe('Property 4: CRUD Operations Completeness', () => {
    /**
     * For any option that has been successfully added, the system should allow 
     * editing and removal operations to complete successfully.
     * Validates: Requirements 1.4
     */
    it('should allow complete CRUD operations on successfully added options', async () => {
      await fc.assert(fc.asyncProperty(
        generateValidOption(),
        generateValidOptionUpdate(),
        async (originalOption, updateData) => {
          // Clear the option manager to ensure clean state
          optionManager.clear();
          
          // Add at least 3 options to avoid minimum constraint issues during removal
          await optionManager.addOption(generateMinimalValidOption());
          await optionManager.addOption(generateMinimalValidOption());
          
          // CREATE: Add the option
          const addedOption = await optionManager.addOption(originalOption);
          expect(addedOption.id).toBeDefined();
          expect(addedOption.name).toBe(originalOption.name);
          
          // READ: Retrieve the option
          const retrievedOption = await optionManager.getOption(addedOption.id);
          expect(retrievedOption).not.toBeNull();
          expect(retrievedOption?.id).toBe(addedOption.id);
          
          // UPDATE: Edit the option
          const updatedOption = await optionManager.updateOption(addedOption.id, updateData);
          expect(updatedOption.id).toBe(addedOption.id); // ID should remain the same
          
          // Verify update was applied
          const retrievedUpdated = await optionManager.getOption(addedOption.id);
          expect(retrievedUpdated).not.toBeNull();
          if (updateData.name) {
            expect(retrievedUpdated?.name).toBe(updateData.name);
          }
          if (updateData.type) {
            expect(retrievedUpdated?.type).toBe(updateData.type);
          }
          if (updateData.attributes) {
            expect(retrievedUpdated?.attributes).toEqual(updateData.attributes);
          }
          
          // DELETE: Remove the option
          await expect(optionManager.removeOption(addedOption.id)).resolves.not.toThrow();
          
          // Verify removal
          const deletedOption = await optionManager.getOption(addedOption.id);
          expect(deletedOption).toBeNull();
          
          return true;
        }
      ), { numRuns: 100 });
    });
  });
});

/**
 * Generator for valid option types
 */
function generateOptionType(): fc.Arbitrary<OptionType> {
  return fc.oneof(
    fc.constant('api' as OptionType),
    fc.constant('cloud-service' as OptionType),
    fc.constant('tech-stack' as OptionType),
    fc.constant('tool' as OptionType),
    fc.constant('custom' as OptionType)
  );
}

/**
 * Generator for attribute values
 */
function generateAttributeValue(): fc.Arbitrary<AttributeValue> {
  return fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.integer({ min: 0, max: 10000 }),
    fc.boolean(),
    fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
    fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 5 }),
    fc.constant(null)
  );
}

/**
 * Generator for option attributes based on type
 */
function generateAttributes(type: OptionType): fc.Arbitrary<Record<string, AttributeValue>> {
  const baseAttributes = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
    generateAttributeValue(),
    { minKeys: 1, maxKeys: 10 }
  );

  // Add type-specific recommended attributes to increase test coverage
  switch (type) {
    case 'api':
      return fc.record({
        endpoint: fc.webUrl(),
        authentication: fc.oneof(fc.constant('API Key'), fc.constant('OAuth'), fc.constant('Basic Auth')),
        rateLimit: fc.string({ minLength: 1, maxLength: 20 })
      }).chain(specificAttrs => 
        baseAttributes.map(baseAttrs => ({ ...baseAttrs, ...specificAttrs }))
      );
    case 'cloud-service':
      return fc.record({
        provider: fc.oneof(fc.constant('AWS'), fc.constant('Azure'), fc.constant('GCP')),
        region: fc.string({ minLength: 1, maxLength: 20 }),
        pricing: fc.string({ minLength: 1, maxLength: 50 })
      }).chain(specificAttrs => 
        baseAttributes.map(baseAttrs => ({ ...baseAttrs, ...specificAttrs }))
      );
    case 'tech-stack':
      return fc.record({
        language: fc.oneof(fc.constant('TypeScript'), fc.constant('Python'), fc.constant('Java')),
        framework: fc.string({ minLength: 1, maxLength: 30 }),
        database: fc.oneof(fc.constant('PostgreSQL'), fc.constant('MongoDB'), fc.constant('MySQL'))
      }).chain(specificAttrs => 
        baseAttributes.map(baseAttrs => ({ ...baseAttrs, ...specificAttrs }))
      );
    case 'tool':
      return fc.record({
        category: fc.string({ minLength: 1, maxLength: 30 }),
        platform: fc.oneof(fc.constant('Cross-platform'), fc.constant('Windows'), fc.constant('macOS')),
        license: fc.oneof(fc.constant('MIT'), fc.constant('Apache'), fc.constant('GPL'))
      }).chain(specificAttrs => 
        baseAttributes.map(baseAttrs => ({ ...baseAttrs, ...specificAttrs }))
      );
    case 'custom':
    default:
      return baseAttributes;
  }
}

/**
 * Generator for optional metadata
 */
function generateMetadata(): fc.Arbitrary<Option['metadata'] | undefined> {
  return fc.option(
    fc.record({
      url: fc.option(fc.webUrl()),
      description: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
      tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }))
    }),
    { nil: undefined }
  );
}

/**
 * Generator for valid options (without ID)
 */
function generateValidOption(): fc.Arbitrary<Omit<Option, 'id'>> {
  return generateOptionType().chain(
    (type: OptionType) => fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
      type: fc.constant(type),
      attributes: generateAttributes(type),
      metadata: generateMetadata()
    })
  );
}

/**
 * Generator for options that may have validation issues (for testing validation consistency)
 */
function generateOptionForValidation(): fc.Arbitrary<Option> {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.oneof(
      fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // Valid names
      fc.string({ minLength: 0, maxLength: 5 }), // Potentially invalid names (empty or whitespace)
      fc.constant('') // Empty name
    ),
    type: fc.oneof(
      generateOptionType(), // Valid types
      fc.string({ minLength: 1, maxLength: 20 }) as fc.Arbitrary<OptionType> // Potentially invalid types
    ),
    attributes: fc.oneof(
      fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }),
        generateAttributeValue(),
        { minKeys: 0, maxKeys: 10 }
      ), // Valid attributes object
      fc.constant(null as any), // Invalid attributes (null)
      fc.constant(undefined as any) // Invalid attributes (undefined)
    ),
    metadata: fc.option(
      fc.record({
        url: fc.option(fc.oneof(
          fc.webUrl(), // Valid URLs
          fc.string({ minLength: 1, maxLength: 50 }) // Potentially invalid URLs
        )),
        description: fc.option(fc.string({ minLength: 0, maxLength: 200 })),
        tags: fc.option(fc.oneof(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }), // Valid tags
          fc.constant(['invalid'] as any) // Keep as valid array to avoid type issues
        ))
      }),
      { nil: undefined }
    )
  }) as fc.Arbitrary<Option>;
}

/**
 * Generator for valid option updates
 */
function generateValidOptionUpdate(): fc.Arbitrary<Partial<Omit<Option, 'id'>>> {
  return fc.oneof(
    // Update just the name
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
    }),
    // Update just the type (but keep existing attributes)
    fc.record({
      type: generateOptionType()
    }),
    // Update just the attributes (never set to undefined)
    fc.record({
      attributes: fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
        generateAttributeValue(),
        { minKeys: 1, maxKeys: 5 }
      )
    }),
    // Update just the metadata
    fc.record({
      metadata: fc.record({
        url: fc.option(fc.webUrl(), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 3 }), { nil: undefined })
      })
    }),
    // Update name and metadata together (safe combination)
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
      metadata: fc.record({
        url: fc.option(fc.webUrl(), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 3 }), { nil: undefined })
      })
    })
  );
}

/**
 * Generator for minimal valid options (used to satisfy minimum option count constraints)
 */
function generateMinimalValidOption(): Omit<Option, 'id'> {
  return {
    name: `Test Option ${Math.random().toString(36).substr(2, 9)}`,
    type: 'custom',
    attributes: { test: 'value' }
  };
}
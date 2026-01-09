import { CriteriaEngine } from './CriteriaEngine';
import { Criterion, CriterionType, ScaleType } from '../types/core';

describe('CriteriaEngine', () => {
  let engine: CriteriaEngine;

  beforeEach(() => {
    engine = new CriteriaEngine();
  });

  describe('addCriterion', () => {
    it('should add a valid criterion', async () => {
      const criterionData = {
        name: 'Cost',
        type: 'cost' as CriterionType,
        weight: 30,
        scale: 'numeric' as ScaleType,
        scaleDefinition: {
          min: 0,
          max: 1000,
          unit: '$'
        }
      };

      const criterion = await engine.addCriterion(criterionData);

      expect(criterion.id).toBeDefined();
      expect(criterion.name).toBe('Cost');
      expect(criterion.type).toBe('cost');
      expect(criterion.weight).toBe(30);
      expect(criterion.scale).toBe('numeric');
    });

    it('should reject criterion with invalid type', async () => {
      const criterionData = {
        name: 'Invalid',
        type: 'invalid' as CriterionType,
        weight: 30,
        scale: 'numeric' as ScaleType
      };

      await expect(engine.addCriterion(criterionData)).rejects.toThrow('Invalid criterion type');
    });

    it('should reject criterion with empty name', async () => {
      const criterionData = {
        name: '',
        type: 'cost' as CriterionType,
        weight: 30,
        scale: 'numeric' as ScaleType
      };

      await expect(engine.addCriterion(criterionData)).rejects.toThrow('name is required');
    });

    it('should reject criterion with weight out of range', async () => {
      const criterionData = {
        name: 'Cost',
        type: 'cost' as CriterionType,
        weight: 150,
        scale: 'numeric' as ScaleType
      };

      await expect(engine.addCriterion(criterionData)).rejects.toThrow('weight must be between 0 and 100');
    });
  });

  describe('updateWeights', () => {
    it('should update weights for existing criteria', async () => {
      const criterion1 = await engine.addCriterion({
        name: 'Cost',
        type: 'cost' as CriterionType,
        weight: 50,
        scale: 'numeric' as ScaleType
      });

      const criterion2 = await engine.addCriterion({
        name: 'Performance',
        type: 'performance' as CriterionType,
        weight: 50,
        scale: 'numeric' as ScaleType
      });

      await engine.updateWeights({
        [criterion1.id]: 30,
        [criterion2.id]: 70
      });

      const updatedCriterion1 = await engine.getCriterion(criterion1.id);
      const updatedCriterion2 = await engine.getCriterion(criterion2.id);

      expect(updatedCriterion1?.weight).toBe(30);
      expect(updatedCriterion2?.weight).toBe(70);
    });

    it('should normalize weights that do not sum to 100', async () => {
      const criterion1 = await engine.addCriterion({
        name: 'Cost',
        type: 'cost' as CriterionType,
        weight: 50,
        scale: 'numeric' as ScaleType
      });

      const criterion2 = await engine.addCriterion({
        name: 'Performance',
        type: 'performance' as CriterionType,
        weight: 50,
        scale: 'numeric' as ScaleType
      });

      // Weights sum to 60, should be normalized to 100
      await engine.updateWeights({
        [criterion1.id]: 20,
        [criterion2.id]: 40
      });

      const updatedCriterion1 = await engine.getCriterion(criterion1.id);
      const updatedCriterion2 = await engine.getCriterion(criterion2.id);

      expect(updatedCriterion1?.weight).toBeCloseTo(33.33, 1);
      expect(updatedCriterion2?.weight).toBeCloseTo(66.67, 1);
    });

    it('should reject weights for non-existent criteria', async () => {
      await expect(engine.updateWeights({
        'non-existent': 100
      })).rejects.toThrow('Criterion with id non-existent not found');
    });

    it('should reject negative weights', async () => {
      const criterion = await engine.addCriterion({
        name: 'Cost',
        type: 'cost' as CriterionType,
        weight: 50,
        scale: 'numeric' as ScaleType
      });

      await expect(engine.updateWeights({
        [criterion.id]: -10
      })).rejects.toThrow('must be between 0 and 100');
    });
  });

  describe('validateCriteria', () => {
    it('should validate a collection of valid criteria', () => {
      const criteria: Criterion[] = [
        {
          id: '1',
          name: 'Cost',
          type: 'cost',
          weight: 40,
          scale: 'numeric',
          scaleDefinition: { min: 0, max: 1000, unit: '$' }
        },
        {
          id: '2',
          name: 'Performance',
          type: 'performance',
          weight: 60,
          scale: 'ordinal',
          scaleDefinition: { labels: ['Low', 'Medium', 'High'] }
        }
      ];

      const result = engine.validateCriteria(criteria);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect weight sum errors', () => {
      const criteria: Criterion[] = [
        {
          id: '1',
          name: 'Cost',
          type: 'cost',
          weight: 40,
          scale: 'numeric'
        },
        {
          id: '2',
          name: 'Performance',
          type: 'performance',
          weight: 40,
          scale: 'numeric'
        }
      ];

      const result = engine.validateCriteria(criteria);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('sum to 100'))).toBe(true);
    });

    it('should warn about duplicate names', () => {
      const criteria: Criterion[] = [
        {
          id: '1',
          name: 'Cost',
          type: 'cost',
          weight: 50,
          scale: 'numeric'
        },
        {
          id: '2',
          name: 'cost', // Same name, different case
          type: 'performance',
          weight: 50,
          scale: 'numeric'
        }
      ];

      const result = engine.validateCriteria(criteria);
      expect(result.warnings.some(w => w.message.includes('Duplicate criterion names'))).toBe(true);
    });
  });

  describe('normalizeWeights', () => {
    it('should normalize weights to sum to 100', () => {
      const weights = { 'a': 20, 'b': 40 }; // Sum = 60
      const normalized = engine.normalizeWeights(weights);
      
      expect(normalized['a']).toBeCloseTo(33.33, 1);
      expect(normalized['b']).toBeCloseTo(66.67, 1);
      
      const sum = Object.values(normalized).reduce((acc, w) => acc + w, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('should handle zero weights by distributing equally', () => {
      const weights = { 'a': 0, 'b': 0, 'c': 0 };
      const normalized = engine.normalizeWeights(weights);
      
      expect(normalized['a']).toBeCloseTo(33.33, 1);
      expect(normalized['b']).toBeCloseTo(33.33, 1);
      expect(normalized['c']).toBeCloseTo(33.33, 1);
    });
  });

  describe('getCriterion and getAllCriteria', () => {
    it('should retrieve criterion by ID', async () => {
      const criterion = await engine.addCriterion({
        name: 'Cost',
        type: 'cost' as CriterionType,
        weight: 50,
        scale: 'numeric' as ScaleType
      });

      const retrieved = await engine.getCriterion(criterion.id);
      expect(retrieved).toEqual(criterion);
    });

    it('should return null for non-existent criterion', async () => {
      const retrieved = await engine.getCriterion('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should retrieve all criteria', async () => {
      await engine.addCriterion({
        name: 'Cost',
        type: 'cost' as CriterionType,
        weight: 30,
        scale: 'numeric' as ScaleType
      });

      await engine.addCriterion({
        name: 'Performance',
        type: 'performance' as CriterionType,
        weight: 70,
        scale: 'numeric' as ScaleType
      });

      const allCriteria = await engine.getAllCriteria();
      expect(allCriteria).toHaveLength(2);
    });
  });
});
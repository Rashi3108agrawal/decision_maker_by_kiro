import { Router } from 'express';
import { CriteriaEngine } from '../../services/CriteriaEngine';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest, commonSchemas } from '../middleware/validation';

const router = Router();
const criteriaEngine = new CriteriaEngine();

// GET /api/criteria - Get all criteria
router.get('/', asyncHandler(async (req, res) => {
  const criteria = await criteriaEngine.getAllCriteria();
  res.json({
    success: true,
    data: criteria,
    count: criteria.length
  });
}));

// GET /api/criteria/:id - Get criterion by ID
router.get('/:id', 
  validateRequest({
    params: { id: commonSchemas.id }
  }),
  asyncHandler(async (req, res) => {
    const criterion = await criteriaEngine.getCriterion(req.params.id);
    
    if (!criterion) {
      throw createError(`Criterion with id ${req.params.id} not found`, 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: criterion
    });
  })
);

// POST /api/criteria - Create new criterion
router.post('/',
  validateRequest({
    body: {
      name: commonSchemas.name,
      type: commonSchemas.criterionType,
      weight: commonSchemas.weight,
      scale: commonSchemas.scaleType,
      scaleDefinition: {
        type: 'object'
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { name, type, weight, scale, scaleDefinition } = req.body;
    
    const criterion = await criteriaEngine.addCriterion({
      name,
      type,
      weight,
      scale,
      scaleDefinition
    });

    res.status(201).json({
      success: true,
      data: criterion,
      message: 'Criterion created successfully'
    });
  })
);

// PUT /api/criteria/weights - Update weights for multiple criteria
router.put('/weights',
  validateRequest({
    body: {
      weights: {
        type: 'object',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { weights } = req.body;
    
    // Validate that all weights are numbers between 0 and 100
    for (const [criterionId, weight] of Object.entries(weights)) {
      if (typeof weight !== 'number' || weight < 0 || weight > 100) {
        throw createError(
          `Invalid weight for criterion ${criterionId}: must be a number between 0 and 100`,
          400,
          'VALIDATION_ERROR'
        );
      }
    }

    await criteriaEngine.updateWeights(weights as Record<string, number>);

    res.json({
      success: true,
      message: 'Weights updated successfully'
    });
  })
);

// POST /api/criteria/validate - Validate criteria collection
router.post('/validate',
  validateRequest({
    body: {
      criteria: {
        type: 'array',
        required: true,
        minItems: 1
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { criteria } = req.body;
    
    const validation = criteriaEngine.validateCriteria(criteria);

    res.json({
      success: true,
      data: validation
    });
  })
);

// POST /api/criteria/normalize-weights - Normalize weights
router.post('/normalize-weights',
  validateRequest({
    body: {
      weights: {
        type: 'object',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { weights } = req.body;
    
    const normalizedWeights = criteriaEngine.normalizeWeights(weights);

    res.json({
      success: true,
      data: {
        originalWeights: weights,
        normalizedWeights
      }
    });
  })
);

// GET /api/criteria/stats - Get criteria statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const criteria = await criteriaEngine.getAllCriteria();
  
  const stats = {
    totalCriteria: criteria.length,
    criteriaByType: criteria.reduce((acc, criterion) => {
      acc[criterion.type] = (acc[criterion.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    criteriaByScale: criteria.reduce((acc, criterion) => {
      acc[criterion.scale] = (acc[criterion.scale] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalWeight: criteria.reduce((sum, criterion) => sum + criterion.weight, 0),
    averageWeight: criteria.length > 0 
      ? criteria.reduce((sum, criterion) => sum + criterion.weight, 0) / criteria.length
      : 0
  };

  res.json({
    success: true,
    data: stats
  });
}));

export { router as criteriaRouter };
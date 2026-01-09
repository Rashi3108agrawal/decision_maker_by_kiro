import { Router } from 'express';
import { OptionManager } from '../../services/OptionManager';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest, commonSchemas } from '../middleware/validation';

const router = Router();
const optionManager = new OptionManager();

// GET /api/options - Get all options
router.get('/', asyncHandler(async (req, res) => {
  const options = await optionManager.getAllOptions();
  res.json({
    success: true,
    data: options,
    count: options.length
  });
}));

// GET /api/options/:id - Get option by ID
router.get('/:id', 
  validateRequest({
    params: { id: commonSchemas.id }
  }),
  asyncHandler(async (req, res) => {
    const option = await optionManager.getOption(req.params.id);
    
    if (!option) {
      throw createError(`Option with id ${req.params.id} not found`, 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: option
    });
  })
);

// POST /api/options - Create new option
router.post('/',
  validateRequest({
    body: {
      name: commonSchemas.name,
      type: commonSchemas.optionType,
      attributes: {
        type: 'object',
        required: true
      },
      metadata: {
        type: 'object'
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { name, type, attributes, metadata } = req.body;
    
    const option = await optionManager.addOption({
      name,
      type,
      attributes,
      metadata
    });

    res.status(201).json({
      success: true,
      data: option,
      message: 'Option created successfully'
    });
  })
);

// PUT /api/options/:id - Update option
router.put('/:id',
  validateRequest({
    params: { id: commonSchemas.id },
    body: {
      name: { ...commonSchemas.name, required: false },
      type: { ...commonSchemas.optionType, required: false },
      attributes: {
        type: 'object'
      },
      metadata: {
        type: 'object'
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const updates = req.body;
    
    const option = await optionManager.updateOption(req.params.id, updates);

    res.json({
      success: true,
      data: option,
      message: 'Option updated successfully'
    });
  })
);

// DELETE /api/options/:id - Delete option
router.delete('/:id',
  validateRequest({
    params: { id: commonSchemas.id }
  }),
  asyncHandler(async (req, res) => {
    await optionManager.removeOption(req.params.id);

    res.json({
      success: true,
      message: 'Option deleted successfully'
    });
  })
);

// POST /api/options/:id/validate - Validate option
router.post('/:id/validate',
  validateRequest({
    params: { id: commonSchemas.id }
  }),
  asyncHandler(async (req, res) => {
    const option = await optionManager.getOption(req.params.id);
    
    if (!option) {
      throw createError(`Option with id ${req.params.id} not found`, 404, 'NOT_FOUND');
    }

    const validation = optionManager.validateOption(option);

    res.json({
      success: true,
      data: validation
    });
  })
);

// GET /api/options/stats - Get options statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const options = await optionManager.getAllOptions();
  
  const stats = {
    totalOptions: options.length,
    optionsByType: options.reduce((acc, option) => {
      acc[option.type] = (acc[option.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averageAttributeCount: options.length > 0 
      ? options.reduce((sum, option) => sum + Object.keys(option.attributes).length, 0) / options.length
      : 0
  };

  res.json({
    success: true,
    data: stats
  });
}));

export { router as optionsRouter };
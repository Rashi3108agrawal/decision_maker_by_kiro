import { Router } from 'express';
import { TemplateManager } from '../../services/TemplateManager';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest, commonSchemas } from '../middleware/validation';

const router = Router();
const templateManager = new TemplateManager();

// GET /api/templates - Get all templates
router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  let templates;
  if (category && typeof category === 'string') {
    templates = await templateManager.getTemplatesByCategory(category);
  } else {
    templates = await templateManager.getAllTemplates();
  }

  res.json({
    success: true,
    data: templates,
    count: templates.length
  });
}));

// GET /api/templates/categories - Get available template categories
router.get('/categories', asyncHandler(async (req, res) => {
  const templates = await templateManager.getAllTemplates();
  const categories = [...new Set(templates.map(t => t.category))];

  res.json({
    success: true,
    data: categories
  });
}));

// GET /api/templates/:id - Get template by ID
router.get('/:id',
  validateRequest({
    params: { id: commonSchemas.id }
  }),
  asyncHandler(async (req, res) => {
    const template = await templateManager.getTemplate(req.params.id);
    
    if (!template) {
      throw createError(`Template with id ${req.params.id} not found`, 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: template
    });
  })
);

// POST /api/templates - Create new template
router.post('/',
  validateRequest({
    body: {
      name: commonSchemas.name,
      description: commonSchemas.description,
      category: {
        type: 'string',
        required: true,
        minLength: 1
      },
      defaultCriteria: {
        type: 'array',
        required: true,
        minItems: 1
      },
      sampleOptions: {
        type: 'array'
      },
      guidance: {
        type: 'array'
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { name, description, category, defaultCriteria, sampleOptions, guidance } = req.body;
    
    const template = await templateManager.createTemplate({
      name,
      description,
      category,
      defaultCriteria,
      sampleOptions,
      guidance
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  })
);

// PUT /api/templates/:id - Update template
router.put('/:id',
  validateRequest({
    params: { id: commonSchemas.id },
    body: {
      name: { ...commonSchemas.name, required: false },
      description: { ...commonSchemas.description, required: false },
      category: {
        type: 'string',
        minLength: 1
      },
      defaultCriteria: {
        type: 'array',
        minItems: 1
      },
      sampleOptions: {
        type: 'array'
      },
      guidance: {
        type: 'array'
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const updates = req.body;
    
    const template = await templateManager.updateTemplate(req.params.id, updates);

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });
  })
);

// DELETE /api/templates/:id - Delete template
router.delete('/:id',
  validateRequest({
    params: { id: commonSchemas.id }
  }),
  asyncHandler(async (req, res) => {
    await templateManager.deleteTemplate(req.params.id);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  })
);

// POST /api/templates/:id/apply - Apply template with customizations
router.post('/:id/apply',
  validateRequest({
    params: { id: commonSchemas.id },
    body: {
      criteriaWeights: {
        type: 'object'
      },
      additionalCriteria: {
        type: 'array'
      },
      excludedCriteria: {
        type: 'array'
      },
      customOptions: {
        type: 'array'
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const customizations = req.body;
    
    const application = await templateManager.applyTemplate(req.params.id, customizations);

    res.json({
      success: true,
      data: application,
      message: 'Template applied successfully'
    });
  })
);

// POST /api/templates/:id/validate - Validate template
router.post('/:id/validate',
  validateRequest({
    params: { id: commonSchemas.id }
  }),
  asyncHandler(async (req, res) => {
    const template = await templateManager.getTemplate(req.params.id);
    
    if (!template) {
      throw createError(`Template with id ${req.params.id} not found`, 404, 'NOT_FOUND');
    }

    const validation = templateManager.validateTemplate(template);

    res.json({
      success: true,
      data: validation
    });
  })
);

export { router as templatesRouter };
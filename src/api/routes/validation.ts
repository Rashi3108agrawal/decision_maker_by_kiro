import { Router } from 'express';
import { ValidationService } from '../../services/ValidationService';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validation';

const router = Router();
const validationService = new ValidationService();

// POST /api/validation/session - Validate complete comparison session
router.post('/session',
  validateRequest({
    body: {
      session: {
        type: 'object',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { session } = req.body;
    
    const validation = validationService.validateComparisonSession(session);

    res.json({
      success: true,
      data: validation
    });
  })
);

// POST /api/validation/analysis-readiness - Check if data is ready for analysis
router.post('/analysis-readiness',
  validateRequest({
    body: {
      options: {
        type: 'array',
        required: true,
        minItems: 2
      },
      criteria: {
        type: 'array',
        required: true,
        minItems: 1
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { options, criteria } = req.body;
    
    const validation = validationService.validateAnalysisReadiness(options, criteria);

    res.json({
      success: true,
      data: validation
    });
  })
);

// POST /api/validation/suggestions - Get improvement suggestions
router.post('/suggestions',
  validateRequest({
    body: {
      session: {
        type: 'object',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { session } = req.body;
    
    const suggestions = validationService.generateImprovementSuggestions(session);

    res.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length
      }
    });
  })
);

// POST /api/validation/quality-report - Get detailed quality report
router.post('/quality-report',
  validateRequest({
    body: {
      session: {
        type: 'object',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { session } = req.body;
    
    const validation = validationService.validateComparisonSession(session);
    const qualityReport = validation.qualityReport;

    res.json({
      success: true,
      data: qualityReport
    });
  })
);

// GET /api/validation/rules - Get validation rules documentation
router.get('/rules', asyncHandler(async (req, res) => {
  const rules = {
    session: {
      required_fields: ['name', 'options', 'criteria'],
      constraints: {
        options: 'Must have 2-10 options',
        criteria: 'Must have at least 1 criterion',
        weights: 'Criterion weights should sum to 100%'
      }
    },
    options: {
      required_fields: ['id', 'name', 'type', 'attributes'],
      constraints: {
        name: 'Must be 1-255 characters',
        type: 'Must be one of: api, cloud-service, tech-stack, tool, custom',
        attributes: 'Must be an object with relevant data'
      }
    },
    criteria: {
      required_fields: ['id', 'name', 'type', 'weight', 'scale'],
      constraints: {
        name: 'Must be 1-255 characters',
        type: 'Must be one of: cost, performance, scalability, ease-of-use, custom',
        weight: 'Must be 0-100',
        scale: 'Must be one of: numeric, ordinal, boolean'
      }
    },
    quality_scoring: {
      completeness: 'Percentage of filled data points',
      consistency: 'Uniformity of data types and formats',
      overall: 'Weighted combination of completeness and consistency'
    }
  };

  res.json({
    success: true,
    data: rules
  });
}));

export { router as validationRouter };
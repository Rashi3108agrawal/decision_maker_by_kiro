import { Router } from 'express';
import { AnalysisEngine } from '../../services/AnalysisEngine';
import { OptionManager } from '../../services/OptionManager';
import { CriteriaEngine } from '../../services/CriteriaEngine';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validation';

const router = Router();
const analysisEngine = new AnalysisEngine();
const optionManager = new OptionManager();
const criteriaEngine = new CriteriaEngine();

// POST /api/analysis/analyze - Perform complete analysis
router.post('/analyze',
  validateRequest({
    body: {
      options: {
        type: 'array',
        required: true,
        minItems: 2,
        maxItems: 10
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
    
    // Validate that options and criteria are properly formatted
    for (const option of options) {
      if (!option.id || !option.name || !option.attributes) {
        throw createError(
          'Invalid option format: each option must have id, name, and attributes',
          400,
          'VALIDATION_ERROR'
        );
      }
    }

    for (const criterion of criteria) {
      if (!criterion.id || !criterion.name || criterion.weight === undefined) {
        throw createError(
          'Invalid criterion format: each criterion must have id, name, and weight',
          400,
          'VALIDATION_ERROR'
        );
      }
    }

    const analysis = await analysisEngine.analyze(options, criteria);

    res.json({
      success: true,
      data: analysis,
      message: 'Analysis completed successfully'
    });
  })
);

// POST /api/analysis/scores - Calculate scores only
router.post('/scores',
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
    
    const scoreMatrix = analysisEngine.calculateScores(options, criteria);

    res.json({
      success: true,
      data: scoreMatrix
    });
  })
);

// POST /api/analysis/trade-offs - Identify trade-offs only
router.post('/trade-offs',
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
    
    const scoreMatrix = analysisEngine.calculateScores(options, criteria);
    const tradeOffs = analysisEngine.identifyTradeOffs(scoreMatrix, options, criteria);

    res.json({
      success: true,
      data: tradeOffs
    });
  })
);

// POST /api/analysis/recommendations - Generate recommendations only
router.post('/recommendations',
  validateRequest({
    body: {
      analysis: {
        type: 'object',
        required: true
      },
      options: {
        type: 'array',
        required: true
      },
      criteria: {
        type: 'array',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { analysis, options, criteria } = req.body;
    
    const recommendations = analysisEngine.generateRecommendations(analysis, options, criteria);

    res.json({
      success: true,
      data: recommendations
    });
  })
);

// POST /api/analysis/session - Analyze complete session
router.post('/session',
  validateRequest({
    body: {
      sessionId: {
        type: 'string'
      },
      name: {
        type: 'string',
        required: true
      },
      description: {
        type: 'string'
      },
      optionIds: {
        type: 'array',
        required: true,
        minItems: 2
      },
      criteriaIds: {
        type: 'array',
        required: true,
        minItems: 1
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { sessionId, name, description, optionIds, criteriaIds } = req.body;
    
    // Fetch options and criteria from their respective managers
    const options = [];
    for (const optionId of optionIds) {
      const option = await optionManager.getOption(optionId);
      if (!option) {
        throw createError(`Option with id ${optionId} not found`, 404, 'NOT_FOUND');
      }
      options.push(option);
    }

    const criteria = [];
    for (const criterionId of criteriaIds) {
      const criterion = await criteriaEngine.getCriterion(criterionId);
      if (!criterion) {
        throw createError(`Criterion with id ${criterionId} not found`, 404, 'NOT_FOUND');
      }
      criteria.push(criterion);
    }

    // Perform analysis
    const analysis = await analysisEngine.analyze(options, criteria);

    // Create session object
    const session = {
      id: sessionId || `session_${Date.now()}`,
      name,
      description,
      options,
      criteria,
      analysis,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: session,
      message: 'Session analysis completed successfully'
    });
  })
);

// GET /api/analysis/methods - Get available analysis methods
router.get('/methods', asyncHandler(async (req, res) => {
  const methods = {
    scoring: {
      name: 'Weighted Sum Model (WSM)',
      description: 'Calculates weighted scores for each option across all criteria',
      suitable_for: 'Most decision scenarios with quantifiable criteria'
    },
    ranking: {
      name: 'Score-based Ranking',
      description: 'Ranks options based on overall weighted scores',
      suitable_for: 'Identifying the best overall option'
    },
    trade_off_analysis: {
      name: 'Trade-off Analysis',
      description: 'Identifies winners and losers for each criterion with significance assessment',
      suitable_for: 'Understanding strengths and weaknesses of each option'
    },
    recommendations: {
      name: 'Contextual Recommendations',
      description: 'Provides recommendations with reasoning based on analysis results',
      suitable_for: 'Getting actionable insights and decision guidance'
    }
  };

  res.json({
    success: true,
    data: methods
  });
}));

export { router as analysisRouter };
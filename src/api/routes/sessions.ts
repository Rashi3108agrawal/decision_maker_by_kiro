import { Router } from 'express';
import { SessionManager } from '../../services/SessionManager';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const sessionManager = new SessionManager();

// GET /api/sessions - List all sessions
router.get('/', asyncHandler(async (req, res) => {
  const sessions = await sessionManager.listSessions();
  
  res.json({
    success: true,
    data: sessions,
    message: 'Sessions retrieved successfully'
  });
}));

// POST /api/sessions - Create new session
router.post('/',
  validateRequest({
    body: {
      name: {
        type: 'string',
        required: true,
        minLength: 1
      },
      description: {
        type: 'string',
        required: false
      },
      options: {
        type: 'array',
        required: false
      },
      criteria: {
        type: 'array',
        required: false
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { name, description, options = [], criteria = [] } = req.body;
    
    const session = await sessionManager.createSession(name, description, options, criteria);
    
    res.status(201).json({
      success: true,
      data: session,
      message: 'Session created successfully'
    });
  })
);

// GET /api/sessions/:id - Get specific session
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const session = await sessionManager.loadSession(id);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found',
      message: `Session with ID ${id} does not exist`
    });
  }
  
  res.json({
    success: true,
    data: session,
    message: 'Session retrieved successfully'
  });
}));

// PUT /api/sessions/:id - Update session
router.put('/:id',
  validateRequest({
    body: {
      name: {
        type: 'string',
        required: false,
        minLength: 1
      },
      description: {
        type: 'string',
        required: false
      },
      options: {
        type: 'array',
        required: false
      },
      criteria: {
        type: 'array',
        required: false
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    try {
      const session = await sessionManager.updateSession(id, updates);
      
      res.json({
        success: true,
        data: session,
        message: 'Session updated successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          message: error.message
        });
      }
      throw error;
    }
  })
);

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    await sessionManager.deleteSession(id);
    
    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        message: error.message
      });
    }
    throw error;
  }
}));

// POST /api/sessions/:id/duplicate - Duplicate session
router.post('/:id/duplicate',
  validateRequest({
    body: {
      name: {
        type: 'string',
        required: true,
        minLength: 1
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    try {
      const duplicatedSession = await sessionManager.duplicateSession(id, name);
      
      res.status(201).json({
        success: true,
        data: duplicatedSession,
        message: 'Session duplicated successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          message: error.message
        });
      }
      throw error;
    }
  })
);

// PUT /api/sessions/:id/options - Add/update options in session
router.put('/:id/options',
  validateRequest({
    body: {
      options: {
        type: 'array',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { options } = req.body;
    
    try {
      const session = await sessionManager.addOptionsToSession(id, options);
      
      res.json({
        success: true,
        data: session,
        message: 'Options updated in session successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          message: error.message
        });
      }
      throw error;
    }
  })
);

// DELETE /api/sessions/:id/options - Remove options from session
router.delete('/:id/options',
  validateRequest({
    body: {
      optionIds: {
        type: 'array',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { optionIds } = req.body;
    
    try {
      const session = await sessionManager.removeOptionsFromSession(id, optionIds);
      
      res.json({
        success: true,
        data: session,
        message: 'Options removed from session successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          message: error.message
        });
      }
      throw error;
    }
  })
);

// PUT /api/sessions/:id/criteria - Add/update criteria in session
router.put('/:id/criteria',
  validateRequest({
    body: {
      criteria: {
        type: 'array',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { criteria } = req.body;
    
    try {
      const session = await sessionManager.addCriteriaToSession(id, criteria);
      
      res.json({
        success: true,
        data: session,
        message: 'Criteria updated in session successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          message: error.message
        });
      }
      throw error;
    }
  })
);

// DELETE /api/sessions/:id/criteria - Remove criteria from session
router.delete('/:id/criteria',
  validateRequest({
    body: {
      criteriaIds: {
        type: 'array',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { criteriaIds } = req.body;
    
    try {
      const session = await sessionManager.removeCriteriaFromSession(id, criteriaIds);
      
      res.json({
        success: true,
        data: session,
        message: 'Criteria removed from session successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          message: error.message
        });
      }
      throw error;
    }
  })
);

// PUT /api/sessions/:id/analysis - Save analysis results to session
router.put('/:id/analysis',
  validateRequest({
    body: {
      analysis: {
        type: 'object',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { analysis } = req.body;
    
    try {
      const session = await sessionManager.saveAnalysisResults(id, analysis);
      
      res.json({
        success: true,
        data: session,
        message: 'Analysis results saved to session successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          message: error.message
        });
      }
      throw error;
    }
  })
);

export { router as sessionsRouter };
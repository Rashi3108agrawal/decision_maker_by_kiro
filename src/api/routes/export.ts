import { Router } from 'express';
import { ExportServiceImpl } from '../../services/ExportService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validation';

const router = Router();
const exportService = new ExportServiceImpl();

// POST /api/export/pdf - Generate PDF export
router.post('/pdf',
  validateRequest({
    body: {
      analysis: {
        type: 'object',
        required: true
      },
      options: {
        type: 'object'
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { analysis, options = {} } = req.body;
    
    try {
      const pdfBuffer = await exportService.generatePDF(analysis, options);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="decision-analysis.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      throw createError(
        `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'EXPORT_ERROR'
      );
    }
  })
);

// POST /api/export/markdown - Generate Markdown export
router.post('/markdown',
  validateRequest({
    body: {
      analysis: {
        type: 'object',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { analysis } = req.body;
    
    const markdown = exportService.generateMarkdown(analysis);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="decision-analysis.md"');
    
    res.send(markdown);
  })
);

// POST /api/export/json - Generate JSON export
router.post('/json',
  validateRequest({
    body: {
      analysis: {
        type: 'object',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { analysis } = req.body;
    
    const jsonExport = exportService.generateJSON(analysis);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="decision-analysis.json"');
    
    res.json({
      success: true,
      data: jsonExport
    });
  })
);

// POST /api/export/share - Create shareable link
router.post('/share',
  validateRequest({
    body: {
      comparisonId: {
        type: 'string',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { comparisonId } = req.body;
    
    const shareableLink = await exportService.createShareableLink(comparisonId);
    
    res.json({
      success: true,
      data: {
        shareableLink,
        comparisonId,
        createdAt: new Date().toISOString()
      },
      message: 'Shareable link created successfully'
    });
  })
);

// GET /api/export/shared/:shareableId - Get comparison by shareable link
router.get('/shared/:shareableId',
  validateRequest({
    params: {
      shareableId: {
        type: 'string',
        required: true
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { shareableId } = req.params;
    
    const comparisonId = exportService.getComparisonByShareableLink(shareableId);
    
    if (!comparisonId) {
      throw createError('Shareable link not found or expired', 404, 'NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: {
        comparisonId,
        shareableId
      }
    });
  })
);

// GET /api/export/formats - Get available export formats
router.get('/formats', asyncHandler(async (req, res) => {
  const formats = {
    pdf: {
      name: 'PDF',
      description: 'Professional report format suitable for presentations and documentation',
      mime_type: 'application/pdf',
      features: ['Visual formatting', 'Charts and tables', 'Professional layout']
    },
    markdown: {
      name: 'Markdown',
      description: 'Plain text format suitable for documentation and version control',
      mime_type: 'text/markdown',
      features: ['Human readable', 'Version control friendly', 'Easy to edit']
    },
    json: {
      name: 'JSON',
      description: 'Structured data format suitable for programmatic access and integration',
      mime_type: 'application/json',
      features: ['Machine readable', 'Complete data preservation', 'API integration']
    }
  };

  res.json({
    success: true,
    data: formats
  });
}));

// POST /api/export/batch - Export in multiple formats
router.post('/batch',
  validateRequest({
    body: {
      analysis: {
        type: 'object',
        required: true
      },
      formats: {
        type: 'array',
        required: true,
        minItems: 1
      },
      options: {
        type: 'object'
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { analysis, formats, options = {} } = req.body;
    
    const exports: Record<string, any> = {};
    
    for (const format of formats) {
      try {
        switch (format) {
          case 'pdf':
            exports.pdf = await exportService.generatePDF(analysis, options);
            break;
          case 'markdown':
            exports.markdown = exportService.generateMarkdown(analysis);
            break;
          case 'json':
            exports.json = exportService.generateJSON(analysis);
            break;
          default:
            throw new Error(`Unsupported format: ${format}`);
        }
      } catch (error) {
        exports[format] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    res.json({
      success: true,
      data: exports,
      message: 'Batch export completed'
    });
  })
);

export { router as exportRouter };
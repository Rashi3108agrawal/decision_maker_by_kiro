import request from 'supertest';
import { createServer } from './server';

describe('API Server', () => {
  const app = createServer();

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        version: '1.0.0'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: 'Route GET /unknown-route not found'
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/options')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Options API', () => {
    it('should get all options', async () => {
      const response = await request(app)
        .get('/api/options')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });

    it('should create a new option', async () => {
      const newOption = {
        name: 'Test API',
        type: 'api',
        attributes: {
          endpoint: 'https://api.test.com',
          cost: 50
        },
        metadata: {
          description: 'Test API for comparison'
        }
      };

      const response = await request(app)
        .post('/api/options')
        .send(newOption)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          name: 'Test API',
          type: 'api'
        }),
        message: 'Option created successfully'
      });
    });

    it('should validate option creation', async () => {
      const invalidOption = {
        name: '', // Invalid: empty name
        type: 'invalid-type', // Invalid: not in enum
        attributes: {} // Valid but empty
      };

      const response = await request(app)
        .post('/api/options')
        .send(invalidOption)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Criteria API', () => {
    it('should get all criteria', async () => {
      const response = await request(app)
        .get('/api/criteria')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });

    it('should create a new criterion', async () => {
      const newCriterion = {
        name: 'Performance',
        type: 'performance',
        weight: 25,
        scale: 'numeric',
        scaleDefinition: {
          min: 0,
          max: 100,
          unit: 'ms'
        }
      };

      const response = await request(app)
        .post('/api/criteria')
        .send(newCriterion)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          name: 'Performance',
          type: 'performance',
          weight: 25
        }),
        message: 'Criterion created successfully'
      });
    });
  });

  describe('Analysis API', () => {
    it('should get available analysis methods', async () => {
      const response = await request(app)
        .get('/api/analysis/methods')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          scoring: expect.any(Object),
          ranking: expect.any(Object),
          trade_off_analysis: expect.any(Object),
          recommendations: expect.any(Object)
        })
      });
    });

    it('should perform analysis with valid data', async () => {
      const analysisRequest = {
        options: [
          {
            id: 'opt1',
            name: 'Option 1',
            attributes: { performance: 80, cost: 100 }
          },
          {
            id: 'opt2',
            name: 'Option 2',
            attributes: { performance: 90, cost: 150 }
          }
        ],
        criteria: [
          {
            id: 'perf',
            name: 'Performance',
            type: 'performance',
            weight: 60,
            scale: 'numeric'
          },
          {
            id: 'cost',
            name: 'Cost',
            type: 'cost',
            weight: 40,
            scale: 'numeric'
          }
        ]
      };

      const response = await request(app)
        .post('/api/analysis/analyze')
        .send(analysisRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          scores: expect.any(Object),
          rankings: expect.any(Array),
          tradeOffs: expect.any(Array),
          recommendations: expect.any(Array),
          qualityScore: expect.any(Number)
        }),
        message: 'Analysis completed successfully'
      });
    });
  });

  describe('Templates API', () => {
    it('should get all templates', async () => {
      const response = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });

    it('should get template categories', async () => {
      const response = await request(app)
        .get('/api/templates/categories')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });
    });
  });

  describe('Validation API', () => {
    it('should get validation rules', async () => {
      const response = await request(app)
        .get('/api/validation/rules')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          session: expect.any(Object),
          options: expect.any(Object),
          criteria: expect.any(Object),
          quality_scoring: expect.any(Object)
        })
      });
    });
  });

  describe('Export API', () => {
    it('should get available export formats', async () => {
      const response = await request(app)
        .get('/api/export/formats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          pdf: expect.any(Object),
          markdown: expect.any(Object),
          json: expect.any(Object)
        })
      });
    });

    it('should generate markdown export', async () => {
      const analysisData = {
        analysis: {
          scores: { opt1: 85, opt2: 75 },
          rankings: [
            { optionId: 'opt1', optionName: 'Option 1', rank: 1, overallScore: 85 },
            { optionId: 'opt2', optionName: 'Option 2', rank: 2, overallScore: 75 }
          ],
          tradeOffs: [],
          recommendations: [],
          qualityScore: 90
        }
      };

      const response = await request(app)
        .post('/api/export/markdown')
        .send(analysisData)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/markdown; charset=utf-8');
      expect(response.text).toContain('# Decision Analysis Report');
    });
  });
});
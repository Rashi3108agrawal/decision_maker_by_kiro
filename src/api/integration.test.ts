import request from 'supertest';
import { createServer } from './server';

describe('API Integration Tests', () => {
  const app = createServer();
  let createdOptionId: string;
  let createdCriterionId: string;

  describe('Complete Workflow Integration', () => {
    it('should create options, criteria, and perform analysis', async () => {
      // Step 1: Create options
      const option1Response = await request(app)
        .post('/api/options')
        .send({
          name: 'API Option 1',
          type: 'api',
          attributes: {
            performance: 80,
            cost: 100,
            reliability: 95
          },
          metadata: {
            description: 'First API option for testing'
          }
        })
        .expect(201);

      const option2Response = await request(app)
        .post('/api/options')
        .send({
          name: 'API Option 2',
          type: 'api',
          attributes: {
            performance: 90,
            cost: 150,
            reliability: 98
          },
          metadata: {
            description: 'Second API option for testing'
          }
        })
        .expect(201);

      createdOptionId = option1Response.body.data.id;

      // Step 2: Create criteria
      const criterion1Response = await request(app)
        .post('/api/criteria')
        .send({
          name: 'Performance',
          type: 'performance',
          weight: 40,
          scale: 'numeric',
          scaleDefinition: {
            min: 0,
            max: 100,
            unit: 'score'
          }
        })
        .expect(201);

      const criterion2Response = await request(app)
        .post('/api/criteria')
        .send({
          name: 'Cost',
          type: 'cost',
          weight: 35,
          scale: 'numeric',
          scaleDefinition: {
            min: 0,
            max: 200,
            unit: '$'
          }
        })
        .expect(201);

      const criterion3Response = await request(app)
        .post('/api/criteria')
        .send({
          name: 'Reliability',
          type: 'performance',
          weight: 25,
          scale: 'numeric',
          scaleDefinition: {
            min: 0,
            max: 100,
            unit: '%'
          }
        })
        .expect(201);

      createdCriterionId = criterion1Response.body.data.id;

      // Step 3: Perform analysis
      const analysisResponse = await request(app)
        .post('/api/analysis/analyze')
        .send({
          options: [option1Response.body.data, option2Response.body.data],
          criteria: [
            criterion1Response.body.data,
            criterion2Response.body.data,
            criterion3Response.body.data
          ]
        })
        .expect(200);

      expect(analysisResponse.body.data).toMatchObject({
        scores: expect.any(Object),
        rankings: expect.arrayContaining([
          expect.objectContaining({
            optionId: expect.any(String),
            optionName: expect.any(String),
            rank: expect.any(Number),
            overallScore: expect.any(Number)
          })
        ]),
        tradeOffs: expect.any(Array),
        recommendations: expect.any(Array),
        qualityScore: expect.any(Number)
      });

      // Step 4: Export results
      const markdownExportResponse = await request(app)
        .post('/api/export/markdown')
        .send({ analysis: analysisResponse.body.data })
        .expect(200);

      expect(markdownExportResponse.text).toContain('# Decision Analysis Report');
      expect(markdownExportResponse.text).toContain('API Option 1');
      expect(markdownExportResponse.text).toContain('API Option 2');
    });

    it('should validate analysis readiness', async () => {
      const validationResponse = await request(app)
        .post('/api/validation/analysis-readiness')
        .send({
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
        })
        .expect(200);

      expect(validationResponse.body.data).toMatchObject({
        isValid: expect.any(Boolean),
        errors: expect.any(Array),
        warnings: expect.any(Array),
        qualityScore: expect.any(Number)
      });
    });

    it('should apply templates', async () => {
      // Get available templates
      const templatesResponse = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(templatesResponse.body.data.length).toBeGreaterThan(0);

      const template = templatesResponse.body.data[0];

      // Apply template
      const applicationResponse = await request(app)
        .post(`/api/templates/${template.id}/apply`)
        .send({
          criteriaWeights: {
            [template.defaultCriteria[0].id]: 50
          }
        })
        .expect(200);

      expect(applicationResponse.body.data).toMatchObject({
        criteria: expect.any(Array),
        sampleOptions: expect.any(Array),
        guidance: expect.any(Array),
        customizations: expect.any(Object)
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid analysis data gracefully', async () => {
      const response = await request(app)
        .post('/api/analysis/analyze')
        .send({
          options: [], // Invalid: empty array
          criteria: []  // Invalid: empty array
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle missing resources', async () => {
      const response = await request(app)
        .get('/api/options/non-existent-id')
        .expect(404);

      expect(response.body.error).toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('not found')
      });
    });
  });

  describe('Data Persistence', () => {
    it('should retrieve created option', async () => {
      if (!createdOptionId) {
        // Create an option first if not already created
        const createResponse = await request(app)
          .post('/api/options')
          .send({
            name: 'Test Option',
            type: 'api',
            attributes: { test: 'value' }
          })
          .expect(201);
        
        createdOptionId = createResponse.body.data.id;
      }

      const response = await request(app)
        .get(`/api/options/${createdOptionId}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: createdOptionId,
        name: expect.any(String),
        type: expect.any(String),
        attributes: expect.any(Object)
      });
    });

    it('should retrieve created criterion', async () => {
      if (!createdCriterionId) {
        // Create a criterion first if not already created
        const createResponse = await request(app)
          .post('/api/criteria')
          .send({
            name: 'Test Criterion',
            type: 'performance',
            weight: 50,
            scale: 'numeric'
          })
          .expect(201);
        
        createdCriterionId = createResponse.body.data.id;
      }

      const response = await request(app)
        .get(`/api/criteria/${createdCriterionId}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: createdCriterionId,
        name: expect.any(String),
        type: expect.any(String),
        weight: expect.any(Number),
        scale: expect.any(String)
      });
    });
  });
});
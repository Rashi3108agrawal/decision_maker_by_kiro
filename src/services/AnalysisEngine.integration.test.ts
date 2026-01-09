import { AnalysisEngine } from './AnalysisEngine';
import { Option, Criterion } from '../types/core';

describe('AnalysisEngine Integration', () => {
  it('should perform complete API comparison analysis', async () => {
    const analysisEngine = new AnalysisEngine();
    
    // Sample API comparison scenario
    const apiOptions: Option[] = [
      {
        id: 'stripe',
        name: 'Stripe API',
        type: 'api',
        attributes: {
          cost: 2.9, // percentage fee
          performance: 95, // response time score
          ease_of_use: 90, // developer experience score
          scalability: 95, // scalability score
          documentation: 95 // documentation quality score
        },
        metadata: {
          description: 'Popular payment processing API',
          tags: ['payments', 'fintech']
        }
      },
      {
        id: 'paypal',
        name: 'PayPal API',
        type: 'api',
        attributes: {
          cost: 3.5,
          performance: 85,
          ease_of_use: 75,
          scalability: 90,
          documentation: 80
        },
        metadata: {
          description: 'Established payment platform API',
          tags: ['payments', 'legacy']
        }
      },
      {
        id: 'square',
        name: 'Square API',
        type: 'api',
        attributes: {
          cost: 2.6,
          performance: 88,
          ease_of_use: 85,
          scalability: 85,
          documentation: 88
        },
        metadata: {
          description: 'Small business focused payment API',
          tags: ['payments', 'small-business']
        }
      }
    ];

    const criteria: Criterion[] = [
      {
        id: 'cost',
        name: 'Transaction Cost',
        type: 'cost',
        weight: 30,
        scale: 'numeric',
        scaleDefinition: { unit: '%' }
      },
      {
        id: 'performance',
        name: 'API Performance',
        type: 'performance',
        weight: 25,
        scale: 'numeric',
        scaleDefinition: { min: 0, max: 100 }
      },
      {
        id: 'ease_of_use',
        name: 'Developer Experience',
        type: 'ease-of-use',
        weight: 20,
        scale: 'numeric',
        scaleDefinition: { min: 0, max: 100 }
      },
      {
        id: 'scalability',
        name: 'Scalability',
        type: 'scalability',
        weight: 15,
        scale: 'numeric',
        scaleDefinition: { min: 0, max: 100 }
      },
      {
        id: 'documentation',
        name: 'Documentation Quality',
        type: 'custom',
        weight: 10,
        scale: 'numeric',
        scaleDefinition: { min: 0, max: 100 }
      }
    ];

    const result = await analysisEngine.analyze(apiOptions, criteria);

    // Verify analysis structure
    expect(result.scores).toHaveProperty('stripe');
    expect(result.scores).toHaveProperty('paypal');
    expect(result.scores).toHaveProperty('square');
    
    expect(result.rankings).toHaveLength(3);
    expect(result.tradeOffs.length).toBeGreaterThan(0);
    expect(result.recommendations).toHaveLength(3);
    expect(result.qualityScore).toBe(100); // All data complete

    // Verify rankings are properly ordered
    expect(result.rankings[0].rank).toBe(1);
    expect(result.rankings[1].rank).toBe(2);
    expect(result.rankings[2].rank).toBe(3);
    
    // Verify scores are in descending order
    expect(result.rankings[0].overallScore).toBeGreaterThanOrEqual(result.rankings[1].overallScore);
    expect(result.rankings[1].overallScore).toBeGreaterThanOrEqual(result.rankings[2].overallScore);

    // Verify trade-offs identify meaningful differences
    const costTradeOff = result.tradeOffs.find(t => t.criterionId === 'cost');
    expect(costTradeOff).toBeDefined();
    expect(costTradeOff?.winner.optionName).toBe('Square API'); // Lowest cost
    expect(costTradeOff?.loser.optionName).toBe('PayPal API'); // Highest cost

    const performanceTradeOff = result.tradeOffs.find(t => t.criterionId === 'performance');
    expect(performanceTradeOff).toBeDefined();
    expect(performanceTradeOff?.winner.optionName).toBe('Stripe API'); // Highest performance

    // Verify recommendations have meaningful content
    const topRecommendation = result.recommendations.find(r => r.rank === 1);
    expect(topRecommendation).toBeDefined();
    expect(topRecommendation?.strengths.length).toBeGreaterThan(0);
    expect(topRecommendation?.reasoning).toContain('Top recommendation');

    // Log results for manual verification
    console.log('\n=== API Comparison Analysis Results ===');
    console.log('\nRankings:');
    result.rankings.forEach(ranking => {
      console.log(`${ranking.rank}. ${ranking.optionName}: ${ranking.overallScore.toFixed(1)}/100`);
    });

    console.log('\nKey Trade-offs:');
    result.tradeOffs.slice(0, 3).forEach(tradeOff => {
      console.log(`${tradeOff.criterionName}: ${tradeOff.winner.optionName} beats ${tradeOff.loser.optionName} (${tradeOff.significance} significance)`);
    });

    console.log(`\nData Quality: ${result.qualityScore.toFixed(0)}%`);
  });
});
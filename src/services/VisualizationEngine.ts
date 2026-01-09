import { 
  Option, 
  Criterion, 
  ScoreMatrix, 
  TradeOffAnalysis, 
  Recommendation,
  AttributeValue
} from '../types/core';
import { 
  VisualizationEngine as IVisualizationEngine,
  MatrixCell,
  MatrixVisualizationConfig,
  ComparisonMatrix,
  MatrixComponent,
  ChartComponent,
  RecommendationComponent,
  SortDirection,
  PerformanceLevel
} from '../interfaces/VisualizationEngine';

export class VisualizationEngine implements IVisualizationEngine {

  /**
   * Creates a matrix component for displaying comparison data
   */
  renderMatrix(
    options: Option[], 
    criteria: Criterion[], 
    scores: ScoreMatrix, 
    config?: Partial<MatrixVisualizationConfig>
  ): MatrixComponent {
    const matrix = this.createComparisonMatrix(options, criteria, scores, config);
    return new MatrixComponentImpl(matrix, this);
  }

  /**
   * Creates a trade-off chart component
   */
  renderTradeOffChart(tradeOffs: TradeOffAnalysis[]): ChartComponent {
    return new ChartComponentImpl(tradeOffs);
  }

  /**
   * Creates a recommendations component
   */
  renderRecommendations(recommendations: Recommendation[]): RecommendationComponent {
    return new RecommendationComponentImpl(recommendations);
  }

  /**
   * Creates the core comparison matrix data structure
   */
  createComparisonMatrix(
    options: Option[], 
    criteria: Criterion[], 
    scores: ScoreMatrix, 
    config?: Partial<MatrixVisualizationConfig>
  ): ComparisonMatrix {
    const defaultConfig: MatrixVisualizationConfig = {
      showWeights: true,
      highlightBest: true,
      highlightWorst: false,
      sortDirection: 'desc',
      expandedCells: new Set<string>()
    };

    const visualConfig = { ...defaultConfig, ...config };
    
    // Create matrix cells
    const cells = this.createMatrixCells(options, criteria, scores);
    
    // Sort options based on configuration
    const sortedOptions = this.sortOptions(options, criteria, scores, visualConfig);
    
    return {
      options,
      criteria,
      scores,
      cells,
      visualConfig,
      sortedOptions
    };
  }

  /**
   * Creates matrix cells with performance indicators and display values
   */
  private createMatrixCells(
    options: Option[], 
    criteria: Criterion[], 
    scores: ScoreMatrix
  ): MatrixCell[][] {
    const cells: MatrixCell[][] = [];

    options.forEach((option, optionIndex) => {
      cells[optionIndex] = [];
      
      criteria.forEach((criterion, criterionIndex) => {
        const scoreData = scores[option.id]?.[criterion.id];
        
        if (scoreData) {
          const cell: MatrixCell = {
            optionId: option.id,
            criterionId: criterion.id,
            rawValue: scoreData.rawValue,
            normalizedScore: scoreData.normalizedScore,
            weightedScore: scoreData.weightedScore,
            performanceLevel: this.calculatePerformanceLevel(scoreData.normalizedScore),
            displayValue: this.formatDisplayValue(scoreData.rawValue, criterion),
            details: this.generateCellDetails(scoreData, criterion)
          };
          
          cells[optionIndex][criterionIndex] = cell;
        } else {
          // Handle missing data
          cells[optionIndex][criterionIndex] = {
            optionId: option.id,
            criterionId: criterion.id,
            rawValue: null,
            normalizedScore: 0,
            weightedScore: 0,
            performanceLevel: 'missing',
            displayValue: 'N/A',
            details: 'No data available for this criterion'
          };
        }
      });
    });

    return cells;
  }

  /**
   * Determines performance level based on normalized score
   */
  private calculatePerformanceLevel(normalizedScore: number): PerformanceLevel {
    if (normalizedScore >= 80) return 'excellent';
    if (normalizedScore >= 60) return 'good';
    if (normalizedScore >= 40) return 'average';
    if (normalizedScore > 0) return 'poor';
    return 'missing';
  }

  /**
   * Formats raw values for display based on criterion type and scale
   */
  private formatDisplayValue(rawValue: AttributeValue, criterion: Criterion): string {
    if (rawValue === null || rawValue === undefined) {
      return 'N/A';
    }

    switch (criterion.scale) {
      case 'numeric':
        if (typeof rawValue === 'number') {
          const unit = criterion.scaleDefinition?.unit || '';
          return `${rawValue.toLocaleString()}${unit}`;
        }
        return String(rawValue);
      
      case 'boolean':
        return rawValue === true ? '✓' : rawValue === false ? '✗' : 'N/A';
      
      case 'ordinal':
        return String(rawValue);
      
      default:
        return String(rawValue);
    }
  }

  /**
   * Generates detailed information for matrix cells
   */
  private generateCellDetails(scoreData: any, criterion: Criterion): string {
    const details = [];
    
    details.push(`Raw value: ${this.formatDisplayValue(scoreData.rawValue, criterion)}`);
    details.push(`Normalized score: ${scoreData.normalizedScore.toFixed(1)}/100`);
    details.push(`Weighted score: ${scoreData.weightedScore.toFixed(2)} (weight: ${criterion.weight}%)`);
    
    if (criterion.scaleDefinition?.unit) {
      details.push(`Unit: ${criterion.scaleDefinition.unit}`);
    }
    
    return details.join('\n');
  }

  /**
   * Sorts options based on the specified criterion or overall score
   */
  private sortOptions(
    options: Option[], 
    criteria: Criterion[], 
    scores: ScoreMatrix, 
    config: MatrixVisualizationConfig
  ): Option[] {
    const sortedOptions = [...options];

    if (config.sortBy === 'overall') {
      // Sort by overall weighted score
      const overallScores = this.calculateOverallScores(scores, criteria);
      sortedOptions.sort((a, b) => {
        const scoreA = overallScores[a.id] || 0;
        const scoreB = overallScores[b.id] || 0;
        return config.sortDirection === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
    } else if (config.sortBy) {
      // Sort by specific criterion
      sortedOptions.sort((a, b) => {
        const scoreA = scores[a.id]?.[config.sortBy!]?.normalizedScore || 0;
        const scoreB = scores[b.id]?.[config.sortBy!]?.normalizedScore || 0;
        return config.sortDirection === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
    }

    return sortedOptions;
  }

  /**
   * Updates the matrix display when weights change
   */
  updateMatrixWithNewWeights(
    matrix: ComparisonMatrix,
    updatedCriteria: Criterion[]
  ): ComparisonMatrix {
    // Recalculate scores with new weights
    const updatedScores = this.recalculateScoresWithNewWeights(
      matrix.scores,
      matrix.criteria,
      updatedCriteria
    );
    
    // Create new matrix with updated criteria and scores
    return this.createComparisonMatrix(
      matrix.options,
      updatedCriteria,
      updatedScores,
      matrix.visualConfig
    );
  }

  /**
   * Recalculates weighted scores when criteria weights change
   */
  private recalculateScoresWithNewWeights(
    originalScores: ScoreMatrix,
    originalCriteria: Criterion[],
    updatedCriteria: Criterion[]
  ): ScoreMatrix {
    const updatedScores: ScoreMatrix = {};
    
    // Create weight mapping
    const weightMap = new Map(updatedCriteria.map(c => [c.id, c.weight]));
    
    Object.keys(originalScores).forEach(optionId => {
      updatedScores[optionId] = {};
      
      Object.keys(originalScores[optionId]).forEach(criterionId => {
        const originalData = originalScores[optionId][criterionId];
        const newWeight = weightMap.get(criterionId) || 0;
        
        updatedScores[optionId][criterionId] = {
          ...originalData,
          weightedScore: (originalData.normalizedScore * newWeight) / 100
        };
      });
    });
    
    return updatedScores;
  }

  /**
   * Calculates overall scores for sorting purposes
   */
  private calculateOverallScores(scores: ScoreMatrix, criteria: Criterion[]): Record<string, number> {
    const overallScores: Record<string, number> = {};
    
    Object.keys(scores).forEach(optionId => {
      let totalWeightedScore = 0;
      let totalWeight = 0;
      
      criteria.forEach(criterion => {
        const scoreData = scores[optionId][criterion.id];
        if (scoreData) {
          totalWeightedScore += scoreData.weightedScore;
          totalWeight += criterion.weight;
        }
      });
      
      overallScores[optionId] = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
    });
    
    return overallScores;
  }
}

/**
 * Implementation of MatrixComponent
 */
class MatrixComponentImpl implements MatrixComponent {
  constructor(
    public matrix: ComparisonMatrix,
    private engine: VisualizationEngine
  ) {}

  render(): string {
    const { sortedOptions, criteria, cells, visualConfig } = this.matrix;
    
    let html = '<div class="comparison-matrix">';
    
    // Header row with enhanced weight display
    html += '<div class="matrix-header">';
    html += '<div class="matrix-cell header-cell option-header">Options</div>';
    
    criteria.forEach(criterion => {
      const weightDisplay = visualConfig.showWeights ? ` (${criterion.weight}%)` : '';
      const weightBarWidth = visualConfig.showWeights ? criterion.weight : 0;
      const weightClass = visualConfig.showWeights ? this.getWeightImportanceClass(criterion.weight) : '';
      
      html += `<div class="matrix-cell header-cell criterion-header ${weightClass}" data-criterion="${criterion.id}">
        <div class="criterion-name">${criterion.name}${weightDisplay}</div>
        ${visualConfig.showWeights ? `
          <div class="weight-indicator">
            <div class="weight-bar">
              <div class="weight-fill" style="width: ${weightBarWidth}%"></div>
            </div>
            <div class="weight-label">${criterion.weight}% importance</div>
          </div>
        ` : ''}
      </div>`;
    });
    
    html += '</div>';
    
    // Data rows with weight-influenced styling
    sortedOptions.forEach((option, optionIndex) => {
      const originalIndex = this.matrix.options.findIndex(o => o.id === option.id);
      html += '<div class="matrix-row">';
      html += `<div class="matrix-cell option-cell">${option.name}</div>`;
      
      criteria.forEach((criterion, criterionIndex) => {
        const cell = cells[originalIndex]?.[criterionIndex];
        if (cell) {
          const cellKey = `${option.id}-${criterion.id}`;
          const isExpanded = visualConfig.expandedCells.has(cellKey);
          const performanceClass = `performance-${cell.performanceLevel}`;
          const highlightClass = this.getHighlightClass(cell, criterionIndex, cells, visualConfig);
          const weightInfluenceClass = this.getWeightInfluenceClass(criterion.weight, cell.performanceLevel);
          
          html += `<div class="matrix-cell data-cell ${performanceClass} ${highlightClass} ${weightInfluenceClass}" 
                    data-option="${option.id}" 
                    data-criterion="${criterion.id}"
                    data-weight="${criterion.weight}"
                    title="${cell.details}">
            <div class="cell-value">${cell.displayValue}</div>
            <div class="cell-score">${cell.normalizedScore.toFixed(0)}</div>
            ${visualConfig.showWeights ? `
              <div class="weighted-contribution">
                ${cell.weightedScore.toFixed(1)} pts
              </div>
            ` : ''}
            ${isExpanded ? `<div class="cell-details">${cell.details}</div>` : ''}
          </div>`;
        }
      });
      
      html += '</div>';
    });
    
    html += '</div>';
    
    // Add CSS styles
    html += this.getMatrixStyles();
    
    return html;
  }

  sort(criterionId: string, direction?: SortDirection): ComparisonMatrix {
    const newConfig = {
      ...this.matrix.visualConfig,
      sortBy: criterionId,
      sortDirection: direction || (this.matrix.visualConfig.sortDirection === 'desc' ? 'asc' : 'desc')
    };
    
    return this.engine.createComparisonMatrix(
      this.matrix.options,
      this.matrix.criteria,
      this.matrix.scores,
      newConfig
    );
  }

  toggleCellDetails(optionId: string, criterionId: string): ComparisonMatrix {
    const cellKey = `${optionId}-${criterionId}`;
    const newExpandedCells = new Set(this.matrix.visualConfig.expandedCells);
    
    if (newExpandedCells.has(cellKey)) {
      newExpandedCells.delete(cellKey);
    } else {
      newExpandedCells.add(cellKey);
    }
    
    const newConfig = {
      ...this.matrix.visualConfig,
      expandedCells: newExpandedCells
    };
    
    return this.engine.createComparisonMatrix(
      this.matrix.options,
      this.matrix.criteria,
      this.matrix.scores,
      newConfig
    );
  }

  updateConfig(config: Partial<MatrixVisualizationConfig>): ComparisonMatrix {
    const newConfig = { ...this.matrix.visualConfig, ...config };
    
    return this.engine.createComparisonMatrix(
      this.matrix.options,
      this.matrix.criteria,
      this.matrix.scores,
      newConfig
    );
  }

  private getHighlightClass(
    cell: MatrixCell, 
    criterionIndex: number, 
    allCells: MatrixCell[][], 
    config: MatrixVisualizationConfig
  ): string {
    if (!config.highlightBest && !config.highlightWorst) {
      return '';
    }

    // Find best and worst scores for this criterion
    const criterionScores = allCells
      .map(row => row[criterionIndex])
      .filter(c => c && c.normalizedScore > 0)
      .map(c => c.normalizedScore);
    
    if (criterionScores.length === 0) return '';
    
    const maxScore = Math.max(...criterionScores);
    const minScore = Math.min(...criterionScores);
    
    if (config.highlightBest && cell.normalizedScore === maxScore) {
      return 'highlight-best';
    }
    
    if (config.highlightWorst && cell.normalizedScore === minScore && minScore < maxScore) {
      return 'highlight-worst';
    }
    
    return '';
  }

  private getWeightImportanceClass(weight: number): string {
    if (weight >= 30) return 'weight-high';
    if (weight >= 15) return 'weight-medium';
    return 'weight-low';
  }

  private getWeightInfluenceClass(weight: number, performanceLevel: PerformanceLevel): string {
    if (weight >= 25 && (performanceLevel === 'excellent' || performanceLevel === 'poor')) {
      return 'high-weight-impact';
    }
    return '';
  }

  private getMatrixStyles(): string {
    return `
      <style>
        .comparison-matrix {
          display: table;
          border-collapse: collapse;
          width: 100%;
          font-family: Arial, sans-serif;
          margin: 20px 0;
        }
        
        .matrix-header, .matrix-row {
          display: table-row;
        }
        
        .matrix-cell {
          display: table-cell;
          padding: 12px;
          border: 1px solid #ddd;
          text-align: center;
          vertical-align: middle;
        }
        
        .header-cell {
          background-color: #f5f5f5;
          font-weight: bold;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .criterion-header {
          min-width: 120px;
        }
        
        .criterion-name {
          margin-bottom: 8px;
        }
        
        .weight-indicator {
          margin-top: 5px;
        }
        
        .weight-bar {
          height: 4px;
          background-color: #e9ecef;
          border-radius: 2px;
          margin-bottom: 3px;
          overflow: hidden;
        }
        
        .weight-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
          transition: width 0.3s ease;
        }
        
        .weight-label {
          font-size: 0.7em;
          color: #666;
        }
        
        .weight-high {
          border-left: 3px solid #dc3545;
        }
        
        .weight-medium {
          border-left: 3px solid #ffc107;
        }
        
        .weight-low {
          border-left: 3px solid #28a745;
        }
        
        .option-cell {
          background-color: #f9f9f9;
          font-weight: bold;
          text-align: left;
          position: sticky;
          left: 0;
          z-index: 5;
        }
        
        .data-cell {
          position: relative;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .data-cell:hover {
          background-color: #f0f0f0;
          transform: scale(1.02);
        }
        
        .cell-value {
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .cell-score {
          font-size: 0.8em;
          color: #666;
        }
        
        .weighted-contribution {
          font-size: 0.7em;
          color: #007bff;
          font-weight: bold;
          margin-top: 2px;
        }
        
        .high-weight-impact {
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.3);
          border-color: #007bff !important;
        }
        
        .cell-details {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ccc;
          padding: 8px;
          font-size: 0.8em;
          text-align: left;
          white-space: pre-line;
          z-index: 20;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .performance-excellent { background-color: #d4edda; }
        .performance-good { background-color: #d1ecf1; }
        .performance-average { background-color: #fff3cd; }
        .performance-poor { background-color: #f8d7da; }
        .performance-missing { background-color: #e2e3e5; color: #6c757d; }
        
        .highlight-best { 
          background-color: #28a745 !important; 
          color: white;
        }
        
        .highlight-worst { 
          background-color: #dc3545 !important; 
          color: white;
        }
        
        /* Weight-based visual emphasis */
        .weight-high .criterion-name {
          color: #dc3545;
          font-size: 1.1em;
        }
        
        .weight-medium .criterion-name {
          color: #ffc107;
        }
        
        .weight-low .criterion-name {
          color: #28a745;
        }
      </style>
    `;
  }
}

/**
 * Implementation of ChartComponent
 */
class ChartComponentImpl implements ChartComponent {
  constructor(public tradeOffs: TradeOffAnalysis[]) {}

  render(): string {
    if (this.tradeOffs.length === 0) {
      return '<div class="trade-off-chart">No trade-offs to display</div>';
    }

    let html = '<div class="trade-off-chart">';
    html += '<h3>Trade-off Analysis</h3>';
    
    this.tradeOffs.forEach(tradeOff => {
      const significanceClass = `significance-${tradeOff.significance}`;
      
      html += `<div class="trade-off-item ${significanceClass}">
        <div class="trade-off-header">
          <h4>${tradeOff.criterionName}</h4>
          <span class="significance-badge ${significanceClass}">${tradeOff.significance}</span>
        </div>
        
        <div class="trade-off-comparison">
          <div class="winner">
            <div class="label">Winner</div>
            <div class="option-name">${tradeOff.winner.optionName}</div>
            <div class="score">${tradeOff.winner.score.toFixed(1)}</div>
          </div>
          
          <div class="gap-indicator">
            <div class="gap-bar">
              <div class="gap-fill" style="width: ${Math.min(tradeOff.gap, 100)}%"></div>
            </div>
            <div class="gap-value">${tradeOff.gap.toFixed(1)}% gap</div>
          </div>
          
          <div class="loser">
            <div class="label">Needs Improvement</div>
            <div class="option-name">${tradeOff.loser.optionName}</div>
            <div class="score">${tradeOff.loser.score.toFixed(1)}</div>
          </div>
        </div>
      </div>`;
    });
    
    html += '</div>';
    html += this.getChartStyles();
    
    return html;
  }

  private getChartStyles(): string {
    return `
      <style>
        .trade-off-chart {
          margin: 20px 0;
          font-family: Arial, sans-serif;
        }
        
        .trade-off-item {
          margin-bottom: 20px;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #ccc;
        }
        
        .trade-off-item.significance-high {
          border-left-color: #dc3545;
          background-color: #f8f9fa;
        }
        
        .trade-off-item.significance-medium {
          border-left-color: #ffc107;
          background-color: #fffbf0;
        }
        
        .trade-off-item.significance-low {
          border-left-color: #28a745;
          background-color: #f8fff9;
        }
        
        .trade-off-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .trade-off-header h4 {
          margin: 0;
          color: #333;
        }
        
        .significance-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .significance-badge.significance-high {
          background-color: #dc3545;
          color: white;
        }
        
        .significance-badge.significance-medium {
          background-color: #ffc107;
          color: #333;
        }
        
        .significance-badge.significance-low {
          background-color: #28a745;
          color: white;
        }
        
        .trade-off-comparison {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .winner, .loser {
          flex: 1;
          text-align: center;
        }
        
        .label {
          font-size: 0.8em;
          color: #666;
          margin-bottom: 5px;
        }
        
        .option-name {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .score {
          font-size: 1.2em;
          color: #333;
        }
        
        .gap-indicator {
          flex: 2;
          text-align: center;
        }
        
        .gap-bar {
          height: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          margin-bottom: 5px;
          overflow: hidden;
        }
        
        .gap-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
          transition: width 0.3s ease;
        }
        
        .gap-value {
          font-size: 0.9em;
          color: #666;
        }
      </style>
    `;
  }
}

/**
 * Implementation of RecommendationComponent
 */
class RecommendationComponentImpl implements RecommendationComponent {
  constructor(public recommendations: Recommendation[]) {}

  render(): string {
    if (this.recommendations.length === 0) {
      return '<div class="recommendations">No recommendations available</div>';
    }

    let html = '<div class="recommendations">';
    html += '<h3>Recommendations</h3>';
    
    this.recommendations.forEach((rec, index) => {
      const rankClass = `rank-${rec.rank}`;
      const medalIcon = this.getMedalIcon(rec.rank);
      
      html += `<div class="recommendation-item ${rankClass}">
        <div class="recommendation-header">
          <div class="rank-info">
            ${medalIcon}
            <span class="rank-number">#${rec.rank}</span>
            <h4 class="option-name">${rec.optionName}</h4>
          </div>
          <div class="overall-score">${rec.overallScore.toFixed(1)}/100</div>
        </div>
        
        <div class="recommendation-content">
          <p class="reasoning">${rec.reasoning}</p>
          
          ${rec.strengths.length > 0 ? `
            <div class="strengths">
              <strong>Strengths:</strong>
              <ul>
                ${rec.strengths.map(strength => `<li>${strength}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${rec.weaknesses.length > 0 ? `
            <div class="weaknesses">
              <strong>Areas for consideration:</strong>
              <ul>
                ${rec.weaknesses.map(weakness => `<li>${weakness}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${rec.bestFor.length > 0 ? `
            <div class="best-for">
              <strong>Best for:</strong>
              <ul>
                ${rec.bestFor.map(scenario => `<li>${scenario}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>`;
    });
    
    html += '</div>';
    html += this.getRecommendationStyles();
    
    return html;
  }

  private getMedalIcon(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '📊';
    }
  }

  private getRecommendationStyles(): string {
    return `
      <style>
        .recommendations {
          margin: 20px 0;
          font-family: Arial, sans-serif;
        }
        
        .recommendation-item {
          margin-bottom: 20px;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #e9ecef;
          background-color: white;
        }
        
        .recommendation-item.rank-1 {
          border-color: #ffd700;
          background-color: #fffef7;
        }
        
        .recommendation-item.rank-2 {
          border-color: #c0c0c0;
          background-color: #fafafa;
        }
        
        .recommendation-item.rank-3 {
          border-color: #cd7f32;
          background-color: #faf8f5;
        }
        
        .recommendation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .rank-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .rank-number {
          font-size: 1.2em;
          font-weight: bold;
          color: #666;
        }
        
        .option-name {
          margin: 0;
          color: #333;
        }
        
        .overall-score {
          font-size: 1.5em;
          font-weight: bold;
          color: #28a745;
          background-color: #f8f9fa;
          padding: 8px 12px;
          border-radius: 6px;
        }
        
        .reasoning {
          margin-bottom: 15px;
          color: #555;
          line-height: 1.5;
        }
        
        .strengths, .weaknesses, .best-for {
          margin-bottom: 10px;
        }
        
        .strengths strong {
          color: #28a745;
        }
        
        .weaknesses strong {
          color: #dc3545;
        }
        
        .best-for strong {
          color: #007bff;
        }
        
        .strengths ul, .weaknesses ul, .best-for ul {
          margin: 5px 0 0 20px;
          padding: 0;
        }
        
        .strengths li, .weaknesses li, .best-for li {
          margin-bottom: 3px;
        }
      </style>
    `;
  }
}
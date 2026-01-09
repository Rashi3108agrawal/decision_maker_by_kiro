import { ExportService } from '../interfaces/ExportService';
import { AnalysisResult, ExportOptions, ComparisonExport, ComparisonSession } from '../types/core';
import * as fs from 'fs/promises';
import * as path from 'path';

// Simple UUID v4 generator to avoid ES module issues in Jest
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class ExportServiceImpl implements ExportService {
  private shareableLinks: Map<string, string> = new Map();

  async generatePDF(analysis: AnalysisResult, options: ExportOptions = {}): Promise<Buffer> {
    try {
      // For now, we'll use a simple approach with puppeteer to generate PDF from HTML
      const puppeteer = require('puppeteer');
      
      const htmlContent = this.generateHTMLReport(analysis, options);
      
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      await browser.close();
      
      return Buffer.from(pdfBuffer);
    } catch (error) {
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  generateMarkdown(analysis: AnalysisResult): string {
    const lines: string[] = [];
    
    // Header
    lines.push('# Decision Analysis Report');
    lines.push('');
    lines.push(`Generated on: ${new Date().toISOString()}`);
    lines.push(`Quality Score: ${analysis.qualityScore}/100`);
    lines.push('');
    
    // Rankings
    lines.push('## Rankings');
    lines.push('');
    lines.push('| Rank | Option | Overall Score |');
    lines.push('|------|--------|---------------|');
    
    analysis.rankings.forEach(ranking => {
      lines.push(`| ${ranking.rank} | ${ranking.optionName} | ${ranking.overallScore.toFixed(2)} |`);
    });
    lines.push('');
    
    // Recommendations
    lines.push('## Recommendations');
    lines.push('');
    
    analysis.recommendations.forEach((rec, index) => {
      lines.push(`### ${index + 1}. ${rec.optionName} (Rank ${rec.rank})`);
      lines.push('');
      lines.push(`**Overall Score:** ${rec.overallScore.toFixed(2)}`);
      lines.push('');
      
      if (rec.strengths.length > 0) {
        lines.push('**Strengths:**');
        rec.strengths.forEach(strength => lines.push(`- ${strength}`));
        lines.push('');
      }
      
      if (rec.weaknesses.length > 0) {
        lines.push('**Weaknesses:**');
        rec.weaknesses.forEach(weakness => lines.push(`- ${weakness}`));
        lines.push('');
      }
      
      if (rec.bestFor.length > 0) {
        lines.push('**Best For:**');
        rec.bestFor.forEach(scenario => lines.push(`- ${scenario}`));
        lines.push('');
      }
      
      lines.push(`**Reasoning:** ${rec.reasoning}`);
      lines.push('');
    });
    
    // Trade-offs
    lines.push('## Trade-off Analysis');
    lines.push('');
    
    analysis.tradeOffs.forEach(tradeOff => {
      lines.push(`### ${tradeOff.criterionName}`);
      lines.push('');
      lines.push(`**Winner:** ${tradeOff.winner.optionName} (${tradeOff.winner.score.toFixed(2)})`);
      lines.push(`**Loser:** ${tradeOff.loser.optionName} (${tradeOff.loser.score.toFixed(2)})`);
      lines.push(`**Gap:** ${tradeOff.gap.toFixed(1)}% (${tradeOff.significance} significance)`);
      lines.push('');
    });
    
    // Detailed Scores
    lines.push('## Detailed Scores');
    lines.push('');
    lines.push('| Option | Overall Score |');
    lines.push('|--------|---------------|');
    
    Object.entries(analysis.scores).forEach(([optionId, score]) => {
      const ranking = analysis.rankings.find(r => r.optionId === optionId);
      const optionName = ranking?.optionName || optionId;
      lines.push(`| ${optionName} | ${score.toFixed(2)} |`);
    });
    
    return lines.join('\n');
  }

  generateJSON(analysis: AnalysisResult): ComparisonExport {
    // Create a mock session for the export since we don't have access to the full session
    const mockSession: ComparisonSession = {
      id: generateId(),
      name: 'Decision Analysis',
      description: 'Exported analysis results',
      options: [],
      criteria: [],
      analysis,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      session: mockSession,
      analysis,
      exportedAt: new Date(),
      version: '1.0.0'
    };
  }

  async createShareableLink(comparisonId: string): Promise<string> {
    // Generate a unique shareable ID
    const shareableId = generateId();
    
    // Store the mapping (in a real implementation, this would be persisted to a database)
    this.shareableLinks.set(shareableId, comparisonId);
    
    // Return a shareable URL (in a real implementation, this would be a proper URL)
    return `https://decision-helper.app/shared/${shareableId}`;
  }

  // Helper method to get comparison by shareable link
  getComparisonByShareableLink(shareableId: string): string | undefined {
    return this.shareableLinks.get(shareableId);
  }

  private generateHTMLReport(analysis: AnalysisResult, options: ExportOptions): string {
    const includeRawData = options.includeRawData ?? true;
    const format = options.format ?? 'detailed';
    
    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Decision Analysis Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .quality-score {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #007bff;
            color: white;
        }
        .recommendation {
            background: #f8f9fa;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .trade-off {
            background: #fff3cd;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
        }
        .significance-high { color: #dc3545; font-weight: bold; }
        .significance-medium { color: #fd7e14; font-weight: bold; }
        .significance-low { color: #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Decision Analysis Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="quality-score">
        <strong>Analysis Quality Score: ${analysis.qualityScore}/100</strong>
    </div>
`;

    // Rankings table
    html += `
    <h2>Rankings</h2>
    <table>
        <thead>
            <tr>
                <th>Rank</th>
                <th>Option</th>
                <th>Overall Score</th>
            </tr>
        </thead>
        <tbody>
`;

    analysis.rankings.forEach(ranking => {
      html += `
            <tr>
                <td>${ranking.rank}</td>
                <td>${ranking.optionName}</td>
                <td>${ranking.overallScore.toFixed(2)}</td>
            </tr>
`;
    });

    html += `
        </tbody>
    </table>
`;

    // Recommendations
    if (format === 'detailed') {
      html += `<h2>Recommendations</h2>`;
      
      analysis.recommendations.forEach((rec, index) => {
        html += `
        <div class="recommendation">
            <h3>${index + 1}. ${rec.optionName} (Rank ${rec.rank})</h3>
            <p><strong>Overall Score:</strong> ${rec.overallScore.toFixed(2)}</p>
`;

        if (rec.strengths.length > 0) {
          html += `<p><strong>Strengths:</strong></p><ul>`;
          rec.strengths.forEach(strength => html += `<li>${strength}</li>`);
          html += `</ul>`;
        }

        if (rec.weaknesses.length > 0) {
          html += `<p><strong>Weaknesses:</strong></p><ul>`;
          rec.weaknesses.forEach(weakness => html += `<li>${weakness}</li>`);
          html += `</ul>`;
        }

        if (rec.bestFor.length > 0) {
          html += `<p><strong>Best For:</strong></p><ul>`;
          rec.bestFor.forEach(scenario => html += `<li>${scenario}</li>`);
          html += `</ul>`;
        }

        html += `<p><strong>Reasoning:</strong> ${rec.reasoning}</p>`;
        html += `</div>`;
      });

      // Trade-offs
      html += `<h2>Trade-off Analysis</h2>`;
      
      analysis.tradeOffs.forEach(tradeOff => {
        html += `
        <div class="trade-off">
            <h3>${tradeOff.criterionName}</h3>
            <p><strong>Winner:</strong> ${tradeOff.winner.optionName} (${tradeOff.winner.score.toFixed(2)})</p>
            <p><strong>Loser:</strong> ${tradeOff.loser.optionName} (${tradeOff.loser.score.toFixed(2)})</p>
            <p><strong>Gap:</strong> ${tradeOff.gap.toFixed(1)}% 
               <span class="significance-${tradeOff.significance}">(${tradeOff.significance} significance)</span>
            </p>
        </div>
`;
      });
    }

    // Raw data if requested
    if (includeRawData) {
      html += `
      <h2>Detailed Scores</h2>
      <table>
          <thead>
              <tr>
                  <th>Option</th>
                  <th>Overall Score</th>
              </tr>
          </thead>
          <tbody>
`;

      Object.entries(analysis.scores).forEach(([optionId, score]) => {
        const ranking = analysis.rankings.find(r => r.optionId === optionId);
        const optionName = ranking?.optionName || optionId;
        html += `
              <tr>
                  <td>${optionName}</td>
                  <td>${score.toFixed(2)}</td>
              </tr>
`;
      });

      html += `
          </tbody>
      </table>
`;
    }

    html += `
</body>
</html>
`;

    return html;
  }
}
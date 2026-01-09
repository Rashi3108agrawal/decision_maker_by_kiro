import { AnalysisResult, ExportOptions, ComparisonExport } from '../types/core';

export interface ExportService {
  generatePDF(analysis: AnalysisResult, options: ExportOptions): Promise<Buffer>;
  generateMarkdown(analysis: AnalysisResult): string;
  generateJSON(analysis: AnalysisResult): ComparisonExport;
  createShareableLink(comparisonId: string): Promise<string>;
}
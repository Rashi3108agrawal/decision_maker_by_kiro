// Main entry point for the Decision Helper Tool

// Export all core types
export * from './types/core';

// Export all interfaces
export * from './interfaces/OptionManager';
export * from './interfaces/CriteriaEngine';
export * from './interfaces/AnalysisEngine';
export * from './interfaces/ExportService';

// Export all services
export { OptionManager } from './services/OptionManager';
export { ExportServiceImpl } from './services/ExportService';

// Version information
export const VERSION = '1.0.0';

console.log('Decision Helper Tool - Core Types and Interfaces Loaded');
console.log(`Version: ${VERSION}`);
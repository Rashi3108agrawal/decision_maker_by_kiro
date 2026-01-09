// Jest setup file for property-based testing configuration
import fc from 'fast-check';

// Configure fast-check for consistent property-based testing
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test
  verbose: true,
  seed: 42, // Fixed seed for reproducible tests during development
});

// Global test utilities can be added here
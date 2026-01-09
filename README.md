# Decision Helper Tool

A Multi-Criteria Decision Analysis (MCDA) tool for comparing options and understanding trade-offs systematically.

## Project Structure

```
src/
├── types/
│   └── core.ts              # Core type definitions
├── interfaces/
│   ├── OptionManager.ts     # Option management interface
│   ├── CriteriaEngine.ts    # Criteria management interface
│   ├── AnalysisEngine.ts    # Analysis engine interface
│   └── ExportService.ts     # Export service interface
├── utils/
│   └── validation.ts        # Validation utilities
├── test-setup.ts           # Jest and fast-check configuration
└── index.ts                # Main entry point
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```

## Testing

This project uses Jest for unit testing and fast-check for property-based testing. All property-based tests are configured to run a minimum of 100 iterations to ensure comprehensive coverage.

## Requirements Coverage

This initial setup addresses the following requirements:
- **1.1**: Core data structures for option storage
- **1.2**: Validation interfaces and utilities
- **2.1**: Constraint and criteria type definitions
- **2.4**: Weight validation utilities
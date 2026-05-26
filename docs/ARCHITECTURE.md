# 🏗️ Architecture Documentation

## System Overview

Decision Maker by Kiro is a three-tier application with a **modular, interface-driven architecture** designed for scalability, testability, and maintainability.

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer (React)                         │
│                 - Web interface for users                    │
│                 - Components for options, criteria, results   │
└────────────────────┬──────────────────────────────────────────┘
                     │ HTTP/JSON
┌────────────────────▼──────────────────────────────────────────┐
│                   API Layer (Express.js)                      │
│  - REST endpoints for all operations                         │
│  - Authentication & validation middleware                    │
│  - Error handling & response formatting                      │
└────────────────────┬──────────────────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────────────────┐
│              Business Logic Layer (Services)                  │
│  - OptionManager: Create, read, update, delete options       │
│  - CriteriaEngine: Manage weighted decision criteria          │
│  - AnalysisEngine: Calculate scores & trade-offs             │
│  - ExportService: Generate reports (PDF, JSON, MD)           │
│  - ValidationService: Data quality & readiness checks        │
└────────────────────┬──────────────────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────────────────┐
│           Core Layer (Types & Interfaces)                    │
│  - Type definitions (Option, Criterion, Analysis, etc)       │
│  - Interface contracts for all services                      │
│  - Validation utilities & helper functions                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Descriptions

### 🎨 UI Layer (`src/ui/`)

**Purpose:** User-facing web application built with React.

**Key Components:**
- **Option Manager UI** - Add, edit, remove decision options
- **Criteria Panel** - Define and weight decision criteria
- **Analysis Dashboard** - View scores, rankings, trade-offs
- **Export Panel** - Generate and download reports
- **Template Browser** - Browse and apply decision templates

**Technology:**
- React 18.2
- Responsive design
- Real-time validation feedback

---

### 🔌 API Layer (`src/api/`)

**Purpose:** RESTful interface for all application functionality.

**Key Responsibilities:**
- Route HTTP requests to appropriate services
- Validate incoming data
- Format and normalize responses
- Handle errors gracefully
- Enforce security policies

**Structure:**
```
src/api/
├── index.ts              # Server initialization
├── routes/
│   ├── options.ts        # Option CRUD endpoints
│   ├── criteria.ts       # Criteria management endpoints
│   ├── analysis.ts       # Analysis endpoints
│   ├── export.ts         # Export endpoints
│   ├── templates.ts      # Template endpoints
│   └── validation.ts     # Validation endpoints
├── middleware/
│   ├── auth.ts           # Authentication
│   ├── validation.ts     # Input validation
│   └── errorHandler.ts   # Error handling
└── README.md             # API documentation
```

**Response Format:**
```json
{
  "success": true,
  "data": { /* results */ },
  "error": null,
  "timestamp": "2026-01-08T18:30:19.236Z"
}
```

**Error Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Weights must sum to 100",
    "timestamp": "2026-01-08T18:30:19.236Z",
    "path": "/api/criteria/validate"
  }
}
```

---

### 🧠 Business Logic Layer (`src/services/`)

**Purpose:** Core decision analysis and data management logic.

#### **OptionManager**
Handles CRUD operations for decision options.

```typescript
interface Option {
  id: string;
  name: string;
  type: string;
  attributes: Record<string, number | string>;
  metadata?: {
    description?: string;
    source?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Operations:**
- Create new options with attributes
- Retrieve options by ID or list all
- Update option details
- Delete options
- Validate option completeness

#### **CriteriaEngine**
Manages weighted decision criteria.

```typescript
interface Criterion {
  id: string;
  name: string;
  type: string;
  weight: number;           // 0-100
  scale: "numeric" | "categorical" | "boolean";
  scaleDefinition: {
    min?: number;
    max?: number;
    unit?: string;
    categories?: string[];
  };
  metadata?: {
    description?: string;
    importance?: "high" | "medium" | "low";
  };
}
```

**Operations:**
- Add/remove criteria
- Set and normalize weights (must sum to 100)
- Validate criteria consistency
- Calculate weight distributions

#### **AnalysisEngine**
Performs Multi-Criteria Decision Analysis.

**Scoring Algorithm:**
```
For each option:
  Score = Σ(criterion.weight × normalized_option_value) / 100
  
Where normalized_option_value is the option's attribute
scaled to the criterion's scale range [0,100]
```

**Analysis Output:**
```typescript
interface AnalysisResult {
  scores: Record<string, number>;           // Option ID → score
  rankings: Array<{
    rank: number;
    optionId: string;
    optionName: string;
    score: number;
    percentOfBest: number;
  }>;
  tradeOffs: Array<{
    option1Id: string;
    option2Id: string;
    advantage: string;
    disadvantage: string;
    criterionId: string;
  }>;
  sensitivity: Record<string, Array<{ /* impact analysis */ }>>;
  recommendations: string[];
}
```

**Operations:**
- Calculate weighted scores for all options
- Generate rankings
- Identify trade-offs between criteria
- Perform sensitivity analysis
- Generate recommendations

#### **ExportService**
Generates reports in multiple formats.

**Supported Formats:**
- **PDF** - Professional report with formatting (via Puppeteer)
- **Markdown** - Machine-readable with tables and sections
- **JSON** - Complete data export for archiving
- **Shareable Link** - Creates temporary link to share analysis

---

### 📦 Core Layer (`src/types/`, `src/interfaces/`, `src/utils/`)

**Purpose:** Type definitions, contracts, and utility functions.

#### **Type Definitions** (`src/types/core.ts`)
```typescript
// Fundamental types
type ScaleType = "numeric" | "categorical" | "boolean";
type OptionType = string;
type CriteriaType = string;

// Enums for constants
enum AnalysisMethod {
  WEIGHTED_SUM = "weighted-sum",
  TOPSIS = "topsis",
  AHP = "ahp"
}
```

#### **Interfaces** (`src/interfaces/`)
Contract definitions for all services:
- `OptionManager` - Option operations contract
- `CriteriaEngine` - Criteria operations contract
- `AnalysisEngine` - Analysis operations contract
- `ExportService` - Export operations contract
- `ValidationService` - Validation operations contract

#### **Validation Utilities** (`src/utils/validation.ts`)
```typescript
// Weight validation
validateWeights(weights: number[]): boolean
normalizeWeights(weights: number[]): number[]

// Option validation
validateOption(option: Option): ValidationResult
validateCriteria(criteria: Criterion[]): ValidationResult

// Attribute scaling
normalizeValue(value: number, scale: ScaleDefinition): number
scaleToRange(value: number, min: number, max: number): number
```

---

## Data Flow

### 🔄 Typical Decision Analysis Flow

```
1. USER INPUT
   ├─ Create options (job offers, vendors, features)
   ├─ Define criteria (salary, support, performance)
   └─ Set weights (importance of each criterion)
   
2. VALIDATION (ValidationService)
   ├─ Verify all options are complete
   ├─ Check criteria weights sum to 100
   ├─ Validate attribute ranges
   └─ Assess data quality
   
3. ANALYSIS (AnalysisEngine)
   ├─ Normalize attribute values to 0-100 scale
   ├─ Calculate weighted scores
   │  Score = Σ(weight_i × normalized_value_i)
   ├─ Generate rankings
   ├─ Identify trade-offs
   └─ Perform sensitivity analysis
   
4. PRESENTATION (UI)
   ├─ Display ranked options
   ├─ Show score breakdown
   ├─ Visualize trade-offs
   └─ Highlight key insights
   
5. EXPORT (ExportService)
   ├─ Format results for report
   ├─ Generate PDF/Markdown/JSON
   └─ Create shareable link
```

---

## Design Patterns

### 1. **Interface Segregation**
Each service implements a focused interface with single responsibility:
```typescript
interface OptionManager {
  createOption(option: CreateOptionDTO): Promise<Option>;
  getOption(id: string): Promise<Option>;
  updateOption(id: string, data: Partial<Option>): Promise<Option>;
  deleteOption(id: string): Promise<void>;
  listOptions(): Promise<Option[]>;
  validateOption(option: Option): Promise<ValidationResult>;
}
```

### 2. **Dependency Injection**
Services are injected, enabling easy testing:
```typescript
class AnalysisService {
  constructor(
    private optionManager: OptionManager,
    private criteriaEngine: CriteriaEngine,
    private validator: ValidationService
  ) {}
}
```

### 3. **Validation Pipeline**
Multi-stage validation ensures data quality:
```
Input → Schema Validation → Business Logic Validation → Normalization
```

### 4. **Error Handling Strategy**
Consistent error responses with meaningful codes:
```typescript
throw new ValidationError(
  "INVALID_WEIGHTS",
  "Criteria weights must sum to 100",
  { weights: criteria.map(c => c.weight) }
);
```

---

## Scalability Considerations

### Current Capabilities
- ✅ In-memory data storage (suitable for real-time analysis)
- ✅ Handles 1000+ options efficiently
- ✅ Supports unlimited criteria
- ✅ Property-based testing for reliability
- ✅ Modular service architecture

### Future Scaling Options
1. **Database Integration**
   - PostgreSQL for persistent storage
   - Redis for caching frequently accessed analyses
   
2. **Microservices**
   - Separate Analysis Service
   - Dedicated Export Service
   - Independent Validation Service
   
3. **Message Queues**
   - Queue long-running PDF generation
   - Async email notifications
   
4. **Caching Layer**
   - Cache analysis results
   - Template caching
   - Criteria templates

---

## Testing Strategy

### Unit Tests
- Test each service in isolation
- Mock dependencies
- Cover edge cases (empty options, zero weights, etc.)

### Integration Tests
- Test API endpoints with real data
- Verify end-to-end flows
- Test error handling

### Property-Based Tests
Using `fast-check` with 100+ iterations:
```typescript
fc.assert(
  fc.property(
    fc.array(fc.float({ min: 0, max: 100 })),
    (weights) => {
      const normalized = normalizeWeights(weights);
      // Verify sum is always 100
      return Math.abs(sum(normalized) - 100) < 0.01;
    }
  ),
  { numRuns: 100 }
);
```

---

## Key Features of This Architecture

| Feature | Benefit |
|---------|---------|
| **Interface-Based Design** | Easy to test, swap implementations, maintain |
| **Modular Services** | Vertical scaling, clear responsibilities |
| **Type Safety** | Catch errors at compile time |
| **Comprehensive Validation** | Data quality guaranteed |
| **Property-Based Testing** | Edge cases covered automatically |
| **Multi-Format Export** | Flexible reporting options |
| **REST API** | Language-agnostic integration |
| **Error Handling** | Graceful failure, clear error messages |

---

## Adding a New Feature

To add a new feature (e.g., "Alternative Weights Scenario"):

1. **Define Types** (`src/types/core.ts`)
   ```typescript
   interface Scenario {
     id: string;
     name: string;
     weights: Record<string, number>;
   }
   ```

2. **Create Interface** (`src/interfaces/ScenarioManager.ts`)
   ```typescript
   interface ScenarioManager {
     createScenario(scenario: Scenario): Promise<Scenario>;
     compareScenarios(scenario1Id: string, scenario2Id: string): Promise<Comparison>;
   }
   ```

3. **Implement Service** (`src/services/ScenarioService.ts`)
   ```typescript
   export class ScenarioService implements ScenarioManager {
     // implementation
   }
   ```

4. **Add API Routes** (`src/api/routes/scenarios.ts`)
   ```typescript
   router.post('/scenarios', validateScenario, createScenario);
   router.post('/scenarios/compare', compareScenarios);
   ```

5. **Add Tests** (`src/services/__tests__/ScenarioService.test.ts`)
   ```typescript
   describe('ScenarioService', () => {
     // test cases
   });
   ```

6. **Update Documentation** (README, API docs)

---

## Environment & Deployment

### Development
```bash
npm install
npm run dev      # Main app
npm run dev:api  # API server only
npm run dev:ui   # UI only
```

### Production
```bash
npm run build
npm start
```

### Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - CORS allowed origin

---

**For API implementation details, see [src/api/README.md](../src/api/README.md)**

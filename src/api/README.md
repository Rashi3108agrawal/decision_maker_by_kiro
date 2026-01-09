# Decision Helper API

A RESTful API for the Decision Helper Tool that provides Multi-Criteria Decision Analysis (MCDA) capabilities.

## Getting Started

### Installation

```bash
npm install
```

### Running the API Server

```bash
# Development mode
npm run dev:api

# Production mode
npm run build
npm run start:api
```

The API server will start on port 3000 by default. You can set the `PORT` environment variable to use a different port.

## API Endpoints

### Health Check

- **GET** `/health` - Check API health status

### Options Management

- **GET** `/api/options` - Get all options
- **GET** `/api/options/:id` - Get option by ID
- **POST** `/api/options` - Create new option
- **PUT** `/api/options/:id` - Update option
- **DELETE** `/api/options/:id` - Delete option
- **POST** `/api/options/:id/validate` - Validate option
- **GET** `/api/options/stats` - Get options statistics

### Criteria Management

- **GET** `/api/criteria` - Get all criteria
- **GET** `/api/criteria/:id` - Get criterion by ID
- **POST** `/api/criteria` - Create new criterion
- **PUT** `/api/criteria/weights` - Update criteria weights
- **POST** `/api/criteria/validate` - Validate criteria collection
- **POST** `/api/criteria/normalize-weights` - Normalize weights
- **GET** `/api/criteria/stats` - Get criteria statistics

### Analysis

- **POST** `/api/analysis/analyze` - Perform complete analysis
- **POST** `/api/analysis/scores` - Calculate scores only
- **POST** `/api/analysis/trade-offs` - Identify trade-offs only
- **POST** `/api/analysis/recommendations` - Generate recommendations
- **POST** `/api/analysis/session` - Analyze complete session
- **GET** `/api/analysis/methods` - Get available analysis methods

### Templates

- **GET** `/api/templates` - Get all templates
- **GET** `/api/templates/categories` - Get template categories
- **GET** `/api/templates/:id` - Get template by ID
- **POST** `/api/templates` - Create new template
- **PUT** `/api/templates/:id` - Update template
- **DELETE** `/api/templates/:id` - Delete template
- **POST** `/api/templates/:id/apply` - Apply template with customizations
- **POST** `/api/templates/:id/validate` - Validate template

### Validation

- **POST** `/api/validation/session` - Validate comparison session
- **POST** `/api/validation/analysis-readiness` - Check analysis readiness
- **POST** `/api/validation/suggestions` - Get improvement suggestions
- **POST** `/api/validation/quality-report` - Get detailed quality report
- **GET** `/api/validation/rules` - Get validation rules documentation

### Export

- **POST** `/api/export/pdf` - Generate PDF export
- **POST** `/api/export/markdown` - Generate Markdown export
- **POST** `/api/export/json` - Generate JSON export
- **POST** `/api/export/share` - Create shareable link
- **GET** `/api/export/shared/:shareableId` - Get comparison by shareable link
- **GET** `/api/export/formats` - Get available export formats
- **POST** `/api/export/batch` - Export in multiple formats

## Example Usage

### Creating an Option

```bash
curl -X POST http://localhost:3000/api/options \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Option 1",
    "type": "api",
    "attributes": {
      "performance": 80,
      "cost": 100,
      "reliability": 95
    },
    "metadata": {
      "description": "First API option for comparison"
    }
  }'
```

### Creating a Criterion

```bash
curl -X POST http://localhost:3000/api/criteria \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Performance",
    "type": "performance",
    "weight": 40,
    "scale": "numeric",
    "scaleDefinition": {
      "min": 0,
      "max": 100,
      "unit": "score"
    }
  }'
```

### Performing Analysis

```bash
curl -X POST http://localhost:3000/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "options": [
      {
        "id": "opt1",
        "name": "Option 1",
        "attributes": {"performance": 80, "cost": 100}
      },
      {
        "id": "opt2", 
        "name": "Option 2",
        "attributes": {"performance": 90, "cost": 150}
      }
    ],
    "criteria": [
      {
        "id": "perf",
        "name": "Performance",
        "type": "performance",
        "weight": 60,
        "scale": "numeric"
      },
      {
        "id": "cost",
        "name": "Cost", 
        "type": "cost",
        "weight": 40,
        "scale": "numeric"
      }
    ]
  }'
```

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2026-01-08T18:30:19.236Z",
    "path": "/api/endpoint"
  }
}
```

Common error codes:
- `VALIDATION_ERROR` (400) - Request validation failed
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `INTERNAL_ERROR` (500) - Internal server error

## Security

The API includes the following security measures:
- Helmet.js for security headers
- CORS configuration
- Request size limits
- Input validation and sanitization

## Testing

Run the API tests:

```bash
npm test -- --testPathPattern="api"
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - CORS origin (default: *)
- `NODE_ENV` - Environment (development/production)
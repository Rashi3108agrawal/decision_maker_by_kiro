# 🎯 Decision Maker by Kiro

> A professional **Multi-Criteria Decision Analysis (MCDA)** tool that helps you systematically compare options, understand trade-offs, and make confident decisions.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.0-green.svg)](https://nodejs.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![API Tests](https://img.shields.io/badge/Tests-Fast--Check-success.svg)](src/test-setup.ts)

---

## ✨ Why Decision Maker?

Making complex decisions is hard. **Decision Maker by Kiro** uses proven Multi-Criteria Decision Analysis techniques to:

- 📊 **Compare multiple options** systematically across weighted criteria
- ⚖️ **Understand trade-offs** visually and analytically
- 🎯 **Reduce decision bias** through structured analysis
- 📈 **Generate insights** with scoring and recommendations
- 💾 **Export reports** in PDF, Markdown, or JSON formats
- 🔄 **Share comparisons** with shareable links

Perfect for:
- Career decisions (job offers, education paths)
- Investment analysis (vendors, technologies, projects)
- Product selection (features, pricing, performance)
- Team planning (resource allocation, priority ranking)

---

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Run Locally

```bash
# Development mode
npm run dev

# API Server (port 3000)
npm run dev:api

# Web UI
npm run dev:ui
```

### Build for Production

```bash
npm run build
npm start
```

---

## 📋 What You Can Do

### 🔧 Core Features

| Feature | Description |
|---------|-------------|
| **Option Management** | Create, edit, and organize decision options with custom attributes |
| **Criteria Definition** | Define weighted criteria with flexible scale definitions |
| **Analysis Engine** | Calculate weighted scores and identify optimal choices |
| **Trade-off Analysis** | Visualize competing priorities and understand compromises |
| **Recommendations** | Get intelligent suggestions based on analysis |
| **Export** | Generate PDF, Markdown, JSON reports and shareable links |
| **Validation** | Comprehensive data quality checks and improvement suggestions |

### 🛠️ Technical Features

- **TypeScript** - Type-safe, maintainable code
- **Property-Based Testing** - 100+ iterations with fast-check for comprehensive coverage
- **REST API** - Full-featured Express.js API with Helmet security
- **React UI** - Modern, responsive web interface
- **PDF Generation** - Professional report creation with Puppeteer
- **Modular Architecture** - Clean separation of concerns with interfaces and services

---

## 📚 Project Structure

```
decision_maker_by_kiro/
├── src/
│   ├── api/                 # Express REST API server
│   │   ├── routes/          # API endpoints
│   │   └── middleware/      # Auth, validation, error handling
│   ├── services/            # Business logic layer
│   ├── interfaces/          # TypeScript interfaces & contracts
│   ├── types/              # Core type definitions
│   ├── utils/              # Helpers & validation utilities
│   ├── ui/                 # React web application
│   └── index.ts            # Main entry point
├── docs/                   # Documentation
├── package.json            # Dependencies & scripts
└── README.md              # This file
```

For detailed architecture, see [**ARCHITECTURE.md**](docs/ARCHITECTURE.md).

---

## 🔌 API Overview

### Health Check
```bash
GET /health
```

### Options Management
```bash
POST /api/options              # Create option
GET /api/options               # List all options
GET /api/options/:id           # Get specific option
PUT /api/options/:id           # Update option
DELETE /api/options/:id        # Delete option
POST /api/options/:id/validate # Validate option
GET /api/options/stats         # Get statistics
```

### Analysis
```bash
POST /api/analysis/analyze           # Full analysis
POST /api/analysis/scores            # Calculate scores only
POST /api/analysis/trade-offs        # Trade-off analysis
POST /api/analysis/recommendations   # Get recommendations
```

### Export
```bash
POST /api/export/pdf         # PDF report
POST /api/export/markdown    # Markdown report
POST /api/export/json        # JSON export
POST /api/export/share       # Create shareable link
GET /api/export/shared/:id   # Access shared comparison
```

For complete API documentation, see [**src/api/README.md**](src/api/README.md).

---

## 💡 Real-World Examples

See practical walkthroughs in [**docs/EXAMPLES.md**](docs/EXAMPLES.md):

- 🎓 **Career Decision** - Comparing job offers with salary, growth, and work-life balance
- 💻 **Tech Stack Selection** - Evaluating programming languages and frameworks
- 🏢 **Vendor Selection** - Comparing SaaS tools across cost, features, and support
- 📱 **Product Launch** - Prioritizing features for MVP release

---

## 🧪 Testing

This project uses **Jest** for unit testing and **fast-check** for property-based testing with 100+ iterations per test.

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage

# Run only API tests
npm test -- --testPathPattern="api"
```

---

## 📖 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, components, and data flow
- **[EXAMPLES.md](docs/EXAMPLES.md)** - Real-world decision scenarios with step-by-step walkthroughs
- **[API Reference](src/api/README.md)** - Complete REST API documentation with curl examples

---

## 🔒 Security

The API includes security best practices:
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Request validation & sanitization
- ✅ Input size limits
- ✅ Error handling without information leakage

---

## 📦 Dependencies

**Core:**
- `express` - REST API framework
- `typescript` - Type safety
- `react` - Web UI
- `jspdf` & `html2canvas` - PDF generation
- `puppeteer` - Advanced PDF rendering

**Development:**
- `jest` - Unit testing
- `fast-check` - Property-based testing
- `ts-jest` - TypeScript support for Jest
- `prettier` - Code formatting
- `eslint` - Code linting

---

## 🤝 Contributing

Contributions are welcome! This is a serious project with comprehensive testing and documentation.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 🎯 Next Steps

1. **Try the API** → Run `npm run dev:api` and explore endpoints
2. **Run the UI** → Execute `npm run dev:ui` to see the web interface
3. **Check Examples** → Read [EXAMPLES.md](docs/EXAMPLES.md) for real scenarios
4. **Understand Architecture** → Review [ARCHITECTURE.md](docs/ARCHITECTURE.md)
5. **Run Tests** → Execute `npm test` to verify everything works

---

**Made with ❤️ by Kiro** | [Report Issues](https://github.com/Rashi3108agrawal/decision_maker_by_kiro/issues) | [View Source](https://github.com/Rashi3108agrawal/decision_maker_by_kiro)

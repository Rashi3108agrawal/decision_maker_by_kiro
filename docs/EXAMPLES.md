# 💡 Real-World Decision Analysis Examples

This guide walks through practical scenarios using Decision Maker by Kiro. Each example includes criteria setup, option creation, and analysis results.

---

## 📚 Table of Contents

1. [🎓 Career Decision: Comparing Job Offers](#career-decision)
2. [💻 Tech Stack Selection: Choosing a Language](#tech-stack)
3. [🏢 Vendor Selection: SaaS Tool Evaluation](#vendor-selection)
4. [📱 Product Launch: Feature Prioritization](#product-launch)

---

## 🎓 Career Decision: Comparing Job Offers {#career-decision}

**Scenario:** You've received 3 job offers and need to decide which one aligns best with your goals.

### Step 1: Define Your Criteria

These are the factors that matter to your decision:

```json
{
  "criteria": [
    {
      "name": "Salary & Compensation",
      "weight": 30,
      "importance": "high",
      "scale": "numeric",
      "unit": "USD per year"
    },
    {
      "name": "Growth & Learning",
      "weight": 25,
      "importance": "high",
      "scale": "numeric",
      "unit": "skill development score (0-100)"
    },
    {
      "name": "Work-Life Balance",
      "weight": 20,
      "importance": "high",
      "scale": "numeric",
      "unit": "flexibility score (0-100)"
    },
    {
      "name": "Team & Culture",
      "weight": 15,
      "importance": "medium",
      "scale": "numeric",
      "unit": "culture fit score (0-100)"
    },
    {
      "name": "Location & Commute",
      "weight": 10,
      "importance": "medium",
      "scale": "numeric",
      "unit": "convenience score (0-100)"
    }
  ]
}
```

**Total Weight:** 30 + 25 + 20 + 15 + 10 = 100 ✓

### Step 2: Add Your Job Options

Research each opportunity and create options:

```json
{
  "options": [
    {
      "id": "job-startup",
      "name": "TechStartup Inc - Senior Engineer",
      "type": "job_offer",
      "attributes": {
        "salary": 150000,
        "growth": 85,
        "work_life_balance": 60,
        "culture": 80,
        "location": 70
      },
      "metadata": {
        "description": "Fast-paced startup, equity options, learning-focused",
        "stage": "Series B",
        "tech_stack": "React, Node.js, AWS"
      }
    },
    {
      "id": "job-corporate",
      "name": "MegaCorp - Senior Software Engineer",
      "type": "job_offer",
      "attributes": {
        "salary": 180000,
        "growth": 55,
        "work_life_balance": 85,
        "culture": 70,
        "location": 85
      },
      "metadata": {
        "description": "Stable company, strong benefits, established processes",
        "employees": "5000+",
        "teams": "Large, well-structured"
      }
    },
    {
      "id": "job-scaleup",
      "name": "ScaleUp Co - Staff Engineer",
      "type": "job_offer",
      "attributes": {
        "salary": 170000,
        "growth": 75,
        "work_life_balance": 75,
        "culture": 85,
        "location": 60
      },
      "metadata": {
        "description": "Growing company, great team dynamics, modern tech",
        "employees": "150-200",
        "stage": "Series C"
      }
    }
  ]
}
```

### Step 3: Run Analysis

**API Request:**
```bash
curl -X POST http://localhost:3000/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "options": [/* options from Step 2 */],
    "criteria": [/* criteria from Step 1 */]
  }'
```

### Step 4: Interpret Results

**Expected Analysis Output:**

```json
{
  "scores": {
    "job-startup": 72.5,
    "job-corporate": 75.0,
    "job-scaleup": 76.5
  },
  "rankings": [
    {
      "rank": 1,
      "optionId": "job-scaleup",
      "optionName": "ScaleUp Co - Staff Engineer",
      "score": 76.5,
      "percentOfBest": 100.0
    },
    {
      "rank": 2,
      "optionId": "job-corporate",
      "optionName": "MegaCorp - Senior Software Engineer",
      "score": 75.0,
      "percentOfBest": 97.9
    },
    {
      "rank": 3,
      "optionId": "job-startup",
      "optionName": "TechStartup Inc - Senior Engineer",
      "score": 72.5,
      "percentOfBest": 94.7
    }
  ]
}
```

### Step 5: Review Trade-Offs

**ScaleUp Co vs MegaCorp:**
| Factor | Advantage | Disadvantage |
|--------|-----------|----------------|
| **Salary** | MegaCorp: $180K vs $170K | ScaleUp: Lower by $10K |
| **Growth** | ScaleUp: 75 vs 55 | MegaCorp: Limited learning |
| **Work-Life Balance** | MegaCorp: 85 vs 75 | ScaleUp: Less predictable |
| **Culture** | ScaleUp: 85 vs 70 | MegaCorp: More formal |
| **Location** | MegaCorp: 85 vs 60 | ScaleUp: Longer commute |

**Insight:** ScaleUp wins overall (76.5 vs 75.0) because it balances growth opportunity with good work-life balance. The $10K salary difference (3% of offer) is offset by significantly better learning opportunities (75 vs 55) and culture fit (85 vs 70).

### Step 6: Sensitivity Analysis

"What if work-life balance was more important to me?"

```json
{
  "scenario": "prefer_balance",
  "weight_changes": {
    "work_life_balance": 35,  // increased from 20
    "growth": 15              // decreased from 25
  },
  "new_scores": {
    "job-startup": 70.0,
    "job-corporate": 77.5,    // now best!
    "job-scaleup": 74.5
  }
}
```

**Key Insight:** If balance is your priority (vs. growth), MegaCorp becomes the clear winner.

---

## 💻 Tech Stack Selection: Choosing a Language {#tech-stack}

**Scenario:** Your startup is choosing between TypeScript, Python, and Go for your backend microservices.

### Step 1: Establish Evaluation Criteria

```json
{
  "criteria": [
    {
      "name": "Development Speed",
      "weight": 25,
      "scale": "numeric",
      "description": "Time to build features (0-100)"
    },
    {
      "name": "Performance",
      "weight": 25,
      "scale": "numeric",
      "description": "Execution speed & throughput (0-100)"
    },
    {
      "name": "Team Expertise",
      "weight": 20,
      "scale": "numeric",
      "description": "Your team's existing knowledge (0-100)"
    },
    {
      "name": "Ecosystem & Libraries",
      "weight": 15,
      "scale": "numeric",
      "description": "Available packages & community (0-100)"
    },
    {
      "name": "Scalability",
      "weight": 15,
      "scale": "numeric",
      "description": "Handling growth & complexity (0-100)"
    }
  ]
}
```

### Step 2: Define Language Options

```json
{
  "options": [
    {
      "id": "lang-typescript",
      "name": "TypeScript",
      "type": "programming_language",
      "attributes": {
        "dev_speed": 90,
        "performance": 70,
        "team_expertise": 85,
        "ecosystem": 95,
        "scalability": 75
      },
      "metadata": {
        "pros": "JS familiarity, huge npm ecosystem, fast iteration",
        "cons": "Runtime performance, CPU-bound tasks",
        "learning_curve": "Moderate"
      }
    },
    {
      "id": "lang-python",
      "name": "Python",
      "type": "programming_language",
      "attributes": {
        "dev_speed": 95,
        "performance": 50,
        "team_expertise": 75,
        "ecosystem": 90,
        "scalability": 60
      },
      "metadata": {
        "pros": "Fastest development, AI/ML libraries, readability",
        "cons": "Slow execution, GIL limitations, deployment",
        "learning_curve": "Easy"
      }
    },
    {
      "id": "lang-go",
      "name": "Go",
      "type": "programming_language",
      "attributes": {
        "dev_speed": 75,
        "performance": 95,
        "team_expertise": 50,
        "ecosystem": 70,
        "scalability": 95
      },
      "metadata": {
        "pros": "Excellent performance, concurrency, deployment simplicity",
        "cons": "Less dev speed, smaller ecosystem, team ramp-up",
        "learning_curve": "Moderate-Hard"
      }
    }
  ]
}
```

### Step 3: Expected Analysis

```json
{
  "scores": {
    "lang-typescript": 81.25,
    "lang-python": 74.5,
    "lang-go": 77.5
  },
  "rankings": [
    {
      "rank": 1,
      "optionId": "lang-typescript",
      "score": 81.25,
      "insight": "Best overall balance for a JavaScript-familiar team"
    },
    {
      "rank": 2,
      "optionId": "lang-go",
      "score": 77.5,
      "insight": "Superior if you prioritize performance & scalability"
    },
    {
      "rank": 3,
      "optionId": "lang-python",
      "score": 74.5,
      "insight": "Best if rapid prototyping is critical"
    }
  ]
}
```

### Step 4: Key Insights

**TypeScript Wins Because:**
- ✅ Strong team familiarity (85)
- ✅ Exceptional ecosystem (95)
- ✅ Good development speed (90)
- ❌ Performance trade-off (70)

**When to Choose Go Instead:**
If your service requirements are:
- Heavy computational workload (change Performance weight to 35%)
- High concurrency demands (change Scalability weight to 25%)
- **Result:** Go score becomes 83.5 (wins over TypeScript)

---

## 🏢 Vendor Selection: SaaS Tool Evaluation {#vendor-selection}

**Scenario:** Evaluating 3 project management tools for your team.

### Step 1: Vendor Evaluation Criteria

```json
{
  "criteria": [
    {
      "name": "Price (Cost per user/month)",
      "weight": 20,
      "type": "cost",
      "scale": "numeric",
      "note": "Lower is better"
    },
    {
      "name": "Feature Completeness",
      "weight": 25,
      "scale": "numeric",
      "unit": "coverage score (0-100)"
    },
    {
      "name": "Ease of Use",
      "weight": 20,
      "scale": "numeric",
      "unit": "usability score (0-100)"
    },
    {
      "name": "Integration Capabilities",
      "weight": 15,
      "scale": "numeric",
      "unit": "integrations available"
    },
    {
      "name": "Customer Support",
      "weight": 12,
      "scale": "numeric",
      "unit": "response quality (0-100)"
    },
    {
      "name": "Security & Compliance",
      "weight": 8,
      "scale": "numeric",
      "unit": "compliance score (0-100)"
    }
  ]
}
```

### Step 2: Vendor Options

```json
{
  "options": [
    {
      "id": "vendor-asana",
      "name": "Asana",
      "type": "saas_project_management",
      "attributes": {
        "price": 85,           // normalized: $30/user → score 85
        "features": 90,
        "ease_of_use": 85,
        "integrations": 80,
        "support": 80,
        "security": 90
      }
    },
    {
      "id": "vendor-monday",
      "name": "Monday.com",
      "type": "saas_project_management",
      "attributes": {
        "price": 75,           // $45/user → score 75
        "features": 95,
        "ease_of_use": 80,
        "integrations": 85,
        "support": 75,
        "security": 85
      }
    },
    {
      "id": "vendor-linear",
      "name": "Linear",
      "type": "saas_project_management",
      "attributes": {
        "price": 90,           // $20/user → score 90
        "features": 80,
        "ease_of_use": 95,
        "integrations": 70,
        "support": 70,
        "security": 90
      }
    }
  ]
}
```

### Step 3: Analysis Results

```json
{
  "scores": {
    "vendor-asana": 84.8,
    "vendor-monday": 85.4,
    "vendor-linear": 83.5
  },
  "recommendation": "Monday.com edges out Asana with more feature completeness, making up for slightly higher cost with better integrations."
}
```

---

## 📱 Product Launch: Feature Prioritization {#product-launch}

**Scenario:** Deciding which features to include in MVP for your product.

### Step 1: Feature Priority Framework

```json
{
  "criteria": [
    {
      "name": "User Impact",
      "weight": 30,
      "description": "How many users benefit? How significant?"
    },
    {
      "name": "Implementation Effort",
      "weight": 25,
      "description": "Development complexity & time (inverted: lower is better)"
    },
    {
      "name": "Revenue Impact",
      "weight": 20,
      "description": "Direct or indirect revenue generation"
    },
    {
      "name": "Competitive Advantage",
      "weight": 15,
      "description": "Differentiation from competitors"
    },
    {
      "name": "Technical Feasibility",
      "weight": 10,
      "description": "Fit with current tech stack"
    }
  ]
}
```

### Step 2: Feature Candidates

```json
{
  "options": [
    {
      "id": "feat-auth",
      "name": "User Authentication & OAuth",
      "attributes": {
        "user_impact": 95,
        "effort": 60,
        "revenue": 70,
        "competitive": 40,
        "feasibility": 95
      }
    },
    {
      "id": "feat-export",
      "name": "Export to PDF/CSV",
      "attributes": {
        "user_impact": 70,
        "effort": 75,
        "revenue": 60,
        "competitive": 60,
        "feasibility": 85
      }
    },
    {
      "id": "feat-collab",
      "name": "Real-time Collaboration",
      "attributes": {
        "user_impact": 90,
        "effort": 35,
        "revenue": 80,
        "competitive": 90,
        "feasibility": 60
      }
    },
    {
      "id": "feat-ai",
      "name": "AI Recommendations",
      "attributes": {
        "user_impact": 60,
        "effort": 20,
        "revenue": 90,
        "competitive": 95,
        "feasibility": 70
      }
    }
  ]
}
```

### Step 3: MVP Recommendation

```json
{
  "scores": {
    "feat-auth": 75.5,
    "feat-collab": 82.3,
    "feat-ai": 80.0,
    "feat-export": 69.5
  },
  "mvc_recommendation": [
    "feat-collab (82.3) - Core feature with best ROI",
    "feat-ai (80.0) - High revenue potential",
    "feat-auth (75.5) - Essential infrastructure"
  ],
  "defer_to_later": ["feat-export (69.5)"],
  "launch_timeline": "3 sprints"
}
```

---

## 🎯 How to Use These Examples

### 1. **Adapt to Your Scenario**
   - Copy the structure
   - Adjust criteria names and weights
   - Replace options with your choices
   - Update attribute values

### 2. **API Integration**
   ```bash
   # Create options
   curl -X POST http://localhost:3000/api/options \
     -H "Content-Type: application/json" \
     -d '{ "name": "Option 1", ... }'
   
   # Create criteria
   curl -X POST http://localhost:3000/api/criteria \
     -H "Content-Type: application/json" \
     -d '{ "name": "Criterion 1", "weight": 30, ... }'
   
   # Run analysis
   curl -X POST http://localhost:3000/api/analysis/analyze \
     -H "Content-Type: application/json" \
     -d '{ "options": [...], "criteria": [...] }'
   ```

### 3. **Export Results**
   ```bash
   # PDF report
   curl -X POST http://localhost:3000/api/export/pdf \
     -H "Content-Type: application/json" \
     -d '{ "analysisId": "..." }' \
     > decision-report.pdf
   
   # JSON export
   curl -X POST http://localhost:3000/api/export/json \
     -H "Content-Type: application/json" \
     -d '{ "analysisId": "..." }' > decision-data.json
   ```

---

## 💡 Best Practices for Decision Analysis

1. **Set Weights First** - Define importance before seeing results
2. **Use Normalized Scales** - Keep attributes on 0-100 scale for consistency
3. **Document Assumptions** - Note why you scored each attribute
4. **Verify Trade-offs** - Ensure rankings match your intuition
5. **Test Sensitivity** - What if key assumptions change?
6. **Share & Discuss** - Export reports to involve stakeholders
7. **Review After Decision** - Track actual outcomes for learning

---

## 📖 Next Steps

- ✅ Explore the [API Documentation](../src/api/README.md)
- ✅ Review the [Architecture Guide](ARCHITECTURE.md)
- ✅ Run `npm test` to see more examples in test files
- ✅ Try building your own decision analysis!

**Happy deciding! 🎯**

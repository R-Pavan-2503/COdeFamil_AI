# CodeFamily: AI-Powered Engineering Intelligence Platform

## Vision

Move engineering intelligence from **"Passive Dashboards"** to **"Active Governance."**

Prevent architectural mistakes, hidden dependencies, and PR conflicts **BEFORE** they happen.

## Stakeholder Questions Answered

### 1. "How do you evaluate deep knowledge?"

**Answer**: Semantic analysis via **Gemini Embeddings**

- Traditional metrics measure lines of code (syntax)
- Embeddings measure understanding (semantics)
- 768-dimensional vectors capture conceptual relationships
- Ownership is based on semantic contribution, not just code churn

### 2. "Is it only viewing? Can it block bad merges?"

**Answer**: Active enforcement via **GitHub Status API**

- Not just a dashboard — physically blocks merges
- Real-time conflict detection between branches
- Automated risk scoring
- Merge button disabled when risk ≥ 80%

### 3. "Can I work simultaneously without conflicts?"

**Answer**: Proactive warnings via **Real-time Analysis**

- Detects structural overlap (same files/regions)
- Detects semantic overlap (similar code intent via embeddings)
- Slack DM alerts before conflicts escalate
- Supabase Realtime updates to frontend

## Technology Stack

### Backend (.NET 8)

- **LibGit2Sharp**: Bare clone repositories and time-travel through commits
- **Supabase SDK**: PostgreSQL with pgvector for AI search
- **Octokit**: GitHub API integration
- **Background Workers**: Real-time webhook processing

### Sidecar (Node.js + TypeScript)

- **Tree-sitter**: AST parsing for functions and imports
- **Express**: REST API for parsing requests
- Supports JavaScript, TypeScript, Python, Go, and more

### Frontend (React + TypeScript)

- **Vite**: Fast build tool
- **React Router**: Navigation
- **Supabase Client**: Real-time updates
- Modern UI with rich visualizations

### AI & Search

- **Gemini API**: 768-dim embeddings for semantic analysis
- **pgvector**: Vector similarity search in PostgreSQL
- **Cosine Similarity**: Measure semantic overlap

### Integrations

- **GitHub OAuth**: User authentication
- **GitHub Webhooks**: Real-time push/PR events
- **GitHub Status API**: Merge blocking
- **Slack API**: Developer notifications

## Core Features

### 1. Repository Analysis

- One-click analysis of any repository
- Complete commit history ingestion
- Semantic ownership calculation
- Dependency graph construction

### 2. Commit Browser

- Navigate all commits with metadata
- View file content at any point in history
- See diffs and patches
- Track who changed what and when

### 3. Pull Request Intelligence

- List all PRs (open, closed, merged)
- Conflict detection with other PRs
- Risk scoring based on semantic overlap
- Dependency impact analysis
- Reviewer recommendations

### 4. File Structure Explorer

- Interactive folder tree
- File content viewer with commit navigation
- Comprehensive file analysis:
  - Semantic purpose
  - Ownership breakdown
  - Dependency relationships
  - Change frequency
  - Blast radius (semantic neighbors)
  - Open PR involvement

### 5. Real-Time Conflict Prevention

- Webhook-driven incremental updates
- Automatic risk calculation on push
- Merge blocking via GitHub Status API
- Slack DM warnings
- Frontend alerts

## Key Innovations

### Semantic Ownership

Traditional tools measure "lines changed." CodeFamily measures **conceptual contribution**:

1. Extract all functions from commits
2. Generate embeddings for each function
3. Track vector movement across commits
4. Calculate semantic delta per author
5. Higher delta = higher ownership

### Risk Calculation

```
Risk Score = (Structural Overlap × 0.4) + (Semantic Overlap × 0.6)

Structural Overlap = Are you editing the same file/region?
Semantic Overlap = Is your code semantically similar? (cosine similarity > 0.85)
```

If Risk ≥ 80%:

- Block merge on GitHub
- Send Slack DM
- Show warning in UI

### Vector-Based Search

- All code chunks stored as 768-dim vectors
- Fast similarity search via pgvector HNSW index
- Find related code even without explicit imports
- Detect logical coupling

## Project Structure

```
codefamily/
├── backend/              # .NET 8 API and Workers
│   ├── src/
│   │   ├── Api/          # Controllers and endpoints
│   │   ├── Core/         # Models, Interfaces, Services
│   │   └── Workers/      # Background job processors
│   └── settings.json     # Configuration
│
├── sidecar/              # Node.js Tree-sitter service
│   └── src/
│       ├── index.ts      # Express server
│       └── parser/       # AST parsing logic
│
├── frontend/             # React UI
│   └── src/
│       ├── pages/        # Route pages
│       ├── components/   # Reusable components
│       └── utils/        # API client
│
├── scripts/              # Setup and utility scripts
├── secrets/              # Private keys (gitignored)
└── testdata/             # Sample repositories
```

## Quick Start

See [RUNNING.md](./RUNNING.md) for detailed setup instructions.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design and data flow.

## License

Proprietary - All Rights Reserved

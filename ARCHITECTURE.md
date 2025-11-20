# CodeFamily Architecture

## System Overview

CodeFamily is a multi-tier AI-powered platform for engineering intelligence:

```
┌─────────────┐
│   Frontend  │ React + TypeScript + Vite
│  (Port5173)│
└──────┬──────┘
       │ HTTP/REST + Realtime
       ▼
┌─────────────┐
│   Backend   │ .NET 8 Web API
│  (Port5000)│
└──────┬──────┘
       │
       ├───────────► Supabase (PostgreSQL + pgvector + Realtime)
       │
       ├───────────► Sidecar (Node.js Tree-sitter Parser, Port 3001)
       │
       ├───────────► Gemini API (768-dim Embeddings)
       │
       ├───────────► GitHub API (OAuth, Repos, PRs, Status)
       │
       └───────────► Slack API (DM Notifications)
```

## Data Flow

### 1. User Authentication

```
User → Frontend → Backend /auth/github → GitHub OAuth
                                         ↓
                    Backend ← Access Token ← GitHub
                       ↓
                  Store user in Supabase (github_id, username, email, avatar)
                       ↓
                  Return session token → Frontend
```

### 2. Repository Analysis (Full Ingestion)

**Trigger**: User clicks "Analyze" on a repository

```
Frontend → POST /analyze/{owner}/{repo}
              ↓
         Backend API
              ↓
   [LibGit2Sharp Bare Clone]
              ↓
   Clone to ./repos/{owner}_{repo}.git
              ↓
   Walk ALL commits (reverse chronological)
              │
              ▼
     ┌────────────────────┐
     │  For Each Commit   │
     └────────────────────┘
              │
              ├─► Insert commit record (sha, message, timestamp)
              │
              └─► For each file in commit:
                       │
                       ├─► Read file content from bare clone (LibGit2Sharp)
                       │
                       ├─► Send to Sidecar → Parse with Tree-sitter
                       │                        │
                       │                        ├─► Extract functions
                       │                        └─► Extract imports
                       │
                       ├─► For each extracted function:
                       │       │
                       │       └─► POST to Gemini Embeddings API
                       │                   ↓
                       │           Receive 768-dim vector
                       │                   ↓
                       │           Store in code_embeddings table
                       │
                       ├─► Store imports in dependencies table
                       │
                       └─► Update file_changes (additions, deletions)
              │
              ▼
    Compute Semantic Ownership
              │
              ├─► Group embeddings by author
              ├─► Calculate semantic delta (vector distance)
              ├─► Assign ownership scores
              └─► Store in file_ownership table
              │
              ▼
    Attach GitHub Webhook
              │
              └─► POST to GitHub API
                       events: [push, pull_request, pull_request_target]
                       url: {WebhookUrl}/webhooks/github
```

### 3. Real-Time Webhook Processing (Incremental Updates)

**Trigger**: Developer pushes code

```
GitHub Push Event
       ↓
POST /webhooks/github
       ↓
Verify HMAC signature
       ↓
Insert into webhook_queue (payload, status='pending')
       ↓
Background Worker (IncrementalWorker) picks up job
       ↓
┌───────────────────────────┐
│   Incremental Analysis    │
└───────────────────────────┘
       │
       ├─► git fetch (on bare clone)
       │
       ├─► Determine changed files ONLY
       │
       ├─► For each changed file:
       │       │
       │       ├─► Read new content
       │       ├─► Parse with Sidecar
       │       ├─► Generate new embeddings
       │       │
       │       └─► Risk Calculation:
       │               │
       │               ├─► Query open PRs
       │               ├─► Compare embeddings (cosine similarity)
       │               ├─► Check structural overlap (same file/region)
       │               │
       │               └─► Risk Score = (Structural × 0.4) + (Semantic × 0.6)
       │
       ├─► If Risk ≥ 80%:
       │       │
       │       ├─► POST to GitHub Status API
       │       │       state: "failure"
       │       │       description: "Blocked: Conflict with PR #XYZ"
       │       │
       │       ├─► POST to Slack API
       │       │       DM author: "@user — Your push conflicts with PR #123"
       │       │
       │       └─► Publish to Supabase Realtime
       │               → Frontend shows "Conflict Warning"
       │
       └─► Update status in webhook_queue to 'completed'
```

### 4. Repository Browser - Commits Tab

```
User clicks repo → Frontend loads /repos/{id}/commits
                          ↓
                   Backend queries commits table
                          ↓
                   Return list (sha, author, timestamp, message)
                          ↓
                   Frontend displays

User clicks commit → Frontend loads /commits/{id}
                          ↓
                   Backend:
                     ├─► Fetch from GitHub API (diff, patch, stats)
                     └─► Query file_changes for this commit
                          ↓
                   Return detailed commit data
                          ↓
                   Frontend displays

User clicks file in commit → Frontend loads /commits/{commitId}/file/{path}
                                   ↓
                            Backend uses LibGit2Sharp:
                              └─► Read file content at commit SHA
                                   ↓
                            Return historical file content
                                   ↓
                            Frontend displays with syntax highlighting
```

### 5. Repository Browser - PRs Tab

```
User opens PRs tab → Frontend loads /repos/{id}/pulls
                          ↓
                   Backend:
                     ├─► Query pull_requests table (local DB)
                     └─► Fetch from GitHub API (latest state)
                          ↓
                   Return list (number, state, author, title)
                          ↓
                   Frontend displays

User clicks PR → Frontend loads /pulls/{id}
                      ↓
                 Backend:
                   ├─► Fetch PR details from GitHub API
                   │       (comments, reviewers, changed files, diff)
                   │
                   ├─► Query pr_files_changed
                   │
                   ├─► Calculate risk score with other open PRs
                   │
                   └─► Query dependencies for impact analysis
                      ↓
                 Return comprehensive PR data
                      ↓
                 Frontend displays with risk warnings
```

### 6. Repository Browser - File Structure Tab

```
User opens File Structure → Frontend loads /repos/{id}/files
                                 ↓
                          Backend queries repository_files
                                 ↓
                          Return folder tree structure
                                 ↓
                          Frontend displays tree

User clicks file → Frontend loads /files/{id}
                        ↓
                   Backend:
                     ├─► Get latest content (LibGit2Sharp at HEAD)
                     ├─► Query code_embeddings for this file
                     ├─► Query dependencies (imports/exports)
                     ├─► Query file_ownership
                     ├─► Query file_changes (frequency, recency)
                     ├─► Perform vector similarity search (blast radius)
                     └─► Check if file is in any open PR
                        ↓
                   Return:
                     - File content
                     - Ownership breakdown
                     - Dependency list
                     - Semantic neighbors (similar files)
                     - Change history
                     - PR involvement
                        ↓
                   Frontend displays in two tabs:
                     1. Code View (with commit navigation)
                     2. File Analysis (ownership, deps, blast radius)
```

## Database Schema Details

### Core Tables

**users**: GitHub user identities

- `github_id`: Unique GitHub user ID
- `username`, `email`, `avatar_url`: Profile data

**repositories**: Tracked repositories

- `name`, `owner_username`: Repo identification
- `status`: 'analyzing', 'ready', 'error'
- `is_active_blocking`: Whether merge blocking is enabled
- `connected_by_user_id`: Who added this repo

**commits**: All commits in analyzed repos

- `sha`: Git commit hash
- `message`, `committed_at`: Commit metadata
- `repository_id`: Foreign key

**repository_files**: All files in repos

- `file_path`: Relative path within repo
- `total_lines`: Current line count

**file_changes**: Changes per commit per file

- `commit_id` + `file_id`: Composite primary key
- `additions`, `deletions`: Diff stats

### AI & Analysis Tables

**code_embeddings**: Semantic vectors

- `file_id`: Which file this belongs to
- `embedding`: vector(768) — Gemini embedding
- `chunk_content`: The actual code text
- Indexed with HNSW for fast similarity search

**dependencies**: File relationships

- `source_file_id` → `target_file_id`
- `dependency_type`: 'import', 'require', 'include', etc.
- `strength`: How critical the dependency is

**file_ownership**: Semantic ownership

- `file_id` + `user_id`: Composite key
- `semantic_score`: Calculated from embedding deltas (0.0 to 1.0)
- NOT based on line counts!

### Pull Request Tables

**pull_requests**: All PRs

- `pr_number`: GitHub PR number
- `state`: 'open', 'closed', 'merged'
- `author_id`: Who created it

**pr_files_changed**: Files modified in PR

- Links PR to files

**reviews**: PR reviews

- `reviewer_id`, `state`: 'approved', 'changes_requested', etc.

### Background Processing

**webhook_queue**: Job queue

- `payload`: JSONB — webhook event data
- `status`: 'pending', 'processing', 'completed', 'failed'
- Processed by workers

## Semantic Ownership Algorithm

**Problem**: "Lines of code changed" doesn't measure expertise.

**Solution**: Measure semantic contribution.

### Algorithm

```
For each file:
  1. Get all embeddings for this file across all commits
  2. Group by author
  3. For each author:
       a. Calculate vector delta:
            Δ = Σ distance(embedding[n], embedding[n-1])
       b. Normalize across all authors
       c. Store as semantic_score
```

### Example

File: `auth.service.ts`

Commits:

- Commit A (Alice): Adds basic login → Embedding E1
- Commit B (Bob): Fixes typo → Embedding E2 (very close to E1)
- Commit C (Alice): Adds OAuth flow → Embedding E3 (far from E2)

Semantic Deltas:

- Alice: distance(E1, null) + distance(E3, E2) = **0.85** (high)
- Bob: distance(E2, E1) = **0.05** (low)

Ownership:

- Alice: 94%
- Bob: 6%

**Insight**: Even though both made 1 commit, Alice introduced significant semantic changes (new concepts), while Bob made superficial edits.

## Risk Calculation Details

### Inputs

1. **Structural Overlap**: Are developers editing the same code?

   - Same file?
   - Same line ranges?
   - Same functions?

2. **Semantic Overlap**: Are developers working on similar concepts?
   - Cosine similarity of embeddings
   - Threshold: 0.85

### Formula

```python
def calculate_risk(push, open_prs):
    max_risk = 0

    for pr in open_prs:
        structural = calculate_structural_overlap(push, pr)
        semantic = calculate_semantic_overlap(push, pr)

        risk = (structural * 0.4) + (semantic * 0.6)
        max_risk = max(max_risk, risk)

    return max_risk

def calculate_structural_overlap(push, pr):
    shared_files = push.files ∩ pr.files
    if len(shared_files) == 0:
        return 0.0

    overlap_score = len(shared_files) / len(push.files ∪ pr.files)
    return overlap_score

def calculate_semantic_overlap(push, pr):
    push_embeddings = get_embeddings(push.files)
    pr_embeddings = get_embeddings(pr.files)

    max_similarity = 0.0
    for push_emb in push_embeddings:
        for pr_emb in pr_embeddings:
            similarity = cosine_similarity(push_emb, pr_emb)
            max_similarity = max(max_similarity, similarity)

    return max_similarity if max_similarity > 0.85 else 0.0
```

### Actions

| Risk Score | Action                                |
| ---------- | ------------------------------------- |
| < 50%      | No action                             |
| 50-79%     | Warning notification (Slack + UI)     |
| ≥ 80%      | **Block merge** + Slack DM + UI alert |

## GitHub Status API Integration

When risk ≥ 80%:

```csharp
POST https://api.github.com/repos/{owner}/{repo}/statuses/{sha}
{
  "state": "failure",
  "description": "Blocked: Potential conflict with PR #123",
  "context": "codefamily/conflict-detection",
  "target_url": "https://codefamily.app/conflicts/{id}"
}
```

This physically disables the "Merge" button on GitHub.

## Technology Choices Justification

### Why LibGit2Sharp?

- Direct access to bare repositories
- No shell commands needed
- Fast historical traversal
- Read file content at any commit

### Why Tree-sitter as a sidecar?

- Tree-sitter is best in Node.js ecosystem
- Supports 40+ languages
- AST parsing is CPU-intensive — isolate from main API
- Horizontal scaling: Run multiple sidecar instances

### Why pgvector?

- Native vector operations in PostgreSQL
- HNSW index for fast k-NN search
- No separate vector database needed
- Keeps data together for transactional consistency

### Why Gemini Embeddings?

- 768 dimensions (good balance)
- Multi-language support
- Fast API response
- Affordable pricing

### Why .NET?

- LibGit2Sharp is C# native
- High performance for background workers
- Strong typing for complex domain models
- Excellent async/await support

## Deployment Considerations

### Local Development

```bash
# Terminal 1: Backend
cd backend/src/Api
dotnet run

# Terminal 2: Sidecar
cd sidecar
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Production (Future)

- Backend: Docker container on Cloud Run / Azure Container Apps
- Sidecar: Separate container, autoscaled
- Frontend: Static hosting (Vercel / Netlify)
- Webhooks: Ngrok → Production URL
- Workers: Background service or serverless functions

## Security Considerations

1. **GitHub App Private Key**: Never commit, stored in `/secrets`
2. **Supabase Service Key**: Server-side only
3. **Webhook Signature**: HMAC verification required
4. **User Tokens**: Short-lived, stored in session
5. **Repository Access**: Respect GitHub permissions

## Performance Optimizations

1. **Incremental Analysis**: Only process changed files
2. **Vector Index**: HNSW for O(log n) similarity search
3. **Bare Clone**: No working directory overhead
4. **Batch Embeddings**: Group multiple functions in single API call
5. **Worker Queue**: Async processing, doesn't block API
6. **Supabase Realtime**: Push updates to frontend, no polling

## Future Enhancements

1. **Multi-language Support**: Expand Tree-sitter parsers
2. **Code Review AI**: Auto-suggest reviewers based on ownership
3. **Trend Analysis**: Track technical debt over time
4. **Team Insights**: Collaboration patterns
5. **Custom Rules**: User-defined conflict thresholds

# CodeFamily - Final Setup and Run Guide

## 🎉 System Status: COMPLETE

All components have been generated and the JWT implementation is complete!

## Quick Start (3 Steps)

### Step 1: Install Dependencies

Open **3 separate PowerShell terminals** in the project root:

#### Terminal 1: Backend Dependencies

```powershell
cd backend/src/Api
dotnet restore
```

#### Terminal 2: Sidecar Dependencies

```powershell
cd sidecar
npm install
```

#### Terminal 3: Frontend Dependencies

```powershell
cd frontend
npm install
```

### Step 2: Verify Database Connection

Your Supabase connection string is already configured in `settings.json`.

Verify the database has the schema by checking:

```
https://zhagdkiukasamywvhvvl.supabase.co/project/default/editor
```

Make sure all tables exist (users, repositories, commits, etc.). If not, run the SQL schema from the requirements.

### Step 3: Start All Services

Keep the 3 terminals open and run:

#### Terminal 1: Backend API

```powershell
cd backend/src/Api
dotnet run
```

**Expected output:**

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
CodeFamily API starting on port 5000
```

#### Terminal 2: Tree-sitter Sidecar

```powershell
cd sidecar
npm run dev
```

**Expected output:**

```
Tree-sitter sidecar listening on port 3001
```

#### Terminal 3: Frontend

```powershell
cd frontend
npm run dev
```

**Expected output:**

```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

## 🚀 Using the Application

### 1. Open Browser

Navigate to: **http://localhost:5173**

### 2. Login with GitHub

Click "Login with GitHub" and authorize the app.

### 3. Analyze a Repository

1. You'll see a list of all your GitHub repositories
2. Click "Analyze" on any repository
3. The backend will:
   - Bare clone the repository
   - Walk all commits
   - Extract functions with Tree-sitter
   - Generate embeddings with Gemini
   - Calculate semantic ownership
   - Attach webhook

**Note:** Analysis may take 5-15 minutes for large repositories.

### 4. Monitor Progress

Watch the backend terminal for logs:

```
Starting full analysis of owner/repo
Found 150 commits
Processing commit abc123...
Analysis complete for owner/repo
```

### 5. Webhook Integration (Optional)

To receive real-time webhooks locally, you need ngrok:

```powershell
# Install ngrok
choco install ngrok

# Start tunnel
ngrok http 5000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok-free.app`) and update:

1. **settings.json**: Set `WebhookUrl` to your ngrok URL
2. **GitHub App settings**: Update webhook URL to `https://abc123.ngrok-free.app/webhooks/github`

Restart the backend after updating settings.

## 🧪 Testing the System

### Test 1: Authentication

- Login with GitHub ✓
- See your avatar and username ✓

### Test 2: Repository List

- See all your repositories ✓
- Analyze button appears ✓

### Test 3: Analysis

- Click "Analyze" ✓
- Status changes to "analyzing" ✓
- Backend logs show commit processing ✓
- Status changes to "ready" when complete ✓

### Test 4: Webhook (with ngrok)

- Push code to an analyzed repository
- Backend receives webhook ✓
- IncrementalWorker processes it ✓
- Risk calculation runs ✓
- If risk ≥ 80%, merge is blocked on GitHub ✓

## 📊 Monitoring

### Backend Logs

Watch for:

- `Starting full analysis...`
- `Found X commits`
- `Processing commit...`
- `Risk score: X.XX`
- `HIGH RISK DETECTED` (if conflict found)

### Sidecar Logs

Watch for:

- POST requests to `/parse`
- Parse errors (if any)

### Database

Check Supabase Studio:

```
https://zhagdkiukasamywvhvvl.supabase.co/project/default/editor
```

Query to see analysis progress:

```sql
SELECT r.name, r.status, COUNT(c.id) as commit_count
FROM repositories r
LEFT JOIN commits c ON r.id = c.repository_id
GROUP BY r.id, r.name, r.status;
```

## 🔧 Troubleshooting

### Backend won't start

**Error: "GitHub App private key not found"**

- Verify PEM file exists at: `d:\ups\team_proj\codeFamily_ai_2\secrets\codefamily.pem`
- Check file is readable

**Error: "Unable to connect to database"**

- Verify Supabase URL and service key in settings.json
- Check internet connection
- Ensure database schema is deployed

### Sidecar won't start

**Error: "Cannot find module 'tree-sitter'"**

```powershell
cd sidecar
npm install
```

**Port 3001 already in use**

```powershell
# Find and kill process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Frontend won't start

**Port 5173 already in use**

```powershell
# Find and kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Analysis stuck

**Repository stays in "analyzing" status**

- Check backend logs for errors
- Verify sidecar is running (port 3001)
- Check Gemini API key is valid
- For large repos (>1000 commits), analysis may take 30+ minutes

### Webhooks not received

**Push doesn't trigger analysis**

- Ensure ngrok is running
- Verify webhook URL in GitHub App settings
- Check "Recent Deliveries" in GitHub App settings
- Verify webhook secret matches settings.json

## 🎯 Key Features to Test

### Semantic Ownership

After analyzing a repository:

```sql
SELECT f.file_path, u.username, fo.semantic_score
FROM file_ownership fo
JOIN repository_files f ON fo.file_id = f.id
JOIN users u ON fo.user_id = u.id
ORDER BY fo.semantic_score DESC
LIMIT 10;
```

### Vector Similarity Search

```sql
SELECT
  rf1.file_path as source,
  rf2.file_path as similar,
  1 - (ce1.embedding <=> ce2.embedding) as similarity
FROM code_embeddings ce1
JOIN code_embeddings ce2 ON ce1.file_id != ce2.file_id
JOIN repository_files rf1 ON ce1.file_id = rf1.id
JOIN repository_files rf2 ON ce2.file_id = rf2.id
WHERE rf1.file_path = 'src/index.js'
ORDER BY ce1.embedding <=> ce2.embedding
LIMIT 5;
```

### Risk Calculation

Push code and check webhook_queue:

```sql
SELECT * FROM webhook_queue ORDER BY id DESC LIMIT 5;
```

## 📚 Next Steps

1. **Analyze multiple repositories** to build your codebase knowledge graph
2. **Enable webhooks** for real-time conflict detection
3. **Explore the database** to see semantic ownership and embeddings
4. **Test conflict detection** by creating overlapping branches

## 🛠️ Development Workflow

### Making Changes

**Backend:**

- Edit code in `backend/src/`
- Restart with `dotnet run`

**Sidecar:**

- Edit code in `sidecar/src/`
- Restart with `npm run dev` (auto-reloads with ts-node)

**Frontend:**

- Edit code in `frontend/src/`
- Vite will hot-reload automatically

### Adding Features

See `ARCHITECTURE.md` for system design and extension points.

## 🎊 You're All Set!

The CodeFamily platform is now running locally. Start by analyzing a repository and explore the AI-powered insights!

**Questions?** Check the docs:

- `README.md` - Project overview
- `ARCHITECTURE.md` - System design & algorithms
- `RUNNING.md` - Detailed running instructions

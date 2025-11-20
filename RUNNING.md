# Running CodeFamily

## Prerequisites

1. **.NET 8 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
2. **Node.js 18+** - [Download](https://nodejs.org/)
3. **GitHub App** - Already configured with your credentials
4. **Supabase Project** - Already set up with schema
5. **Gemini API Key** - Already configured
6. **Slack Bot** - Already configured

## Initial Setup

### 1. Place GitHub App Private Key

Download your GitHub App private key (`.pem` file) and place it at:

```
d:\ups\team_proj\codeFamily_ai_2\secrets\codefamily.pem
```

This is **REQUIRED** before running the backend.

### 2. Verify Configuration

Check `settings.json` in the root directory. It should already contain your credentials:

```json
{
  "GitHub": {
    "AppId": "2322543",
    "ClientId": "Iv23lisygbizqMOjydvx",
    "ClientSecret": "0f21958a56647a5dccf866331b27e16e4789b6a9",
    "WebhookSecret": "my_super_secret_123",
    "PrivateKeyPath": "/secrets/codefamily.pem"
  },
  ...
}
```

### 3. Install Dependencies

```bash
# Backend .NET dependencies (restore NuGet packages)
cd backend/src/Api
dotnet restore

# Sidecar Node.js dependencies
cd ../../../sidecar
npm install

# Frontend React dependencies
cd ../frontend
npm install
```

## Running the Application

You need **3 terminal windows** running simultaneously:

### Terminal 1: Backend API

```bash
cd d:\ups\team_proj\codeFamily_ai_2\backend\src\Api
dotnet run
```

Expected output:

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
```

The backend will:

- Start Web API on port 5000
- Launch background workers for webhook processing
- Connect to Supabase
- Wait for requests

### Terminal 2: Tree-sitter Sidecar

```bash
cd d:\ups\team_proj\codeFamily_ai_2\sidecar
npm run dev
```

Expected output:

```
Tree-sitter sidecar listening on port 3001
```

The sidecar will:

- Start Express server on port 3001
- Load Tree-sitter parsers
- Wait for parsing requests from backend

### Terminal 3: Frontend

```bash
cd d:\ups\team_proj\codeFamily_ai_2\frontend
npm run dev
```

Expected output:

```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

## Using the Application

### 1. Login

1. Open browser to `http://localhost:5173`
2. Click "Login with GitHub"
3. Authorize the GitHub App
4. You'll be redirected back to the dashboard

### 2. Analyze a Repository

1. You'll see a list of all your GitHub repositories
2. Click "Analyze" on any repository
3. Backend will:
   - Bare clone the repository
   - Walk all commits
   - Extract functions and imports
   - Generate embeddings
   - Calculate semantic ownership
   - Attach webhook (if not already attached)

**Note**: Large repositories may take several minutes to analyze.

### 3. Browse Repository

Once analysis is complete, click on the repository to open the browser. You'll see 3 tabs:

#### Commits Tab

- List of all commits
- Click to view details, diffs, and files
- Navigate through file history

#### Pull Requests Tab

- All PRs (open, closed, merged)
- Risk scores and conflict warnings
- Dependency impact analysis

#### File Structure Tab

- Interactive folder tree
- Click any file to see:
  - **Code View**: File content with commit navigation
  - **File Analysis**: Ownership, dependencies, blast radius

### 4. Real-Time Conflict Detection

When you or a teammate pushes code:

1. GitHub sends webhook to backend
2. Backend analyzes changed files
3. Compares with open PRs
4. If risk ≥ 80%:
   - Blocks merge on GitHub
   - Sends Slack DM
   - Shows alert in UI

## Webhook Setup (Ngrok for Local Testing)

To receive GitHub webhooks locally, you need a tunnel:

### 1. Install Ngrok (if not installed)

```bash
# Download from https://ngrok.com/download
# Or use chocolatey:
choco install ngrok
```

### 2. Start Ngrok Tunnel

```bash
ngrok http 5000
```

You'll see output like:

```
Forwarding  https://your-random-id.ngrok-free.app -> http://localhost:5000
```

### 3. Update GitHub App Webhook URL

1. Go to your GitHub App settings
2. Update webhook URL to: `https://your-random-id.ngrok-free.app/webhooks/github`
3. Save changes

### 4. Update settings.json

```json
{
  "WebhookUrl": "https://your-random-id.ngrok-free.app"
}
```

**Note**: Your ngrok URL changes each time you restart it (unless you have a paid plan).

## Troubleshooting

### Backend won't start

**Error**: `Could not find file '/secrets/codefamily.pem'`

**Solution**: Ensure your GitHub App private key is placed at the exact path specified in `settings.json`.

---

**Error**: `Unable to connect to Supabase`

**Solution**: Verify your Supabase URL and service key in `settings.json`.

---

### Sidecar won't start

**Error**: `Cannot find module 'tree-sitter'`

**Solution**: Run `npm install` in the `sidecar` directory.

---

### Frontend won't start

**Error**: `EADDRINUSE: Port 5173 already in use`

**Solution**: Kill the process using port 5173 or change the port in `vite.config.ts`.

---

### Webhooks not received

**Problem**: Pushing code doesn't trigger analysis

**Solution**:

1. Verify ngrok is running and forwarding to port 5000
2. Check GitHub App webhook URL is correct
3. Look at Recent Deliveries in GitHub App settings
4. Verify webhook secret matches `settings.json`

---

### Repository analysis stuck

**Problem**: Analysis status stays "analyzing"

**Solution**:

1. Check backend logs for errors
2. Verify sidecar is running (port 3001)
3. Check Gemini API key is valid
4. For large repos, analysis may take 10+ minutes

---

### Embeddings not generating

**Error**: `Gemini API rate limit exceeded`

**Solution**:

- Wait a few minutes (free tier has quota limits)
- Or upgrade to paid Gemini API tier

---

## Stopping the Application

Press `Ctrl+C` in each terminal window to stop:

1. Frontend (Terminal 3)
2. Sidecar (Terminal 2)
3. Backend (Terminal 1)

Also stop ngrok if running.

## Database Management

### View Data

Use Supabase Studio:

```
https://zhagdkiukasamywvhvvl.supabase.co/project/default/editor
```

### Reset Repository Analysis

To re-analyze a repository:

1. Delete from Supabase:

   ```sql
   DELETE FROM repositories WHERE name = 'your-repo-name';
   ```

   (Cascading delete will remove all related data)

2. Delete local clone:

   ```bash
   rm -rf repos/owner_repo-name.git
   ```

3. Click "Analyze" again in UI

## Production Deployment

**Note**: This is currently set up for local development. For production deployment:

1. **Backend**: Deploy to Azure App Service or Google Cloud Run
2. **Sidecar**: Separate container, load balanced
3. **Frontend**: Build and deploy to Vercel/Netlify
4. **Webhooks**: Update GitHub App with production URL
5. **Secrets**: Use Azure Key Vault or Google Secret Manager
6. **Workers**: Use persistent background service or serverless functions

## Monitoring

### Backend Logs

Check console output for:

- API requests
- Worker job processing
- Integration errors (GitHub, Gemini, Slack)

### Database Queries

Check `webhook_queue` table for job status:

```sql
SELECT id, status, payload->>'action' as action, created_at
FROM webhook_queue
ORDER BY id DESC
LIMIT 10;
```

### Webhook Deliveries

Check GitHub App → Advanced → Recent Deliveries to see webhook attempts and responses.

## Support

For issues or questions, check:

- [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Backend logs for error messages
- Supabase logs for database issues
- GitHub App webhook delivery logs

---

**You're now ready to run CodeFamily!**

Start all three services and navigate to `http://localhost:5173` to begin.

# Sidecar Fix - Tree-sitter Native Compilation

## Problem

Tree-sitter language parsers require native Node.js bindings that need to be compiled. This requires build tools.

## Solution

### Option 1: Use node-gyp rebuild (Recommended)

```powershell
cd d:\ups\team_proj\codeFamily_ai_2\sidecar

# Install dependencies
npm install

# Rebuild native modules
npm rebuild tree-sitter-javascript
npm rebuild tree-sitter-typescript
npm rebuild tree-sitter-python
npm rebuild tree-sitter-go

# Or rebuild all at once
npm rebuild

# Try running
npm run dev
```

### Option 2: If rebuild fails, reinstall individual packages

```powershell
cd d:\ups\team_proj\codeFamily_ai_2\sidecar

# Remove node_modules
rm -r -force node_modules
rm package-lock.json

# Reinstall
npm install

# Run
npm run dev
```

### Option 3: Use prebuilt binaries (if available)

Check if your Node version has prebuilt binaries:

```powershell
node --version  # Make sure you're using Node 18 or 20
```

If you're using an unsupported Node version, switch to Node 18 LTS:

- Download from: https://nodejs.org/
- Install Node 18.x LTS
- Retry installation

## Current Status

✅ **Backend**: Building successfully!
⚠️ **Sidecar**: Needs native module compilation
✅ **Frontend**: Dependencies installed, running

## Next Steps

1. Try Option 1 (npm rebuild)
2. If that works, run: `npm run dev`
3. The sidecar should start on port 3001

Then you can start the backend!

## If Still Failing

The sidecar is optional for initial testing. You can:

1. Start the backend anyway
2. Start the frontend
3. Test OAuth and repository listing
4. The sidecar is only needed for actual code parsing

The main features will work without it initially!

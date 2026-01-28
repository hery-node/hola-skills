---
name: start-server
description: Start development servers for server and web applications. Use when the user says "start server", "start all servers", or wants to run dev servers. Automatically kills existing processes and runs in background mode.
---

# Start Server

Start development servers with bun for both `server/` and `web/` directories in the workspace.

## Trigger Phrases

| Phrase                                           | Action                          |
| ------------------------------------------------ | ------------------------------- |
| "start server", "start all servers", "start dev" | Start both servers normally     |
| "server clean", "clean start", "clean"           | Remove node_modules, then start |

## Directory Structure Expected

```
source/
├── server/        # Backend server (default port: 3000)
│   └── package.json (with "dev" script)
└── web/          # Frontend web app (default port: 5173)
    └── package.json (with "dev" script)
```

## Critical Rules

### 1. Kill Existing Processes First

**Always kill existing server processes before starting new ones** to avoid port conflicts:

```bash
# Kill existing bun processes on server port (3000)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Kill existing bun processes on web port (5173)
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
```

### 2. Run in Background Mode

**Always run servers in background mode** so the AI agent doesn't accidentally terminate them:

```bash
# Use nohup or & to run in background
cd server && nohup bun run dev > /dev/null 2>&1 &

# Or use the run_command tool with background mode
```

When using the `run_command` tool, set a short `WaitMsBeforeAsync` (e.g., 500-1000ms) to send the process to background after startup confirmation.

## Workflows

### Normal Start

1. Find the workspace root containing `server/` and `web/` directories

2. **Kill existing processes** on both ports:

   ```bash
   lsof -ti:3000 | xargs kill -9 2>/dev/null || true
   lsof -ti:5173 | xargs kill -9 2>/dev/null || true
   ```

3. Start server in background:
   ```bash
   cd server && bun run dev
   ```
4. Start web in background:
   ```bash
   cd web && bun run dev
   ```

### Clean Start

Remove dependencies and start fresh:

1. Find the workspace root containing `server/` and `web/` directories

2. **Kill existing processes**:

   ```bash
   lsof -ti:3000 | xargs kill -9 2>/dev/null || true
   lsof -ti:5173 | xargs kill -9 2>/dev/null || true
   ```

3. Remove node_modules:

   ```bash
   rm -rf server/node_modules web/node_modules
   ```

4. Start server in background:

   ```bash
   cd server && bun run dev
   ```

5. Start web in background:
   ```bash
   cd web && bun run dev
   ```

## One-Liner Commands

### Kill and Start Server Only

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null || true; cd server && bun run dev
```

### Kill and Start Web Only

```bash
lsof -ti:5173 | xargs kill -9 2>/dev/null || true; cd web && bun run dev
```

### Kill and Start Both

```bash
# Run these as separate background commands
lsof -ti:3000 | xargs kill -9 2>/dev/null || true; cd server && bun run dev &
lsof -ti:5173 | xargs kill -9 2>/dev/null || true; cd web && bun run dev &
```

## Example Output

```
🔪 Killing existing processes...
✅ Killed process on port 3000
✅ Killed process on port 5173

🚀 Starting servers in background...
✅ Server started on http://localhost:3000
✅ Web started on http://localhost:5173

Both servers are running in background!
```

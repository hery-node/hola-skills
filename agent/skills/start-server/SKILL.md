---
name: start-server
description: Start development servers for server and web applications. Use when the user says "start server", "start all servers", or wants to run dev servers. Supports clean mode to remove node_modules before starting.
---

# Start Server

Start development servers with bun for both `server/` and `web/` directories in the workspace.

## Trigger Phrases

| Phrase | Action |
|--------|--------|
| "start server", "start all servers", "start dev" | Start both servers normally |
| "server clean", "clean start", "clean" | Remove node_modules, then start |

## Directory Structure Expected

```
holacoder/source/
├── server/        # Backend server
│   └── package.json (with "dev" script)
└── web/          # Frontend web app
    └── package.json (with "dev" script)
```

## Workflows

### Normal Start

Start both servers without cleanup:

1. Find the workspace root containing `server/` and `web/` directories
2. Start server in background terminal:
   ```bash
   cd server && bun run dev
   ```
3. Start web in background terminal:
   ```bash
   cd web && bun run dev
   ```

### Clean Start

Remove dependencies and start fresh:

1. Find the workspace root containing `server/` and `web/` directories
2. Remove node_modules:
   ```bash
   rm -rf server/node_modules web/node_modules
   ```
3. Start server in background terminal:
   ```bash
   cd server && bun run dev
   ```
4. Start web in background terminal:
   ```bash
   cd web && bun run dev
   ```

## Important Notes

- **Run in background**: Use separate terminal processes for each server so both run concurrently
- **Check for running servers**: Before starting, check if servers are already running on the ports
- **Report status**: Show which servers started successfully and on which ports
- **Handle errors**: If `bun run dev` fails, report the error to the user

## Example Output

```
Starting development servers...

🧹 Cleaning node_modules...
✅ Removed server/node_modules
✅ Removed web/node_modules

🚀 Starting servers...
✅ Server started on http://localhost:3000
✅ Web started on http://localhost:5173

Both servers are running!
```

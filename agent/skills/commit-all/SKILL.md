---
name: commit-all
description: Commit and push all changes across git repositories. Use when the user says "commit all", "push all", "done", or indicates they have finished their work and want to save/push all changes.
---

# Commit All Changes

When the user indicates they are done with their work, find all git repositories in the workspace and commit/push all changes.

## Trigger Phrases

- "commit all"
- "push all"
- "done"
- "save all changes"
- "I'm finished"

## Workflow

### Step 1: Find All Git Repositories

Search for all `.git` directories in the workspace to identify all git repositories:

```bash
find /path/to/workspace -name ".git" -type d 2>/dev/null
```

### Step 2: For Each Repository

For each git repository found, perform these steps:

#### 2.1 Check for Changes

```bash
git status --porcelain
```

If no changes, skip this repository.

#### 2.2 Stage All Changes

```bash
git add -A
```

#### 2.3 Commit with Simple Message

Create a simple, one-line commit message describing the changes. Keep it short and clear:

```bash
git commit -m "Update: brief description of changes"
```

**Commit message guidelines:**

- One line only, no multi-line messages
- Start with action verb: "Update", "Add", "Fix", "Remove", "Refactor"
- Keep under 50 characters if possible
- Be specific but concise

**Good examples:**

- `"Add voice-input-corrector skill"`
- `"Fix bug in user authentication"`
- `"Update README with new instructions"`
- `"Remove unused dependencies"`

**Bad examples:**

- `"Changes"` (too vague)
- `"Fixed the bug that was causing issues with the login system when users tried to authenticate"` (too long)

#### 2.4 Push to Remote

```bash
git push
```

If push fails due to upstream changes, inform the user rather than force pushing.

## Output Format

Report the results for each repository:

```
## Git Commit Summary

### Repository: /path/to/repo1
- Files changed: 3
- Commit: "Add new feature X"
- ✅ Pushed successfully

### Repository: /path/to/repo2
- No changes detected
- ⏭️ Skipped

### Repository: /path/to/repo3
- Files changed: 1
- Commit: "Fix typo in documentation"
- ❌ Push failed: remote has new changes (pull required)
```

## Important Notes

1. **Always show changes before committing** - List the files that will be committed
2. **Ask for confirmation** if there are many changes (>10 files)
3. **Never force push** - If push fails, inform the user
4. **Skip repos with no changes** - Don't create empty commits

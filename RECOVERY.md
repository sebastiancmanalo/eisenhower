# Recovery Guide

This project is now under Git version control. Use Git commands for recovery instead of relying on editor Timeline.

## Basic Recovery

### View Recent Commits
```bash
git log --oneline
```

### Checkout a Previous Commit
```bash
# View a specific commit
git show <commit-hash>

# Restore a file from a previous commit
git checkout <commit-hash> -- <file-path>

# Temporarily view the project at a previous commit (detached HEAD)
git checkout <commit-hash>
```

### Return to Latest
```bash
# If you're in detached HEAD state
git checkout main
```

## Emergency Recovery

### Reflog (Find Lost Commits)
If you accidentally reset or lost commits:
```bash
# View reflog (history of all HEAD movements)
git reflog

# Recover a lost commit
git checkout <commit-hash-from-reflog>
# Then create a new branch if needed: git checkout -b recovery-branch
```

### Undo Last Commit (Keep Changes)
```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)
```bash
git reset --hard HEAD~1
```

### Discard Uncommitted Changes
```bash
# Discard changes to a specific file
git restore <file-path>

# Discard all uncommitted changes
git restore .
```

## Best Practices

- **Before major changes**: Create a branch or commit current state
- **Regular commits**: Commit frequently with clear messages
- **Use branches**: Create feature branches for experimental work
- **Review before push**: Use `git log` and `git diff` to review before pushing

## Getting Help

```bash
# View Git help for any command
git help <command>

# Example: git help log
```


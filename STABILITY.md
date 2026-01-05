# Stability Guidelines

## Core Rules

- **Never bulk-migrate styles**; one component at a time
- **Don't rename/move files** without updating imports/tests
- **Always run** `npm test` + `npm run build` before stopping
- **Take a snapshot** (`npm run snapshot`) before major refactors
- **Prefer minimal diffs**; avoid "rewrite everything" changes

## Workflow

1. Before major changes: `npm run snapshot`
2. Make focused, incremental changes
3. Before finishing: `npm run preflight` (runs tests + build)
4. Commit only when tests pass and build succeeds


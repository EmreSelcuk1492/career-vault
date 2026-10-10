#!/usr/bin/env bash
# auto-stage.sh (PostToolUse). Fires after every Write/Edit and stages whatever
# changed. Silent on success. Always exits 0 so it never breaks the agent flow.
set -u

REPO="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$REPO" 2>/dev/null || exit 0
[ -d ".git" ] || exit 0

# Do not touch state mid-merge, mid-rebase, or mid-bisect.
if [ -e ".git/MERGE_HEAD" ] || [ -e ".git/REBASE_HEAD" ] || [ -d ".git/rebase-merge" ] || [ -e ".git/BISECT_LOG" ]; then
  exit 0
fi

# Stage everything, respecting .gitignore. -A picks up new, modified, and deleted files.
git add -A 2>/dev/null || true

exit 0

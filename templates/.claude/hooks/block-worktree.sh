#!/usr/bin/env bash
# block-worktree.sh (PreToolUse). Worktrees are disabled for this vault: all
# work happens directly on main. Exit 2 blocks the tool call and shows the
# reason to the agent. Parses the hook JSON with grep only, so it needs no
# python or jq.
set -u

INPUT=$(cat 2>/dev/null || true)
[ -n "$INPUT" ] || exit 0

tool=$(printf '%s' "$INPUT" | grep -Eo '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"([^"]*)"$/\1/')

bad=0
case "$tool" in
  EnterWorktree) bad=1 ;;
  Agent)
    printf '%s' "$INPUT" | grep -Eq '"isolation"[[:space:]]*:[[:space:]]*"worktree"' && bad=1 ;;
  Bash)
    printf '%s' "$INPUT" | grep -Eq '\bgit\b[^;&|]*\bworktree[[:space:]]+add\b' && bad=1 ;;
esac

if [ "$bad" = "1" ]; then
  echo "Blocked: worktrees are disabled in this vault. Work directly on main (see the rules in the manual)." >&2
  exit 2
fi
exit 0

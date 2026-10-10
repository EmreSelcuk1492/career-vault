#!/usr/bin/env bash
# auto-commit.sh (Stop hook). "Pushed upon completion": commit anything that
# changed, push in the foreground, then verify the repo is clean and even with
# the remote's main. If not, exit 2 so the agent has to fix it before finishing.
# If this hook already blocked once (stop_hook_active), warn instead of looping.
#
# A vault with no remote yet: the hook commits locally and asks you to add one.
set -u

REPO="${CLAUDE_PROJECT_DIR:-$(pwd)}"
INPUT=$(cat 2>/dev/null || true)
ACTIVE=0
printf '%s' "$INPUT" | grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true' && ACTIVE=1

PROBLEMS=""
COMMITTED=0
cd "$REPO" 2>/dev/null || exit 0
[ -d ".git" ] || exit 0

if [ -e ".git/MERGE_HEAD" ] || [ -e ".git/REBASE_HEAD" ] || [ -d ".git/rebase-merge" ] || [ -e ".git/BISECT_LOG" ]; then
  PROBLEMS="$PROBLEMS\n- mid-merge or mid-rebase, so nothing was committed"
else
  git add -A 2>/dev/null || true
  if ! git diff --cached --quiet 2>/dev/null; then
    NUM=$(git diff --cached --name-only | wc -l | tr -d ' ')
    FILES=$(git diff --cached --name-only | head -5 | sed 's|^|- |')
    EXTRA=""
    [ "$NUM" -gt 5 ] && EXTRA=$'\n- and '"$((NUM - 5))"' more'
    if git commit -q -m "auto: $NUM file(s) updated, $(date '+%Y-%m-%d %H:%M')" -m "$(printf '%s%s' "$FILES" "$EXTRA")" >/dev/null 2>&1; then
      COMMITTED=1
    else
      PROBLEMS="$PROBLEMS\n- commit failed (is git user.name / user.email set? run: git config --global user.name \"Your Name\" && git config --global user.email you@example.com)"
    fi
  fi

  if git remote | grep -q .; then
    if git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
      if [ -n "$(git log --oneline '@{u}..HEAD' 2>/dev/null)" ]; then
        git push -q 2>/dev/null || PROBLEMS="$PROBLEMS\n- push failed (check network and remote access)"
      fi
    else
      git push -q -u origin HEAD 2>/dev/null || PROBLEMS="$PROBLEMS\n- first push failed (check that the remote exists and you have access)"
    fi
    git fetch -q 2>/dev/null
    AHEAD=$(git rev-list --count '@{u}..HEAD' 2>/dev/null || echo "?")
    [ "$AHEAD" != "0" ] && PROBLEMS="$PROBLEMS\n- $AHEAD commit(s) not on the remote"
  elif [ "$COMMITTED" = "1" ]; then
    PROBLEMS="$PROBLEMS\n- committed locally, but this vault has no remote. Create an empty private repo on GitHub, then run: git remote add origin <url> && git push -u origin main"
  fi

  [ -n "$(git status --porcelain)" ] && PROBLEMS="$PROBLEMS\n- uncommitted changes remain"
  BR=$(git branch --show-current 2>/dev/null)
  [ -n "$BR" ] && [ "$BR" != "main" ] && PROBLEMS="$PROBLEMS\n- on branch '$BR', not main"
fi

if [ -n "$PROBLEMS" ]; then
  if [ "$ACTIVE" = "1" ]; then
    printf "Push-on-completion warning (already retried once):%b\n" "$PROBLEMS" >&2
    exit 0
  fi
  printf "Not done yet: everything must be committed and pushed to main before finishing.%b\nFix these, then finish.\n" "$PROBLEMS" >&2
  exit 2
fi
exit 0

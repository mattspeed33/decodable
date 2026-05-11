#!/usr/bin/env bash
# Rotates the ANTHROPIC_API_KEY across Vercel (3 envs) and .env.local.
# Reads the new key from the macOS clipboard (pbpaste). The key value never
# appears in command output: stdin pipe to vercel, and a here-doc to sed via
# Node so $K is never expanded into a shell error message.
#
# Usage:
#   1. Copy the new key to clipboard (e.g. from password manager)
#   2. bash rotate-anthropic.sh
#
# Safe to re-run; idempotent except for vercel rm which will warn if missing.

set -euo pipefail
set +x  # belt-and-suspenders: do not echo commands

K=$(pbpaste | tr -d '\n\r ')

if [[ -z "$K" ]]; then
  echo "clipboard is empty — copy the new key first" >&2
  exit 1
fi
if [[ ! "$K" =~ ^sk-ant- ]]; then
  echo "clipboard does not look like an Anthropic key (expected sk-ant-...)" >&2
  exit 1
fi

echo "[1/5] removing existing ANTHROPIC_API_KEY from all 3 envs (ignoring missing)..."
npx vercel env rm ANTHROPIC_API_KEY production --yes >/dev/null 2>&1 || true
npx vercel env rm ANTHROPIC_API_KEY preview --yes >/dev/null 2>&1 || true
npx vercel env rm ANTHROPIC_API_KEY development --yes >/dev/null 2>&1 || true

echo "[2/5] adding to production..."
printf '%s' "$K" | npx vercel env add ANTHROPIC_API_KEY production --no-sensitive --yes >/dev/null

echo "[3/5] adding to preview..."
printf '%s' "$K" | npx vercel env add ANTHROPIC_API_KEY preview "" --no-sensitive --yes >/dev/null

echo "[4/5] adding to development..."
printf '%s' "$K" | npx vercel env add ANTHROPIC_API_KEY development --yes >/dev/null

echo "[5/5] updating .env.local..."
# Use node so the value is never expanded into a shell argument visible in errors.
ANTHROPIC_NEW_KEY="$K" node -e '
  const fs = require("fs");
  const path = ".env.local";
  const key = process.env.ANTHROPIC_NEW_KEY;
  let content = fs.readFileSync(path, "utf8");
  const line = `ANTHROPIC_API_KEY="${key}"`;
  if (/^ANTHROPIC_API_KEY=/m.test(content)) {
    content = content.replace(/^ANTHROPIC_API_KEY=.*$/m, line);
  } else {
    if (!content.endsWith("\n")) content += "\n";
    content += line + "\n";
  }
  fs.writeFileSync(path, content);
'

unset K
echo "done — key rotated on Vercel (prod/preview/dev) and updated in .env.local"

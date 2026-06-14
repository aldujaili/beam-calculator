#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs Python and Node dependencies so tests and linters work out of the box.
set -euo pipefail

# Only run in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$PROJECT_DIR"

echo "[session-start] Installing Python dependencies..."
python3 -m pip install --quiet -r requirements.txt

echo "[session-start] Installing Node dependencies for wa-structural-inspection-app..."
(cd wa-structural-inspection-app && npm install --no-audit --no-fund)

# Tests import top-level modules (e.g. beam_deflection) directly, so make the
# project root importable for the whole session.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PYTHONPATH=\"$PROJECT_DIR:\${PYTHONPATH:-}\"" >> "$CLAUDE_ENV_FILE"
fi

echo "[session-start] Done."

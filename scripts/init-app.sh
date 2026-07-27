#!/bin/bash
# Run once, right after cloning this template to create a new derived app
# (e.g. `git clone concept-book-base cb-newsubject && cd cb-newsubject &&
# bash scripts/init-app.sh`).
#
# Fixes the one identity field that CANNOT be auto-derived at build/run time:
# package.json's "name" field (npm has no notion of "infer from folder").
# vite.config.js's `base` needs no fixing here — it already derives itself
# from this repo's own folder name at build time (see vite.config.js).
#
# This script is deterministic and idempotent: safe to re-run, does not
# touch anything requiring human judgment (branding, catalog content).
set -euo pipefail

cd "$(dirname "$0")/.."
APP_NAME="$(basename "$(pwd)")"

if [ "$APP_NAME" = "concept-book-base" ]; then
  echo "[init-app] Refusing to run inside concept-book-base itself." >&2
  echo "[init-app] Clone it to a new directory first, then run this script there." >&2
  exit 1
fi

echo "[init-app] Detected app name from folder: $APP_NAME"

if [ ! -f package.json ]; then
  echo "[init-app] package.json not found — run this from the repo root." >&2
  exit 1
fi

python3 - "$APP_NAME" << 'PYEOF'
import json
import sys
from pathlib import Path

app_name = sys.argv[1]
path = Path("package.json")
data = json.loads(path.read_text())
old_name = data.get("name")
data["name"] = app_name
path.write_text(json.dumps(data, indent=2) + "\n")
print(f"[init-app] package.json: \"name\" {old_name!r} -> {app_name!r}")
PYEOF

echo ""
echo "[init-app] Done. vite.config.js base and package.json name now match this folder."
echo ""
echo "[init-app] Still manual (domain-specific, can't be auto-derived — see CLAUDE.md"
echo "[init-app] 'Extension points'):"
echo "  - src/config.js appConfig.logoImage   (branding, optional)"
echo "  - src/i18n.js 'app.title'             (defaults to 'ConceptBook', optional)"
echo "  - public/domains/catalog.json         (starts empty [] — add domains via"
echo "                                          concept-book-press ingestion or"
echo "                                          scripts/sync_from_press.py)"
echo "  - index.html <title>                  (defaults to 'ConceptBook', optional)"
echo ""
echo "[init-app] First deploy: npm install && npm run deploy"
echo "[init-app] (creates the gh-pages branch; GitHub Pages won't show a source"
echo "[init-app]  in Settings -> Pages until that branch exists with content)"

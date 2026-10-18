#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
npm ci --prefix desktop
node desktop/node_modules/electron/install.js
npm ci --prefix web
python3 scripts/dictionaries.py
npm run build --prefix web
cargo build --release --locked
python3 scripts/notices.py
python3 scripts/license_audit.py

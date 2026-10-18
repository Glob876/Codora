#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
npm ci --prefix web
npm run build --prefix web
cargo build --release --locked
python3 scripts/notices.py
python3 scripts/license_audit.py

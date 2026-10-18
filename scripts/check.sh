#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
python3 -m unittest discover -s scripts -p '*_test.py'
npm test --prefix desktop
web/node_modules/.bin/prettier --check "desktop/*.cjs" desktop/package.json
npm run check --prefix web
npm run format:check --prefix web
npm test --prefix web
npm run build --prefix web
cargo fmt --all --check
cargo test --locked
cargo clippy --all-targets --locked -- -D warnings
npm audit --prefix web --audit-level=low
npm audit --prefix desktop --audit-level=low
python3 scripts/notices.py
python3 scripts/license_audit.py

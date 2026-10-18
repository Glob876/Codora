#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
npm run check --prefix web
npm run format:check --prefix web
npm test --prefix web
npm run build --prefix web
cargo fmt --all --check
cargo test --locked
cargo clippy --all-targets --locked -- -D warnings
npm audit --prefix web --audit-level=low
python3 scripts/notices.py
python3 scripts/license_audit.py

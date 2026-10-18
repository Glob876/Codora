#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -x "$project_root/target/release/codora" || ! -x "$project_root/desktop/node_modules/.bin/electron" ]]; then
  "$project_root/scripts/build.sh"
fi
# Browser/server mode is explicit; normal launch always owns a desktop window.
for arg in "$@"; do
  if [[ "$arg" == "--no-open" || "$arg" == "--browser" || "$arg" == "--help" || "$arg" == "-h" ]]; then
    args=()
    for item in "$@"; do [[ "$item" == "--browser" ]] || args+=("$item"); done
    exec "$project_root/target/release/codora" "${args[@]}"
  fi
done
exec "$project_root/desktop/node_modules/.bin/electron" "$project_root/desktop" "$@"

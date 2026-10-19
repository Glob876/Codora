#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# Console builds do not need Node, Electron, dictionaries or web/dist.
if [[ "${1:-}" == "console" || "${1:-}" == "--console" ]]; then
  shift
  if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    echo 'Usage: ./run.sh console [folder] [file ...]'
    echo 'Ctrl+S save | Ctrl+P files | Ctrl+E commands | Ctrl+Q quit | F1 help'
    exit 0
  fi
  (
    cd -- "$project_root"
    cargo build --release --locked --no-default-features --target-dir target/console
  )
  exec "$project_root/target/console/release/codora" console "$@"
fi
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

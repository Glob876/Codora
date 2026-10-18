#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -x "$project_root/target/release/typoha" ]]; then
  "$project_root/scripts/build.sh"
fi
if [[ $# -eq 0 ]]; then
  exec "$project_root/target/release/typoha" "$project_root/examples"
fi
exec "$project_root/target/release/typoha" "$@"

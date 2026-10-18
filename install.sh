#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
[[ "$(uname -s)" == Linux ]] || { echo 'Codora installation is currently supported on Linux only.' >&2; exit 1; }
command -v python3 >/dev/null || { echo 'Install Python 3, then run this command again.' >&2; exit 1; }
[[ "$EUID" != 0 ]] || { echo 'Run install.sh as a regular user, without sudo.' >&2; exit 1; }
build=true
args=("$@")
while [[ "$#" -gt 0 ]]; do
  arg="$1"
  case "$arg" in
    --uninstall|--help|-h|--no-build) build=false ;;
    --prefix) [[ "$#" -gt 1 && -n "$2" ]] || { echo '--prefix requires a directory.' >&2; exit 1; }; shift ;;
    *) echo "Unknown argument: $arg. Use --help." >&2; exit 1 ;;
  esac
  shift
done
if [[ "$build" == true && ! -f "$root/resources/app/bin/codora-core" ]]; then
  [[ -f "$root/Cargo.toml" ]] || { echo 'Run install.sh from a complete Codora source checkout or desktop package.' >&2; exit 1; }
  for tool in node npm cargo rustup; do
    command -v "$tool" >/dev/null || { echo "Installing from source requires $tool. See README.md for build requirements." >&2; exit 1; }
  done
  "$root/scripts/build.sh"
fi
exec python3 "$root/scripts/install.py" "${args[@]}"

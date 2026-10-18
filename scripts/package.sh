#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
./scripts/build.sh
package_name="typoha-0.1.0-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m)"
package_dir="artifacts/$package_name"
mkdir -p "$package_dir/docs"
cp target/release/typoha LICENSE README.md THIRD_PARTY_NOTICES.md "$package_dir/"
cp -R docs/licenses "$package_dir/docs/"
cp docs/parity.md docs/clean-room.md docs/dependencies.json "$package_dir/docs/"
# Ship committed sample documents only, never local drafts or private notes.
git archive HEAD examples | tar -x -C "$package_dir"
tar -czf "artifacts/$package_name.tar.gz" -C artifacts "$package_name"
sha256sum "artifacts/$package_name.tar.gz" > "artifacts/$package_name.tar.gz.sha256"

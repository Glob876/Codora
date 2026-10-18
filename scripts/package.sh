#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
# Package one committed revision so the binary and its sources stay together.
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Commit project changes before packaging." >&2
  exit 1
fi
./scripts/build.sh
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Build updated tracked files; commit them before packaging." >&2
  exit 1
fi
package_name="codora-0.1.0-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m)"
package_dir="artifacts/$package_name"
mkdir -p "$package_dir/docs"
cp target/release/codora LICENSE COPYRIGHT README.md README.ru.md AGENTS.md THIRD_PARTY_NOTICES.md "$package_dir/"
cp -R docs/licenses docs/screenshots docs/dictionary-notices "$package_dir/docs/"
cp docs/parity.md docs/clean-room.md docs/architecture.md docs/verification.md docs/dependencies.json docs/licensing.md docs/legacy-MIT.txt "$package_dir/docs/"
# Ship committed sample documents only, never local drafts or private notes.
git archive HEAD examples | tar -x -C "$package_dir"
source_dir="$(mktemp -d "$PWD/artifacts/codora-source.XXXXXX")"
trap 'rm -rf -- "$source_dir"' EXIT
git archive HEAD | tar -x -C "$source_dir"
mkdir -p "$source_dir/.cargo"
(
  cd -- "$source_dir"
  cargo vendor --locked --versioned-dirs vendor/cargo > .cargo/config.toml
)
cp -a web/node_modules "$source_dir/web/"
cp -a desktop/node_modules "$source_dir/desktop/"
mkdir -p "$source_dir/web/public"
cp -a web/public/dictionaries "$source_dir/web/public/"
git rev-parse HEAD > "$source_dir/SOURCE-COMMIT"
cat > "$source_dir/SOURCE-BUILD.md" <<'BUILD'
# Rebuild Codora from this source archive

The exact project revision is in SOURCE-COMMIT. Rust crates and npm dependencies
are included. On the same platform as the binary, with the Rust toolchain from
rust-toolchain.toml, Node.js 24+, and a C/C++ linker installed, run:

```sh
npm run build --prefix web
cargo build --release --locked --offline
./target/release/codora ./examples --no-open
./desktop/node_modules/.bin/electron ./desktop ./examples
```

Run these commands from this archive's root. Cargo uses .cargo/config.toml and
vendor/cargo. The frontend uses the included web/node_modules and local dictionaries. The
desktop shell uses the included desktop/node_modules with its platform runtime. Do not run npm ci
or scripts/build.sh for an offline rebuild: they fetch dependencies again.
The compiler, Node.js and OS toolchain are not included. Other target platforms
may need their own platform-specific build tools and npm packages.

Original project license: AGPL-3.0-or-later; see LICENSE and COPYRIGHT.
Dependency notices: THIRD_PARTY_NOTICES.md and docs/licenses/.
BUILD
tar -czf "artifacts/$package_name-source.tar.gz" -C "$source_dir" .
cp "artifacts/$package_name-source.tar.gz" "$package_dir/source.tar.gz"
tar -czf "artifacts/$package_name.tar.gz" -C artifacts "$package_name"
sha256sum "artifacts/$package_name.tar.gz" > "artifacts/$package_name.tar.gz.sha256"
sha256sum "artifacts/$package_name-source.tar.gz" > "artifacts/$package_name-source.tar.gz.sha256"

./scripts/package-desktop.sh

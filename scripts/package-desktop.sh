#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
# Called after package.sh has built and archived the exact committed sources.
[[ "$(uname -s)" == Linux ]] || { echo "Desktop packaging is currently verified on Linux only." >&2; exit 1; }
package_name="codora-0.1.0-linux-$(uname -m)"
source_archive="$PWD/artifacts/$package_name-source.tar.gz"
[[ -f "$source_archive" ]] || { echo "Run scripts/package.sh first." >&2; exit 1; }
desktop_name="$package_name-desktop"
destination="$PWD/artifacts/$desktop_name"
[[ ! -e "$destination" ]] || { echo "Desktop package already exists: $destination" >&2; exit 1; }
mkdir -p "$destination"
cp -a desktop/node_modules/electron/dist/. "$destination/"
mv "$destination/electron" "$destination/codora"
rm -f "$destination/resources/default_app.asar"
app_dir="$destination/resources/app"
mkdir -p "$app_dir/bin"
cp desktop/package.json desktop/main.cjs desktop/backend.cjs desktop/preload.cjs desktop/icon.svg desktop/icon.png "$app_dir/"
cp target/release/codora "$app_dir/bin/codora-core"
cp LICENSE COPYRIGHT README.md README.ru.md THIRD_PARTY_NOTICES.md "$destination/"
cp -a docs "$destination/docs"
cp "$source_archive" "$destination/source.tar.gz"
# Source files/notes are never taken from an uncommitted working directory.
git archive HEAD examples | tar -x -C "$destination"
cat > "$destination/Codora.desktop" <<'DESKTOP'
[Desktop Entry]
Type=Application
Name=Codora
Comment=Local Markdown editor
Exec=codora
Terminal=false
Categories=Office;TextEditor;
DESKTOP
cat > "$destination/install-menu.sh" <<'INSTALL'
#!/usr/bin/env bash
set -euo pipefail
app_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# Quote a desktop Exec argument without shell evaluation.
python3 - "$app_root" <<'PY'
import os, pathlib, sys
root = pathlib.Path(sys.argv[1])
target = pathlib.Path(os.environ.get('XDG_DATA_HOME', pathlib.Path.home() / '.local/share')) / 'applications/codora.desktop'
target.parent.mkdir(parents=True, exist_ok=True)
exe = str(root / 'codora').replace('\\', '\\\\').replace('"', '\\"').replace('`', '\\`').replace('$', '\\$').replace('%', '%%')
target.write_text('[Desktop Entry]\nType=Application\nName=Codora\nComment=Local Markdown editor\nExec="' + exe + '"\nIcon=' + str(root / 'resources/app/icon.svg') + '\nTerminal=false\nCategories=Office;TextEditor;\n')
print('Codora added to the application menu.')
PY
INSTALL
chmod +x "$destination/install-menu.sh"
tar -czf "artifacts/$desktop_name.tar.gz" -C artifacts "$desktop_name"
sha256sum "artifacts/$desktop_name.tar.gz" > "artifacts/$desktop_name.tar.gz.sha256"

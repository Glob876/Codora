#!/usr/bin/env python3
"""Collect exact dependency metadata and unmodified license notices.

Run after npm ci and cargo fetch. Includes development/platform dependencies
conservatively; the binary does not distribute the build tool implementations.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs' / 'licenses'
OUTPUT.mkdir(parents=True, exist_ok=True)
# This directory contains generated notices only, never hand-authored files.
for previous in OUTPUT.iterdir():
    if previous.is_file() and previous.name.startswith(('cargo-', 'npm-', 'electron-runtime-')):
        previous.unlink()
metadata = json.loads(subprocess.check_output(['cargo', 'metadata', '--format-version', '1'], cwd=ROOT))
records = []
missing = []
# khroma's distributed manifest omits the license field; the package's license
# file explicitly grants MIT. Keep this narrow override with the original text.
manifest_overrides = {'khroma': 'MIT'}

def collect(ecosystem, name, version, license_expression, folder, source, dev=False):
    if name == 'codora':
        return
    key = re.sub(r'[^a-zA-Z0-9_.-]', '_', f'{ecosystem}-{name}-{version}')
    files = []
    for p in sorted(folder.iterdir()):
        if p.is_file() and p.name.lower().startswith(('license', 'licence', 'copying', 'notice', 'copyright')):
            dest = OUTPUT / f'{key}-{p.name}'
            dest.write_bytes(p.read_bytes())
            files.append(str(dest.relative_to(ROOT)))
    if not files:
        fallback = []
        if ecosystem == 'cargo' and name == 'r-efi':
            fallback = [folder / 'AUTHORS']
        elif ecosystem == 'cargo' and name in ('winapi-i686-pc-windows-gnu', 'winapi-x86_64-pc-windows-gnu'):
            # The 0.4.0 import-library crates omit root licenses via their include
            # list. They belong to winapi-rs; retain that repository's MIT grant
            # distributed in the parent winapi 0.3.9 crate.
            fallback = [folder.parent / 'winapi-0.3.9/LICENSE-MIT',
                        folder.parent / 'winapi-0.3.9/LICENSE-APACHE']
        elif ecosystem == 'npm' and name == '@electron-internal/extract-zip':
            # Upstream 1.0.5 declares BSD-2-Clause but omits the grant text even
            # from its release commit. Retain its README; exception in licensing.md.
            fallback = [folder / 'README.md']
        elif ecosystem == 'npm' and name in ('fastdom', 'strictdom'):
            # These exact distributed README files contain the complete MIT grant.
            fallback = [folder / 'README.md']
        elif ecosystem == 'npm' and name == '@rolldown/binding-linux-x64-gnu':
            fallback = [ROOT / 'web/node_modules/rolldown/LICENSE']
        else:
            fallback = list((ROOT / 'docs/upstream-licenses').glob(f'{name}-{version}-*LICENSE*'))
        for p in fallback:
            if p.is_file():
                dest = OUTPUT / f'{key}-{p.name}'
                dest.write_bytes(p.read_bytes())
                files.append(str(dest.relative_to(ROOT)))
    if not files:
        missing.append(f'{ecosystem} {name}@{version}')
    records.append({'ecosystem':ecosystem, 'name':name, 'version':version,
                    'license':license_expression, 'development_only':dev,
                    'source':source, 'notices':files})

for p in metadata['packages']:
    collect('cargo', p['name'], p['version'], p['license'] or 'UNKNOWN',
            Path(p['manifest_path']).parent, p.get('repository') or p.get('source'), False)
for npm_root in ('web', 'desktop'):
    lock = json.loads((ROOT / npm_root / 'package-lock.json').read_text())
    for location, entry in lock['packages'].items():
        if not location:
            continue
        folder = ROOT / npm_root / location
        manifest = folder / 'package.json'
        if not manifest.is_file():
            continue
        p = json.loads(manifest.read_text())
        name = p.get('name', location.split('node_modules/')[-1])
        if any(r['ecosystem'] == 'npm' and r['name'] == name and r['version'] == entry['version'] for r in records):
            continue
        collect('npm', name, entry['version'], p.get('license') or manifest_overrides.get(name, 'UNKNOWN'),
                folder, entry.get('resolved') or p.get('homepage'), entry.get('dev', False))
# Electron's MIT wrapper is not the whole runtime. Preserve the complete bundled
# Chromium/Node/FFmpeg notice inventory without changing its license texts.
electron = ROOT / 'desktop/node_modules/electron'
version = json.loads((electron / 'package.json').read_text())['version']
collect('electron-runtime', 'electron', version, 'MIT AND LicenseRef-Chromium-ThirdParty',
        electron / 'dist', f'https://github.com/electron/electron/releases/tag/v{version}')
records.sort(key=lambda p:(p['ecosystem'],p['name'],p['version']))
(ROOT / 'docs/dependencies.json').write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
lines = ['# Third-party notices', '',
         'Generated from Cargo.lock, cargo metadata, package-lock.json and installed package license files.',
         'License texts are preserved without modification under docs/licenses/. Development and platform dependencies are included conservatively.', '',
         '## License choices', '',
         '- For Rust dual/triple expressions offering MIT, the MIT option is selected; other AND clauses (BSD-3-Clause, Unicode-3.0) still apply.',
         '- DOMPurify is used under its Apache-2.0 option.',
         '- The frontend runtime dependencies otherwise use permissive MIT/ISC/BSD/Apache/Unlicense terms. No vendor assets are distributed.',
         '- MPL-2.0 packages in the build toolchain (Lightning CSS) are not bundled into the app. Their license notices and exact package source URLs are nevertheless retained.',
         '- Mermaid 11.17.2 is selected instead of the 12.x ELK-containing distribution, avoiding the EPL-licensed optional runtime in this build.',
         '- Electron runtime includes Chromium, Node and FFmpeg under their individual licenses; the complete bundled LICENSES.chromium.html is retained. See docs/licensing.md for distribution limitations.',
         '- The build-only @electron-internal/extract-zip 1.0.5 omits the full BSD grant upstream; its README declaration is retained. This documented exception needs resolution before public source-archive distribution (docs/licensing.md).',
         '- khroma omits its manifest license field; its distributed license file explicitly grants MIT.',
         '', '| Ecosystem | Package | License | Scope | Notices |', '| --- | --- | --- | --- | --- |']
for p in records:
    notice_links = ', '.join(f'[{Path(n).name.split(p["version"]+"-",1)[-1]}]({n})' for n in p['notices']) or 'See source'
    lines.append(f'| {p["ecosystem"]} | {p["name"]} {p["version"]} | {p["license"]} | {"build/test" if p["development_only"] else "runtime/platform or Rust test dependency"} | {notice_links} |')
lines += ['', '## Regeneration', '', '`python3 scripts/notices.py` after `npm ci --prefix web` and `cargo fetch`.', '',
          'The original project code is licensed separately in LICENSE. These notices do not relicense dependencies or constitute legal clearance.']
(ROOT / 'THIRD_PARTY_NOTICES.md').write_text('\n'.join(lines)+'\n')
print(f'{len(records)} dependency records, {len(list(OUTPUT.iterdir()))} notice files')
if missing:
    print('Packages without top-level notice files (inspect before distribution):\n'+'\n'.join(missing))
    raise SystemExit(1)

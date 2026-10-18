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
    if previous.is_file() and previous.name.startswith(('cargo-', 'npm-')):
        previous.unlink()
metadata = json.loads(subprocess.check_output(['cargo', 'metadata', '--format-version', '1'], cwd=ROOT))
lock = json.loads((ROOT / 'web/package-lock.json').read_text())
records = []
missing = []
# khroma's distributed manifest omits the license field; the package's license
# file explicitly grants MIT. Keep this narrow override with the original text.
manifest_overrides = {'khroma': 'MIT'}

def collect(ecosystem, name, version, license_expression, folder, source, dev=False):
    if name == 'typoha':
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
for location, entry in lock['packages'].items():
    if not location:
        continue
    folder = ROOT / 'web' / location
    manifest = folder / 'package.json'
    if not manifest.is_file():  # optional dependency for a different platform
        continue
    p = json.loads(manifest.read_text())
    name = p.get('name', location.split('node_modules/')[-1])
    collect('npm', name, entry['version'], p.get('license') or manifest_overrides.get(name, 'UNKNOWN'),
            folder, entry.get('resolved') or p.get('homepage'), entry.get('dev', False))
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

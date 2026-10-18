#!/usr/bin/env python3
"""Fetch pinned Electron dictionaries at build time; no runtime Internet access."""
import hashlib
import io
from pathlib import Path
import urllib.request
import zipfile

root = Path(__file__).resolve().parents[1]
url = 'https://github.com/electron/electron/releases/download/v44.9.0/hunspell_dictionaries.zip'
expected = '41fc02332fc7cc2ea7230409de1bbe5d0a44b3a45b85f6d3acdaddd2b2047d8f'
cache = root / 'desktop/node_modules/.cache/typoha-dictionaries.zip'
cache.parent.mkdir(parents=True, exist_ok=True)
if not cache.exists():
    cache.write_bytes(urllib.request.urlopen(url, timeout=60).read())
data = cache.read_bytes()
if hashlib.sha256(data).hexdigest() != expected:
    raise SystemExit('Dictionary checksum mismatch; remove desktop/node_modules/.cache/typoha-dictionaries.zip and retry.')
destination = root / 'web/public/dictionaries'
destination.mkdir(parents=True, exist_ok=True)
notices = root / 'docs/dictionary-notices'
notices.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(io.BytesIO(data)) as archive:
    for name in ('en-US-10-1.bdic', 'ru-RU-3-0.bdic'):
        # Chromium requests lowercase file names on some platforms.
        (destination / name.lower()).write_bytes(archive.read(name))
    for name in archive.namelist():
        if name.startswith(('LICENSE', 'COPYING')):
            (notices / name).write_bytes(archive.read(name))
print('Pinned Russian and English dictionaries installed locally.')

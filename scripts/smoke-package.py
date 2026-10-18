#!/usr/bin/env python3
"""Verify a release archive from outside its source tree (stdlib only)."""
import json
import re
import subprocess
import tarfile
import tempfile
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[1]
archive = root / 'artifacts/codora-0.1.0-linux-x86_64.tar.gz'
# Explicit loopback HTTP: ambient proxy settings must not send local tests out.
http = urllib.request.build_opener(urllib.request.ProxyHandler({}))
with tempfile.TemporaryDirectory(prefix='codora-package-') as directory:
    with tarfile.open(archive) as tar:
        assert not any('/.typoha/' in n or '/node_modules/' in n for n in tar.getnames())
        tar.extractall(directory, filter='data')
    package = Path(directory) / 'codora-0.1.0-linux-x86_64'
    notes = Path(directory) / 'notes'
    notes.mkdir()
    source = '# Автономная сборка\n\nРаботает без исходников.\n'
    (notes / 'test.md').write_text(source)
    process = subprocess.Popen([str(package / 'codora'), str(notes), '--no-open'], cwd=directory,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        process.stdout.readline()
        line = process.stdout.readline()
        url = re.search(r'http://[^\s]+', line).group()
        origin, token = url.split('/#')
        index = http.open(origin, timeout=10).read().decode()
        asset = re.search(r'src="([^"]+\.js)"', index).group(1)
        assert http.open(origin + asset, timeout=10).status == 200
        request = urllib.request.Request(origin + '/api/document?path=test.md', headers={'x-codora-token': token})
        document = json.load(http.open(request, timeout=10))
        assert document['content'] == source
        print('Standalone archive: binary, embedded JavaScript, authenticated UTF-8 document access passed.')
    finally:
        process.terminate()
        process.wait(timeout=5)

#!/usr/bin/env python3
"""Install a self-contained Linux desktop build for one user (stdlib only)."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import shlex
import shutil
import sys
import tempfile

MARKER = 'Codora user installation v1'
SOURCE = Path(__file__).resolve().parents[1]
PAYLOAD_NAMES = [
    'codora', 'chrome-sandbox', 'chrome_crashpad_handler', 'chrome_100_percent.pak',
    'chrome_200_percent.pak', 'icudtl.dat', 'libffmpeg.so', 'libvk_swiftshader.so',
    'libvulkan.so.1', 'locales', 'resources', 'resources.pak', 'snapshot_blob.bin',
    'v8_context_snapshot.bin', 'version', 'vk_swiftshader_icd.json', 'LICENSE',
    'LICENSES.chromium.html', 'COPYRIGHT', 'THIRD_PARTY_NOTICES.md', 'README.md',
    'README.ru.md', 'docs', 'source.tar.gz', 'install.sh',
]


def atomic(path, data, mode=0o644):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.codora-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(name, mode)
        os.replace(name, path)
    finally:
        Path(name).unlink(missing_ok=True)


def desktop_quote(value):
    # Desktop Exec has its own quoting rules, independent of shell quoting.
    for old, new in [('\\', '\\\\'), ('"', '\\"'), ('`', '\\`'), ('$', '\\$'), ('%', '%%')]:
        value = value.replace(old, new)
    # The desktop string-value escaping is decoded before Exec quoting.
    return '"' + value.replace('\\', '\\\\') + '"'


def copy_payload(destination):
    packaged = SOURCE / 'resources/app/bin/codora-core'
    if packaged.is_file():
        for name in PAYLOAD_NAMES:
            item = SOURCE / name
            if item.is_dir():
                shutil.copytree(item, destination / name, symlinks=True)
            elif item.is_file():
                shutil.copy2(item, destination / name)
        (destination / 'scripts').mkdir()
        shutil.copy2(SOURCE / 'scripts/install.py', destination / 'scripts/install.py')
    else:
        runtime = SOURCE / 'desktop/node_modules/electron/dist'
        core = SOURCE / 'target/release/codora'
        if not (runtime / 'electron').is_file() or not core.is_file():
            raise ValueError('No desktop build found. Run ./install.sh without --no-build.')
        shutil.copytree(runtime, destination, dirs_exist_ok=True, symlinks=True)
        (destination / 'electron').rename(destination / 'codora')
        (destination / 'resources/default_app.asar').unlink(missing_ok=True)
        app = destination / 'resources/app'
        (app / 'bin').mkdir(parents=True)
        for name in ['package.json', 'main.cjs', 'backend.cjs', 'preload.cjs', 'icon.svg', 'icon.png']:
            shutil.copy2(SOURCE / 'desktop' / name, app / name)
        shutil.copy2(core, app / 'bin/codora-core')
        for name in ['LICENSE', 'COPYRIGHT', 'THIRD_PARTY_NOTICES.md', 'README.md', 'README.ru.md', 'install.sh']:
            shutil.copy2(SOURCE / name, destination / name)
        shutil.copytree(SOURCE / 'docs', destination / 'docs')
        (destination / 'scripts').mkdir()
        shutil.copy2(SOURCE / 'scripts/install.py', destination / 'scripts/install.py')
    for name in ['codora', 'resources/app/bin/codora-core', 'resources/app/icon.png']:
        if not (destination / name).is_file():
            raise ValueError('Incomplete desktop package: ' + name)
    for name in ['codora', 'resources/app/bin/codora-core']:
        if not os.access(destination / name, os.X_OK):
            raise ValueError('Desktop executable has no execute permission: ' + name)


def install(prefix, uninstall=False):
    base = prefix / 'lib/codora'
    marker = base / '.codora-install.json'
    launcher = prefix / 'bin/codora'
    remover = prefix / 'bin/codora-uninstall'
    if base.is_symlink() or marker.is_symlink():
        raise ValueError('Refusing a symbolic link at the installation directory or marker.')
    metadata = json.loads(marker.read_text()) if marker.is_file() else {}
    managed = metadata.get('owner') == MARKER
    data_home = prefix / 'share'
    if prefix == Path.home() / '.local' and Path(os.environ.get('XDG_DATA_HOME', '.')).is_absolute():
        data_home = Path(os.environ['XDG_DATA_HOME'])
    if managed and 'data_home' in metadata:
        data_home = Path(metadata['data_home'])
    if not data_home.is_absolute() or any(c in str(data_home) for c in '\n\r\t'):
        raise ValueError('Desktop data directory must be an absolute path without control characters.')
    desktop = data_home / 'applications/codora.desktop'
    icon = data_home / 'icons/hicolor/512x512/apps/codora.png'
    paths = [launcher, remover, desktop, icon]
    if base.exists() and not managed:
        raise ValueError('Installation directory is not managed by Codora: ' + str(base))
    for path in paths:
        if path.is_symlink() or (path.exists() and not path.is_file()):
            raise ValueError('Refusing to replace a symbolic link or directory: ' + str(path))
        if path.exists() and not managed:
            raise ValueError('Refusing to overwrite an existing file: ' + str(path))
        if path.exists() and path != icon and MARKER.encode() not in path.read_bytes():
            raise ValueError('Integration file was replaced by another program: ' + str(path))
    if uninstall:
        if not managed:
            print('Codora is not installed at ' + str(prefix))
            return
        for path in paths:
            path.unlink(missing_ok=True)
        shutil.rmtree(base)
        print('Codora removed. Documents, drafts and user settings were preserved.')
        return
    if SOURCE == base or base in SOURCE.parents:
        raise ValueError('To update, run install.sh from a new package or source checkout.')
    if SOURCE in base.parents:
        raise ValueError('Choose an installation prefix outside the source/package directory.')
    base.mkdir(parents=True, exist_ok=True)
    releases = base / 'releases'
    if releases.is_symlink():
        raise ValueError('Refusing a symbolic link at releases.')
    releases.mkdir(exist_ok=True)
    current = base / 'current'
    if current.exists() and not current.is_symlink():
        raise ValueError('Expected a managed current symlink.')
    previous = os.readlink(current) if current.is_symlink() else None
    if previous is not None and (Path(previous).is_absolute() or len(Path(previous).parts) != 2 or Path(previous).parts[0] != 'releases'):
        raise ValueError('Current symlink points outside managed releases.')
    release = Path(tempfile.mkdtemp(prefix='build-', dir=releases))
    old = {p: (p.read_bytes(), p.stat().st_mode & 0o777) if p.exists() else None for p in paths + [marker]}
    switched = False
    try:
        copy_payload(release)
        app = base / 'current'
        run = f'#!/bin/sh\n# {MARKER}\nexec {shlex.quote(str(app / "codora"))} "$@"\n'
        remove = f'#!/bin/sh\n# {MARKER}\nexec python3 {shlex.quote(str(app / "scripts/install.py"))} --uninstall --prefix {shlex.quote(str(prefix))}\n'
        icon_value = str(icon).replace('\\', '\\\\')
        entry = f'[Desktop Entry]\n# {MARKER}\nType=Application\nName=Codora\nComment=Local code and Markdown editor\nExec={desktop_quote(str(launcher))}\nIcon={icon_value}\nTerminal=false\nCategories=Utility;TextEditor;\nStartupWMClass=Codora\n'
        atomic(launcher, run.encode(), 0o755)
        atomic(remover, remove.encode(), 0o755)
        atomic(icon, (release / 'resources/app/icon.png').read_bytes())
        atomic(desktop, entry.encode())
        atomic(marker, (json.dumps({'owner': MARKER, 'data_home': str(data_home)}) + '\n').encode())
        link = base / '.current-next'
        link.unlink(missing_ok=True)
        link.symlink_to('releases/' + release.name)
        os.replace(link, current)
        switched = True
    except Exception:
        for path, value in old.items():
            if value is None:
                path.unlink(missing_ok=True)
            else:
                atomic(path, *value)
        raise
    finally:
        if not switched:
            shutil.rmtree(release)
            if not managed:
                shutil.rmtree(base)
    # Keep old payloads: an existing running window may still load runtime files.
    print('Codora installed at ' + str(base))
    print('Open Codora from the application menu, or run: ' + shlex.quote(str(launcher)))
    print('Remove it with: ' + shlex.quote(str(remover)))
    if str(prefix / 'bin') not in os.environ.get('PATH', '').split(os.pathsep):
        print('For the codora command, add this to ~/.profile and reopen your terminal:')
        print('export PATH=' + shlex.quote(str(prefix / 'bin')) + ':"$PATH"')


def main():
    parser = argparse.ArgumentParser(description='Install Codora for the current Linux user, without sudo.')
    parser.add_argument('--prefix', type=Path, default=Path.home() / '.local', help='installation prefix (default: ~/.local)')
    parser.add_argument('--uninstall', action='store_true', help='remove this installation, preserving documents and settings')
    parser.add_argument('--no-build', action='store_true', help='use an existing source build (developer option)')
    args = parser.parse_args()
    if sys.platform != 'linux' or os.geteuid() == 0:
        parser.exit(1, 'Run as a regular Linux user, without sudo.\n')
    prefix = args.prefix.expanduser().absolute()
    if any(c in str(prefix) for c in '\n\r\t='):
        parser.exit(1, 'Installation paths cannot contain tabs, line breaks or an equals sign.\n')
    (prefix / 'lib').mkdir(parents=True, exist_ok=True)
    lock = prefix / 'lib/.codora-install.lock'
    try:
        fd = os.open(lock, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, 'w') as stream:
            fcntl.flock(stream, fcntl.LOCK_EX)
            install(prefix, args.uninstall)
    except (OSError, ValueError) as error:
        parser.exit(1, 'Codora installation failed: ' + str(error) + '\n')


if __name__ == '__main__':
    main()

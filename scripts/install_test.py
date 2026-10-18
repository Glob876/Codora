"""Exercise installation in disposable prefixes; never touch the real user profile."""
import importlib.util
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import tarfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('install.py')
spec = importlib.util.spec_from_file_location('codora_install', SCRIPT)
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class InstallationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='codora-installer-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.package = self.root / 'package'
        self.package.mkdir()
        self.prefix = self.root / 'user prefix $d `literal` % "quoted"'
        self.app = self.package / 'resources/app'
        (self.app / 'bin').mkdir(parents=True)
        for path in [self.package / 'codora', self.app / 'bin/codora-core']:
            path.write_text('#!/bin/sh\nprintf "%s\\n" "$@"\n')
            path.chmod(0o755)
        (self.app / 'icon.png').write_bytes(b'original-icon')
        (self.package / 'source.tar.gz').write_bytes(b'corresponding-source')
        (self.package / 'private-note.md').write_text('never install local notes')
        (self.package / 'scripts').mkdir()
        shutil.copy2(SCRIPT, self.package / 'scripts/install.py')
        shutil.copy2(SCRIPT.parents[1] / 'install.sh', self.package / 'install.sh')
        self.source = patch.object(installer, 'SOURCE', self.package)
        self.source.start()
        self.addCleanup(self.source.stop)

    def install(self):
        installer.install(self.prefix)
        return self.prefix / 'lib/codora/current'

    def test_self_contained_install_launch_and_remove_preserves_documents(self):
        current = self.install()
        self.assertTrue(current.is_symlink())
        self.assertFalse((current / 'private-note.md').exists())
        self.assertEqual((current / 'source.tar.gz').read_bytes(), b'corresponding-source')
        self.assertEqual((self.prefix / 'share/icons/hicolor/512x512/apps/codora.png').read_bytes(), b'original-icon')
        entry = (self.prefix / 'share/applications/codora.desktop').read_text()
        self.assertIn('%%', entry)
        self.assertIn('\\\\"quoted\\\\"', entry)
        if shutil.which('desktop-file-validate'):
            subprocess.run(['desktop-file-validate', str(self.prefix / 'share/applications/codora.desktop')], check=True)
        args = ['notes with spaces', '$(touch should-not-exist)', '--file']
        run = subprocess.run([str(self.prefix / 'bin/codora'), *args], text=True, capture_output=True, check=True)
        self.assertEqual(run.stdout.splitlines(), args)
        document = self.prefix / 'share/my-notes.md'
        document.write_text('unsaved draft remains')
        installer.install(self.prefix, uninstall=True)
        self.assertEqual(document.read_text(), 'unsaved draft remains')
        self.assertFalse(current.parent.exists())
        self.assertFalse((self.prefix / 'bin/codora').exists())
        self.assertFalse((self.prefix / 'share/applications/codora.desktop').exists())

    def test_update_switches_payload_and_keeps_previous_running_version(self):
        current = self.install()
        previous = current.resolve()
        (self.package / 'version').write_text('new payload')
        self.install()
        self.assertNotEqual(current.resolve(), previous)
        self.assertTrue(previous.exists())
        self.assertEqual((current / 'version').read_text(), 'new payload')

    def test_failed_update_rolls_back_integrations_and_current(self):
        current = self.install()
        previous = current.resolve()
        launcher = self.prefix / 'bin/codora'
        original = launcher.read_bytes()
        atomic = installer.atomic
        failed = False

        def fail_once(path, *args):
            nonlocal failed
            if path.name == 'codora.desktop' and not failed:
                failed = True
                raise OSError('simulated write failure')
            return atomic(path, *args)

        with patch.object(installer, 'atomic', side_effect=fail_once):
            with self.assertRaisesRegex(OSError, 'simulated'):
                self.install()
        self.assertEqual(current.resolve(), previous)
        self.assertEqual(launcher.read_bytes(), original)
        self.assertEqual(list((current.parent / 'releases').iterdir()), [previous])

    def test_unrelated_existing_launcher_is_never_overwritten(self):
        target = self.prefix / 'bin/codora'
        target.parent.mkdir(parents=True)
        target.write_text('another program')
        with self.assertRaisesRegex(ValueError, 'overwrite'):
            self.install()
        self.assertEqual(target.read_text(), 'another program')

    def test_symlink_installation_cannot_delete_external_files(self):
        outside = self.root / 'outside'
        outside.mkdir()
        sentinel = outside / 'keep'
        sentinel.write_text('keep')
        base = self.prefix / 'lib/codora'
        base.parent.mkdir(parents=True)
        base.symlink_to(outside)
        for uninstall in [False, True]:
            with self.assertRaisesRegex(ValueError, 'symbolic link'):
                installer.install(self.prefix, uninstall=uninstall)
        self.assertEqual(sentinel.read_text(), 'keep')

    def test_invalid_payload_does_not_leave_a_partial_installation(self):
        (self.package / 'codora').unlink()
        with self.assertRaisesRegex(ValueError, 'Incomplete'):
            self.install()
        self.assertFalse((self.prefix / 'lib/codora').exists())
        self.assertFalse((self.prefix / 'bin/codora').exists())

    def test_package_entry_point_and_installed_uninstaller(self):
        if os.geteuid() == 0:
            self.skipTest('entry point intentionally refuses root')
        subprocess.run([str(self.package / 'install.sh'), '--prefix', str(self.prefix)], check=True, capture_output=True)
        # The installed payload must survive moving/removing the extracted package.
        shutil.rmtree(self.package)
        subprocess.run([str(self.prefix / 'bin/codora'), 'still-independent'], check=True, capture_output=True)
        subprocess.run([str(self.prefix / 'bin/codora-uninstall')], check=True, capture_output=True)
        self.assertFalse((self.prefix / 'lib/codora').exists())

    def test_xdg_menu_location_is_remembered_for_uninstall(self):
        home = self.root / 'home'
        self.prefix = home / '.local'
        data = self.root / 'xdg-data'
        with patch.object(Path, 'home', return_value=home):
            with patch.dict(os.environ, {'XDG_DATA_HOME': str(data)}):
                self.install()
            self.assertTrue((data / 'applications/codora.desktop').is_file())
            with patch.dict(os.environ, {'XDG_DATA_HOME': str(self.root / 'different-data')}):
                installer.install(self.prefix, uninstall=True)
        self.assertFalse((data / 'applications/codora.desktop').exists())

    def test_desktop_packager_includes_a_working_installer(self):
        source = self.root / 'release-source'
        runtime = source / 'desktop/node_modules/electron/dist'
        (runtime / 'resources').mkdir(parents=True)
        shutil.copy2(self.package / 'codora', runtime / 'electron')
        (runtime / 'resources/default_app.asar').write_text('default electron app')
        (source / 'target/release').mkdir(parents=True)
        shutil.copy2(self.app / 'bin/codora-core', source / 'target/release/codora')
        for name in ['package.json', 'main.cjs', 'backend.cjs', 'preload.cjs', 'icon.svg', 'icon.png']:
            (source / 'desktop' / name).write_text('{}' if name == 'package.json' else 'fixture')
        (source / 'scripts').mkdir()
        shutil.copy2(SCRIPT, source / 'scripts/install.py')
        shutil.copy2(SCRIPT.with_name('package-desktop.sh'), source / 'scripts/package-desktop.sh')
        shutil.copy2(self.package / 'install.sh', source / 'install.sh')
        for name in ['LICENSE', 'COPYRIGHT', 'README.md', 'README.ru.md', 'THIRD_PARTY_NOTICES.md']:
            (source / name).write_text('fixture')
        (source / 'docs').mkdir()
        (source / 'docs/keep').write_text('notices')
        (source / 'examples').mkdir()
        (source / 'examples/note.md').write_text('# Original fixture')
        (source / 'artifacts').mkdir()
        name = 'codora-0.1.0-linux-' + os.uname().machine
        (source / 'artifacts' / (name + '-source.tar.gz')).write_bytes(b'corresponding-source')
        subprocess.run(['git', 'init', '-q', str(source)], check=True)
        subprocess.run(['git', '-C', str(source), 'add', 'examples'], check=True)
        subprocess.run(['git', '-C', str(source), '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'fixture'], check=True)
        subprocess.run(['bash', str(source / 'scripts/package-desktop.sh')], check=True, capture_output=True)
        with tarfile.open(source / 'artifacts' / (name + '-desktop.tar.gz')) as archive:
            names = archive.getnames()
        for required in ['install.sh', 'scripts/install.py', 'codora', 'resources/app/bin/codora-core', 'source.tar.gz', 'docs/keep']:
            self.assertIn(name + '-desktop/' + required, names)
        payload = source / 'artifacts' / (name + '-desktop')
        with patch.object(installer, 'SOURCE', payload):
            self.install()
        self.assertTrue((self.prefix / 'lib/codora/current/scripts/install.py').is_file())


if __name__ == '__main__':
    unittest.main()

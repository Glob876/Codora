#!/usr/bin/env python3
"""Exercise the real console binary over a Unix PTY, in a disposable workspace."""
import errno
import fcntl
import os
from pathlib import Path
import pty
import select
import signal
import struct
import sys
import tempfile
import termios
import time

binary = str(Path(sys.argv[1] if len(sys.argv) > 1 else 'target/debug/codora').resolve())
with tempfile.TemporaryDirectory(prefix='codora-console-smoke-') as root:
    pid, master = pty.fork()
    if pid == 0:
        os.environ['TERM'] = 'xterm-256color'
        os.execv(binary, [binary, 'console', root])
    fcntl.ioctl(master, termios.TIOCSWINSZ, struct.pack('HHHH', 32, 110, 0, 0))
    output = bytearray()
    reaped = False

    def wait_for(predicate, message):
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            if predicate():
                return
            if select.select([master], [], [], .1)[0]:
                try:
                    data = os.read(master, 65536)
                except OSError as exc:
                    if exc.errno == errno.EIO:
                        break
                    raise
                if not data:
                    break
                output.extend(data)
        raise AssertionError(message + '\n' + output[-2500:].decode(errors='replace'))

    def send(data):
        output.clear()
        os.write(master, data)

    try:
        wait_for(lambda: b'Command palette' in output, 'welcome screen missing')
        assert b'////////////////' in output, 'ASCII logo missing'
        send(b'\x0e')  # Ctrl+N
        wait_for(lambda: b'Untitled' in output, 'new tab missing')
        send(b'\x1b[200~' + 'print("Привет")\n'.encode() + b'\x1b[201~')
        wait_for(lambda: 'Привет'.encode() in output, 'UTF-8 paste missing')
        send(b'\x13')  # Ctrl+S
        wait_for(lambda: b'Save as' in output, 'save dialog missing')
        send(b'smoke.py\r')
        path = Path(root) / 'smoke.py'
        wait_for(lambda: path.exists(), 'file was not saved')
        assert path.read_text() == 'print("Привет")\n'
        send(b'\x1b[15~')  # F5
        wait_for(lambda: b'exit 0' in output, 'Python did not finish')
        assert 'Привет'.encode() in output
        send(b'\x1b[200~# local\n\x1b[201~')
        wait_for(lambda: b'local' in output, 'edit missing')
        path.write_text('external\n')
        send(b'\x13')
        wait_for(lambda: 'Файл изменён'.encode() in output, 'save conflict missing')
        assert path.read_text() == 'external\n', 'external file overwritten'
        assert list((Path(root) / '.typoha/drafts').glob('*.json')), 'recovery draft missing'
        send(b'\x11')
        wait_for(lambda: b'Discard' in output, 'quit confirmation missing')
        send(b'\x1b')
        # Avoid treating Esc followed by Ctrl+Q as an Alt sequence.
        wait_for(lambda: b'Cancelled' in output, 'quit cancellation missing')
        send(b'\x11')
        wait_for(lambda: b'Discard' in output, 'second quit confirmation missing')
        send(b'd')
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            # Keep draining PTY so terminal cleanup cannot block on a full buffer.
            if select.select([master], [], [], .05)[0]:
                try:
                    output.extend(os.read(master, 65536))
                except OSError as exc:
                    if exc.errno != errno.EIO:
                        raise
            found, status = os.waitpid(pid, os.WNOHANG)
            if found:
                reaped = True
                assert os.waitstatus_to_exitcode(status) == 0
                break
        assert reaped, 'console failed to quit'
        assert b'\x1b[?1049l' in output, 'alternate screen not restored'
        print('Console PTY smoke passed: ASCII welcome, UTF-8 paste/save, Python, conflict/draft, cancel/discard, terminal cleanup.')
    finally:
        if not reaped:
            os.killpg(pid, signal.SIGKILL)
            os.waitpid(pid, 0)
        os.close(master)

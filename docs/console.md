# Codora in your terminal

Run from the checkout:

```bash
./run.sh console
./run.sh console /path/to/workspace
./run.sh console /path/to/workspace README.md src/main.rs
./run.sh console /path/to/file.py
./run.sh console --help
```

The first run builds a Rust-only binary under `target/console/release/`. It needs
rustup (the pinned toolchain) and a C/C++ linker; Node, npm, Electron, a browser,
a display server and `web/dist` are not required. Later runs reuse Cargo's cache.
The caller's current directory remains the default workspace. The console does
not start a web server or open a port. Existing full builds also accept
`target/release/codora console …`. After reinstalling an updated desktop package,
the installed launcher accepts `codora console …` and dispatches directly to the
Rust binary. A graphical terminal with UTF-8 and ANSI color support is recommended;
SSH and ordinary interactive TTYs work too. Console UI text is currently English.

The original ASCII Codora wordmark appears on the welcome screen. There are no
editing modes: type immediately, use Shift+arrows to select, and open the command
palette with Ctrl+E. The palette lists all implemented commands and filters as you
type. It provides alternatives for shortcuts intercepted by your terminal.

| Action | Shortcut |
| --- | --- |
| New document / open file | Ctrl+N / Ctrl+P (or Ctrl+O) |
| Save / save as | Ctrl+S / Alt+S |
| Close tab / quit | Ctrl+W / Ctrl+Q |
| Previous / next tab | Alt+Left / Alt+Right |
| Command palette / help | Ctrl+E / F1 |
| Focus file tree / editor | F2; arrows and Enter browse |
| Find / next / previous | Ctrl+F / F3 / Shift+F3 |
| Replace all / go to line | Ctrl+R / Ctrl+G |
| Search workspace | Ctrl+Shift+F, or command palette |
| Undo / redo / select all | Ctrl+Z / Ctrl+Y / Ctrl+A |
| Copy / cut / paste | Ctrl+C / Ctrl+X / Ctrl+V |
| Complete document word | Ctrl+Space |
| Indent / unindent | Tab / Shift+Tab |
| Markdown text preview | F4; arrows/PgUp/PgDn; Esc closes |
| Save and run Python / output | F5 / F6 |
| Focus mode | F8 |
| Cancel dialog / hide output | Esc |

Copy/cut/paste use an editor clipboard shared across tabs. To paste from the
system clipboard, use your terminal's paste shortcut; bracketed paste prevents
pasted newlines or control sequences from invoking editor commands. Copying to
the system clipboard is not implemented. Text files retain UTF-8, their final
newline and uniform LF/CRLF endings. Enter inherits the current indentation.
Autocomplete offers words from the current document, not TypeScript semantics.
There is no code syntax highlighting or live diagnostics in this first terminal
version. Long lines scroll horizontally; soft wrapping in the source editor is
not implemented. Minimum terminal size is 30 columns × 10 rows.

## Shared document operations

File listing, literal/regex workspace search, opening, revision-checked atomic
save, previous-version history, rename/move, new folders, recoverable trash and
restoration all call the same `Workspace` implementation as the desktop editor.
The sidebar shows a collapsible tree, with sibling folders before files; Ctrl+P
provides fuzzy matching. Ctrl+O inside that picker enters a relative path directly.
Binary files are not editable. Workspace boundaries and symlink restrictions
are identical to desktop behavior. Console startup uses the explicit folder or
current directory; it does not replace the desktop's remembered workspace.

Dirty tabs write `.typoha/drafts` after 600 ms of inactivity, before saves, tab
switches and quit. The welcome status reports available recovery drafts.
**Recover draft** and **Version history** open unsaved copies so recovering cannot
overwrite the current document. Save that copy under a new name. A successful save
clears its recovery entry. Explicit Discard clears that tab's draft; closing or
quitting otherwise asks Save / Discard / Cancel. A save conflict leaves both the
external file and a recovery draft intact. Autosave is off by default and can be
enabled in the palette for named files; a conflict disables automatic retries.
Tabs and undo stacks are not restored automatically after restart. A process
killed before the debounce expires can lose the latest keystrokes.

The command palette also includes heading navigation, Markdown insertions and
formatting, hidden files, indentation width, three console palettes (dark, light,
terminal colors), line numbers and focus mode. Console settings live under the
`console` key in workspace preferences without replacing desktop settings.

Python uses the existing `Runner`: F5 saves first, `.venv` is preferred, stdout,
stderr, status and exit code appear below. **Send input to Python** and **Stop
Python** are in the palette. Output is capped at 256 KiB. Hiding it does not stop
the process. Quitting stops it; Unix descendants use the existing process-group
cleanup. Python runs with your user permissions, without a filesystem or network
sandbox. Console mode is a script runner, not a shell or a terminal emulator.

Pandoc import/export uses the same local sandboxed conversion adapter as the
web API. Install Pandoc separately. Input and output paths stay inside the
workspace; export creates a new file and refuses existing paths. DOCX/ODT/RTF/EPUB,
HTML and several text formats are supported. This first version waits for conversion completion (up to 60 seconds);
terminal input resumes when Pandoc finishes.

## Graphical differences

The Markdown preview is styled terminal text with headings, emphasis, lists,
tasks, code and tables. TeX, Mermaid, raw HTML and image references retain their
source representation; they are not rendered graphically. PDF/PNG export,
printing, visual WYSIWYG editing, image uploads, spellcheck, desktop extensions,
custom CSS/fonts/transparency, interface translations and semantic JS/TS
completion are unavailable in the terminal. The desktop interface remains the
way to use those features. This version does not claim full desktop parity.

## Verification

```bash
cargo test --locked
cargo clippy --all-targets --locked -- -D warnings
cargo test --no-default-features --locked
cargo build --no-default-features --locked
python3 scripts/smoke-console.py target/debug/codora
```

The smoke test requires a Unix PTY and Python 3; it uses temporary workspaces,
not your documents. Unit tests cover conflict recovery, UTF-8/CRLF preservation,
history, explicit close decisions, workspace boundaries, undo/replace, clipboard,
recovery copies, settings isolation, tree order, terminal sizes and Python output.

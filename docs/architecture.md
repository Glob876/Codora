# Architecture and extension points

## Data flow

UTF-8 Markdown is the durable document representation. Rust serves bundled browser assets and authenticated loopback APIs. The client keeps one active document, path, disk revision and dirty state. Rich editing uses independently licensed Milkdown/ProseMirror; source editing uses CodeMirror. The renderer is separate from editing and cleans active HTML through DOMPurify.

1. Open returns exact text and a SHA-256 revision.
2. Initial editor rendering does not mark a document dirty or replace its stored source. A synchronous ProseMirror plugin observes real document changes, avoiding delayed initialization callbacks.
3. Edits update memory and an emergency tab copy when browser storage permits. Server drafts are debounced separately.
4. Save passes the previously read revision. Rust compares disk contents, writes a previous-version snapshot, fsyncs a temporary sibling, then renames the new file into place. Conflicts return HTTP 409.
5. Workspace identity is carried by the client and rechecked while the filesystem mutex is held. A stale window cannot save to another window's newly selected folder.

The compare-and-replace protocol protects ordinary editor/external modification workflows. It does not claim to eliminate all races with a hostile external process changing files between OS calls. Workspace directories must be trusted local user directories; this is not a multi-user file server.

## Modules

- `src/core.rs`: synchronous filesystem operations, revisions, history, trash, draft persistence, search, workspace boundary.
- `src/server.rs`: loopback authentication/origin policy, workspace scope, HTTP adapters, sandboxed Pandoc process adapter and bundled static files.
- `src/main.rs`: CLI, listener lifecycle, private desktop handshake/parent-pipe watchdog and explicit browser/server mode.
- `desktop/main.cjs`, `preload.cjs`, `backend.cjs`: sandboxed Electron window, narrowly scoped native dialogs/printing IPC and Rust child lifecycle. No Node API is exposed to document content.
- `web/src/model.ts`: pure headings, statistics, fuzzy matching, syntax compatibility and asset paths.
- `web/src/render.ts`: Markdown/KaTeX/Mermaid/footnotes/alerts rendering and sanitation.
- `web/src/api.ts`: authenticated transport, per-run token and workspace identity.
- `web/src/commands.ts`: menu/command metadata.
- `web/src/main.ts`: active-document coordinator and UI events.
- `web/src/settings.ts` and `web/src/shell.ts`: settings and application shell.
- `web/src/escape.ts`: HTML escaping shared by UI and renderer. The renderer is loaded on demand.
- `web/src/extensions.ts`: compile-time extension contract.

## Adding a feature

Create an `EditorExtension`, import it in `extensions.ts`, and append it to `extensions`. The menu/palette includes its commands. A command receives only the documented application operations:

```ts
const insertTimestamp: EditorExtension = {
  id: "timestamp",
  commands: [{
    id: "insert",
    label: "Вставить дату",
    run: ({ insertMarkdown }) => insertMarkdown(new Date().toISOString()),
  }],
};
```

For persistent file features, add a core operation, its failure-path tests, an authenticated API route and a client command. Never pass a shell command from Markdown or an untrusted template. Only explicit allowlisted Pandoc formats are accepted; the app does not include or download Pandoc.

## Persistence

A workspace contains `.typoha/history`, `.typoha/trash`, `.typoha/drafts`, `.typoha/config`. Keep these out of source control and consider them when backing up a workspace. History is path-based; moving a file does not yet migrate its history. Browser preferences are a cache. Rust stores workspace options in `.typoha/config/preferences.json` and application appearance in `appearance.json` beside the session file. Appearance takes precedence across folder changes and restarts; only an explicit allowlist of interface keys is shared, never recent/pinned paths or custom CSS. Startup migrates existing workspace appearance, and folder changes await pending preference writes. Emergency copies belong to the originating browser tab and are subject to browser storage limits.

## Runtime and packaging

Release builds embed the built `web/dist` assets. `build.rs` invalidates the Rust build when these assets change, so a UI-only edit cannot silently leave a stale embedded release. Node and Rust are build dependencies. Normal `run.sh` launches the pinned Electron shell; server-only and browser modes remain explicit options. Desktop packaging includes Chromium, so no existing browser or WebKit development packages are required. Windows/macOS are not validated yet.

The Rust `--desktop` protocol sends one JSON capability URL over a private stdout pipe. Closing the parent's stdin pipe gracefully stops the server, including after a shell crash. The shell never prints or persists this URL. Chromium uses a nonpersistent, cache-disabled session; token/sessionStorage remains in memory. Workspace settings and drafts continue through the Rust API. Window size and position are not persisted yet.

The preload exposes only explicit file/folder selection, print and PDF generation. IPC checks the sender window, main frame and local origin. The renderer has sandbox/context isolation, no Node integration or webviews. Permissions are denied except local editor clipboard writes and fullscreen. Navigation cannot replace the editor with an external page. Explicit external links open in the system browser. Export downloads display a save dialog. Closing a dirty window can be canceled through the native dialog; choosing to discard is explicit. Application-menu quit follows the same beforeunload path.

Russian/English dictionaries are fetched at build time from a pinned Electron archive with verified SHA-256 and embedded as static assets. The spellchecker fetches those assets from the local Rust server, never the Chromium CDN. Other dictionary languages are not currently bundled. Context-menu suggestions and standard edit actions are available. No updater, telemetry or remote dictionary service is enabled.

## Document tabs and preferences

`main.ts` keeps per-document Markdown, revision, dirty flag, draft ID, mode and scroll offset in memory. Source tabs also retain CodeMirror state (selection and undo history). A tab switch awaits the outgoing draft write before replacing the editor; closing and changing workspace ask about dirty documents. All tabs belong to the current Rust workspace. On workspace change they are closed after this check; tabs are not a persisted session. Rich editor undo history is recreated when mounting another tab. Rename/trash of a path with other open tabs is blocked until those tabs close.

`settings-panel.ts` owns the preferences draft and categorized UI. Changes preview without writing preferences; Save commits through Rust, Cancel/Escape restores the original settings. `themes.ts` supplies original local palettes; the three custom colors override accent, panels and text. New settings should be added to `Settings`, `defaults`, the appropriate category and relevant behavior. Motion uses CSS and respects both the explicit setting and the OS preference. The default desktop backend root remains a local folder (the existing home directory in packaged builds, examples in development), while the new tab hides its tree until the user opens a folder or requests the sidebar.

## Tree, localization and transparent surfaces

`file-tree.ts` converts the flat scoped Rust listing into a depth-first tree. Siblings are sorted independently; filters retain matching ancestors, and collapsed paths suppress every descendant. Filtering never changes the on-disk hierarchy.

`icons.ts` serializes only explicitly imported Lucide SVG nodes into decorative non-focusable SVG. New icons must be added to this local allowlist. `i18n.ts` owns the four-language interface catalog and reversible chrome translation. A mutation observer handles newly generated application controls, skips editor-only mutations, and excludes document editors, file paths, outline titles, search hits, draft/history lists and input values. Add new interface strings to the catalog; explicitly translate parameterized messages with `tr`. Locale selection and background opacity use the same draft/commit/cancel preferences transaction. Rust error messages are still returned verbatim.

`appearance.ts` clamps opacity and derives the panel value (+4 p.p., capped at 100%). CSS surfaces use color-mix with transparent; no whole-window opacity is applied, so text stays sharp. The desktop shell enables an alpha background at construction; renderer window-control IPC accepts only minimize/maximize/close from the trusted main frame. Native file/folder pickers and unsaved-close messages follow the selected language. Transparent resizable windows depend on platform composition; default opacity is 100% and export/print remain opaque.

## Code editing and application session

`web/src/code-editor.ts` resolves local CodeMirror language packages by filename,
adds completion providers without replacing language-specific providers, and configures
indentation. `web/src/intelligence.ts` uses TypeScript's language service with an
in-memory host and local ES5 library; no filesystem or network access is exposed.
To add a snippet/keyword family, extend the tables in code-editor.ts. For whole-project
language tooling, introduce an explicitly designed Rust-controlled transport; the
current service intentionally supports one document only.

`src/session.rs` owns session reads/atomic writes. `Workspace::change_root` writes the
new canonical root before committing the workspace switch, so a persistence failure
is surfaced and leaves the active workspace unchanged. Desktop passes `--session-file`
in Electron's userData directory and `--fallback-workspace` for first launch; browser
mode uses XDG_CONFIG_HOME/Codora/session.json (HOME/.config fallback), or APPDATA on
Windows. Explicit positional roots override remembered state. Missing/deleted folders
and invalid session files cause a visible startup error; supplying a valid explicit
folder repairs the session. Tokens and document contents never enter session.json.
The `.typoha` workspace metadata namespace and legacy preference keys are retained.

## Python execution

`src/runner.rs` owns one explicit Python process at a time, independently of HTTP.
`POST /api/run` accepts a workspace-relative `.py` path and expected saved revision.
It resolves the path through Workspace, checks the revision and launches the file
without a shell, using its parent directory as cwd. Root `.venv/bin/python`
(`.venv/Scripts/python.exe` on Windows) is preferred; otherwise the host's Python
is used (`python3`/`python` on Unix, `py -3`/`python` on Windows). No packages or
interpreters are installed automatically. Scripts run with the user's permissions;
the subprocess is not a filesystem/network sandbox.

`GET /api/run?id=...` returns bounded in-memory stdout/stderr, completion and exit
status. `POST /api/run/control` takes the run id and optional `input` string;
input is forwarded as a line, while an absent input requests Stop. All endpoints
use the existing capability/origin/workspace checks. Output is capped at 256 KiB,
then drained without retaining more bytes; input lines are limited to 8 KiB.
There is no runtime deadline. A workspace switch is refused while its script runs.
On Unix, each run has a dedicated process group, killed on Stop/completion or task
shutdown. The direct child is reaped and stdin/output tasks are closed. Other
platforms currently kill the direct child only; descendant cleanup is unverified.

`web/src/run-panel.ts` owns panel rendering/polling/control. The editor saves dirty
or untitled Python files before launching, and cancels launch if Save is cancelled,
conflicted, or further edits remain unsaved. Hiding the panel does not stop the run.
F5 runs Python or shows the current run. This is a script runner, not a terminal
emulator, debugger, REPL, environment/package manager or general shell execution API.

`preferences.rs` owns preference validation, atomic persistence and the shared appearance allowlist independently of HTTP. New application-wide appearance keys must be added to that allowlist; workspace-specific paths and custom CSS must remain outside it.

## Terminal frontend

`src/console.rs` uses Ratatui, Crossterm and tui-textarea. The `console` CLI branch
runs before any HTTP listener is created. All document I/O calls Workspace and
Python execution uses Runner. `src/conversion.rs` contains the Pandoc adapter
shared with server.rs. The `web` Cargo feature embeds the frontend and is enabled
by default; `--no-default-features` builds a terminal-only executable without
web assets or HTTP dependencies. run.sh keeps this build in target/console so
it cannot replace the desktop backend. Console preferences use a separate nested
key in existing workspace settings. See console.md for key bindings and limits.

Console settings are loaded and validated in `src/console_config.rs` from the
workspace metadata directory. Extend its typed Settings, validation, template
`console.example.toml` and `docs/console-config.md` together. UI rendering consumes
validated options; document I/O remains in Workspace. Palette commands atomically
save TOML after checking that the loaded source has not changed on disk.

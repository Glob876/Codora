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

A workspace contains `.typoha/history`, `.typoha/trash`, `.typoha/drafts`, `.typoha/config`. Keep these out of source control and consider them when backing up a workspace. History is path-based; moving a file does not yet migrate its history. Browser preferences are a cache; workspace configuration is authoritative across restarts. Emergency copies belong to the originating browser tab and are subject to browser storage limits.

## Runtime and packaging

Release builds embed the built `web/dist` assets. `build.rs` invalidates the Rust build when these assets change, so a UI-only edit cannot silently leave a stale embedded release. Node and Rust are build dependencies. Normal `run.sh` launches the pinned Electron shell; server-only and browser modes remain explicit options. Desktop packaging includes Chromium, so no existing browser or WebKit development packages are required. Windows/macOS are not validated yet.

The Rust `--desktop` protocol sends one JSON capability URL over a private stdout pipe. Closing the parent's stdin pipe gracefully stops the server, including after a shell crash. The shell never prints or persists this URL. Chromium uses a nonpersistent, cache-disabled session; token/sessionStorage remains in memory. Workspace settings and drafts continue through the Rust API. Window size and position are not persisted yet.

The preload exposes only folder selection, print and PDF generation. IPC checks the sender window, main frame and local origin. The renderer has sandbox/context isolation, no Node integration or webviews. Permissions are denied except local editor clipboard writes and fullscreen. Navigation cannot replace the editor with an external page. Explicit external links open in the system browser. Export downloads display a save dialog. Closing a dirty window can be canceled through the native dialog; choosing to discard is explicit. Application-menu quit follows the same beforeunload path.

Russian/English dictionaries are fetched at build time from a pinned Electron archive with verified SHA-256 and embedded as static assets. The spellchecker fetches those assets from the local Rust server, never the Chromium CDN. Other dictionary languages are not currently bundled. Context-menu suggestions and standard edit actions are available. No updater, telemetry or remote dictionary service is enabled.

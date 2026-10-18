# Typoha

**English** | [Русский](README.ru.md)

An independent local Markdown editor with a **Rust** filesystem core and a **TypeScript** interface built with Milkdown and CodeMirror. Styles, copy, and sample documents are original; no Typora code or assets are used.

Typoha is inspired by Typora’s focus on distraction-free Markdown writing and is developing in its own direction, with an original interface and independent implementation. Typoha is not affiliated with Typora.

**Version 0.1.0 is a working initial implementation, not a complete 1:1 clone.** The [feature coverage table](docs/parity.md) lists implemented features, differences, and remaining work. The independent implementation process is documented in [clean-room.md](docs/clean-room.md). These detailed documents are currently available in Russian and English respectively.

**Vibe-coded:** this project was created with AI coding agents (Codex), guided by the project owner.

![Typoha editor interface](docs/screenshots/typoha.jpg)

## Getting started

From the project directory:

```bash
./run.sh
```

If a release build is available, the editor opens on a minimal new tab; no folder picker opens automatically. Otherwise, the script builds it first; you need Node.js 24+, npm, rustup, and a C/C++ linker. The Rust toolchain is pinned in `rust-toolchain.toml`. The first build downloads open-source dependencies from npm and crates.io.

To open your own folder:

```bash
./run.sh /absolute/path/to/notes
```

Normal launch opens a **Typoha desktop window** with bundled Electron/Chromium. An installed browser is not required. Folder selection and export downloads use system dialogs; PDF is generated directly. Closing the window stops the Rust server, and unsaved changes prompt before closing. Russian and English spelling dictionaries are bundled locally without runtime Internet downloads.

For an explicit browser session, use `./run.sh --browser /path/to/notes`. For development server mode:

```bash
./run.sh ./examples --no-open --port 43217
```

The server listens only on `127.0.0.1`. Its terminal URL contains a temporary access key; do not share it. Ctrl+C stops server mode; closing a browser tab does not.

The Linux desktop distribution is built under `artifacts/typoha-0.1.0-linux-x86_64-desktop/`. Run `./typoha`, then use Open File or Open Folder on the new tab. Users do not need Node, Rust or an installed browser. `./install-menu.sh` adds Typoha to the current user's application menu; keep the extracted folder in place afterwards. Electron requires standard Linux graphical libraries and a working Chromium sandbox; the sandbox is never automatically disabled.

The application interface is currently in Russian. This README describes the current version.

## Implemented features

- Document tabs with unsaved markers, draft protection, and Ctrl+T / Ctrl+W shortcuts.
- Categorized preferences, live theme preview, custom accent/panel/text colors, and nine original palettes including Catppuccin-, Gruvbox-, Ayu-, and Nord-inspired variants.
- Subtle interface animations with an accessibility-aware motion switch.

- Live Markdown editing, source mode, and preview; tables and task lists.
- KaTeX formulas, Mermaid diagrams, and syntax highlighting; footnotes, alerts, emoji, subscripts, superscripts, and highlights in preview.
- A file tree, document outline, find and replace, regex search across a folder, and quick open.
- Revision-checked saves, autosave, version history, drafts, and recoverable trash.
- Light, dark, sepia, and system themes; custom CSS, writing width and font settings, and focus mode.
- HTML, PNG and direct PDF export in desktop mode; system printing. Other formats use an **external Pandoc** installation in PATH, which is not bundled with the app.
- A command palette and an [API for custom extensions](docs/architecture.md).

Documents containing constructs unsupported by the visual editor open in source mode with an explanation. This preserves their text; visual editing may normalize Markdown syntax. Active HTML embeds and automatic network downloads are disabled.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Save / save as | Ctrl+S / Ctrl+Shift+S |
| New document | Ctrl+N |
| Quick open / commands | Ctrl+P / Ctrl+Shift+P |
| Source mode | Ctrl+/ |
| Find and replace / search folder | Ctrl+F / Ctrl+Shift+F |
| Toggle sidebar | Ctrl+Shift+L |
| Focus / typewriter mode | F8 / F9 |
| Settings | Ctrl+, |

On macOS, Command is the primary modifier. Native platform shortcuts may differ.

## Development and checks

```bash
npm ci --prefix web
./scripts/check.sh
./scripts/build.sh
./scripts/package.sh
```

`check.sh` runs TypeScript checks, formatting checks, client tests, the frontend build, Rust tests, Clippy, npm audit, and license checks. `package.sh` creates Linux server and desktop archives in `artifacts/` with the executable, sample documents, both READMEs, documentation, complete third-party license notices, and a source archive with vendored dependencies. The desktop archive also includes Electron and its full Chromium notices. See docs/licensing.md for known license-review limitations. Windows and macOS builds have not been verified yet.

Workspace data is stored in `.typoha` inside the open folder. Avoid deleting history, drafts, or trash unless intended. Symbolic links outside the workspace are not supported. Documents are currently limited to 16 MB; folder search skips files larger than 2 MB and returns at most 500 matching lines.

## Licensing and provenance

Original project code is licensed under **[GNU AGPL v3 or later](LICENSE)** (`AGPL-3.0-or-later`). You may use, modify, redistribute, and sell it. Keep copyright and license notices, identify your changes, and provide the corresponding source under the same license when distributing modified versions. Modified versions used over a network must also offer their source to interacting users. Private changes without distribution or remote user interaction do not have to be published.

See [COPYRIGHT](COPYRIGHT) for attribution and [licensing details](docs/licensing.md) for the transition from earlier MIT revisions. Dependencies retain their own licenses: [complete notices](THIRD_PARTY_NOTICES.md) and [machine-readable inventory](docs/dependencies.json).

Source code and commit history are available in the [GitHub repository](https://github.com/Glob876/Typoha). Development rules are in [AGENTS.md](AGENTS.md).

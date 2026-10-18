# Typoha

**English** | [Русский](README.ru.md)

An independent local Markdown editor with a **Rust** filesystem core and a **TypeScript** interface built with Milkdown and CodeMirror. Styles, copy, and sample documents are original; no Typora code or assets are used.

**Version 0.1.0 is a working initial implementation, not a complete 1:1 clone.** The [feature coverage table](docs/parity.md) lists implemented features, differences, and remaining work. The independent implementation process is documented in [clean-room.md](docs/clean-room.md). These detailed documents are currently available in Russian and English respectively.

**Vibe-coded:** this project was created with AI coding agents (Codex), guided by the project owner.

![Typoha editor interface](docs/screenshots/typoha.jpg)

## Getting started

From the project directory:

```bash
./run.sh
```

If a release build is available, the editor opens with sample documents. Otherwise, the script builds it first; you need Node.js 24+, npm, rustup, and a C/C++ linker. The Rust toolchain is pinned in `rust-toolchain.toml`. The first build downloads open-source dependencies from npm and crates.io.

To open your own folder:

```bash
./run.sh /absolute/path/to/notes
```

If a browser does not open automatically, use the URL printed in the terminal. In Codex, you can open it in the in-app browser. An installed Chromium, Chrome, or Edge is used for a separate app window; otherwise, the system browser is used. The server listens only on `127.0.0.1`. The URL contains a temporary access key for the open folder; do not share it.

```bash
./target/release/typoha ./examples --no-open --port 43217
```

Press Ctrl+C in the terminal to stop the server. Closing the browser tab does not stop it. With a packaged build, run `./typoha ./examples` without installing Node or Rust.

The application interface is currently in Russian. This README describes the current version.

## Implemented features

- Live Markdown editing, source mode, and preview; tables and task lists.
- KaTeX formulas, Mermaid diagrams, and syntax highlighting; footnotes, alerts, emoji, subscripts, superscripts, and highlights in preview.
- A file tree, document outline, find and replace, regex search across a folder, and quick open.
- Revision-checked saves, autosave, version history, drafts, and recoverable trash.
- Light, dark, sepia, and system themes; custom CSS, writing width and font settings, and focus mode.
- HTML and PNG export; PDF through browser printing. Other formats use an **external Pandoc** installation in PATH, which is not bundled with the app.
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

`check.sh` runs TypeScript checks, formatting checks, client tests, the frontend build, Rust tests, Clippy, npm audit, and license checks. `package.sh` creates a Linux archive in `artifacts/` with the executable, sample documents, both READMEs, documentation, complete third-party license notices, and a source archive with vendored dependencies. Windows and macOS builds have not been verified yet.

Workspace data is stored in `.typoha` inside the open folder. Avoid deleting history, drafts, or trash unless intended. Symbolic links outside the workspace are not supported. Documents are currently limited to 16 MB; folder search skips files larger than 2 MB and returns at most 500 matching lines.

## Licensing and provenance

Original project code is licensed under **[GNU AGPL v3 or later](LICENSE)** (`AGPL-3.0-or-later`). You may use, modify, redistribute, and sell it. Keep copyright and license notices, identify your changes, and provide the corresponding source under the same license when distributing modified versions. Modified versions used over a network must also offer their source to interacting users. Private changes without distribution or remote user interaction do not have to be published.

See [COPYRIGHT](COPYRIGHT) for attribution and [licensing details](docs/licensing.md) for the transition from earlier MIT revisions. Dependencies retain their own licenses: [complete notices](THIRD_PARTY_NOTICES.md) and [machine-readable inventory](docs/dependencies.json).

Source code and commit history are available in the [GitHub repository](https://github.com/Glob876/Typoha). Development rules are in [AGENTS.md](AGENTS.md).

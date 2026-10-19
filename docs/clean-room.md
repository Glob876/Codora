# Independent implementation record

Started 2026-10-18, at the user's request. Goal: a local extensible Markdown editor with familiar live-editing behavior, independently written.

## Boundary

The author previously collected vendor screenshots and public feature documentation in a separate research directory. No vendor application implementation has been accessed. Reference screenshots and press-kit files are deliberately excluded from this repository and its assets. Only publicly documented behavior and common Markdown conventions inform the requirements. All application styling and sample documents are written here independently.

This is a single-author independent implementation using a clean-room-style source boundary. It is **not** an independently audited two-team clean room. Functional similarity is the aim; pixel copying of distinctive artwork/themes/copy is excluded. Zero IP risk, trademark clearance and patent clearance are not claimed.

## Public behavioral references

- https://support.typora.io/ — feature inventory (read during requirements research).
- https://support.typora.io/Markdown-Reference/ — supported syntax categories.
- https://support.typora.io/File-Management/ — workspace and navigation scenarios.
- https://support.typora.io/Search/ — search scenarios.
- https://support.typora.io/Export/ — export categories and external conversion concept.
- https://spec.commonmark.org/ — Markdown standard.
- https://github.github.com/gfm/ — table/task-list/strike extensions.

Screenshots under `docs/screenshots/` were captured from Typoha itself with its original sample documents; they are not reference-product images.

No documentation prose or product assets are copied into the implementation. The previous Russian feature inventory remains outside the repository.

## Dependency references

- Milkdown / Crepe: https://milkdown.dev/ — MIT, local rich Markdown editing, ProseMirror.
- CodeMirror: https://codemirror.net/ — MIT, source editing.
- Rust crates/npm dependencies: registries, lockfiles and generated third-party notices identify exact versions.

## Legal context, not legal clearance

https://www.copyright.gov/register/tx-programs.html distinguishes program expression from ideas, logic, algorithms, systems, methods, concepts and layouts. https://www.copyright.gov/circs/circ61.pdf also discusses screen displays and manuals. Applicable law and other rights can differ by jurisdiction. This record documents implementation provenance, not a legal opinion.

## Desktop shell (2026-10-18)

Original green square/t-path app icon in desktop/icon.svg; icon.png is its raster asset.

Original Electron main/preload/process-lifecycle code, using public Electron APIs:
- https://www.electronjs.org/docs/latest/tutorial/security/
- https://www.electronjs.org/docs/latest/api/browser-window
- https://www.electronjs.org/docs/latest/api/web-contents
- https://www.electronjs.org/docs/latest/api/session
- https://www.electronjs.org/docs/latest/tutorial/spellchecker

Electron 44.9.0 is pinned in desktop/package-lock.json. Its release runtime and
bundled Chromium notices are retained; no other editor's implementation or assets
were consulted. Russian/English dictionaries come from the same Electron release's
hunspell_dictionaries.zip, SHA-256 41fc02332fc7cc2ea7230409de1bbe5d0a44b3a45b85f6d3acdaddd2b2047d8f,
verified against the upstream SHASUMS256.txt. Dictionary notices are retained in
docs/dictionary-notices. License inventory exceptions are recorded in licensing.md.

## Tabs, preferences and motion (2026-10-18)

Implemented from the owner's written requirements in this chat and existing Typoha code. The README now explicitly acknowledges Typora as inspiration while stating Typoha's independent direction and lack of affiliation. No Typora source, application, screenshots, theme files, fonts or assets were fetched or inspected.

The new welcome screen, tab strip, five-category preferences dialog, transitions and theme swatches are original TypeScript/CSS. Catppuccin, Gruvbox, Ayu and Nord names describe independently selected mood palettes, not imported upstream theme packages or exact color compatibility. Matrix and Rose palettes are also original. No new dependencies or external resources were added. Filesystem writes, preferences and recoverable drafts continue through the existing authenticated Rust API. Electron only returns explicitly selected paths.

## File tree, icons, locale and transparency (2026-10-18)

Source requirements: the owner's follow-up in this chat. The file tree is now an original depth-first sibling-sorted view of the Rust listing, with collapse hiding all descendants, including during filtering. Interface translations for English, Ukrainian and German are authored locally; Russian remains the default. Document contents, filenames, search excerpts and text input values are excluded from interface translation.

Lucide 1.59.0 is pinned from npm, under ISC, with its complete notice retained in `docs/licenses/npm-lucide-1.59.0-LICENSE` and the dependency inventory. Selected SVG nodes are bundled locally; no icon fonts or external assets are loaded. References consulted: https://lucide.dev/ and https://github.com/lucide-icons/lucide/blob/main/LICENSE . No Typora resources were consulted.

Transparency uses original CSS surface colors and Electron's public transparent-window API: https://www.electronjs.org/docs/latest/tutorial/custom-window-styles . The default is fully opaque; user-selected background opacity affects color surfaces, not text/icons. Panels, tabs and popups use a four-percentage-point denser color, capped at 100%. Actual desktop compositing and resize behavior are platform-dependent, as documented by Electron. The frameless shell has original window controls and sender/origin-checked allowlisted IPC.

## Codora and code editing (2026-10-18)

Source requirements: the owner's request to rename the application/repository to Codora,
add language syntax, automatic intelligent suggestions, and remember the open folder.
Original changes extend the existing CodeMirror editor, with public documented APIs:
https://codemirror.net/docs/ref/ and https://codemirror.net/examples/autocompletion/ .
The TypeScript 5.9.3 language service runs locally against the current JS/TS document
and its redistributed ES5 declarations; no editor product code or assets were used.
TypeScript is Apache-2.0; CodeMirror autocomplete/language are MIT. Exact dependencies
are locked, direct new dependencies pinned, and license notices retained.

Automatic language selection uses CodeMirror's language descriptions; unknown UTF-8
files remain plain text. Existing language completion providers remain enabled;
original keyword/snippet/word providers supplement them. JS/TS member completion
uses inferred types within one document, without project or network access. It is
bounded to 300,000 characters to limit synchronous analysis. No LSP, debugger,
terminal, marketplace or VS Code compatibility is claimed.

Rust persists only the canonical workspace path in a separate application session
file, using atomic replacement. Explicit startup paths take precedence; unavailable
or corrupt remembered workspaces fail visibly rather than silently substituting a
folder. Existing `.typoha` metadata is deliberately retained so history and drafts
survive the rename. The new C icon is original SVG geometry.

## New document formats (2026-10-18)

Implemented from the owner's request to choose a format after Start writing.
The original local dialog offers Markdown, plain text and common source formats.
An untitled document retains its extension per tab, independently of its disk path;
that extension selects the existing language support and default Save filename.
Cancellation preserves the welcome screen, and selecting a format does not create
an empty file on disk. No new dependencies or external references were needed.

## Explicit Python run action (2026-10-18)

Implemented from the owner's request for a quick Python Run button. Original Rust
process management in `src/runner.rs` uses the existing Tokio process/I/O APIs; the
local dependency source was inspected for process-group and kill-on-drop behavior.
No editor product implementation or resources were consulted. Unix process-group
cleanup uses libc 0.2.191 (already locked transitively), now an explicitly pinned
Unix dependency; its existing MIT/Apache-2.0 notices are retained.

The TypeScript panel polls authenticated loopback endpoints, renders stdout/stderr
as text, forwards explicitly submitted stdin and offers Stop. A run is never
triggered by opening a file. Saving uses the existing revision/conflict checks.
The system/workspace Python interpreter is external and is not redistributed.

## Codora identity and shared appearance (2026-10-18)

Original monochrome and color vector marks were authored with Figma Plugin API
from our own SVG geometry: https://www.figma.com/design/IK5L6edo3xvnP9zSIzk9Bx
(monochrome node 1:3; color node 1:6). Exported SVG paths are retained locally;
the PNG icon is rasterized from the color SVG. These original project assets use
the repository license. No third-party editor assets, reference screenshots,
fonts or new dependencies were used. The app uses the monochrome paths in both
appearance modes; the desktop icon and tray use the color mark.

Custom scrollbar rules use local palette variables and browser CSS pseudo-elements,
with standard scrollbar-color/width fallback. Shared appearance persistence is
original Rust code. The README screenshot is captured from our rebuilt Electron
application with a disposable, original sample document.

## Folded-ribbon identity (2026-10-18)

The owner selected the original “Лента мысли” concept created in this session:
https://www.figma.com/design/JyOLKqfWBwr8EMhrMNgNQa?node-id=6-2.
Our own SVG geometry was drawn with the Figma Plugin API; no other editor assets
or reference images were consulted. The approved icon (node 6:20) and monochrome
mark (node 6:72) were exported as SVG. The desktop PNG is rasterized from that
SVG at 512 × 512. Existing interface surfaces use the monochrome mark through
currentColor in both appearance modes.

Transparent README lockups (nodes 8:2 and 8:8) contain only the color mark and
the word “codora”; the word is outlined, with no font downloads at runtime.
The lettering uses Manrope SemiBold from Figma. Its SIL Open Font License 1.1
notice is retained at docs/licenses/Manrope-OFL.txt, obtained from
https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt.
No font binaries or new application dependencies are distributed. The original
mark geometry remains under the repository license.

## Per-user Linux installer (2026-10-18)

Implemented from the owner's request for one installation command and a README
guide. Original Bash/Python code copies the local pinned Electron runtime, Rust
core, frontend, artwork and notices to a user-owned versioned installation. No
proprietary editor implementation or assets were consulted; no dependencies were
added. Desktop Exec quoting follows the public freedesktop.org specification:
https://specifications.freedesktop.org/desktop-entry/latest/exec-variables.html.

Source installation explicitly runs the existing build workflow; ready desktop
packages install offline. The installer does not upload content, grant root
permissions, disable the Chromium sandbox, install OS packages or fetch releases.
It preserves earlier runtime payloads for running windows and switches the current
version with an atomic symlink replacement. Failed copies/integration writes
restore the prior launcher/menu/icon state. Removal uses an ownership marker and
preserves workspace documents, drafts and application settings.

## Terminal interface (2026-10-19)

The terminal frontend and ASCII Codora wordmark are original code and text,
written from the owner's request for familiar keyboard-first editing. No micro
or proprietary editor source/assets were fetched or copied. Public crate APIs
used: Ratatui 0.29.0 (MIT), Crossterm 0.28.1 (MIT), tui-textarea 0.7.0 (MIT),
pulldown-cmark 0.13.0 (MIT). Exact transitive versions and notices are recorded
in Cargo.lock and the dependency inventory. All existing file safety remains
in the shared Rust core. Graphical parity is explicitly limited in console.md.

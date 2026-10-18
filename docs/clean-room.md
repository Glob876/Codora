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

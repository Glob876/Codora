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

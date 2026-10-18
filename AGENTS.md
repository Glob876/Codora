# Typoha development rules

## Independent implementation
- Implement publicly described behavior and open standards, not proprietary implementation details.
- Do not fetch, inspect, decompile, patch, or import Typora source, binaries, bundles, CSS, icons, fonts, strings, themes, or other product assets.
- Do not put reference screenshots or the vendor press kit in this repository or distribution.
- Public feature descriptions are input for behavioral requirements only. Write original code, UI copy, styling, fixtures, and documentation.
- Preserve a source/provenance log in docs/clean-room.md. This is an independent implementation protocol, not a certification of legal immunity or a formal two-team clean room.
- Use dependencies with explicit redistribution licenses. Pin versions and retain notices. Record exceptions and unresolved licensing before distribution.
- Own name and visual identity: Typoha. Never imply affiliation with another editor.

## Engineering
- Rust owns filesystem access, conflict detection, history, workspace search, persistence and export. TypeScript owns the local editing interface.
- Keep UTF-8 Markdown the source of truth. Never silently drop unsupported syntax, discard unsaved edits, overwrite a changed disk version, or traverse outside an opened workspace.
- No telemetry, cloud account, external font CDN, or automatic network upload. Network-backed content requires explicit user action.
- Bind only to loopback; authenticate filesystem endpoints with a per-run capability token. Reject cross-origin requests. Never log document contents or tokens.
- Use atomic replacement for saves and retain recoverable history. Surface errors visibly.
- Keep core logic separate from HTTP and UI; extension points must be documented.
- Meaningful changes require relevant tests. Run cargo fmt, cargo test, cargo clippy -- -D warnings, npm run check, npm test, npm run build before delivery.
- Maintain docs/parity.md honestly: implemented, partial, external or planned. Never call an unverified behavior complete.
- Commit coherent milestones. Do not commit generated builds, local documents, credentials, caches or dependency folders. Never push without user intent.

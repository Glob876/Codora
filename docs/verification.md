# Проверка версии 0.1.0

Проведена 18.10.2026 в Linux x86_64.

## Автоматически

- `./scripts/check.sh`: успешно.
- 14 Rust-тестов: атомарное сохранение, конфликт внешнего изменения, удаление до сохранения, история, корзина, Unicode-поиск, черновики, ограничения путей и вложенных symlink, аутентификация, origin/host, смена workspace другим окном, сохранение настроек.
- 10 TypeScript/DOM-тестов: структура документа, Unicode/anchors, поиск имён, классификация неподдерживаемого синтаксиса, границы изображений, очистка активного HTML, формулы, сноски, emoji, индексы, оглавление.
- TypeScript и Prettier: успешно.
- Rustfmt и Clippy с `-D warnings`: успешно.
- `npm audit --audit-level=low`: 0 известных уязвимостей на момент проверки. Это не полный аудит безопасности и не проверка RustSec.
- Инвентаризация лицензий: 505 записей, 593 сохранённых файла уведомлений; политика зависимостей пройдена. Это не юридическое заключение.
- `cargo build --release --locked`: успешно; бинарник около 12 МБ.

## Через интерфейс

- Открытие приложения и Markdown-файла, переключение исходник/редактор/просмотр, панель структуры и переход к формуле.
- Создание документа, ввод в визуальном режиме, сохранение через Ctrl+S, проверка полученного Markdown.
- Ввод/сохранение исходника, формулы и подсветка кода.
- Mermaid с текстовыми подписями после очистки SVG.
- HTML скачан и проверен на наличие текста и SVG.
- PNG скачан, открыт и визуально проверен: 1800×690, текст и диаграмма присутствуют.
- JPEG вставлен через буфер обмена в изолированный тестовый документ; локальный файл изображения создан.
- Скриншот собственного интерфейса сохранён в `docs/screenshots/typoha.jpg`.

## Архив

`typoha-0.1.0-linux-x86_64.tar.gz` распакован во временную папку. Оттуда запущен вложенный бинарник без доступа к исходному каталогу web/dist; проверены встроенный JavaScript и чтение UTF-8-документа по аутентифицированному API. Служебные .typoha и node_modules в архив не попадают.

## Не проверено в этом окружении

Нативные Windows/macOS, установщики, реальные Pandoc-конвертации (Pandoc отсутствует), вывод PDF через физический принтер, доступность конкретных орфографических словарей и все виды Mermaid/TeX. Остальные отличия перечислены в [parity.md](parity.md). GitHub Actions подготовлен, но удалённый запуск не выполнялся.

## Desktop shell — 2026-10-18 (Linux)

- Required checks passed: cargo fmt, cargo test (16 integration tests), cargo clippy -- -D warnings; frontend TypeScript check, 10 Vitest tests, production build, formatting; npm audit for both lockfiles.
- Five Node tests cover capability URL validation, external URL policy, child lifetime, malformed handshake and startup failure.
- `xvfb-run -a desktop/node_modules/.bin/electron desktop/smoke.cjs` passed with a fresh disposable Chromium profile and temporary Markdown folders. It exercises the actual Rust release binary and embedded frontend: sandbox/no renderer Node APIs, file opening, real PDF generation/download (PDF text verified with pdftotext), clipboard writing, both local dictionaries initialized, native folder picker, cancellation of both window close and application quit with dirty content, persisted disk draft, and explicit discard/normal shutdown.
- Physical printing and platform printer drivers are not verified; the shell uses Electron's system print API. Windows/macOS builds and installers remain unverified. Window geometry and other spelling languages remain future work.
- License inventory checks retain upstream runtime and dictionary notices. Outstanding public-distribution review is explicitly recorded in docs/licensing.md.

## Tabs, themes and preferences — 2026-10-18 (Linux)

- Required checks passed: `cargo fmt`, `cargo test` (15 integration tests), `cargo clippy -- -D warnings`, `npm run check`, `npm test` (13 frontend tests), `npm run build`; frontend Prettier and `git diff --check` passed. Five desktop Node tests also passed. Production build retains the existing warning about large JavaScript chunks.
- Extended the real Electron/Xvfb smoke test: startup makes zero file-picker calls, welcome has a zero-width sidebar, explicit Open File uses the native picker, multiple tabs switch and close, source text survives switching, changed-tab close can be canceled, and native close/quit prompts cover an inactive dirty tab. Drafts are verified on disk.
- Theme preview changes actual computed colors; Cancel restores them. The animations preference is saved through Rust and verified in `.typoha/config/preferences.json`. New unit tests cover category switching, numeric bounds, custom colors, preview rollback and commit isolation. Existing real PDF/text, clipboard, dictionary and sandbox checks continue to pass.
- Original welcome/settings screenshots were inspected from `/tmp` during development; no reference product assets were used.
- Limits: tab sessions are not restored after restart; rich-editor undo history is recreated on switching (source state is retained). Settings remain scoped to each workspace. All nine palettes are original variants, not upstream theme packages. Physical printing, Windows/macOS and subjective animation quality on other hardware remain unverified.

## Tree, SVG icons, locales and opacity — 2026-10-18 (Linux)

- Required checks passed: cargo fmt, cargo test (15 integration tests), cargo clippy -- -D warnings, frontend TypeScript check, 18 Vitest tests and production build. Desktop Node tests (5), Prettier, git diff --check and the license policy audit (514 dependency records) also passed. Lucide 1.59.0 is pinned with its license notice. The production bundle retains the known large-chunk warning.
- New tests cover depth-first tree order, collapse of files and nested folders, retained ancestry under filtering, opacity bounds and the +4 p.p. panel relationship, reversible English/German/Ukrainian chrome translation, shortcut labels and exclusion of document/input/path text.
- Extended Electron/Xvfb test passed against the embedded release UI. It asserts actual nested tree order, hides every descendant when collapsing a parent while retaining sibling files, expands files again, checks SVG toolbar icons, previews English settings without changing the document, checks computed surface alpha (80% main / 84% sidebar), and verifies Cancel restores Russian and opaque surfaces. Existing preferences persistence, PDF text/download, spelling dictionaries, dirty inactive tabs and native close protection continue to pass.
- Inspected the original application screenshot at `/tmp/typoha-refinement-settings.png`: SVG icons, English settings and the opacity slider are readable, with a denser dialog surface. This is a screenshot of Typoha only and is not committed.
- Physical desktop compositing, transparency while resizing under different window managers, and Windows/macOS are unverified. The Electron documentation describes limitations for transparent resizable windows. Default surfaces remain 100% opaque; export/print explicitly use white. Additional UI languages do not add spelling dictionaries; backend errors and some long help/dynamic messages remain Russian.

## Codora: code editor and session restoration (2026-10-18)

- `scripts/check.sh` passed: desktop Node tests (5), Prettier checks, TypeScript check, Vitest (22), production frontend build, cargo fmt, Rust integration tests (19), clippy across all targets with warnings denied, npm audits (zero vulnerabilities), notices and license policy (514 dependency records). The known large bundle warning remains; the TypeScript service is a lazy local chunk (~3.7 MB minified) loaded for JS/TS files.
- Rust restart test launches the real backend, selects another workspace through the authenticated API, closes its parent pipe, restarts with the same session file, and verifies the restored root. Explicit root override, session write failure, unchanged workspace on failure, source listing/search/history and exact source preservation are covered.
- `cargo build --release --locked` passed. `xvfb-run -a desktop/node_modules/.bin/electron desktop/smoke-code.cjs` passed against the bundled UI: restored root and visible sidebar, actual TypeScript syntax colors, automatic inferred object member popup, acceptance, disk save, Python language detection and enabled Markdown editing after switching files. The captured `/tmp/codora-code.png` was visually inspected; it shows Codora branding, code, file tree and property type details.
- Existing `desktop/smoke.cjs` passed: sandbox, clipboard, PDF text/download, local spelling dictionaries, preferences, nested tree behavior, native folder selection, cancellation of close/quit with dirty inactive tabs, and disk draft recovery.
- Full VS Code parity, project-wide semantic analysis/imports, LSP, project diagnostics/refactoring, terminal, debugger, Git UI, extension compatibility, restoration of tabs/cursors, Windows/macOS and large-project performance remain unverified or unimplemented. Semantic suggestions are limited to the current JS/TS document (300000 characters) and ES5 library; other languages use their CodeMirror providers and local word/keyword/snippet completion.

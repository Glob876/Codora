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

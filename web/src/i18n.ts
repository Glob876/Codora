export const languages = ["ru", "en", "uk", "de"] as const;
export type Language = (typeof languages)[number];
let language: Language = "ru";
// Authored interface translations. Document text and user paths never enter this catalog.
const rows = `Запустить|Run|Запустити|Ausführen
Показать вывод|Show output|Показати вивід|Ausgabe anzeigen
Запустить Python|Run Python|Запустити Python|Python ausführen
Вывод Python|Python output|Вивід Python|Python-Ausgabe
Остановить|Stop|Зупинити|Stoppen
Скрыть вывод|Hide output|Сховати вивід|Ausgabe ausblenden
Запуск…|Starting…|Запуск…|Startet…
Выполняется…|Running…|Виконується…|Wird ausgeführt…
Остановлено|Stopped|Зупинено|Gestoppt
Код выхода|Exit code|Код виходу|Exit-Code
Ввод для Python|Python input|Введення для Python|Python-Eingabe
Ввод для input() · Enter|Input for input() · Enter|Введення для input() · Enter|Eingabe für input() · Enter
Отправить|Send|Надіслати|Senden
Вывод ограничен 256 КБ|Output limited to 256 KB|Вивід обмежено 256 КБ|Ausgabe auf 256 KB begrenzt
Новый файл|New file|Новий файл|Neue Datei
Формат файла|File format|Формат файлу|Dateiformat
Обычный текст|Plain text|Звичайний текст|Klartext
Создать|Create|Створити|Erstellen
Файл|File|Файл|Datei
Правка|Edit|Редагування|Bearbeiten
Абзац|Paragraph|Абзац|Absatz
Формат|Format|Формат|Format
Вид|View|Вигляд|Ansicht
Темы|Themes|Теми|Designs
Справка|Help|Довідка|Hilfe
Расширения|Extensions|Розширення|Erweiterungen
Без названия|Untitled|Без назви|Unbenannt
Новая вкладка|New tab|Нова вкладка|Neuer Tab
Новый документ|New document|Новий документ|Neues Dokument
Место для новой мысли|Room for a new thought|Місце для нової думки|Raum für einen neuen Gedanken
Ваши тексты. Ваш ритм.|Your words. Your rhythm.|Ваші тексти. Ваш ритм.|Deine Texte. Dein Rhythmus.
Открыть файл|Open file|Відкрити файл|Datei öffnen
Открыть папку|Open folder|Відкрити папку|Ordner öffnen
Открыть другую папку|Open another folder|Відкрити іншу папку|Anderen Ordner öffnen
Начать писать|Start writing|Почати писати|Schreiben beginnen
Настройки|Settings|Налаштування|Einstellungen
Команды|Commands|Команди|Befehle
Заметки|Notes|Нотатки|Notizen
Файлы|Files|Файли|Dateien
Структура|Outline|Структура|Gliederung
Поиск|Search|Пошук|Suche
Папка|Folder|Папка|Ordner
Корзина|Trash|Кошик|Papierkorb
Боковая панель|Sidebar|Бічна панель|Seitenleiste
Ширина боковой панели|Sidebar width|Ширина бічної панелі|Breite der Seitenleiste
Редактор|Editor|Редактор|Editor
Исходник|Source|Джерело|Quelltext
Просмотр|Preview|Перегляд|Vorschau
Предпросмотр|Preview|Попередній перегляд|Vorschau
Живое редактирование|Live editing|Живе редагування|Direkt bearbeiten
Исходный Markdown|Markdown source|Джерело Markdown|Markdown-Quelltext
Режим редактора|Editor mode|Режим редактора|Editormodus
Форматирование|Formatting|Форматування|Formatierung
Заголовок|Heading|Заголовок|Überschrift
Полужирный|Bold|Жирний|Fett
Курсив|Italic|Курсив|Kursiv
Зачёркивание|Strikethrough|Закреслення|Durchgestrichen
Ссылка|Link|Посилання|Link
Изображение|Image|Зображення|Bild
Таблица|Table|Таблиця|Tabelle
Код|Code|Код|Code
Формула|Equation|Формула|Formel
Список|List|Список|Liste
Список задач|Task list|Список завдань|Aufgabenliste
Цитата|Quote|Цитата|Zitat
Режим фокусировки|Focus mode|Режим фокусування|Fokusmodus
Экспорт|Export|Експорт|Export
Проверка орфографии|Spellcheck|Перевірка правопису|Rechtschreibung
Сохранение…|Saving…|Збереження…|Speichern…
Изменён|Modified|Змінено|Geändert
Сохранено|Saved|Збережено|Gespeichert
Закрыть|Close|Закрити|Schließen
Закрыть окно|Close window|Закрити вікно|Fenster schließen
Свернуть|Minimize|Згорнути|Minimieren
Развернуть|Maximize|Розгорнути|Maximieren
Оформление|Appearance|Оформлення|Darstellung
Интерфейс|Interface|Інтерфейс|Oberfläche
Письмо|Writing|Письмо|Schreiben
Дополнительно|Advanced|Додатково|Erweitert
Категории настроек|Settings categories|Категорії налаштувань|Einstellungskategorien
Выберите настроение для своего рабочего пространства.|Choose a mood for your workspace.|Оберіть настрій для свого робочого простору.|Wähle eine Stimmung für deinen Arbeitsbereich.
Цветовая схема|Color scheme|Колірна схема|Farbschema
Системная|System|Системна|System
Бумага|Paper|Папір|Papier
Сепия|Sepia|Сепія|Sepia
Ночь|Night|Ніч|Nacht
Розовый кварц|Rose quartz|Рожевий кварц|Rosenquarz
Своя палитра|Custom palette|Власна палітра|Eigene Farbpalette
Цвета дополняют выбранную тему. Сброс возвращает исходную палитру.|Colors override the selected theme. Reset restores its palette.|Кольори доповнюють вибрану тему. Скидання повертає початкову палітру.|Farben ergänzen das gewählte Design. Zurücksetzen stellt die Palette wieder her.
Основной · акцент|Primary · accent|Основний · акцент|Primär · Akzent
Второстепенный · панели|Secondary · panels|Другорядний · панелі|Sekundär · Flächen
Текст|Text|Текст|Text
Сбросить палитру|Reset palette|Скинути палітру|Palette zurücksetzen
Непрозрачность фона, %|Background opacity, %|Непрозорість фону, %|Hintergrunddeckkraft, %
Панели и меню на 4 процентных пункта плотнее фона. В браузере прозрачность ограничена страницей; в приложении зависит от оконного композитора.|Panels and menus are 4 percentage points more opaque. In a browser transparency is limited to the page; in the app it depends on the window compositor.|Панелі та меню на 4 відсоткові пункти щільніші. У браузері прозорість обмежена сторінкою; у застосунку залежить від віконного композитора.|Flächen und Menüs sind 4 Prozentpunkte deckender. Im Browser gilt Transparenz nur innerhalb der Seite; in der App hängt sie vom Fenster-Compositor ab.
Шрифт|Font|Шрифт|Schrift
С засечками|Serif|Із зарубками|Serifenschrift
Системный|System|Системний|Systemschrift
Моноширинный|Monospace|Моноширинний|Festbreitenschrift
Размер текста, px|Font size, px|Розмір тексту, px|Schriftgröße, px
Ширина страницы, px|Page width, px|Ширина сторінки, px|Seitenbreite, px
Межстрочный интервал|Line height|Міжрядковий інтервал|Zeilenhöhe
Размер табуляции в исходнике|Source tab size|Розмір табуляції у джерелі|Tabulatorbreite im Quelltext
Номера строк|Line numbers|Номери рядків|Zeilennummern
В режиме исходного Markdown|In Markdown source mode|У режимі джерела Markdown|Im Markdown-Quelltext
Перенос длинных строк|Wrap long lines|Перенесення довгих рядків|Lange Zeilen umbrechen
Локальная проверка средствами оболочки|Local spellcheck provided by the app|Локальна перевірка засобами застосунку|Lokale Rechtschreibprüfung der App
Язык интерфейса|Interface language|Мова інтерфейсу|Sprache der Oberfläche
Плавные анимации|Smooth animations|Плавні анімації|Sanfte Animationen
Учитывается системное уменьшение движения|Respects the system reduced motion setting|Враховується системне зменшення руху|Beachtet die Systemeinstellung für reduzierte Bewegung
Панель форматирования|Formatting toolbar|Панель форматування|Formatierungsleiste
Быстрый доступ к оформлению текста|Quick access to text formatting|Швидкий доступ до форматування тексту|Schneller Zugriff auf Textformatierung
Строка состояния|Status bar|Рядок стану|Statusleiste
Статистика и параметры документа|Document statistics and options|Статистика та параметри документа|Dokumentstatistik und Optionen
Ширина боковой панели, px|Sidebar width, px|Ширина бічної панелі, px|Seitenleistenbreite, px
Сортировка файлов|File sorting|Сортування файлів|Dateisortierung
По имени|By name|За назвою|Nach Name
По изменению|By modification|За зміною|Nach Änderung
Скрытые файлы|Hidden files|Приховані файли|Versteckte Dateien
Показывать в дереве папки|Show in the folder tree|Показувати в дереві папки|Im Ordnerbaum anzeigen
Все типы файлов|All file types|Усі типи файлів|Alle Dateitypen
Вместе с файлами Markdown|Alongside Markdown files|Разом із файлами Markdown|Zusammen mit Markdown-Dateien
Фокусировка|Focus|Фокусування|Fokus
Приглушать соседние абзацы во время письма|Dim surrounding paragraphs while writing|Приглушувати сусідні абзаци під час письма|Umliegende Absätze beim Schreiben abdunkeln
Печатная машинка|Typewriter|Друкарська машинка|Schreibmaschine
Удерживать текущую строку ближе к центру|Keep the current line near the center|Тримати поточний рядок ближче до центру|Aktuelle Zeile nahe der Mitte halten
Автосохранение|Autosave|Автозбереження|Automatisch speichern
Только для документов с именем; конфликты остаются под защитой|Named documents only; conflict protection stays enabled|Лише для документів з назвою; захист від конфліктів залишається|Nur benannte Dokumente; Konfliktschutz bleibt aktiv
Задержка автосохранения, мс|Autosave delay, ms|Затримка автозбереження, мс|Speicherverzögerung, ms
Пользовательский CSS|Custom CSS|Власний CSS|Eigenes CSS
CSS применяется локально. Внешние ресурсы блокируются. Настройки сохраняются Rust-ядром в рабочей папке.|CSS is applied locally. External resources are blocked. Settings are saved by the Rust core in the workspace.|CSS застосовується локально. Зовнішні ресурси блокуються. Ядро Rust зберігає налаштування в робочій папці.|CSS wird lokal angewendet. Externe Ressourcen sind blockiert. Der Rust-Kern speichert Einstellungen im Arbeitsordner.
Восстановить настройки по умолчанию|Restore defaults|Відновити початкові налаштування|Standardeinstellungen wiederherstellen
Предпросмотр изменений|Live preview|Попередній перегляд змін|Live-Vorschau
Отмена|Cancel|Скасувати|Abbrechen
Сохранить|Save|Зберегти|Speichern
Применить|Apply|Застосувати|Anwenden
Фильтр файлов…|Filter files…|Фільтр файлів…|Dateien filtern…
Фильтр файлов|File filter|Фільтр файлів|Dateifilter
Порядок сортировки|Sort order|Порядок сортування|Sortierreihenfolge
Обновить файлы|Refresh files|Оновити файли|Dateien aktualisieren
Добавьте заголовки — здесь появится структура документа.|Add headings to see the document outline here.|Додайте заголовки — тут з’явиться структура документа.|Füge Überschriften hinzu, um die Gliederung zu sehen.
Здесь пока нет документов.|No documents here yet.|Тут поки немає документів.|Hier sind noch keine Dokumente.
Создайте заметку кнопкой +.|Create a note with the plus button.|Створіть нотатку кнопкою плюс.|Erstelle eine Notiz mit der Plus-Schaltfläche.
Перечитать с диска|Reload from disk|Перечитати з диска|Vom Datenträger neu laden
Новая вкладка|New tab|Нова вкладка|Neuer Tab
Закрыть вкладку|Close tab|Закрити вкладку|Tab schließen
Открыть файл…|Open file…|Відкрити файл…|Datei öffnen…
Быстро открыть…|Quick open…|Швидко відкрити…|Schnell öffnen…
Открыть папку…|Open folder…|Відкрити папку…|Ordner öffnen…
Сохранить как…|Save as…|Зберегти як…|Speichern unter…
Новая папка…|New folder…|Нова папка…|Neuer Ordner…
Переименовать / переместить…|Rename / move…|Перейменувати / перемістити…|Umbenennen / verschieben…
Создать копию…|Duplicate…|Створити копію…|Duplizieren…
Переместить в корзину|Move to trash|Перемістити до кошика|In den Papierkorb verschieben
Импортировать файл…|Import file…|Імпортувати файл…|Datei importieren…
Экспорт…|Export…|Експорт…|Exportieren…
Печать / PDF…|Print / PDF…|Друк / PDF…|Drucken / PDF…
Отменить|Undo|Скасувати дію|Rückgängig
Повторить|Redo|Повторити|Wiederholen
Найти и заменить|Find and replace|Знайти та замінити|Suchen und ersetzen
Поиск в папке|Search folder|Пошук у папці|Ordner durchsuchen
Несохранённые изменения|Unsaved changes|Незбережені зміни|Ungespeicherte Änderungen
Сохранить текущий документ перед переходом? Копия ваших правок также находится в черновиках.|Save this document before continuing? Your edits are also kept in drafts.|Зберегти документ перед переходом? Копія ваших змін також є в чернетках.|Dokument vor dem Fortfahren speichern? Deine Änderungen liegen auch als Entwurf vor.
Оставить в черновиках|Keep in drafts|Залишити в чернетках|Als Entwurf behalten
Сохранить документ|Save document|Зберегти документ|Dokument speichern
Путь относительно открытой папки|Path relative to the open folder|Шлях відносно відкритої папки|Pfad relativ zum geöffneten Ordner
Полный путь к папке|Full folder path|Повний шлях до папки|Vollständiger Ordnerpfad
Новая папка|New folder|Нова папка|Neuer Ordner
Путь относительно рабочей папки|Path relative to the workspace|Шлях відносно робочої папки|Pfad relativ zum Arbeitsordner
Новый путь|New path|Новий шлях|Neuer Pfad
Новый относительный путь|New relative path|Новий відносний шлях|Neuer relativer Pfad
Переименовать / переместить|Rename / move|Перейменувати / перемістити|Umbenennen / verschieben
Создать копию|Duplicate|Створити копію|Duplizieren
В корзину|Move to trash|До кошика|In den Papierkorb
Черновики|Drafts|Чернетки|Entwürfe
Нет несохранённых черновиков.|No unsaved drafts.|Немає незбережених чернеток.|Keine ungespeicherten Entwürfe.
История версий|Version history|Історія версій|Versionsverlauf
Корзина пуста.|Trash is empty.|Кошик порожній.|Papierkorb ist leer.
Список обновлён|File list refreshed|Список оновлено|Dateiliste aktualisiert
Файл восстановлен|File restored|Файл відновлено|Datei wiederhergestellt
Перемещено в корзину|Moved to trash|Переміщено до кошика|In den Papierkorb verschoben
Текст скопирован|Text copied|Текст скопійовано|Text kopiert
Markdown скопирован|Markdown copied|Markdown скопійовано|Markdown kopiert
HTML скопирован|HTML copied|HTML скопійовано|HTML kopiert
Дождитесь завершения сохранения|Wait for saving to finish|Дочекайтеся завершення збереження|Warte, bis das Speichern abgeschlossen ist
Начните писать…|Start writing…|Почніть писати…|Beginne zu schreiben…
Документы|Documents|Документи|Dokumente
С учётом регистра|Case sensitive|З урахуванням регістру|Groß-/Kleinschreibung
Целое слово|Whole word|Ціле слово|Ganzes Wort
Регулярное выражение|Regular expression|Регулярний вираз|Regulärer Ausdruck
Копировать Markdown|Copy Markdown|Копіювати Markdown|Markdown kopieren
Копировать HTML-код|Copy HTML|Копіювати HTML|HTML kopieren
Копировать обычный текст|Copy plain text|Копіювати звичайний текст|Klartext kopieren
Заголовок…|Heading…|Заголовок…|Überschrift…
Обычный абзац|Plain paragraph|Звичайний абзац|Normaler Absatz
Маркированный список|Bullet list|Маркований список|Aufzählung
Нумерованный список|Numbered list|Нумерований список|Nummerierte Liste
Таблица…|Table…|Таблиця…|Tabelle…
Блок кода|Code block|Блок коду|Codeblock
Математический блок|Math block|Математичний блок|Mathematikblock
Диаграмма Mermaid|Mermaid diagram|Діаграма Mermaid|Mermaid-Diagramm
Оглавление|Table of contents|Зміст|Inhaltsverzeichnis
Горизонтальная линия|Horizontal rule|Горизонтальна лінія|Horizontale Linie
Зачёркнутый|Strikethrough|Закреслений|Durchgestrichen
Код в строке|Inline code|Код у рядку|Inline-Code
Выделение маркером|Highlight|Виділення маркером|Hervorheben
Ссылка…|Link…|Посилання…|Link…
Изображение…|Image…|Зображення…|Bild…
Сноска|Footnote|Виноска|Fußnote
Метаданные YAML|YAML metadata|Метадані YAML|YAML-Metadaten
Структура документа|Document outline|Структура документа|Dokumentgliederung
Исходный код|Source code|Джерельний код|Quelltext
Полный экран|Fullscreen|Повний екран|Vollbild
Статистика документа|Document statistics|Статистика документа|Dokumentstatistik
Восстановить черновик…|Restore draft…|Відновити чернетку…|Entwurf wiederherstellen…
Настройки…|Settings…|Налаштування…|Einstellungen…
Markdown: краткая справка|Markdown: quick reference|Markdown: коротка довідка|Markdown: Kurzreferenz
О Codora|About Codora|Про Codora|Über Codora
Краткая справка Markdown|Markdown reference|Довідка Markdown|Markdown-Referenz
Место для ваших мыслей|A place for your thoughts|Місце для ваших думок|Ein Ort für deine Gedanken
Быстро открыть|Quick open|Швидко відкрити|Schnell öffnen
Введите команду…|Type a command…|Введіть команду…|Befehl eingeben…
Введите часть имени файла…|Type part of a file name…|Введіть частину назви файлу…|Teil eines Dateinamens eingeben…
Поиск команд|Search commands|Пошук команд|Befehle suchen
Поиск файла|Search files|Пошук файлу|Dateien suchen
↑ ↓ — выбрать · Enter — открыть · Esc — закрыть|↑ ↓ select · Enter open · Esc close|↑ ↓ вибрати · Enter відкрити · Esc закрити|↑ ↓ wählen · Enter öffnen · Esc schließen
Недавно|Recent|Нещодавно|Zuletzt
Найти в папке…|Find in folder…|Знайти в папці…|Im Ordner suchen…
Слово|Word|Слово|Wort
Поиск по Markdown и текстовым файлам. До 500 совпадений.|Search Markdown and text files. Up to 500 matches.|Пошук у Markdown і текстових файлах. До 500 збігів.|Markdown- und Textdateien durchsuchen. Bis zu 500 Treffer.
Экспорт документа|Export document|Експорт документа|Dokument exportieren
Создайте копию для чтения, публикации или другого редактора.|Create a copy for reading, publishing or another editor.|Створіть копію для читання, публікації або іншого редактора.|Erstelle eine Kopie zum Lesen, Veröffentlichen oder für einen anderen Editor.
PDF / печать|PDF / print|PDF / друк|PDF / Drucken
Изображение PNG|PNG image|Зображення PNG|PNG-Bild
Слайды RevealJS · Pandoc|RevealJS slides · Pandoc|Слайди RevealJS · Pandoc|RevealJS-Folien · Pandoc
Pandoc — внешний конвертер. PDF сохраняется отдельным файлом.|Pandoc is an external converter. PDF is saved as a separate file.|Pandoc — зовнішній конвертер. PDF зберігається окремим файлом.|Pandoc ist ein externer Konverter. PDF wird als separate Datei gespeichert.
Pandoc — внешний конвертер. PDF создаётся через диалог печати браузера.|Pandoc is an external converter. PDF uses the browser print dialog.|Pandoc — зовнішній конвертер. PDF створюється через діалог друку браузера.|Pandoc ist ein externer Konverter. PDF wird über den Druckdialog des Browsers erstellt.
Открываются отдельной несохранённой копией, без замены файла на диске.|Opens as an unsaved copy without replacing the disk file.|Відкривається незбереженою копією без заміни файлу на диску.|Wird als ungespeicherte Kopie geöffnet, ohne die Datei zu ersetzen.
Файлы можно восстановить, пока исходный путь свободен.|Files can be restored while the original path is free.|Файли можна відновити, поки початковий шлях вільний.|Dateien können wiederhergestellt werden, solange der ursprüngliche Pfad frei ist.
слов|words|слів|Wörter
символов|characters|символів|Zeichen
строк|lines|рядків|Zeilen
мин чтения|min read|хв читання|Min. Lesezeit
Совпадений|Matches|Збігів|Treffer
Ничего не найдено|No results|Нічого не знайдено|Keine Ergebnisse
Документы|Documents|Документи|Dokumente
Поиск…|Searching…|Пошук…|Suche…
Меню приложения|Application menu|Меню застосунку|Anwendungsmenü
Перед переименованием сохраните документ|Save the document before renaming|Збережіть документ перед перейменуванням|Dokument vor dem Umbenennen speichern
Сначала закройте другие вкладки этого файла или папки|Close other tabs for this file or folder first|Спочатку закрийте інші вкладки цього файлу або папки|Schließe zuerst andere Tabs dieser Datei oder dieses Ordners
Для открытия документа используйте «Файл → Импортировать»|Use File → Import to open this document|Для відкриття документа використайте «Файл → Імпортувати»|Öffne dieses Dokument über Datei → Importieren`;
const catalog = new Map(
  rows.split("\n").map((row) => {
    const [ru, ...values] = row.split("|");
    return [ru, values] as const;
  }),
);
export function setLanguage(value: string) {
  language = languages.includes(value as Language) ? (value as Language) : "ru";
  document.documentElement.lang = language;
}
export function getLanguage() {
  return language;
}
export function tr(source: string): string {
  if (language === "ru") return source;
  const direct = catalog.get(source)?.[languages.indexOf(language) - 1];
  if (direct) return direct;
  const shortcut = source.match(/^(.*?) · ((?:Ctrl|F\d|Shift|Alt).*)$/);
  if (shortcut) return `${tr(shortcut[1])} · ${shortcut[2]}`;
  return source;
}
const originals = new WeakMap<Node, { source: string; output: string }>();
const attributes = new WeakMap<
  Element,
  Map<string, { source: string; output: string }>
>();
const protectedContent =
  "#editor, #document-name, #workspace-name, #window-title, .file-entry, .outline-entry, .document-tab, .search-hit, .item-list, textarea, pre, code, [data-no-translate]";
/** Translate application chrome only. Editing surfaces, user paths, drafts and values are excluded. */
export function translateUi(root: HTMLElement) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        return node instanceof Element &&
          node.matches(protectedContent + ",svg,style,script")
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    },
  );
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node instanceof Element) {
      const records = attributes.get(node) || new Map();
      for (const key of ["title", "placeholder", "aria-label"]) {
        const current = node.getAttribute(key);
        if (current === null) continue;
        const previous = records.get(key);
        const source = previous?.output === current ? previous.source : current;
        const output = tr(source);
        records.set(key, { source, output });
        if (current !== output) node.setAttribute(key, output);
      }
      attributes.set(node, records);
    } else {
      const current = node.textContent || "";
      const previous = originals.get(node);
      const source = previous?.output === current ? previous.source : current;
      const output = source.replace(/\S[\s\S]*\S|\S/, (text) => tr(text));
      originals.set(node, { source, output });
      if (current !== output) node.textContent = output;
    }
  }
}
export function observeUi(root: HTMLElement) {
  const observer = new MutationObserver((records) => {
    if (
      records.every((record) =>
        (record.target instanceof Element
          ? record.target
          : record.target.parentElement
        )?.closest("#editor,textarea,pre,code,[data-no-translate]"),
      )
    )
      return;
    observer.disconnect();
    translateUi(root);
    observer.observe(root, options);
  });
  const options: MutationObserverInit = {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["title", "placeholder", "aria-label"],
  };
  observer.observe(root, options);
  translateUi(root);
  return observer;
}

import { extensions } from "./extensions";
import { Crepe } from "@milkdown/crepe";
import { editorViewCtx, serializerCtx } from "@milkdown/kit/core";
import { callCommand, insert, $prose } from "@milkdown/kit/utils";
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  turnIntoTextCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  createCodeBlockCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
} from "@milkdown/kit/preset/commonmark";
import {
  toggleStrikethroughCommand,
  insertTableCommand,
} from "@milkdown/kit/preset/gfm";
import { undoCommand, redoCommand } from "@milkdown/kit/plugin/history";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  drawSelection,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { Plugin } from "@milkdown/kit/prose/state";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { basicSetup } from "codemirror";
import { openSearchPanel, searchKeymap } from "@codemirror/search";
import { undo, redo } from "@codemirror/commands";
import {
  api,
  ApiError,
  assetUrl,
  token,
  workspaceScope,
  bytesToBase64,
  download,
} from "./api";
import {
  headings,
  statistics,
  richCompatibility,
  fuzzyScore,
  safeRelativeAsset,
  toc,
} from "./model";
import { diagram, escapeHtml as esc, renderDocument } from "./render";
import "@milkdown/crepe/theme/common/style.css";
import "./style.css";

interface FileEntry {
  path: string;
  name: string;
  directory: boolean;
  modified: number;
  bytes: number;
}
interface Document {
  path: string;
  content: string;
  revision: string;
}
interface Draft {
  id: string;
  path: string | null;
  content: string;
}
interface Settings {
  theme: "paper" | "night" | "sepia" | "system";
  font: string;
  fontSize: number;
  width: number;
  lineHeight: number;
  autosave: boolean;
  spellcheck: boolean;
  focus: boolean;
  typewriter: boolean;
  hidden: boolean;
  allFiles: boolean;
  sort: "name" | "modified";
  customCss: string;
  recent: string[];
  pinned: string[];
}
const defaults: Settings = {
  theme: "paper",
  font: "serif",
  fontSize: 18,
  width: 820,
  lineHeight: 1.8,
  autosave: true,
  spellcheck: true,
  focus: false,
  typewriter: false,
  hidden: false,
  allFiles: false,
  sort: "name",
  customCss: "",
  recent: [],
  pinned: [],
};
function loadLocalSettings(): Settings {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem("typoha-settings") || "{}"),
    };
  } catch {
    return { ...defaults };
  }
}
let settings: Settings = loadLocalSettings();
let preferencesReady = false;
const sample = `# Пространство для мысли\n\nПишите, не отвлекаясь на разметку. **Typoha** превращает Markdown в оформленный документ прямо во время ввода.\n\n## Начните с простого\n\nОткройте папку с заметками или сохраните этот документ под своим именем. Все файлы остаются на вашем компьютере.\n\n- [x] Обычные файлы Markdown\n- [x] Таблицы, формулы и блоки кода\n- [ ] Ваша следующая идея\n\n> Хорошая заметка начинается с одной строки.\n\n## Небольшой пример\n\n| Возможность | Как использовать |\n| --- | --- |\n| Заголовок | Введите решётку и пробел |\n| Список | Начните строку с дефиса |\n| Исходник | Нажмите Ctrl+/ |\n\n### Формула\n\n$$\nE = mc^2\n$$\n\n### Код\n\n\`\`\`rust\nfn main() {\n    println!("Привет, Typoha!");\n}\n\`\`\`\n\n### Диаграмма\n\n\`\`\`mermaid\nflowchart LR\n    A[Идея] --> B[Заметка]\n    B --> C[Готовый текст]\n\`\`\`\n`;
let content = sample,
  path: string | null = null,
  revision: string | null = null,
  dirty = false,
  root = "",
  files: FileEntry[] = [];
let mode: "rich" | "source" | "preview" = "rich",
  sidebar: "files" | "outline" | "search" = "files";
let crepe: Crepe | null = null,
  cm: EditorView | null = null,
  ready = false,
  loading = false,
  saving = false;
let draftId: string = crypto.randomUUID(),
  saveTimer: ReturnType<typeof setTimeout>,
  draftTimer: ReturnType<typeof setTimeout>,
  outlineTimer: ReturnType<typeof setTimeout>;
let lastSaved = sample,
  collapsed = new Set<string>(),
  searchSeq = 0;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const app = $("#app");
app.innerHTML = `<div class="window"><header class="menubar"><button class="wordmark" data-action="about"><span class="brand-glyph">t</span>Typoha</button><nav id="menus" aria-label="Меню приложения"></nav><div class="window-title" id="window-title">Без названия</div><button class="icon-button" data-action="palette" title="Команды · Ctrl+Shift+P" aria-label="Команды">⌘</button></header>
<div class="workspace"><aside id="sidebar"><div class="sidebar-top"><button id="workspace-name" data-action="workspace" title="Открыть другую папку">Заметки</button><button class="icon-button" data-action="new" aria-label="Новый документ" title="Новый документ · Ctrl+N">+</button></div><div class="sidebar-tabs" role="tablist"><button data-tab="files" role="tab">Файлы</button><button data-tab="outline" role="tab">Структура</button><button data-tab="search" role="tab">Поиск</button></div><div id="sidebar-content"></div><footer class="sidebar-footer"><button data-action="workspace" title="Открыть папку">▱ Папка</button><button data-action="settings" title="Настройки" aria-label="Настройки">⚙</button><button data-action="trash" title="Корзина" aria-label="Корзина">♲</button></footer></aside><div id="resize-handle" role="separator" aria-label="Ширина боковой панели"></div>
<main id="main"><div class="document-bar"><div class="breadcrumbs"><button class="icon-button" data-action="sidebar" title="Боковая панель" aria-label="Боковая панель">☰</button><span id="document-name">Без названия</span><span id="save-indicator" aria-live="polite">Новый документ</span></div><div class="view-switch" role="group" aria-label="Режим редактора"><button data-mode="rich" title="Живое редактирование">Редактор</button><button data-mode="source" title="Исходный Markdown · Ctrl+/">Исходник</button><button data-mode="preview" title="Предпросмотр">Просмотр</button></div></div>
<div class="format-bar" aria-label="Форматирование"><button data-action="heading" title="Заголовок">H</button><button data-action="bold" title="Полужирный · Ctrl+B"><b>B</b></button><button data-action="italic" title="Курсив · Ctrl+I"><i>I</i></button><button data-action="strike" title="Зачёркивание"><s>S</s></button><i class="divider"></i><button data-action="link" title="Ссылка · Ctrl+K">↗</button><button data-action="image" title="Изображение">▧</button><button data-action="table" title="Таблица">▦</button><button data-action="code" title="Код">&lt;/&gt;</button><button data-action="math" title="Формула">∑</button><i class="divider"></i><button data-action="bullet" title="Список">☷</button><button data-action="task" title="Список задач">☑</button><button data-action="quote" title="Цитата">❞</button><span class="toolbar-spacer"></span><button data-action="focus" title="Режим фокусировки · F8">◎</button><button data-action="export" title="Экспорт">Экспорт ↗</button></div>
<div id="compatibility" hidden></div><div id="editor-scroll"><div id="editor"></div></div><footer class="statusbar"><div><button data-action="statistics" id="statistics">0 слов</button><span id="cursor-position"></span></div><div><button id="spellcheck-toggle" data-action="spellcheck" title="Проверка орфографии">Аа ✓</button><span>UTF-8</span><button data-action="source" id="source-toggle">Markdown</button><button data-action="settings" id="zoom">100%</button></div></footer></main></div></div><div id="toast" role="status" hidden></div><div id="dropdown" role="menu" hidden></div><dialog id="dialog"></dialog><input type="file" id="image-input" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" hidden><input type="file" id="import-input" accept=".md,.markdown,.txt,.docx,.odt,.rtf,.epub,.html,.rst,.tex" hidden><style id="custom-style"></style>`;

import { actions, type Action } from "./commands";
for (const extension of extensions)
  for (const command of extension.commands || []) {
    actions.push({
      id: `extension:${extension.id}:${command.id}`,
      label: command.label,
      group: "Расширения",
    });
  }
for (const group of [...new Set(actions.map((a) => a.group))]) {
  const b = document.createElement("button");
  b.textContent = group;
  b.addEventListener("click", () =>
    menu(
      b,
      actions.filter((a) => a.group === group),
    ),
  );
  $("#menus").append(b);
}
function toast(message: string, error = false) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.toggle("error", error);
  el.hidden = false;
  setTimeout(
    () => {
      if (el.textContent === message) el.hidden = true;
    },
    error ? 12000 : 3500,
  );
}
function report(e: unknown) {
  console.error(e);
  toast(e instanceof Error ? e.message : String(e), true);
}
function fire(p: Promise<unknown> | void) {
  if (p) p.catch(report);
}
function menu(
  anchor: HTMLElement,
  items: Action[],
  targetPath: string | null = null,
) {
  const box = $("#dropdown");
  box.replaceChildren();
  for (const a of items) {
    const b = document.createElement("button");
    b.setAttribute("role", "menuitem");
    b.innerHTML = `<span>${esc(a.label)}</span><kbd>${esc(a.key || "")}</kbd>`;
    b.onclick = () => {
      box.hidden = true;
      fire(run(a.id, targetPath));
    };
    box.append(b);
  }
  const r = anchor.getBoundingClientRect();
  box.style.left = `${Math.min(r.left, innerWidth - 310)}px`;
  box.style.top = `${r.bottom + 5}px`;
  box.hidden = false;
}
function setSettings() {
  if (preferencesReady) fire(api("preferences", settings));
  localStorage.setItem("typoha-settings", JSON.stringify(settings));
  applySettings();
}
function applySettings() {
  let theme = settings.theme;
  if (theme === "system")
    theme = matchMedia("(prefers-color-scheme: dark)").matches
      ? "night"
      : "paper";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.setProperty(
    "--writing-width",
    `${settings.width}px`,
  );
  document.documentElement.style.setProperty(
    "--writing-size",
    `${settings.fontSize}px`,
  );
  document.documentElement.style.setProperty(
    "--writing-font",
    settings.font === "mono"
      ? "ui-monospace, monospace"
      : settings.font === "sans"
        ? "system-ui, sans-serif"
        : 'Georgia, "Times New Roman", serif',
  );
  document.documentElement.style.setProperty(
    "--writing-leading",
    String(settings.lineHeight),
  );
  document.body.classList.toggle("focus-mode", settings.focus);
  document.body.classList.toggle("typewriter-mode", settings.typewriter);
  $("#custom-style").textContent = settings.customCss;
  $("#zoom").textContent = `${Math.round((settings.fontSize / 18) * 100)}%`;
  $("#spellcheck-toggle").classList.toggle("active", settings.spellcheck);
  $("#editor")
    .querySelectorAll<HTMLElement>("[contenteditable]")
    .forEach((e) => (e.spellcheck = settings.spellcheck));
}
function updateStatus() {
  const name = path?.split("/").pop() || "Без названия";
  $("#document-name").textContent = name;
  $("#document-name").title = path || name;
  $("#window-title").textContent = `${dirty ? "● " : ""}${name} — Typoha`;
  document.title = `${dirty ? "● " : ""}${name} — Typoha`;
  $("#save-indicator").textContent = saving
    ? "Сохранение…"
    : dirty
      ? "Изменён"
      : path
        ? "Сохранено"
        : "Новый документ";
  $("#save-indicator").classList.toggle("unsaved", dirty);
  const st = statistics(content);
  $("#statistics").textContent = `${st.words.toLocaleString("ru")} слов`;
  $("#statistics").title =
    `${st.characters} символов · ${st.lines} строк · ${st.minutes} мин чтения`;
  document
    .querySelectorAll<HTMLElement>("[data-mode]")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
}
function changed(next: string) {
  if (!ready || loading || next === content) return;
  content = next;
  try {
    sessionStorage.setItem(
      "typoha-emergency-draft",
      JSON.stringify({ root, path, content }),
    );
  } catch {
    /* Server drafts still protect documents larger than browser storage. */
  }
  for (const extension of extensions) {
    try {
      extension.onDocumentChange?.(content);
    } catch (e) {
      report(e);
    }
  }
  dirty = content !== lastSaved;
  updateStatus();
  clearTimeout(saveTimer);
  clearTimeout(draftTimer);
  clearTimeout(outlineTimer);
  draftTimer = setTimeout(() => fire(persistDraft()), 450);
  if (settings.autosave && path)
    saveTimer = setTimeout(() => {
      if (settings.autosave && dirty && path) fire(save(false));
    }, 1600);
  outlineTimer = setTimeout(() => {
    if (sidebar === "outline") renderSidebar();
  }, 350);
}
async function persistDraft() {
  if (dirty) await api("drafts", { id: draftId, path, content });
}
function currentSource() {
  return content;
}
async function mountEditor(nextMode = mode) {
  if (loading) return;
  clearTimeout(saveTimer);
  clearTimeout(draftTimer);
  ready = false;
  loading = true;
  const scroll = $("#editor-scroll").scrollTop;
  try {
    if (crepe) {
      await crepe.destroy();
      crepe = null;
    }
    cm?.destroy();
    cm = null;
    const holder = $("#editor");
    holder.replaceChildren();
    mode = nextMode;
    const reason = richCompatibility(content);
    const hint = $("#compatibility");
    hint.hidden = !(reason && mode === "rich");
    if (reason && mode === "rich") {
      hint.textContent = `В документе есть ${reason}. Чтобы сохранить разметку без потерь, открыт исходник. Оформление доступно во вкладке «Просмотр».`;
      mode = "source";
      hint.hidden = false;
    }
    if (mode === "source") {
      cm = new EditorView({
        state: EditorState.create({
          doc: content,
          extensions: [
            basicSetup,
            markdown({ codeLanguages: languages }),
            keymap.of(searchKeymap),
            EditorView.lineWrapping,
            drawSelection(),
            highlightActiveLine(),
            EditorView.contentAttributes.of({
              spellcheck: String(settings.spellcheck),
              "aria-label": "Исходный Markdown",
            }),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) changed(update.state.doc.toString());
              if (update.selectionSet) {
                const pos = update.state.selection.main.head;
                const line = update.state.doc.lineAt(pos);
                $("#cursor-position").textContent =
                  `${line.number}:${pos - line.from + 1}`;
              }
            }),
          ],
        }),
        parent: holder,
      });
    } else if (mode === "preview") {
      holder.append(await renderDocument(content, path));
    } else {
      crepe = new Crepe({
        root: holder,
        defaultValue: content,
        features: { [Crepe.Feature.AI]: false, [Crepe.Feature.TopBar]: false },
        featureConfigs: {
          [Crepe.Feature.Placeholder]: { text: "Начните писать…" },
          [Crepe.Feature.ImageBlock]: {
            onUpload: uploadImage,
            proxyDomURL: (url) => {
              const relative = safeRelativeAsset(path, url);
              return relative === null
                ? ""
                : relative.startsWith("data:")
                  ? relative
                  : assetUrl(relative);
            },
            onImageLoadError: () => {},
          },
          [Crepe.Feature.CodeMirror]: {
            languages,
            renderPreview: (language, code, apply) => {
              if (language.toLowerCase() !== "mermaid") return null;
              void diagram(code).then(apply);
              return "Построение диаграммы…";
            },
            previewOnlyByDefault: true,
          },
          [Crepe.Feature.Latex]: {
            katexOptions: { trust: false, throwOnError: false },
          },
        },
      });
      crepe.editor.use(
        $prose(
          (ctx) =>
            new Plugin({
              view() {
                return {
                  update(view, previous) {
                    if (!view.state.doc.eq(previous.doc))
                      changed(ctx.get(serializerCtx)(view.state.doc));
                  },
                };
              },
            }),
        ),
      );
      await crepe.create();
    }
    updateStatus();
    applySettings();
    $("#editor-scroll").scrollTop = scroll;
  } finally {
    loading = false;
    ready = true;
    if (dirty && settings.autosave && path)
      saveTimer = setTimeout(() => {
        if (dirty && path && settings.autosave) fire(save(false));
      }, 1600);
  }
}
async function setContent(next: string, markDirty = true) {
  content = next;
  dirty = markDirty && content !== lastSaved;
  await mountEditor();
  updateStatus();
  if (dirty) await persistDraft();
  renderSidebar();
}
function selected() {
  if (cm) {
    const sel = cm.state.selection.main;
    return cm.state.sliceDoc(sel.from, sel.to);
  }
  return window.getSelection()?.toString() || "";
}
async function insertText(text: string, wrap?: [string, string]) {
  if (mode === "preview") await mountEditor("source");
  if (cm) {
    const s = cm.state.selection.main;
    const value = wrap
      ? wrap[0] + cm.state.sliceDoc(s.from, s.to) + wrap[1]
      : text;
    cm.dispatch({
      changes: { from: s.from, to: s.to, insert: value },
      selection: { anchor: s.from + value.length },
    });
    cm.focus();
  } else if (crepe) {
    if (wrap) {
      const view = crepe.editor.ctx.get(editorViewCtx);
      const { from, to } = view.state.selection;
      const selection = view.state.doc.textBetween(from, to);
      crepe.editor.action(insert(wrap[0] + selection + wrap[1]));
    } else crepe.editor.action(insert(text));
  }
}
function richCommand(command: any, payload?: any) {
  if (crepe) {
    crepe.editor.action(callCommand(command.key, payload));
    crepe.editor.ctx.get(editorViewCtx).focus();
    return true;
  }
  return false;
}
async function save(asNew: boolean) {
  if (saving) return;
  let destination = path;
  if (asNew || !destination) {
    destination = await input(
      "Сохранить документ",
      "Путь относительно открытой папки",
      asNew && path
        ? path.replace(/(\.[^.]+)?$/, "-копия.md")
        : path || "Новая заметка.md",
    );
    if (!destination) return;
  }
  saving = true;
  updateStatus();
  const snapshot = currentSource();
  const previousPath = path;
  try {
    const saved = await api<Document>("document", {
      path: destination,
      content: snapshot,
      expected_revision: asNew ? null : destination === path ? revision : null,
    });
    if (path === previousPath) {
      path = saved.path;
      revision = saved.revision;
      lastSaved = snapshot;
      dirty = content !== snapshot;
      if (!dirty) {
        await api("drafts/clear", { id: draftId });
        sessionStorage.removeItem("typoha-emergency-draft");
      } else await persistDraft();
      remember(path);
    }
    await refreshFiles();
  } catch (e) {
    await persistDraft().catch(() => {});
    throw e;
  } finally {
    saving = false;
    updateStatus();
  }
  if (dirty && settings.autosave && path)
    saveTimer = setTimeout(() => {
      if (settings.autosave && dirty && path) fire(save(false));
    }, 1600);
}
async function canLeave() {
  if (saving) {
    toast("Дождитесь завершения сохранения");
    return false;
  }
  if (!dirty) return true;
  await persistDraft();
  const answer = await choose(
    "Несохранённые изменения",
    "Сохранить текущий документ перед переходом? Копия ваших правок также находится в черновиках.",
    [
      { id: "save", label: "Сохранить" },
      { id: "draft", label: "Оставить в черновиках" },
      { id: "cancel", label: "Отмена" },
    ],
  );
  if (answer === "save") {
    await save(false);
    return !dirty;
  }
  return answer === "draft";
}
async function openDocument(target: string, line?: number) {
  if (loading || !(await canLeave())) return;
  const doc = await api<Document>(
    `document?path=${encodeURIComponent(target)}`,
  );
  path = doc.path;
  content = doc.content;
  lastSaved = content;
  revision = doc.revision;
  dirty = false;
  draftId = crypto.randomUUID();
  remember(path);
  await mountEditor(line ? "source" : mode);
  renderSidebar();
  if (line && cm) {
    const ln = cm.state.doc.line(Math.min(line, cm.state.doc.lines));
    cm.dispatch({
      selection: { anchor: ln.from },
      effects: EditorView.scrollIntoView(ln.from, { y: "center" }),
    });
    cm.focus();
  }
}
function remember(p: string) {
  settings.recent = [
    `${root}\n${p}`,
    ...settings.recent.filter((v) => v !== `${root}\n${p}`),
  ].slice(0, 30);
  setSettings();
}
async function refreshFiles() {
  files = await api<FileEntry[]>(
    `files?hidden=${settings.hidden}&all=${settings.allFiles}`,
  );
  renderSidebar();
}
function renderSidebar() {
  document.querySelectorAll<HTMLElement>("[data-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === sidebar);
    b.setAttribute("aria-selected", String(b.dataset.tab === sidebar));
  });
  const box = $("#sidebar-content");
  if (sidebar === "search") {
    renderSearch();
    return;
  }
  box.replaceChildren();
  if (sidebar === "outline") {
    const hs = headings(content);
    if (!hs.length)
      box.innerHTML =
        '<p class="empty-state">Добавьте заголовки — здесь появится структура документа.</p>';
    for (const h of hs) {
      const b = document.createElement("button");
      b.className = "outline-entry";
      b.style.paddingLeft = `${16 + (h.level - 1) * 14}px`;
      b.textContent = h.title;
      b.onclick = () => jumpHeading(h.line, h.slug, h.title);
      box.append(b);
    }
    return;
  }
  const tools = document.createElement("div");
  tools.className = "file-tools";
  tools.innerHTML = `<input id="file-filter" placeholder="Фильтр файлов…" aria-label="Фильтр файлов"><button data-action="sort" title="Порядок сортировки">⇅</button><button data-action="refresh" title="Обновить файлы">⟳</button>`;
  box.append(tools);
  const list = document.createElement("div");
  list.id = "file-list";
  box.append(list);
  const renderList = (filter: string) => {
    list.replaceChildren();
    let items = [...files];
    if (settings.sort === "modified")
      items.sort(
        (a, b) =>
          Number(b.directory) - Number(a.directory) || b.modified - a.modified,
      );
    items = items.filter((e) =>
      e.path.toLowerCase().includes(filter.toLowerCase()),
    );
    for (const entry of items) {
      if (
        !filter &&
        entry.path
          .split("/")
          .slice(0, -1)
          .some((_, i, parts) => collapsed.has(parts.slice(0, i + 1).join("/")))
      )
        continue;
      const b = document.createElement("button");
      b.className = `file-entry ${entry.directory ? "folder" : ""} ${entry.path === path ? "selected" : ""}`;
      b.style.paddingLeft = `${14 + (entry.path.split("/").length - 1) * 16}px`;
      b.title = entry.path;
      b.innerHTML = `<span class="file-symbol">${entry.directory ? (collapsed.has(entry.path) ? "▸" : "▾") : "▤"}</span><span class="file-label">${esc(entry.name)}</span>`;
      b.onclick = () => {
        if (entry.directory) {
          if (collapsed.has(entry.path)) collapsed.delete(entry.path);
          else collapsed.add(entry.path);
          renderList(filter);
        } else fire(openDocument(entry.path));
      };
      b.oncontextmenu = (event) => {
        event.preventDefault();
        menu(
          b,
          actions.filter((a) =>
            [
              "rename",
              "delete",
              ...(!entry.directory ? ["duplicate"] : []),
            ].includes(a.id),
          ),
          entry.path,
        );
      };
      list.append(b);
    }
    if (!items.length)
      list.innerHTML =
        '<p class="empty-state">Здесь пока нет документов.<br>Создайте заметку кнопкой +.</p>';
  };
  renderList("");
  $("#file-filter").oninput = (event) =>
    renderList((event.target as HTMLInputElement).value);
}
function jumpHeading(line: number, slug: string, title: string) {
  if (cm) {
    const ln = cm.state.doc.line(Math.min(line + 1, cm.state.doc.lines));
    cm.dispatch({
      selection: { anchor: ln.from },
      effects: EditorView.scrollIntoView(ln.from, { y: "start" }),
    });
    cm.focus();
  } else {
    const node = [...$("#editor").querySelectorAll("h1,h2,h3,h4,h5,h6")].find(
      (h) => h.id === slug || h.textContent === title,
    );
    node?.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}
function renderSearch() {
  const box = $("#sidebar-content");
  box.innerHTML =
    '<div class="search-controls"><input id="global-query" placeholder="Найти в папке…" aria-label="Поиск в папке"><div><label><input type="checkbox" id="search-case"> Aa</label><label><input type="checkbox" id="search-word"> Слово</label><label><input type="checkbox" id="search-regex"> .*</label></div></div><div id="search-results"><p class="empty-state">Поиск по Markdown и текстовым файлам. До 500 совпадений.</p></div>';
  let timer: ReturnType<typeof setTimeout>;
  const search = () => {
    clearTimeout(timer);
    timer = setTimeout(() => fire(doSearch()), 220);
  };
  box.querySelectorAll("input").forEach((i) => (i.oninput = search));
}
async function doSearch() {
  const seq = ++searchSeq;
  const query = $<HTMLInputElement>("#global-query").value;
  const result = await api<{ path: string; line: number; text: string }[]>(
    "search",
    {
      query,
      regex: $<HTMLInputElement>("#search-regex").checked,
      case_sensitive: $<HTMLInputElement>("#search-case").checked,
      whole_word: $<HTMLInputElement>("#search-word").checked,
    },
  );
  if (seq !== searchSeq || sidebar !== "search") return;
  const box = $("#search-results");
  box.replaceChildren();
  const summary = document.createElement("p");
  summary.className = "search-summary";
  summary.textContent = `Совпадений: ${result.length}${result.length === 500 ? "+" : ""}`;
  box.append(summary);
  for (const hit of result) {
    const b = document.createElement("button");
    b.className = "search-hit";
    b.innerHTML = `<strong>${esc(hit.path)}:${hit.line}</strong><span>${esc(hit.text)}</span>`;
    b.onclick = () => fire(openDocument(hit.path, hit.line));
    box.append(b);
  }
}
function dialogShell(title: string, body: string) {
  const d = $<HTMLDialogElement>("#dialog");
  if (d.open) d.close();
  d.innerHTML = `<form method="dialog"><header><h2>${esc(title)}</h2><button value="cancel" class="close-dialog" aria-label="Закрыть">×</button></header>${body}</form>`;
  d.returnValue = "";
  d.querySelectorAll<HTMLButtonElement>('button[value="cancel"]').forEach(
    (b) => (b.formNoValidate = true),
  );
  d.showModal();
  return d;
}
async function input(
  title: string,
  label: string,
  value = "",
): Promise<string | null> {
  const d = dialogShell(
    title,
    `<label class="field">${esc(label)}<input id="dialog-input" value="${esc(value)}" autocomplete="off" required></label><div class="dialog-actions"><button value="cancel">Отмена</button><button value="ok" class="primary">Продолжить</button></div>`,
  );
  const field = $<HTMLInputElement>("#dialog-input");
  field.focus();
  field.select();
  return new Promise((resolve) =>
    d.addEventListener(
      "close",
      () => resolve(d.returnValue === "ok" ? field.value.trim() : null),
      { once: true },
    ),
  );
}
async function choose(
  title: string,
  message: string,
  buttons: { id: string; label: string }[],
): Promise<string> {
  const d = dialogShell(
    title,
    `<p>${esc(message)}</p><div class="dialog-actions">${buttons.map((b, i) => `<button value="${b.id}" class="${i === 0 ? "primary" : ""}">${esc(b.label)}</button>`).join("")}</div>`,
  );
  return new Promise((resolve) =>
    d.addEventListener("close", () => resolve(d.returnValue), { once: true }),
  );
}
function palette(commands = false) {
  const d = dialogShell(
    commands ? "Команды" : "Быстро открыть",
    `<input id="palette-query" placeholder="${commands ? "Введите команду…" : "Введите часть имени файла…"}" aria-label="${commands ? "Поиск команд" : "Поиск файла"}" autocomplete="off"><div id="palette-results"></div><p class="dialog-hint">↑ ↓ — выбрать · Enter — открыть · Esc — закрыть</p>`,
  );
  let index = 0;
  const q = $<HTMLInputElement>("#palette-query");
  const box = $("#palette-results");
  let filtered: {
    label: string;
    key?: string;
    run: () => unknown;
    score: number;
  }[] = [];
  const render = () => {
    const choices = commands
      ? actions.map((a) => ({
          label: `${a.group} › ${a.label}`,
          key: a.key,
          run: () => run(a.id),
        }))
      : files
          .filter((f) => !f.directory)
          .map((f) => ({
            label: f.path,
            key: settings.recent.includes(`${root}\n${f.path}`)
              ? "Недавно"
              : "",
            run: () => openDocument(f.path),
          }));
    filtered = choices
      .map((a) => ({ ...a, score: fuzzyScore(q.value, a.label) }))
      .filter((a) => a.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 60);
    index = 0;
    paint();
  };
  const paint = () => {
    box.replaceChildren();
    filtered.forEach((a, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = i === index ? "selected" : "";
      b.innerHTML = `<span>${esc(a.label)}</span><kbd>${esc(a.key || "")}</kbd>`;
      b.onclick = () => {
        d.close();
        fire(Promise.resolve(a.run()));
      };
      box.append(b);
    });
  };
  q.oninput = render;
  q.onkeydown = (e) => {
    if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
      e.preventDefault();
      if (e.key === "Enter") {
        d.close();
        fire(Promise.resolve(filtered[index]?.run()));
      } else {
        index = Math.max(
          0,
          Math.min(
            filtered.length - 1,
            index + (e.key === "ArrowDown" ? 1 : -1),
          ),
        );
        paint();
        box.children[index]?.scrollIntoView({ block: "nearest" });
      }
    }
  };
  render();
  q.focus();
}
async function uploadImage(file: File): Promise<string> {
  const data = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
  const result = await api<{ path: string }>("upload", {
    name: file.name,
    data,
  });
  const prefix =
    path
      ?.split("/")
      .slice(0, -1)
      .map(() => "../")
      .join("") || "";
  return prefix + result.path;
}
async function exportDialog() {
  const d = dialogShell(
    "Экспорт документа",
    `<p>Создайте копию для чтения, публикации или другого редактора.</p><div class="export-grid">${[
      ["md", "Markdown"],
      ["html", "HTML"],
      ["pdf", "PDF / печать"],
      ["png", "Изображение PNG"],
      ["docx", "Word · Pandoc"],
      ["odt", "OpenDocument · Pandoc"],
      ["epub", "EPUB · Pandoc"],
      ["rtf", "RTF · Pandoc"],
      ["latex", "LaTeX · Pandoc"],
      ["mediawiki", "MediaWiki · Pandoc"],
      ["revealjs", "Слайды RevealJS · Pandoc"],
    ]
      .map(
        ([id, label]) =>
          `<button type="button" data-export="${id}">${label}</button>`,
      )
      .join(
        "",
      )}</div><p class="dialog-hint">Pandoc — внешний конвертер. PDF создаётся через диалог печати браузера.</p>`,
  );
  d.querySelectorAll<HTMLElement>("[data-export]").forEach(
    (b) =>
      (b.onclick = () => {
        d.close();
        fire(exportFile(b.dataset.export!));
      }),
  );
}
const exportCss = `body{margin:48px auto;max-width:820px;padding:0 36px;color:#24272b;background:white;font:18px/1.8 Georgia,serif}h1,h2,h3,h4{line-height:1.3}h1{font-size:2.3em}h2{margin-top:1.8em}img,svg{max-width:100%}pre{white-space:pre-wrap;background:#f4f4f4;padding:20px;border-radius:6px}code{font-family:monospace}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px 14px}blockquote{border-left:3px solid #aaa;padding-left:20px;color:#60646b}.document-toc a{display:block}a{color:#367269}.katex-html{display:none}.katex-mathml{position:static}math{font-family:serif}@media print{body{margin:0;max-width:none}pre,table,img{break-inside:avoid}h1,h2,h3{break-after:avoid}}`;
async function exportArticle() {
  const article = await renderDocument(content, path);
  for (const img of article.querySelectorAll("img")) {
    if (img.src.includes("/api/asset?")) {
      try {
        const blob = await (await fetch(img.src)).blob();
        img.src = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
      } catch {
        img.removeAttribute("src");
      }
    }
  }
  return article;
}
async function exportFile(format: string) {
  const name = (path?.split("/").pop() || "Документ.md").replace(
    /\.[^.]+$/,
    "",
  );
  if (format === "md") {
    download(content, `${name}.md`, "text/markdown;charset=utf-8");
    return;
  }
  if (format === "html") {
    const article = await exportArticle();
    download(
      `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(name)}</title><style>${exportCss}</style><body>${article.outerHTML}</body></html>`,
      `${name}.html`,
      "text/html;charset=utf-8",
    );
    return;
  }
  if (format === "pdf") {
    await printDocument();
    return;
  }
  if (format === "png") {
    const article = await exportArticle();
    article.classList.add("export-image");
    document.body.append(article);
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(article, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        skipFonts: true,
      });
      if (!blob) throw new Error("Браузер не смог создать PNG");
      download(blob, `${name}.png`);
    } finally {
      article.remove();
    }
    return;
  }
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "content-type": "application/json", "x-typoha-token": token },
    body: JSON.stringify({ content, format }),
  });
  if (!response.ok) throw new Error((await response.json()).error);
  download(
    await response.blob(),
    `${name}.${format === "latex" ? "tex" : format === "revealjs" ? "html" : format}`,
  );
}
async function printDocument() {
  const article = await exportArticle();
  const area = document.createElement("div");
  area.id = "print-area";
  area.append(article);
  $("#print-area")?.remove();
  document.body.append(area);
  window.print();
}
async function showHistory() {
  if (!path) {
    toast("Сначала сохраните документ");
    return;
  }
  const snapshots = await api<{ id: string; bytes: number }[]>(
    `history?path=${encodeURIComponent(path)}`,
  );
  const d = dialogShell(
    "История версий",
    '<p>Выберите снимок. Он откроется как несохранённые правки; текущая версия на диске останется доступна.</p><div id="history-list" class="item-list"></div>',
  );
  const box = $("#history-list");
  if (!snapshots.length)
    box.textContent =
      "История появится после следующего изменения сохранённого файла.";
  for (const s of snapshots) {
    const b = document.createElement("button");
    const timestamp = Number(s.id.split("-")[0]);
    b.textContent = `${new Date(timestamp).toLocaleString("ru")} · ${s.bytes} байт`;
    b.onclick = () =>
      fire(
        (async () => {
          d.close();
          if (!(await canLeave())) return;
          const snap = await api<{ content: string }>(
            `snapshot?path=${encodeURIComponent(path!)}&id=${encodeURIComponent(s.id)}`,
          );
          await setContent(snap.content);
        })(),
      );
    box.append(b);
  }
}
async function showDrafts() {
  const drafts = await api<Draft[]>("drafts");
  const emergency = sessionStorage.getItem("typoha-emergency-draft");
  if (emergency) {
    try {
      const d = JSON.parse(emergency);
      drafts.unshift({
        id: crypto.randomUUID(),
        path: `Аварийная копия: ${d.path || "Без названия"}`,
        content: d.content,
      });
    } catch {}
  }
  const d = dialogShell(
    "Черновики",
    '<p>Открываются отдельной несохранённой копией, без замены файла на диске.</p><div id="draft-list" class="item-list"></div>',
  );
  const box = $("#draft-list");
  if (!drafts.length) box.textContent = "Нет несохранённых черновиков.";
  for (const draft of drafts) {
    const b = document.createElement("button");
    b.textContent = `${draft.path || "Без названия"} — ${draft.content.slice(0, 70).replaceAll("\n", " ")}`;
    b.onclick = () =>
      fire(
        (async () => {
          d.close();
          if (!(await canLeave())) return;
          path = null;
          revision = null;
          lastSaved = "";
          draftId = draft.id;
          await setContent(draft.content);
        })(),
      );
    box.append(b);
  }
}
async function showTrash() {
  const trash = await api<{ id: string; path: string }[]>("trash");
  const d = dialogShell(
    "Корзина",
    '<p>Файлы можно восстановить, пока исходный путь свободен.</p><div id="trash-list" class="item-list"></div>',
  );
  const box = $("#trash-list");
  if (!trash.length) box.textContent = "Корзина пуста.";
  for (const t of trash) {
    const b = document.createElement("button");
    b.textContent = `Восстановить: ${t.path}`;
    b.onclick = () =>
      fire(
        (async () => {
          await api("restore", { id: t.id });
          d.close();
          await refreshFiles();
          toast("Файл восстановлен");
        })(),
      );
    box.append(b);
  }
}
function showSettings() {
  const d = dialogShell(
    "Настройки",
    `<div class="settings-grid"><label>Тема<select name="theme">${[
      ["paper", "Бумага"],
      ["sepia", "Сепия"],
      ["night", "Ночь"],
      ["system", "Системная"],
    ]
      .map(([id, name]) => `<option value="${id}">${name}</option>`)
      .join(
        "",
      )}</select></label><label>Шрифт<select name="font"><option value="serif">С засечками</option><option value="sans">Системный</option><option value="mono">Моноширинный</option></select></label><label>Размер текста<input type="number" name="fontSize" min="12" max="36" value="${settings.fontSize}"></label><label>Ширина страницы<input type="number" name="width" min="480" max="1400" step="20" value="${settings.width}"></label><label>Межстрочный интервал<input type="number" name="lineHeight" min="1.2" max="2.5" step="0.1" value="${settings.lineHeight}"></label><label>Сортировка<select name="sort"><option value="name">По имени</option><option value="modified">По изменению</option></select></label></div><div class="settings-checks">${[
      ["autosave", "Автосохранение файлов"],
      ["spellcheck", "Проверка орфографии браузером"],
      ["focus", "Режим фокусировки"],
      ["typewriter", "Режим печатной машинки"],
      ["hidden", "Показывать скрытые файлы"],
      ["allFiles", "Показывать все типы файлов"],
    ]
      .map(
        ([id, label]) =>
          `<label><input type="checkbox" name="${id}" ${(settings as any)[id] ? "checked" : ""}>${label}</label>`,
      )
      .join(
        "",
      )}</div><label class="field">Пользовательский CSS<textarea name="customCss" rows="5" spellcheck="false" placeholder=".milkdown h1 { color: #276b62; }">${esc(settings.customCss)}</textarea></label><p class="dialog-hint">CSS применяется локально. Сетевые ресурсы блокируются. Настройки сохраняются в открытой папке и доступны после перезапуска.</p><div class="dialog-actions"><button value="cancel">Отмена</button><button value="ok" class="primary">Применить</button></div>`,
  );
  for (const name of ["theme", "font", "sort"])
    d.querySelector<HTMLSelectElement>(`[name=${name}]`)!.value = (
      settings as any
    )[name];
  d.addEventListener(
    "close",
    () => {
      if (d.returnValue !== "ok") return;
      const form = d.querySelector("form")!;
      const data = new FormData(form);
      for (const key of ["theme", "font", "sort", "customCss"])
        (settings as any)[key] = data.get(key);
      for (const key of [
        "autosave",
        "spellcheck",
        "focus",
        "typewriter",
        "hidden",
        "allFiles",
      ])
        (settings as any)[key] = data.has(key);
      settings.fontSize = Math.max(
        12,
        Math.min(36, Number(data.get("fontSize")) || 18),
      );
      settings.width = Math.max(
        480,
        Math.min(1400, Number(data.get("width")) || 820),
      );
      settings.lineHeight = Math.max(
        1.2,
        Math.min(2.5, Number(data.get("lineHeight")) || 1.8),
      );
      clearTimeout(saveTimer);
      setSettings();
      fire(refreshFiles());
      if (cm) fire(mountEditor());
    },
    { once: true },
  );
}
async function run(
  id: string,
  targetPath: string | null = null,
): Promise<void> {
  const target = targetPath || path;
  if (id.startsWith("extension:")) {
    const [, extensionId, commandId] = id.split(":");
    const command = extensions
      .find((e) => e.id === extensionId)
      ?.commands?.find((c) => c.id === commandId);
    if (command)
      await command.run({
        getMarkdown: () => content,
        setMarkdown: (text) => setContent(text),
        insertMarkdown: (text) => insertText(text),
        notify: (message) => toast(message),
      });
    return;
  }
  if (id.startsWith("theme-")) {
    settings.theme = id.slice(6) as Settings["theme"];
    setSettings();
    return;
  }
  switch (id) {
    case "new":
      if (await canLeave()) {
        path = null;
        revision = null;
        content = "";
        lastSaved = "";
        dirty = false;
        draftId = crypto.randomUUID();
        await mountEditor();
        renderSidebar();
        cm?.focus();
        crepe?.editor.ctx.get(editorViewCtx).focus();
      }
      break;
    case "workspace":
      {
        if (!(await canLeave())) return;
        const destination = await input(
          "Открыть папку",
          "Полный путь к папке",
          root,
        );
        if (destination) {
          await api("workspace", { root: destination });
          root = (await api("workspace")).root;
          settings = {
            ...defaults,
            ...(await api<Partial<Settings>>("preferences")),
          };
          applySettings();
          $("#workspace-name").textContent = root.split("/").pop() || root;
          $("#workspace-name").title = root;
          collapsed.clear();
          path = null;
          content = "";
          lastSaved = "";
          revision = null;
          dirty = false;
          draftId = crypto.randomUUID();
          await refreshFiles();
          await mountEditor();
        }
      }
      break;
    case "open":
      palette();
      break;
    case "palette":
      palette(true);
      break;
    case "reload":
      if (path) await openDocument(path);
      break;
    case "save":
      await save(false);
      break;
    case "save-as":
      await save(true);
      break;
    case "duplicate": {
      if (target && target !== path) {
        const original = await api<Document>(
          `document?path=${encodeURIComponent(target)}`,
        );
        const destination = await input(
          "Создать копию",
          "Новый относительный путь",
          target.replace(/(\.[^.]+)?$/, "-копия.md"),
        );
        if (destination) {
          await api("document", {
            path: destination,
            content: original.content,
            expected_revision: null,
          });
          await refreshFiles();
        }
      } else await save(true);
      break;
    }
    case "new-folder":
      {
        const p = await input(
          "Новая папка",
          "Путь относительно рабочей папки",
          "Новая папка",
        );
        if (p) {
          await api("folder", { path: p });
          await refreshFiles();
        }
      }
      break;
    case "rename":
      if (target) {
        if (dirty && (target === path || path?.startsWith(target + "/"))) {
          toast("Перед переименованием сохраните документ");
          return;
        }
        const to = await input(
          "Переименовать / переместить",
          "Новый путь",
          target,
        );
        if (to) {
          await api("rename", { from: target, to });
          if (path === target || path?.startsWith(target + "/")) {
            path = to + path!.slice(target.length);
            revision = (
              await api<Document>(`document?path=${encodeURIComponent(path!)}`)
            ).revision;
            updateStatus();
          }
          await refreshFiles();
        }
      }
      break;
    case "delete":
      if (target) {
        if (
          (target === path || path?.startsWith(target + "/")) &&
          !(await canLeave())
        )
          return;
        const answer = await choose("Переместить в корзину", target, [
          { id: "yes", label: "В корзину" },
          { id: "cancel", label: "Отмена" },
        ]);
        if (answer === "yes") {
          await api("trash", { path: target });
          if (target === path || path?.startsWith(target + "/")) {
            path = null;
            revision = null;
            dirty = false;
            content = "";
            lastSaved = "";
            await mountEditor();
          }
          await refreshFiles();
          toast("Перемещено в корзину");
        }
      }
      break;
    case "undo":
      if (cm) undo(cm);
      else richCommand(undoCommand);
      break;
    case "redo":
      if (cm) redo(cm);
      else richCommand(redoCommand);
      break;
    case "bold":
      if (!richCommand(toggleStrongCommand)) await insertText("", ["**", "**"]);
      break;
    case "italic":
      if (!richCommand(toggleEmphasisCommand)) await insertText("", ["*", "*"]);
      break;
    case "strike":
      if (!richCommand(toggleStrikethroughCommand))
        await insertText("", ["~~", "~~"]);
      break;
    case "inline-code":
      if (!richCommand(toggleInlineCodeCommand))
        await insertText("", ["`", "`"]);
      break;
    case "heading":
      {
        const level = await input("Заголовок", "Уровень от 1 до 6", "2");
        const n = Number(level);
        if (level && n >= 1 && n <= 6) {
          if (!richCommand(wrapInHeadingCommand, n))
            await insertText(`${"#".repeat(n)} `);
        }
      }
      break;
    case "paragraph":
      richCommand(turnIntoTextCommand);
      break;
    case "bullet":
      if (!richCommand(wrapInBulletListCommand)) await insertText("- ");
      break;
    case "ordered":
      if (!richCommand(wrapInOrderedListCommand)) await insertText("1. ");
      break;
    case "quote":
      if (!richCommand(wrapInBlockquoteCommand)) await insertText("> ");
      break;
    case "task":
      await insertText("- [ ] Задача\n");
      break;
    case "table":
      {
        const size = await input(
          "Вставить таблицу",
          "Строки × столбцы (например 3x2)",
          "3x2",
        );
        const m = size?.match(/^(\d{1,2})\s*[xх×*]\s*(\d{1,2})$/);
        if (!m) {
          if (size) toast("Введите размер, например 3x2", true);
          break;
        }
        const row = Math.min(30, Math.max(1, Number(m[1]))),
          col = Math.min(20, Math.max(1, Number(m[2])));
        if (!richCommand(insertTableCommand, { row, col }))
          await insertText(
            `\n| ${Array(col).fill("Заголовок").join(" | ")} |\n| ${Array(col).fill("---").join(" | ")} |\n${Array(
              row,
            )
              .fill(`| ${Array(col).fill(" ").join(" | ")} |`)
              .join("\n")}\n`,
          );
      }
      break;
    case "code":
      if (!richCommand(createCodeBlockCommand))
        await insertText("\n```\n\n```\n");
      break;
    case "math":
      await insertText("\n$$\nx^2 + y^2 = z^2\n$$\n");
      break;
    case "diagram":
      await insertText(
        "\n```mermaid\nflowchart LR\n    A[Начало] --> B[Результат]\n```\n",
      );
      break;
    case "link":
      {
        const text = selected() || "Ссылка";
        const url = await input(
          "Вставить ссылку",
          "Адрес страницы, файла или #заголовка",
          "https://",
        );
        if (url)
          await insertText(
            `[${text}](${url.replace(/[()]/g, (c) => encodeURIComponent(c))})`,
          );
      }
      break;
    case "image":
      $<HTMLInputElement>("#image-input").click();
      break;
    case "toc":
      await mountEditor("source");
      await insertText(`\n${toc(content)}\n`);
      break;
    case "rule":
      await insertText("\n---\n");
      break;
    case "highlight":
      await mountEditor("source");
      await insertText("", ["==", "=="]);
      break;
    case "footnote":
      await mountEditor("source");
      await insertText("[^note]\n\n[^note]: Текст сноски\n");
      break;
    case "yaml":
      await mountEditor("source");
      cm?.dispatch({
        changes: {
          from: 0,
          insert: "---\ntitle: Название документа\nauthor: Автор\n---\n\n",
        },
      });
      break;
    case "source":
      await mountEditor(mode === "source" ? "rich" : "source");
      break;
    case "preview":
      await mountEditor(mode === "preview" ? "rich" : "preview");
      break;
    case "sidebar":
      document.body.classList.toggle("hide-sidebar");
      break;
    case "outline":
      sidebar = "outline";
      document.body.classList.remove("hide-sidebar");
      renderSidebar();
      break;
    case "global-search":
      sidebar = "search";
      document.body.classList.remove("hide-sidebar");
      renderSidebar();
      $("#global-query").focus();
      break;
    case "find":
      await mountEditor("source");
      if (cm) {
        openSearchPanel(cm);
      }
      break;
    case "focus":
      settings.focus = !settings.focus;
      setSettings();
      break;
    case "typewriter":
      settings.typewriter = !settings.typewriter;
      setSettings();
      break;
    case "fullscreen":
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      break;
    case "statistics":
      {
        const s = statistics(content);
        dialogShell(
          "Статистика",
          `<div class="statistics-grid">${[
            [s.words, "слов"],
            [s.characters, "символов"],
            [s.lines, "строк"],
            [s.minutes, "минут чтения"],
          ]
            .map(
              ([n, l]) => `<div><strong>${n}</strong><span>${l}</span></div>`,
            )
            .join("")}</div>`,
        );
      }
      break;
    case "settings":
      showSettings();
      break;
    case "spellcheck":
      settings.spellcheck = !settings.spellcheck;
      setSettings();
      break;
    case "history":
      await showHistory();
      break;
    case "drafts":
      await showDrafts();
      break;
    case "trash":
      await showTrash();
      break;
    case "sort":
      settings.sort = settings.sort === "name" ? "modified" : "name";
      setSettings();
      renderSidebar();
      break;
    case "refresh":
      await refreshFiles();
      toast("Список обновлён");
      break;
    case "import":
      $<HTMLInputElement>("#import-input").click();
      break;
    case "export":
      await exportDialog();
      break;
    case "print":
      await printDocument();
      break;
    case "copy-markdown":
      await navigator.clipboard.writeText(selected() || content);
      toast("Markdown скопирован");
      break;
    case "copy-html":
      await navigator.clipboard.writeText((await exportArticle()).innerHTML);
      toast("HTML скопирован");
      break;
    case "copy-plain":
      await navigator.clipboard.writeText(
        selected() || (await renderDocument(content, path)).textContent || "",
      );
      toast("Текст скопирован");
      break;
    case "about":
      dialogShell(
        "Typoha",
        `<div class="about-brand"><span class="brand-glyph">t</span><h3>Место для ваших мыслей</h3></div><p>Независимый Markdown-редактор. Версия 0.1.0.</p><p>Rust · Milkdown · CodeMirror<br>Локальные файлы. Открытые стандарты. Собственный интерфейс.</p><p>Реализация не связана с разработчиками других редакторов. Полный функциональный паритет ещё не достигнут; перечень ограничений находится в docs/parity.md.</p><p class="dialog-hint">Оригинальная реализация: MIT. Лицензии библиотек перечислены в THIRD_PARTY_NOTICES.md.</p>`,
      );
      break;
    case "help":
      dialogShell(
        "Краткая справка Markdown",
        `<div class="help-content"><pre># Заголовок\n## Раздел\n**полужирный**  *курсив*  ~~зачёркнутый~~\n- Список\n1. Нумерованный список\n- [ ] Задача\n&gt; Цитата\n[Ссылка](https://example.org)\n![Описание](assets/image.png)\n\`встроенный код\`\n\n\`\`\`rust\nfn main() {}\n\`\`\`\n\n$$\nE = mc^2\n$$</pre><p>Ctrl+S — сохранить · Ctrl+/ — исходник · Ctrl+P — открыть файл · Ctrl+Shift+P — команды · F8 — фокус · F9 — печатная машинка.</p><p>Для HTML, YAML, сносок и некоторых расширений используйте исходник: он сохраняет введённый текст без преобразований.</p></div>`,
      );
      break;
  }
}
app.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const action = target.closest<HTMLElement>("[data-action]");
  if (action) fire(run(action.dataset.action!));
  const tab = target.closest<HTMLElement>("[data-tab]");
  if (tab) {
    sidebar = tab.dataset.tab as typeof sidebar;
    renderSidebar();
  }
  const modeButton = target.closest<HTMLElement>("[data-mode]");
  if (modeButton) fire(mountEditor(modeButton.dataset.mode as typeof mode));
});
document.addEventListener("click", (e) => {
  if (!(e.target as HTMLElement).closest("#dropdown,#menus,.file-entry"))
    $("#dropdown").hidden = true;
});
document.addEventListener("keydown", (e) => {
  if ($<HTMLDialogElement>("#dialog").open) return;
  const mod = e.ctrlKey || e.metaKey;
  let action: string | undefined;
  if (mod) {
    const key = e.key.toLowerCase();
    action =
      key === "s"
        ? e.shiftKey
          ? "save-as"
          : "save"
        : key === "p"
          ? e.shiftKey
            ? "palette"
            : "open"
          : key === "n"
            ? "new"
            : key === "/"
              ? "source"
              : key === "f"
                ? e.shiftKey
                  ? "global-search"
                  : "find"
                : key === "h"
                  ? "find"
                  : key === ","
                    ? "settings"
                    : key === "l" && e.shiftKey
                      ? "sidebar"
                      : key === "k"
                        ? "link"
                        : key === "b" && mode !== "rich"
                          ? "bold"
                          : key === "i" && mode !== "rich"
                            ? "italic"
                            : undefined;
  } else if (e.key === "F8") action = "focus";
  else if (e.key === "F9") action = "typewriter";
  if (action) {
    e.preventDefault();
    fire(run(action));
  }
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    fire(persistDraft());
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && dirty) {
    fire(persistDraft());
  }
});
$<HTMLInputElement>("#image-input").onchange = (event) =>
  fire(
    (async () => {
      const input = event.target as HTMLInputElement;
      const f = input.files?.[0];
      if (f)
        await insertText(
          `![${f.name.replace(/[\[\]]/g, "")}](${await uploadImage(f)})`,
        );
      input.value = "";
    })(),
  );
$<HTMLInputElement>("#import-input").onchange = (event) =>
  fire(
    (async () => {
      const input = event.target as HTMLInputElement;
      const f = input.files?.[0];
      input.value = "";
      if (!f || !(await canLeave())) return;
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      let text: string;
      if (["md", "markdown", "txt"].includes(ext)) text = await f.text();
      else {
        const res = await api<{ content: string }>("import", {
          format: ext === "tex" ? "latex" : ext,
          data: bytesToBase64(new Uint8Array(await f.arrayBuffer())),
        });
        text = res.content;
      }
      path = null;
      revision = null;
      lastSaved = "";
      draftId = crypto.randomUUID();
      await setContent(text);
    })(),
  );
$("#editor").addEventListener("dragover", (e) => {
  if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
});
$("#editor").addEventListener(
  "drop",
  (e) => {
    if (e.dataTransfer?.files.length) {
      e.preventDefault();
      e.stopPropagation();
      const f = e.dataTransfer.files[0];
      if (f.type.startsWith("image/"))
        fire(
          (async () => {
            await insertText(`![${f.name}](${await uploadImage(f)})`);
          })(),
        );
      else toast("Для открытия документа используйте «Файл → Импортировать»");
    }
  },
  true,
);
$("#editor").addEventListener(
  "paste",
  (e) => {
    const image = [...(e.clipboardData?.items || [])].find((i) =>
      i.type.startsWith("image/"),
    );
    if (image) {
      e.preventDefault();
      e.stopPropagation();
      const f = image.getAsFile();
      if (f)
        fire(
          (async () => {
            await insertText(`![Изображение](${await uploadImage(f)})`);
          })(),
        );
    }
  },
  true,
);
$("#editor").addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a");
  if (!a) return;
  const href = a.getAttribute("href") || "";
  if (href.startsWith("#")) {
    e.preventDefault();
    $("#editor")
      .querySelectorAll<HTMLElement>("[id]")
      .forEach((n) => {
        if (n.id === href.slice(1)) n.scrollIntoView({ behavior: "smooth" });
      });
  } else if (!/^[a-z][\w+.-]*:|^\/\//i.test(href)) {
    e.preventDefault();
    if (!e.ctrlKey && mode === "rich") return;
    const p = safeRelativeAsset(path, href);
    if (p) fire(openDocument(p));
  } else if (!e.ctrlKey && mode === "rich") {
    e.preventDefault();
  }
});
$("#resize-handle").addEventListener("pointerdown", (e) => {
  const handle = e.currentTarget as HTMLElement;
  handle.setPointerCapture(e.pointerId);
  handle.onpointermove = (event) =>
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${Math.max(180, Math.min(480, event.clientX))}px`,
    );
  handle.onpointerup = () => (handle.onpointermove = null);
});
document.addEventListener("selectionchange", () => {
  if (!settings.focus && !settings.typewriter) return;
  const selection = getSelection();
  const node = selection?.anchorNode?.parentElement;
  const block = node?.closest<HTMLElement>(".ProseMirror > *");
  if (block && $("#editor").contains(block)) {
    document.querySelector(".focused-block")?.classList.remove("focused-block");
    block.classList.add("focused-block");
    if (settings.typewriter)
      block.scrollIntoView({ block: "center", behavior: "smooth" });
  }
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () =>
  applySettings(),
);
setInterval(() => {
  if (
    document.visibilityState === "visible" &&
    !loading &&
    !$<HTMLDialogElement>("#dialog").open &&
    sidebar === "files" &&
    !(document.activeElement as HTMLElement)?.closest("#sidebar-content")
  )
    fire(refreshFiles());
}, 12000);
async function boot() {
  applySettings();
  try {
    const workspace = await api<{ root: string; name: string }>("workspace");
    root = workspace.root;
    settings = {
      ...settings,
      ...(await api<Partial<Settings>>("preferences")),
    };
    preferencesReady = true;
    applySettings();
    $("#workspace-name").textContent =
      typeof workspace.name === "string"
        ? workspace.name
        : root.split("/").pop() || root;
    $("#workspace-name").title = root;
    await refreshFiles();
    await mountEditor();
    const drafts = await api<Draft[]>("drafts");
    if (drafts.length)
      toast(
        `Есть несохранённые черновики: ${drafts.length}. Откройте «Вид → Восстановить черновик».`,
        true,
      );
  } catch (e) {
    ready = true;
    report(e);
    $("#editor").innerHTML =
      '<div class="connection-error"><h1>Откройте ссылку из Typoha</h1><p>Запустите приложение и используйте адрес из терминала. Он содержит локальный ключ доступа.</p></div>';
  }
}
fire(boot());

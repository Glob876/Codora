import { brandMark } from "./brand";
import { RunPanel, isPython } from "./run-panel";
import { chooseDocumentFormat, newDocumentName } from "./new-document";
import { observeUi, setLanguage, tr, translateUi } from "./i18n";
import { surfaceOpacity } from "./appearance";
import { treeRows } from "./file-tree";
import { icon } from "./icons";
import { themeVariables } from "./themes";
import { settingsPanel } from "./settings-panel";
import { appMarkup } from "./shell";
import { defaults, loadLocalSettings, type Settings } from "./settings";
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
import { Plugin, Selection } from "@milkdown/kit/prose/state";
import { languages } from "@codemirror/language-data";
import {
  codeExtensions,
  isMarkdown,
  languageName,
  copyPath,
} from "./code-editor";
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
import { escapeHtml as esc } from "./escape";
const renderDocument: typeof import("./render").renderDocument = async (
  ...args
) => (await import("./render")).renderDocument(...args);
const diagram: typeof import("./render").diagram = async (...args) =>
  (await import("./render")).diagram(...args);
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
let settings: Settings = loadLocalSettings();
let preferencesReady = false;
const sample = "";
let untitledExtension = "md";
function editorPath() {
  return path || `untitled.${untitledExtension}`;
}
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
let pendingOpen: { target: string; line?: number } | null = null;
let lastSaved = sample,
  collapsed = new Set<string>(),
  searchSeq = 0;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const app = $("#app");
app.innerHTML = appMarkup;
const runPanel = new RunPanel($("#run-panel"), () => updateStatus());
document.body.classList.add("welcome-active", "hide-sidebar");
$("#welcome").hidden = false;
setLanguage(settings.language);
observeUi(app);
if (window.codoraDesktop) {
  document.body.classList.add("desktop-window");
  $("#window-controls").hidden = false;
  $("#window-controls").addEventListener("click", (event) => {
    const control = (event.target as Element).closest<HTMLElement>(
      "[data-window]",
    )?.dataset.window;
    if (control === "minimize" || control === "maximize" || control === "close")
      fire(window.codoraDesktop!.windowControl(control));
  });
}

interface TabState {
  id: string;
  content: string;
  path: string | null;
  revision: string | null;
  dirty: boolean;
  lastSaved: string;
  draftId: string;
  mode: "rich" | "source" | "preview";
  welcome: boolean;
  scroll: number;
  untitledExtension: string;
  sourceState?: EditorState;
  richSelection?: ReturnType<Selection["toJSON"]>;
}
let tabs: TabState[] = [];
let activeTab = "";
let welcome = true;
let navigating = false;
function snapshotTab(): TabState {
  return {
    id: activeTab,
    content,
    path,
    revision,
    dirty,
    lastSaved,
    draftId,
    mode,
    welcome,
    scroll: $("#editor-scroll").scrollTop,
    untitledExtension,
    sourceState: cm?.state,
    richSelection: crepe?.editor.ctx
      .get(editorViewCtx)
      .state.selection.toJSON(),
  };
}
function captureTab() {
  const index = tabs.findIndex((t) => t.id === activeTab);
  if (index >= 0) tabs[index] = snapshotTab();
}
function renderTabs() {
  captureTab();
  const box = $("#document-tabs");
  // Keep focused tab buttons stable while typing.
  if (
    box.children.length !== tabs.length ||
    tabs.some((t, i) => (box.children[i] as HTMLElement)?.dataset.id !== t.id)
  ) {
    box.replaceChildren();
    for (const tab of tabs) {
      const item = document.createElement("div");
      item.className = "document-tab";
      item.dataset.id = tab.id;
      const button = document.createElement("button");
      button.setAttribute("role", "tab");
      button.onclick = () => fire(activateTab(tab.id));
      const close = document.createElement("button");
      close.innerHTML = icon("close");
      close.setAttribute("aria-label", tr("Закрыть вкладку"));
      close.onclick = () => fire(closeTab(tab.id));
      item.append(button, close);
      box.append(item);
    }
  }
  tabs.forEach((t, i) => {
    const item = box.children[i];
    const b = item.firstElementChild!;
    item.lastElementChild!.setAttribute("aria-label", tr("Закрыть вкладку"));
    b.textContent = `${t.dirty ? "● " : ""}${t.path?.split("/").pop() || (t.welcome ? tr("Новая вкладка") : `${tr("Без названия")}.${t.untitledExtension}`)}`;
    b.setAttribute("aria-selected", String(t.id === activeTab));
    item.classList.toggle("active", t.id === activeTab);
  });
  document.body.classList.toggle("welcome-active", welcome);
  $("#welcome").hidden = !welcome;
}
async function activateTab(id: string) {
  if (loading || saving || navigating || id === activeTab) return;
  navigating = true;
  try {
    clearTimeout(saveTimer);
    clearTimeout(draftTimer);
    await persistDraft();
    captureTab();
    const t = tabs.find((t) => t.id === id);
    if (!t) return;
    activeTab = t.id;
    ({
      content,
      path,
      revision,
      dirty,
      lastSaved,
      draftId,
      mode,
      welcome,
      untitledExtension,
    } = t);
    await mountEditor();
    if (cm && t.sourceState && mode === "source") cm.setState(t.sourceState);
    if (crepe && t.richSelection && mode === "rich") {
      const view = crepe.editor.ctx.get(editorViewCtx);
      view.dispatch(
        view.state.tr.setSelection(
          Selection.fromJSON(view.state.doc, t.richSelection),
        ),
      );
    }
    $("#editor-scroll").scrollTop = t.scroll;
    renderTabs();
    renderSidebar();
  } finally {
    navigating = false;
  }
}
async function newTab(isWelcome = true, extension?: string) {
  if (loading || saving || navigating) return;
  navigating = true;
  try {
    await persistDraft();
    captureTab();
    activeTab = crypto.randomUUID();
    content = "";
    path = null;
    untitledExtension = extension || "md";
    if (extension) mode = extension === "md" ? "rich" : "source";
    revision = null;
    dirty = false;
    lastSaved = "";
    draftId = crypto.randomUUID();
    welcome = isWelcome;
    tabs.push(snapshotTab());
    await mountEditor();
    renderTabs();
  } finally {
    navigating = false;
  }
}
async function closeTab(id: string) {
  await activateTab(id);
  if (activeTab !== id || loading || !(await canLeave())) return;
  const index = tabs.findIndex((t) => t.id === id);
  tabs.splice(index, 1);
  activeTab = "";
  dirty = false;
  if (tabs.length) await activateTab(tabs[Math.min(index, tabs.length - 1)].id);
  else await newTab();
  renderTabs();
}
async function leaveWorkspace() {
  if (loading || saving) return false;
  await preferencesSaved;
  captureTab();
  for (const t of tabs.filter((t) => t.dirty)) {
    await activateTab(t.id);
    if (!(await canLeave())) return false;
  }
  return true;
}

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
  el.textContent = tr(message);
  el.classList.toggle("error", error);
  el.hidden = false;
  setTimeout(
    () => {
      if (el.textContent === tr(message)) el.hidden = true;
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
let preferencesSaved: Promise<unknown> = Promise.resolve();
function setSettings() {
  if (preferencesReady) {
    const snapshot = { ...settings };
    preferencesSaved = preferencesSaved
      .catch(() => {})
      .then(() => api("preferences", snapshot));
    fire(preferencesSaved);
  }
  localStorage.setItem("typoha-settings", JSON.stringify(settings));
  applySettings();
}
let nativeLanguage = "";
function applySettings() {
  if (window.codoraDesktop && nativeLanguage !== settings.language) {
    nativeLanguage = settings.language;
    fire(window.codoraDesktop.setLanguage(settings.language));
  }
  setLanguage(settings.language);
  translateUi(app);
  const opacity = surfaceOpacity(settings.backgroundOpacity);
  for (const [name, base, amount] of [
    ["bg", "bg", opacity.background],
    ["panel", "panel", opacity.panel],
    ["bar", "bar", opacity.panel],
    ["menu", "bg", opacity.panel],
  ] as const)
    document.documentElement.style.setProperty(
      `--surface-${name}`,
      `color-mix(in srgb, var(--${base}) ${amount}%, transparent)`,
    );
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.appearance = themeVariables(
    settings.theme,
    matchMedia("(prefers-color-scheme: dark)").matches,
  )["color-scheme"];
  for (const [key, value] of Object.entries(
    themeVariables(
      settings.theme,
      matchMedia("(prefers-color-scheme: dark)").matches,
    ),
  ))
    document.documentElement.style.setProperty(key, value);
  for (const [key, value] of [
    ["--accent", settings.primaryColor],
    ["--panel", settings.secondaryColor],
    ["--text", settings.textColor],
  ])
    if (/^#[0-9a-f]{6}$/i.test(value))
      document.documentElement.style.setProperty(key, value);
  document.body.classList.toggle("reduce-motion", !settings.animations);
  document.body.classList.toggle("hide-toolbar", !settings.toolbar);
  document.body.classList.toggle("hide-statusbar", !settings.statusbar);
  document.documentElement.style.setProperty(
    "--sidebar-width",
    `${settings.sidebarWidth}px`,
  );
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
    .forEach(
      (e) => (e.spellcheck = isMarkdown(editorPath()) && settings.spellcheck),
    );
  updateStatus();
}
function updateStatus() {
  renderTabs();
  const name =
    path?.split("/").pop() || `${tr("Без названия")}.${untitledExtension}`;
  $("#document-name").textContent = name;
  $("#document-name").title = path || name;
  $("#window-title").textContent = `${dirty ? "● " : ""}${name} — Codora`;
  document.title = `${dirty ? "● " : ""}${name} — Codora`;
  $("#save-indicator").textContent = saving
    ? "Сохранение…"
    : dirty
      ? "Изменён"
      : path
        ? "Сохранено"
        : "Новый документ";
  $("#save-indicator").classList.toggle("unsaved", dirty);
  $("#source-toggle").textContent = languageName(editorPath());
  document
    .querySelectorAll<HTMLButtonElement>(
      '[data-mode="rich"], [data-mode="preview"]',
    )
    .forEach((button) => {
      button.disabled = !isMarkdown(editorPath());
    });
  const runButton = $<HTMLButtonElement>("#run-python");
  runButton.hidden = welcome || !isPython(editorPath());
  runButton.disabled = loading || saving;
  runButton.innerHTML = `${icon("play")} ${tr(runPanel.busy ? "Показать вывод" : "Запустить")}`;
  const st = statistics(content);
  $("#statistics").textContent =
    `${st.words.toLocaleString(settings.language)} ${tr("слов")}`;
  $("#statistics").title =
    `${st.characters} ${tr("символов")} · ${st.lines} ${tr("строк")} · ${st.minutes} ${tr("мин чтения")}`;
  document
    .querySelectorAll<HTMLElement>("[data-mode]")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
}
function changed(next: string) {
  if (!ready || loading || next === content) return;
  content = next;
  welcome = false;
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
    }, settings.autosaveDelay);
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
    holder.classList.remove("editor-enter");
    void holder.offsetWidth;
    holder.classList.add("editor-enter");
    holder.replaceChildren();
    mode = isMarkdown(editorPath()) ? nextMode : "source";
    document.body.classList.toggle("code-document", !isMarkdown(editorPath()));
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
            EditorState.tabSize.of(settings.tabSize),
            ...(settings.lineNumbers
              ? []
              : [EditorView.theme({ ".cm-lineNumbers": { display: "none" } })]),
            ...(await codeExtensions(editorPath(), settings.tabSize)),
            keymap.of(searchKeymap),
            ...(settings.wordWrap ? [EditorView.lineWrapping] : []),
            drawSelection(),
            highlightActiveLine(),
            EditorView.contentAttributes.of({
              spellcheck: String(
                isMarkdown(editorPath()) && settings.spellcheck,
              ),
              "aria-label": languageName(editorPath()),
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
          [Crepe.Feature.Placeholder]: { text: tr("Начните писать…") },
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
    updateStatus();
    if (pendingOpen) {
      const queued = pendingOpen;
      pendingOpen = null;
      setTimeout(() => fire(openDocument(queued.target, queued.line)), 0);
    }
    if (dirty && settings.autosave && path)
      saveTimer = setTimeout(() => {
        if (dirty && path && settings.autosave) fire(save(false));
      }, settings.autosaveDelay);
  }
}
async function setContent(next: string, markDirty = true) {
  welcome = false;
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
        ? copyPath(path)
        : path || newDocumentName(untitledExtension),
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
    if (path !== previousPath) await mountEditor();
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
    }, settings.autosaveDelay);
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
let openingDocument = false;
async function openDocument(target: string, line?: number) {
  if (openingDocument || navigating) return;
  if (loading) {
    pendingOpen = { target, line };
    return;
  }
  if (saving) return;
  captureTab();
  const existing = tabs.find((t) => t.path === target);
  if (existing) {
    await activateTab(existing.id);
    if (line) {
      if (mode !== "source") await mountEditor("source");
      if (cm) {
        const ln = cm.state.doc.line(Math.min(line, cm.state.doc.lines));
        cm.dispatch({
          selection: { anchor: ln.from },
          effects: EditorView.scrollIntoView(ln.from, { y: "center" }),
        });
      }
    }
    return;
  }
  openingDocument = true;
  try {
    const doc = await api<Document>(
      `document?path=${encodeURIComponent(target)}`,
    );
    if (!existing && (!welcome || dirty || path)) await newTab(false);
    welcome = false;
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
  } finally {
    openingDocument = false;
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
  tools.innerHTML = `<input id="file-filter" placeholder="Фильтр файлов…" aria-label="Фильтр файлов"><button data-action="sort" title="Порядок сортировки">${icon("sort")}</button><button data-action="refresh" title="Обновить файлы">${icon("refresh")}</button>`;
  box.append(tools);
  const list = document.createElement("div");
  list.id = "file-list";
  box.append(list);
  const renderList = (filter: string) => {
    list.replaceChildren();
    const items = treeRows(files, collapsed, settings.sort, filter);
    for (const entry of items) {
      const b = document.createElement("button");
      b.className = `file-entry ${entry.directory ? "folder" : ""} ${entry.path === path ? "selected" : ""}`;
      b.style.paddingLeft = `${14 + (entry.path.split("/").length - 1) * 16}px`;
      b.title = entry.path;
      if (entry.directory)
        b.setAttribute("aria-expanded", String(!collapsed.has(entry.path)));
      b.innerHTML = `<span class="file-symbol">${entry.directory ? icon(collapsed.has(entry.path) ? "right" : "down") + icon(collapsed.has(entry.path) ? "folder" : "folder-open") : icon("file")}</span><span class="file-label">${esc(entry.name)}</span>`;
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
  summary.textContent = `${tr("Совпадений")}: ${result.length}${result.length === 500 ? "+" : ""}`;
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
  d.innerHTML = `<form method="dialog"><header><h2>${esc(title)}</h2><button value="cancel" class="close-dialog" aria-label="Закрыть">${icon("close")}</button></header>${body}</form>`;
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
          label: `${tr(a.group)} › ${tr(a.label)}`,
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
      if (!commands) b.dataset.noTranslate = "";
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
      ["pdf", window.codoraDesktop ? "PDF" : "PDF / печать"],
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
      )}</div><p class="dialog-hint">Pandoc — внешний конвертер. ${window.codoraDesktop ? "PDF сохраняется отдельным файлом." : "PDF создаётся через диалог печати браузера."}</p>`,
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
    await printDocument(name);
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
    headers: {
      "content-type": "application/json",
      "x-codora-token": token,
      "x-codora-workspace": workspaceScope,
    },
    body: JSON.stringify({ content, format }),
  });
  if (!response.ok) throw new Error((await response.json()).error);
  download(
    await response.blob(),
    `${name}.${format === "latex" ? "tex" : format === "revealjs" ? "html" : format}`,
  );
}
async function printDocument(pdfName?: string) {
  const article = await exportArticle();
  const area = document.createElement("div");
  area.id = "print-area";
  area.append(article);
  $("#print-area")?.remove();
  document.body.append(area);
  if (window.codoraDesktop) {
    if (pdfName) {
      const bytes = await window.codoraDesktop.pdf();
      download(
        new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
        `${pdfName}.pdf`,
      );
    } else {
      await window.codoraDesktop.print();
    }
  } else {
    window.print();
  }
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
          await newTab(false);
          path = null;
          revision = null;
          lastSaved = "";
          draftId = crypto.randomUUID();
          mode = "source";
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
  const initial = { ...settings };
  const d = dialogShell("Настройки", "");
  settingsPanel(
    d,
    initial,
    (next) => {
      settings = { ...next };
      applySettings();
    },
    (next) => {
      settings = { ...next };
      setSettings();
      clearTimeout(saveTimer);
      fire(
        (async () => {
          await refreshFiles();
          await mountEditor();
        })(),
      );
    },
  );
}
async function run(
  id: string,
  targetPath: string | null = null,
): Promise<void> {
  if (
    openingDocument &&
    ["new", "new-tab", "write", "workspace", "open", "close-tab"].includes(id)
  )
    return;
  if (
    !isMarkdown(editorPath()) &&
    [
      "bold",
      "italic",
      "strike",
      "inline-code",
      "heading",
      "paragraph",
      "bullet",
      "ordered",
      "quote",
      "task",
      "table",
      "code",
      "math",
      "diagram",
      "link",
      "image",
      "toc",
      "rule",
      "highlight",
      "footnote",
      "yaml",
    ].includes(id)
  ) {
    toast("Форматирование Markdown доступно в файлах Markdown");
    return;
  }
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
    case "run-python":
      if (runPanel.busy) {
        runPanel.show();
        break;
      }
      if (loading || saving || !isPython(editorPath())) break;
      if (dirty || !path) await save(false);
      if (path && revision && !dirty && isPython(path))
        await runPanel.start(path, revision);
      break;
    case "new-tab":
      await newTab();
      break;
    case "close-tab":
      await closeTab(activeTab);
      break;
    case "write":
    case "new": {
      const extension = await chooseDocumentFormat(dialogShell);
      if (!extension) break;
      if (id === "new") {
        await newTab(false, extension);
        break;
      }
      untitledExtension = extension;
      welcome = false;
      mode = extension === "md" ? "rich" : "source";
      await mountEditor();
      break;
    }
    case "workspace":
      {
        const destination = window.codoraDesktop
          ? await window.codoraDesktop.chooseFolder()
          : await input("Открыть папку", "Полный путь к папке", root);
        if (destination) {
          if (!(await leaveWorkspace())) return;
          await api("workspace", { root: destination });
          tabs = [];
          activeTab = crypto.randomUUID();
          welcome = false;
          document.body.classList.remove("hide-sidebar");
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
          tabs.push(snapshotTab());
          await refreshFiles();
          await mountEditor();
        }
      }
      break;
    case "open":
      if (window.codoraDesktop) {
        const file = await window.codoraDesktop.chooseFile();
        if (!file) return;
        if (file.root !== root) {
          if (!(await leaveWorkspace())) return;
          await api("workspace", { root: file.root });
          root = (await api("workspace")).root;
          settings = {
            ...defaults,
            ...(await api<Partial<Settings>>("preferences")),
          };
          applySettings();
          $("#workspace-name").title = root;
          collapsed.clear();
          tabs = [];
          activeTab = "";
          dirty = false;
          await newTab();
          $("#workspace-name").textContent = root.split("/").pop() || root;
          await refreshFiles();
        }
        await openDocument(file.path);
      } else palette();
      break;
    case "quick-open":
      palette();
      break;
    case "palette":
      palette(true);
      break;
    case "reload":
      if (path && (await canLeave())) {
        const doc = await api<Document>(
          `document?path=${encodeURIComponent(path)}`,
        );
        revision = doc.revision;
        lastSaved = doc.content;
        dirty = false;
        await setContent(doc.content, false);
      }
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
          copyPath(target),
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
        captureTab();
        if (
          tabs.some(
            (t) =>
              t.id !== activeTab &&
              (t.path === target || t.path?.startsWith(target + "/")),
          )
        ) {
          toast("Сначала закройте другие вкладки этого файла или папки", true);
          return;
        }
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
            await mountEditor();
          }
          await refreshFiles();
        }
      }
      break;
    case "delete":
      if (target) {
        captureTab();
        if (
          tabs.some(
            (t) =>
              t.id !== activeTab &&
              (t.path === target || t.path?.startsWith(target + "/")),
          )
        ) {
          toast("Сначала закройте другие вкладки этого файла или папки", true);
          return;
        }
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
        "Codora",
        `<div class="about-brand"><span class="brand-glyph">${brandMark}</span><h3>Место для ваших мыслей</h3></div><p>Независимый редактор кода и Markdown. Версия 0.1.0.</p><p>Rust · Milkdown · CodeMirror<br>Локальные файлы. Открытые стандарты. Собственный интерфейс.</p><p>Реализация не связана с разработчиками других редакторов. Полный функциональный паритет ещё не достигнут; перечень ограничений находится в docs/parity.md.</p><p class="dialog-hint">© 2026 Codora contributors · Glob876. GNU AGPL v3 или более поздняя. Без гарантий. Разрешены изменения и распространение на условиях лицензии. <a href="https://github.com/Glob876/Codora/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">Лицензия</a> · <a href="https://github.com/Glob876/Codora" target="_blank" rel="noopener noreferrer">Исходный код</a>. Лицензии библиотек: THIRD_PARTY_NOTICES.md.</p>`,
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
  if (
    (e.ctrlKey && e.key === "Tab") ||
    ((e.key === "ArrowLeft" || e.key === "ArrowRight") &&
      (e.target as HTMLElement).matches("#document-tabs [role=tab]"))
  ) {
    e.preventDefault();
    const direction = e.shiftKey || e.key === "ArrowLeft" ? -1 : 1;
    const index = tabs.findIndex((t) => t.id === activeTab);
    const next = tabs[(index + direction + tabs.length) % tabs.length];
    if (next)
      fire(
        activateTab(next.id).then(() => {
          $("#document-tabs [aria-selected=true]").focus();
        }),
      );
    return;
  }
  let action: string | undefined;
  if (mod) {
    const key = e.key.toLowerCase();
    action =
      key === "t"
        ? "new-tab"
        : key === "w"
          ? "close-tab"
          : key === "o"
            ? "open"
            : key === "s"
              ? e.shiftKey
                ? "save-as"
                : "save"
              : key === "p"
                ? e.shiftKey
                  ? "palette"
                  : "quick-open"
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
  } else if (e.key === "F5") action = "run-python";
  else if (e.key === "F8") action = "focus";
  else if (e.key === "F9") action = "typewriter";
  if (action) {
    e.preventDefault();
    fire(run(action));
  }
});
window.addEventListener("beforeunload", (e) => {
  captureTab();
  if (tabs.some((t) => t.dirty)) {
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
      if (!f || loading || saving) return;
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
      await newTab(false);
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
  handle.onpointerup = () => {
    handle.onpointermove = null;
    settings.sidebarWidth = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--sidebar-width",
      ),
    );
    setSettings();
  };
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
    const workspace = await api<{
      root: string;
      name: string;
      restored: boolean;
    }>("workspace");
    root = workspace.root;
    settings = {
      ...settings,
      ...(await api<Partial<Settings>>("preferences")),
    };
    preferencesReady = true;
    // Migrate existing workspace appearance before the first folder switch.
    await api("preferences", settings);
    applySettings();
    $("#workspace-name").textContent =
      typeof workspace.name === "string"
        ? workspace.name
        : root.split("/").pop() || root;
    $("#workspace-name").title = root;
    welcome = !workspace.restored;
    activeTab = crypto.randomUUID();
    tabs.push(snapshotTab());
    document.body.classList.toggle("hide-sidebar", !workspace.restored);
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
    welcome = false;
    renderTabs();
    report(e);
    $("#editor").innerHTML =
      '<div class="connection-error"><h1>Откройте ссылку из Codora</h1><p>Запустите приложение и используйте адрес из терминала. Он содержит локальный ключ доступа.</p></div>';
  }
}
fire(boot());

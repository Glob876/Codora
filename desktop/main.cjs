const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  dialog,
  ipcMain,
  shell,
  session,
} = require("electron");
const path = require("node:path");
const { compactController } = require("./compact.cjs");
const { startBackend, externalUrl } = require("./backend.cjs");
let backend;
let window;
let tray;
let origin;
let stopped = false;
let language = "ru";
const nativeTranslations = {
  "Открыть файл": ["Open file", "Відкрити файл", "Datei öffnen"],
  "Открыть папку": ["Open folder", "Відкрити папку", "Ordner öffnen"],
  "Markdown и текст": [
    "Markdown and text",
    "Markdown і текст",
    "Markdown und Text",
  ],
  "Сохранить экспорт": ["Save export", "Зберегти експорт", "Export speichern"],
  "Несохранённые изменения": [
    "Unsaved changes",
    "Незбережені зміни",
    "Ungespeicherte Änderungen",
  ],
  "Закрыть редактор без сохранения изменений?": [
    "Close the editor without saving changes?",
    "Закрити редактор без збереження змін?",
    "Editor ohne Speichern schließen?",
  ],
  "Нажмите «Вернуться», чтобы сохранить документ. Восстановление черновика зависит от успешной записи на диск.":
    [
      "Choose Return to save your document. Draft recovery depends on a successful disk write.",
      "Натисніть «Повернутися», щоб зберегти документ. Відновлення чернетки залежить від успішного запису на диск.",
      "Wähle Zurück, um das Dokument zu speichern. Die Wiederherstellung hängt vom erfolgreichen Schreiben auf den Datenträger ab.",
    ],
  Вернуться: ["Return", "Повернутися", "Zurück"],
  "Закрыть без сохранения": [
    "Close without saving",
    "Закрити без збереження",
    "Ohne Speichern schließen",
  ],
};
const nt = (source) =>
  language === "ru"
    ? source
    : nativeTranslations[source]?.[["en", "uk", "de"].indexOf(language)] ||
      source;
app.setName("Codora");
if (process.platform === "linux") app.setDesktopName("codora.desktop");
// Avoid Chromium background services; document network policy remains in Rust CSP.
app.commandLine.appendSwitch("disable-background-networking");
app.commandLine.appendSwitch("disable-component-update");
app.commandLine.appendSwitch("disable-sync");
app.enableSandbox();

async function openExternal(url) {
  if (!externalUrl(url)) return;
  await shell.openExternal(url);
}
function trusted(event) {
  return (
    window &&
    event.sender === window.webContents &&
    event.senderFrame === window.webContents.mainFrame &&
    new URL(event.senderFrame.url).origin === origin
  );
}
app
  .whenReady()
  .then(async () => {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
        {
          label: "Правка",
          submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            { role: "selectAll" },
          ],
        },
        {
          label: "Окно",
          submenu: [
            { role: "togglefullscreen", accelerator: "F11" },
            { role: "minimize" },
            { role: "close" },
          ],
        },
      ]),
    );
    const binary = app.isPackaged
      ? path.join(
          __dirname,
          "bin",
          process.platform === "win32" ? "codora-core.exe" : "codora-core",
        )
      : path.join(
          __dirname,
          "..",
          "target",
          "release",
          process.platform === "win32" ? "codora.exe" : "codora",
        );
    const args = process.argv.slice(app.isPackaged ? 1 : 2);
    backend = startBackend(binary, [
      ...args,
      "--session-file",
      path.join(app.getPath("userData"), "session.json"),
      "--fallback-workspace",
      app.isPackaged
        ? app.getPath("home")
        : path.join(__dirname, "..", "examples"),
    ]);
    const url = await backend.ready;
    origin = new URL(url).origin;
    // No persistent Chromium profile: capability tokens and documents stay in memory.
    const localSession = session.fromPartition(`codora-${process.pid}`, {
      cache: false,
    });
    const permitted = (contents, permission) =>
      contents === window?.webContents &&
      ["clipboard-sanitized-write", "clipboard-write", "fullscreen"].includes(
        permission,
      );
    localSession.setPermissionRequestHandler((contents, permission, callback) =>
      callback(permitted(contents, permission)),
    );
    localSession.setSpellCheckerDictionaryDownloadURL(
      `${origin}/dictionaries/`,
    );
    if (process.platform !== "darwin")
      localSession.setSpellCheckerLanguages(["ru-RU", "en-US"]);
    localSession.setPermissionCheckHandler((contents, permission) =>
      permitted(contents, permission),
    );
    localSession.on("will-download", (_event, item) => {
      item.setSaveDialogOptions({
        title: nt("Сохранить экспорт"),
        defaultPath: item.getFilename(),
      });
      item.once("done", (_e, state) => {
        if (state === "interrupted" && window && !window.isDestroyed())
          dialog.showErrorBox(
            "Экспорт не сохранён",
            "Проверьте свободное место и права доступа к выбранной папке.",
          );
      });
    });
    window = new BrowserWindow({
      title: "Codora",
      icon: path.join(__dirname, "icon.png"),
      width: 1280,
      height: 860,
      minWidth: 760,
      minHeight: 540,
      show: false,
      backgroundColor: "#00000000",
      transparent: true,
      frame: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        session: localSession,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        spellcheck: true,
      },
    });
    window.webContents.setWindowOpenHandler(({ url }) => {
      void openExternal(url).catch(() =>
        dialog.showErrorBox(
          "Не удалось открыть ссылку",
          "Проверьте системный браузер.",
        ),
      );
      return { action: "deny" };
    });
    window.webContents.on("will-navigate", (event, url) => {
      // Keep the editor alive even when a document contains links.
      if (new URL(url).origin !== origin || new URL(url).pathname !== "/") {
        event.preventDefault();
        void openExternal(url).catch(() => {});
      }
    });
    window.webContents.on("will-redirect", (event, url) => {
      if (new URL(url).origin !== origin) event.preventDefault();
    });
    window.webContents.on("context-menu", (_event, params) => {
      const items = params.dictionarySuggestions.map((label) => ({
        label,
        click: () => window.webContents.replaceMisspelling(label),
      }));
      if (items.length) items.push({ type: "separator" });
      if (params.isEditable)
        items.push(
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        );
      else if (params.selectionText) items.push({ role: "copy" });
      if (items.length) Menu.buildFromTemplate(items).popup({ window });
    });
    window.webContents.on("will-attach-webview", (event) =>
      event.preventDefault(),
    );
    window.webContents.on("will-prevent-unload", (event) => {
      const choice = dialog.showMessageBoxSync(window, {
        type: "warning",
        title: nt("Несохранённые изменения"),
        message: nt("Закрыть редактор без сохранения изменений?"),
        detail: nt(
          "Нажмите «Вернуться», чтобы сохранить документ. Восстановление черновика зависит от успешной записи на диск.",
        ),
        buttons: [nt("Вернуться"), nt("Закрыть без сохранения")],
        defaultId: 0,
        cancelId: 0,
      });
      if (choice === 1) event.preventDefault();
    });
    window.webContents.on("render-process-gone", () => {
      dialog.showErrorBox(
        "Редактор остановился",
        "Перезапустите Codora. Сохранённые документы и черновики остаются в рабочей папке.",
      );
    });
    backend.child.once("exit", () => {
      if (!backend.stopping && window && !window.isDestroyed()) {
        dialog.showErrorBox(
          "Файловое ядро остановилось",
          "Сохранение недоступно. Скопируйте несохранённый текст и перезапустите Codora.",
        );
      }
    });
    ipcMain.handle("codora:folder", async (event) => {
      if (!trusted(event)) throw new Error("Недоступно");
      const result = await dialog.showOpenDialog(window, {
        title: nt("Открыть папку"),
        properties: ["openDirectory", "createDirectory"],
      });
      return result.canceled ? null : result.filePaths[0];
    });
    ipcMain.handle("codora:language", (event, value) => {
      if (!trusted(event) || !["ru", "en", "uk", "de"].includes(value))
        throw new Error("Недоступно");
      language = value;
    });
    const setCompact = compactController(window);
    ipcMain.handle("codora:compact", (event, active) => {
      if (!trusted(event)) throw new Error("Недоступно");
      setCompact(active);
    });
    ipcMain.handle("codora:window", (event, action) => {
      if (!trusted(event)) throw new Error("Недоступно");
      if (action === "minimize") window.minimize();
      else if (action === "maximize") {
        if (window.isMaximized()) window.unmaximize();
        else window.maximize();
      } else if (action === "close") window.close();
      else throw new Error("Неизвестная команда окна");
    });
    ipcMain.handle("codora:file", async (event) => {
      if (!trusted(event)) throw new Error("Недоступно");
      const result = await dialog.showOpenDialog(window, {
        title: nt("Открыть файл"),
        properties: ["openFile"],
        filters: [
          {
            name: nt("Markdown и текст"),
            extensions: [
              "md",
              "markdown",
              "txt",
              "rs",
              "ts",
              "tsx",
              "js",
              "jsx",
              "py",
              "json",
              "html",
              "css",
              "go",
              "java",
              "c",
              "cpp",
              "yaml",
              "toml",
              "sh",
            ],
          },
          { name: "Все файлы", extensions: ["*"] },
        ],
      });
      if (result.canceled) return null;
      return {
        root: path.dirname(result.filePaths[0]),
        path: path.basename(result.filePaths[0]),
      };
    });
    ipcMain.handle("codora:print", (event) => {
      if (!trusted(event)) throw new Error("Недоступно");
      return new Promise((resolve, reject) =>
        window.webContents.print({ printBackground: true }, (ok, reason) => {
          if (ok || reason === "cancelled") resolve();
          else reject(new Error(reason));
        }),
      );
    });
    ipcMain.handle("codora:pdf", (event) => {
      if (!trusted(event)) throw new Error("Недоступно");
      return window.webContents.printToPDF({
        printBackground: true,
        preferCSSPageSize: true,
      });
    });
    await window.loadURL(url);
    window.show();
    tray = new Tray(
      nativeImage
        .createFromPath(path.join(__dirname, "icon.png"))
        .resize({ width: 24, height: 24 }),
    );
    tray.setToolTip("Codora");
    const showWindow = () => {
      window.show();
      window.focus();
    };
    tray.on("click", showWindow);
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: "Codora", click: showWindow },
        { type: "separator" },
        { label: "Quit Codora", click: () => app.quit() },
      ]),
    );
  })
  .catch(async () => {
    dialog.showErrorBox(
      "Не удалось запустить Codora",
      "Проверьте путь к папке, права доступа и сборку приложения.",
    );
    if (backend) await backend.stop();
    app.exit(1);
  });
app.on("window-all-closed", () => app.quit());
app.on("will-quit", (event) => {
  if (backend && !stopped) {
    event.preventDefault();
    void backend.stop().finally(() => {
      stopped = true;
      app.quit();
    });
  }
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => app.quit());

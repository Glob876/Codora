// Run with Electron: electron desktop/smoke.cjs. Uses disposable notes only.
const { app, dialog, session } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "codora-desktop-smoke-"));
fs.writeFileSync(
  path.join(root, "test.md"),
  "# Desktop test\n\nOriginal text.\n",
);
fs.mkdirSync(path.join(root, "a/inner"), { recursive: true });
fs.mkdirSync(path.join(root, "b"));
fs.writeFileSync(path.join(root, "a/own.md"), "# Own file");
fs.writeFileSync(path.join(root, "a/inner/deep.md"), "# Deep file");
fs.writeFileSync(path.join(root, "b/sibling.md"), "# Sibling file");
app.setPath("userData", path.join(root, ".profile"));
const other = path.join(root, "other");
fs.mkdirSync(other);
fs.writeFileSync(path.join(other, "other.md"), "# Other workspace\n");
process.argv = [process.argv[0], __dirname, root];
let failed = false;
let closePrompts = 0;
let pickerCalls = 0;
const dictionaries = new Set();
app.on("session-created", (ses) => {
  ses.on("spellcheck-dictionary-initialized", (_event, language) =>
    dictionaries.add(language),
  );
});
dialog.showErrorBox = (title, message) => {
  failed = true;
  console.error(title, message);
  app.exit(1);
};
dialog.showMessageBoxSync = () => {
  closePrompts++;
  return 0;
};
dialog.showOpenDialog = async (_window, options) => {
  pickerCalls++;
  return {
    canceled: false,
    filePaths: [
      options.properties.includes("openFile")
        ? path.join(root, "test.md")
        : other,
    ],
  };
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deadline = setTimeout(() => {
  console.error("Smoke test timed out");
  app.exit(1);
}, 30000);
app.on("browser-window-created", (_event, win) => {
  win.webContents.once("did-finish-load", async () => {
    try {
      async function js(code) {
        return win.webContents.executeJavaScript(code, true);
      }
      async function until(code) {
        for (let i = 0; i < 100; i++) {
          if (await js(code)) return;
          await pause(100);
        }
        throw new Error("UI condition timed out: " + code);
      }
      await until(
        "document.querySelector('.file-entry') && document.querySelector('#document-tabs button')",
      );
      assert.equal(pickerCalls, 0, "No picker at startup");
      assert.equal(
        await js("document.querySelector('#welcome').hidden"),
        false,
      );
      assert.equal(
        await js("getComputedStyle(document.querySelector('#sidebar')).width"),
        "0px",
      );
      await pause(350);
      fs.writeFileSync(
        "/tmp/codora-welcome.png",
        (await win.webContents.capturePage()).toPNG(),
      );
      await js(
        "document.querySelector('#welcome [data-action=settings]').click()",
      );
      await until("document.querySelector('.theme-gallery')");
      await js("document.querySelector('[data-theme-choice=matrix]').click()");
      assert.equal(
        await js(
          "getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()",
        ),
        "#55d987",
      );
      await pause(250);
      fs.writeFileSync(
        "/tmp/typoha-settings.png",
        (await win.webContents.capturePage()).toPNG(),
      );
      await js(
        "document.querySelector('#dialog button[value=cancel]').click()",
      );
      await until(
        "!document.querySelector('#dialog').open && getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() === '#34756a'",
      );
      assert.equal(
        await js(
          "getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()",
        ),
        "#34756a",
      );
      await js("document.querySelector('#welcome [data-action=open]').click()");
      await until(
        "document.querySelector('#document-name').textContent === 'test.md'",
      );
      assert.equal(pickerCalls, 1);
      await js("document.querySelector('[data-action=new-tab]').click()");
      await until(
        "document.querySelectorAll('.document-tab').length === 2 && !document.querySelector('#welcome').hidden",
      );
      await js(
        "document.querySelectorAll('#document-tabs [role=tab]')[0].click()",
      );
      await until(
        "document.querySelector('#welcome').hidden && document.querySelector('#document-name').textContent === 'test.md'",
      );
      await js(
        "document.querySelectorAll('.document-tab')[1].lastElementChild.click()",
      );
      await until("document.querySelectorAll('.document-tab').length === 1");
      assert.equal(
        await js("typeof window.codoraDesktop.chooseFolder"),
        "function",
      );
      assert.equal(await js("typeof require"), "undefined");
      assert.equal(await js("typeof process"), "undefined");
      await js(
        "document.querySelector('.file-entry[title=\"test.md\"]').click()",
      );
      await until(
        "document.querySelector('#document-name').textContent === 'test.md'",
      );
      // A folder owns both its files and subfolders in the visible tree.
      await js(
        "document.querySelector('.document-bar [data-action=sidebar]').click()",
      );
      await until(
        "parseFloat(getComputedStyle(document.querySelector('#sidebar')).width) > 200",
      );
      assert.equal(
        await js(
          "[...document.querySelectorAll('.file-entry')].map(e => e.title).join('|')",
        ),
        "a|a/inner|a/inner/deep.md|a/own.md|b|b/sibling.md|other|other/other.md|test.md",
      );
      await js("document.querySelector('.file-entry[title=a]').click()");
      assert.equal(
        await js(
          "[...document.querySelectorAll('.file-entry')].some(e => e.title.startsWith('a/'))",
        ),
        false,
      );
      assert.equal(
        await js(
          "!!document.querySelector('.file-entry[title=\"b/sibling.md\"]')",
        ),
        true,
      );
      await js("document.querySelector('.file-entry[title=a]').click()");
      assert.equal(
        await js("!!document.querySelector('.file-entry[title=\"a/own.md\"]')"),
        true,
      );
      assert.equal(
        await js(
          "document.querySelectorAll('.format-bar .ui-icon').length >= 14",
        ),
        true,
      );
      // Language and opacity preview roll back together, without changing document text.
      await js("document.querySelector('[data-action=settings]').click()");
      await until("document.querySelector('.theme-gallery')");
      await js(
        "document.querySelector('[data-category=workspace]').click(); const lang = document.querySelector('[name=language]'); lang.value='en'; lang.dispatchEvent(new Event('input', {bubbles:true}));",
      );
      await until(
        "document.querySelector('#dialog h2').textContent === 'Settings'",
      );
      await js(
        "document.querySelector('[data-category=appearance]').click(); const opacity = document.querySelector('[name=backgroundOpacity]'); opacity.value='80'; opacity.dispatchEvent(new Event('input', {bubbles:true}));",
      );
      assert.match(
        await js(
          "getComputedStyle(document.querySelector('#editor-scroll')).backgroundColor",
        ),
        /0\.8\)/,
      );
      assert.match(
        await js(
          "getComputedStyle(document.querySelector('#sidebar')).backgroundColor",
        ),
        /0\.84\)/,
      );
      await pause(250);
      fs.writeFileSync(
        "/tmp/codora-refinement-settings.png",
        (await win.webContents.capturePage()).toPNG(),
      );
      await js(
        "document.querySelector('#dialog button[value=cancel]').click()",
      );
      await until(
        "!document.querySelector('#dialog').open && document.documentElement.lang === 'ru'",
      );
      assert.match(
        await js(
          "getComputedStyle(document.querySelector('#editor-scroll')).backgroundColor",
        ),
        /rgb\(255, 255, 255\)|color\(srgb 1 1 1\)/,
      );
      // Saving preferences writes through Rust and survives reopening the panel.
      await js("document.querySelector('[data-action=settings]').click()");
      await until("document.querySelector('.theme-gallery')");
      await js(
        "document.querySelector('[data-category=workspace]').click(); document.querySelector('[name=animations]').click(); document.querySelector('#dialog button[value=ok]').click()",
      );
      await until(
        "!document.querySelector('#dialog').open && document.body.classList.contains('reduce-motion')",
      );
      await until("document.querySelector('.milkdown')");
      for (
        let i = 0;
        i < 50 &&
        (!fs.existsSync(path.join(root, ".typoha/config/preferences.json")) ||
          JSON.parse(
            fs.readFileSync(
              path.join(root, ".typoha/config/preferences.json"),
              "utf8",
            ),
          ).animations !== false);
        i++
      )
        await pause(50);
      assert.equal(
        JSON.parse(
          fs.readFileSync(
            path.join(root, ".typoha/config/preferences.json"),
            "utf8",
          ),
        ).animations,
        false,
      );
      // Actual UI export, Chromium PDF generation and blob download to disk.
      const downloaded = new Promise((resolve, reject) => {
        win.webContents.session.once("will-download", (_e, item) => {
          item.setSavePath(path.join(root, "export.pdf"));
          item.once("done", (_event, state) =>
            state === "completed" ? resolve() : reject(new Error(state)),
          );
        });
      });
      await js("document.querySelector('[data-action=export]').click()");
      await until("document.querySelector('[data-export=pdf]')");
      await js("document.querySelector('[data-export=pdf]').click()");
      await downloaded;
      assert.equal(
        fs
          .readFileSync(path.join(root, "export.pdf"))
          .subarray(0, 5)
          .toString(),
        "%PDF-",
      );
      const { spawnSync } = require("node:child_process");
      const pdfText = spawnSync(
        "pdftotext",
        [path.join(root, "export.pdf"), "-"],
        { encoding: "utf8" },
      );
      if (!pdfText.error) {
        assert.equal(pdfText.status, 0);
        assert.match(pdfText.stdout, /Desktop test/);
      }
      await js("navigator.clipboard.writeText('Codora clipboard')");
      for (let i = 0; i < 100 && dictionaries.size < 2; i++) await pause(100);
      assert.ok(dictionaries.has("ru"), "Russian dictionary initialized");
      assert.ok(dictionaries.has("en-US"), "English dictionary initialized");
      await js("document.querySelector('[data-action=workspace]').click()");
      await until(
        "document.querySelector('#workspace-name').title === " +
          JSON.stringify(other),
      );
      await js("document.querySelector('[data-action=new]').click()");
      await until(
        "document.querySelector('#document-name').textContent === 'Без названия'",
      );
      await js("document.querySelector('[data-mode=source]').click()");
      await until("document.querySelector('.cm-content')");
      await js("document.querySelector('.cm-content').focus()");
      win.webContents.insertText("Unsaved desktop text");
      await until(
        "document.querySelector('#window-title').textContent.includes('●')",
      );
      await js("document.querySelector('[data-action=new-tab]').click()");
      await until("!document.querySelector('#welcome').hidden");
      await js(
        "document.querySelectorAll('#document-tabs [role=tab]')[1].click()",
      );
      await until(
        "document.querySelector('.cm-content')?.textContent.includes('Unsaved desktop text')",
      );
      // Closing an edited tab must allow cancellation.
      await js(
        "document.querySelectorAll('.document-tab')[1].lastElementChild.click()",
      );
      await until("document.querySelector('#dialog').open");
      await js(
        "document.querySelector('#dialog button[value=cancel]').click()",
      );
      await until("!document.querySelector('#dialog').open");
      assert.equal(
        await js("document.querySelectorAll('.document-tab').length"),
        3,
      );
      // The native close guard also covers dirty inactive tabs.
      await js(
        "document.querySelectorAll('#document-tabs [role=tab]')[2].click()",
      );
      await until("!document.querySelector('#welcome').hidden");
      win.close();
      await pause(500);
      assert.equal(win.isDestroyed(), false);
      assert.equal(closePrompts, 1);
      app.quit();
      await pause(500);
      assert.equal(win.isDestroyed(), false);
      assert.equal(closePrompts, 2);
      // Crash recovery: draft must exist before explicitly discarding UI state.
      await pause(1500);
      const drafts = fs.readdirSync(path.join(other, ".typoha", "drafts"));
      assert.ok(drafts.length > 0);
      console.log(
        "Desktop smoke passed: sandbox, editor, PDF contents/download, clipboard, local dictionaries, native folder picker, close/quit cancellation, disk draft.",
      );
      dialog.showMessageBoxSync = () => 1;
      clearTimeout(deadline);
      win.close();
    } catch (error) {
      failed = true;
      console.error(error);
      app.exit(1);
    }
  });
});
app.on("quit", () => {
  fs.rmSync(root, { recursive: true, force: true });
  if (failed) process.exitCode = 1;
});
require("./main.cjs");

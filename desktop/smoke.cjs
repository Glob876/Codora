// Run with Electron: electron desktop/smoke.cjs. Uses disposable notes only.
const { app, dialog, session } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "typoha-desktop-smoke-"));
fs.writeFileSync(
  path.join(root, "test.md"),
  "# Desktop test\n\nOriginal text.\n",
);
app.setPath("userData", path.join(root, ".profile"));
const other = path.join(root, "other");
fs.mkdirSync(other);
fs.writeFileSync(path.join(other, "other.md"), "# Other workspace\n");
process.argv = [process.argv[0], __dirname, root];
let failed = false;
let closePrompts = 0;
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
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [other] });
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
      await until("document.querySelector('.file-entry')");
      assert.equal(
        await js("typeof window.typohaDesktop.chooseFolder"),
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
      await js("navigator.clipboard.writeText('Typoha clipboard')");
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

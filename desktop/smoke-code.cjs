// End-to-end test in disposable workspaces, including the actual bundled language service.
const { app, dialog } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "codora-code-smoke-"));
const root = path.join(temporary, "workspace");
const profile = path.join(temporary, "profile");
fs.mkdirSync(root);
fs.mkdirSync(profile);
fs.writeFileSync(path.join(profile, "session.json"), JSON.stringify({ root }));
fs.writeFileSync(
  path.join(root, "code.ts"),
  'const user = {name: "Ada", age: 20};\nuser',
);
fs.writeFileSync(
  path.join(root, "code.py"),
  "def greet(name):\n    return name\n",
);
fs.writeFileSync(path.join(root, "note.md"), "# Markdown\n");
app.setPath("userData", profile);
process.argv = [process.argv[0], __dirname];
dialog.showErrorBox = (title, message) => {
  console.error(title, message);
  app.exit(1);
};
dialog.showMessageBoxSync = () => 1;
const timeout = setTimeout(() => {
  console.error("Code smoke timed out");
  app.exit(1);
}, 30000);
app.on("browser-window-created", (_event, win) => {
  win.webContents.once("did-finish-load", async () => {
    const js = (code) => win.webContents.executeJavaScript(code, true);
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    async function until(code) {
      for (let i = 0; i < 100; i++) {
        if (await js(code)) return;
        await pause(100);
      }
      throw new Error("UI condition timed out: " + code);
    }
    function key(keyCode, modifiers = []) {
      win.webContents.sendInputEvent({ type: "keyDown", keyCode, modifiers });
      win.webContents.sendInputEvent({ type: "keyUp", keyCode, modifiers });
    }
    try {
      await until("document.querySelector('.file-entry[title=\"code.ts\"]')");
      assert.equal(
        await js("document.querySelector('#workspace-name').title"),
        root,
      );
      assert.equal(await js("document.querySelector('#welcome').hidden"), true);
      assert.notEqual(
        await js("getComputedStyle(document.querySelector('#sidebar')).width"),
        "0px",
      );
      await js(
        "document.querySelector('.file-entry[title=\"code.ts\"]').click()",
      );
      await until(
        "document.querySelector('.cm-content') && document.querySelector('#source-toggle').textContent === 'TypeScript'",
      );
      assert.equal(
        await js("document.querySelector('[data-mode=rich]').disabled"),
        true,
      );
      await js("document.querySelector('.cm-content').focus()");
      key("End", ["control"]);
      win.webContents.insertText(".");
      await until(
        "[...document.querySelectorAll('.cm-completionLabel')].some(e => e.textContent === 'name')",
      );
      assert.equal(
        await js("!!document.querySelector('.cm-line span')"),
        true,
        "Syntax highlighting is rendered",
      );
      fs.writeFileSync(
        "/tmp/codora-code.png",
        (await win.webContents.capturePage()).toPNG(),
      );
      await pause(200); // CodeMirror briefly delays acceptance while a popup is first shown.
      key("Enter");
      await until(
        "document.querySelector('.cm-content').textContent.includes('user.age') || document.querySelector('.cm-content').textContent.includes('user.name')",
      );
      key("s", ["control"]);
      for (
        let i = 0;
        i < 50 &&
        !/user\.(age|name)$/.test(
          fs.readFileSync(path.join(root, "code.ts"), "utf8"),
        );
        i++
      )
        await pause(100);
      assert.match(
        fs.readFileSync(path.join(root, "code.ts"), "utf8"),
        /user\.(age|name)$/,
      );
      await js(
        "document.querySelector('.file-entry[title=\"code.py\"]').click()",
      );
      await until(
        "document.querySelector('#source-toggle').textContent === 'Python'",
      );
      await js(
        "document.querySelector('.file-entry[title=\"note.md\"]').click()",
      );
      await until(
        "document.querySelector('#source-toggle').textContent === 'Markdown'",
      );
      assert.equal(
        await js("document.querySelector('[data-mode=rich]').disabled"),
        false,
      );
      const saved = JSON.parse(
        fs.readFileSync(path.join(profile, "session.json"), "utf8"),
      );
      assert.deepEqual(saved, { root });
      console.log(
        "Code smoke passed: restored workspace/sidebar, TS/Python language modes, actual syntax highlighting, automatic inferred member completions, accept/save, Markdown switching, path-only session.",
      );
      clearTimeout(timeout);
      win.close();
    } catch (error) {
      console.error(error);
      app.exit(1);
    }
  });
});
app.on("quit", () => fs.rmSync(temporary, { recursive: true, force: true }));
require("./main.cjs");

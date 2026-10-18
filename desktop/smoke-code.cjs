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
      await js("document.querySelector('[data-action=new-tab]').click()");
      await until("!document.querySelector('#welcome').hidden");
      await js("document.querySelector('[data-action=write]').click()");
      await until(
        "document.querySelector('#document-format') && document.querySelector('#dialog').open",
      );
      await js(
        "document.querySelector('#dialog button[value=cancel]').click()",
      );
      await until("!document.querySelector('#dialog').open");
      assert.equal(
        await js("document.querySelector('#welcome').hidden"),
        false,
      );
      await js("document.querySelector('[data-action=write]').click()");
      await until(
        "document.querySelector('#document-format') && document.querySelector('#dialog').open",
      );
      await js(
        "document.querySelector('#document-format').value = 'py'; document.querySelector('#dialog button[value=ok]').click()",
      );
      await until(
        "document.querySelector('#document-name').textContent === 'Без названия.py' && document.querySelector('.cm-content')",
      );
      assert.equal(
        await js("document.querySelector('#source-toggle').textContent"),
        "Python",
      );
      await js("document.querySelector('.cm-content').focus()");
      win.webContents.insertText("print('new file')");
      await js("document.querySelector('#run-python').click()");
      await until(
        "document.querySelector('#dialog-input') && document.querySelector('#dialog').open",
      );
      assert.equal(
        await js("document.querySelector('#dialog-input').value"),
        "Новый файл.py",
      );
      await js("document.querySelector('#dialog button[value=ok]').click()");
      await until(
        "document.querySelector('#document-name').textContent === 'Новый файл.py'",
      );
      assert.equal(
        fs.readFileSync(path.join(root, "Новый файл.py"), "utf8"),
        "print('new file')",
      );
      assert.equal(
        await js("document.querySelector('#run-python').hidden"),
        false,
      );
      await until(
        "document.querySelector('#run-stdout').textContent.includes('new file') && document.querySelector('#run-status').textContent.includes(': 0')",
      );
      async function replacePython(source) {
        await js("document.querySelector('.cm-content').focus()");
        key("a", ["control"]);
        win.webContents.insertText(source);
        await until(
          "document.querySelector('#window-title').textContent.includes('●')",
        );
      }
      await replacePython("name = input('Name: ')\nprint('Hello ' + name)\n");
      await js("document.querySelector('#run-python').click()");
      await until(
        "document.querySelector('#run-stdout').textContent.includes('Name: ')",
      );
      await js(
        "document.querySelector('#run-input').value = 'Мир'; document.querySelector('#run-input-form').requestSubmit()",
      );
      await until(
        "document.querySelector('#run-stdout').textContent.includes('Hello Мир') && document.querySelector('#run-status').textContent.includes(': 0')",
      );
      assert.match(
        fs.readFileSync(path.join(root, "Новый файл.py"), "utf8"),
        /input/,
      );
      await replacePython("raise RuntimeError('ui-runner-error')\n");
      key("F5");
      await until(
        "document.querySelector('#run-stderr').textContent.includes('RuntimeError: ui-runner-error') && document.querySelector('#run-status').textContent.includes(': 1')",
      );
      fs.writeFileSync(
        "/tmp/codora-python.png",
        (await win.webContents.capturePage()).toPNG(),
      );
      await replacePython("import time\nprint('waiting')\ntime.sleep(60)\n");
      await js("document.querySelector('#run-python').click()");
      await until(
        "document.querySelector('#run-stdout').textContent.includes('waiting')",
      );
      await js("document.querySelector('#stop-run').click()");
      await until(
        "document.querySelector('#run-status').textContent === 'Остановлено'",
      );
      const saved = JSON.parse(
        fs.readFileSync(path.join(profile, "session.json"), "utf8"),
      );
      assert.deepEqual(saved, { root });
      console.log(
        "Code smoke passed: restored workspace/sidebar, TS/Python language modes, actual syntax highlighting, automatic inferred member completions, accept/save, Markdown switching, format picker/cancellation and Python file creation, Python run/autosave/stdin/traceback/F5/Stop, path-only session.",
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

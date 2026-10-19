// Electron integration test; disposable workspace only.
const { app, dialog } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "codora-compact-"));
app.setPath("userData", path.join(root, ".profile"));
process.argv = [process.argv[0], __dirname, root];
dialog.showErrorBox = (title, message) => {
  console.error(title, message);
  app.exit(1);
};
dialog.showMessageBoxSync = () => 1;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deadline = setTimeout(() => {
  console.error("Compact smoke timed out");
  app.exit(1);
}, 30000);
app.on("browser-window-created", (_event, win) => {
  win.webContents.once("did-finish-load", async () => {
    const js = (code) => win.webContents.executeJavaScript(code, true);
    async function until(code) {
      for (let i = 0; i < 100; i++) {
        if (await js(code)) return;
        await pause(100);
      }
      throw new Error("Timed out: " + code);
    }
    function key(keyCode, modifiers = []) {
      win.webContents.sendInputEvent({ type: "keyDown", keyCode, modifiers });
      win.webContents.sendInputEvent({ type: "keyUp", keyCode, modifiers });
    }
    try {
      await until("document.querySelector('.ProseMirror')");
      const original = win.getBounds();
      key("m", ["control", "shift"]);
      await until("document.body.classList.contains('compact-mode')");
      await pause(250);
      assert.deepEqual(win.getSize(), [480, 360]);
      assert.equal(
        await js(
          "getComputedStyle(document.querySelector('.compact-logo')).display",
        ),
        "block",
      );
      assert.equal(
        await js(
          "getComputedStyle(document.querySelector('.menubar')).visibility",
        ),
        "hidden",
      );
      for (const selector of [
        "#welcome",
        "#sidebar",
        ".tabstrip",
        ".document-bar",
        ".format-bar",
        ".statusbar",
      ])
        assert.equal(
          await js(
            `getComputedStyle(document.querySelector('${selector}')).display`,
          ),
          "none",
        );
      assert.equal(
        await js(
          "getComputedStyle(document.querySelector('#editor-scroll')).display",
        ),
        "block",
      );
      assert.equal(
        await js(
          "getComputedStyle(document.querySelector('[data-placeholder]'), '::before').content",
        ),
        "none",
      );
      fs.writeFileSync(
        "/tmp/codora-compact-empty.png",
        (await win.webContents.capturePage()).toPNG(),
      );
      win.webContents.insertText("Маленькое окно для текста.");
      await until("!document.body.classList.contains('compact-empty')");
      const text = await js(
        "document.querySelector('.ProseMirror').textContent",
      );
      assert.equal(text, "Маленькое окно для текста.");
      fs.writeFileSync(
        "/tmp/codora-compact-text.png",
        (await win.webContents.capturePage()).toPNG(),
      );
      const top = await js(
        "document.querySelector('#editor').getBoundingClientRect().top",
      );
      key("Alt");
      await until("document.body.classList.contains('compact-menu-visible')");
      await pause(220);
      assert.equal(
        await js(
          "getComputedStyle(document.querySelector('.menubar')).opacity",
        ),
        "1",
      );
      assert.equal(
        await js(
          "document.querySelector('#editor').getBoundingClientRect().top",
        ),
        top,
      );
      await js("document.querySelector('#menus button').click()");
      assert.equal(
        await js("document.querySelector('#dropdown').hidden"),
        false,
      );
      key("Escape");
      await until("!document.body.classList.contains('compact-menu-visible')");
      assert.equal(
        await js("document.querySelector('#dropdown').hidden"),
        true,
      );
      key("m", ["control", "shift"]);
      await until("!document.body.classList.contains('compact-mode')");
      await pause(250);
      assert.deepEqual(win.getBounds(), original);
      assert.equal(
        await js("document.querySelector('.ProseMirror').textContent"),
        text,
      );
      console.log(
        "Compact smoke passed: native resize/restore, logo-only welcome, first input, hidden chrome, Alt overlay/menu, Escape, retained unsaved text.",
      );
      clearTimeout(deadline);
      win.close();
    } catch (error) {
      console.error(error);
      app.exit(1);
    }
  });
});
app.on("quit", () => fs.rmSync(root, { recursive: true, force: true }));
require("./main.cjs");

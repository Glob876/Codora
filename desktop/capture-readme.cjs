// Capture only original sample notes in a disposable workspace.
// Run after building: xvfb-run -a -s "-screen 0 1600x1000x24" desktop/node_modules/.bin/electron desktop/capture-readme.cjs
const { app, dialog } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "codora-readme-"));
const root = path.join(temporary, "Notes");
fs.mkdirSync(root);
fs.writeFileSync(
  path.join(root, "Welcome.md"),
  '# A little room to think\n\nCodora brings your notes and code together, right on your computer.\n\n## From an idea to a working draft\n\nKeep a journal, sketch a plan, or build something new. Your files stay in plain UTF-8 Markdown.\n\n- **Write naturally** with live Markdown editing\n- Keep notes and source code in one folder\n- Choose a palette that feels like home\n- Find your words with workspace search\n\n> Good tools give your ideas space.\n\n## A small example\n\n```python\nfrom pathlib import Path\n\nfor note in Path(".").glob("*.md"):\n    print(note.name)\n```\n\n## Next steps\n\n- [x] Make a little space for writing\n- [x] Save the first draft\n- [ ] Follow the next idea\n',
);
fs.writeFileSync(path.join(root, "Ideas.md"), "# Ideas\n");
fs.mkdirSync(path.join(root, "Projects"));
app.setPath("userData", path.join(root, ".profile"));
process.argv = [process.argv[0], __dirname, root];
dialog.showErrorBox = (title, body) => {
  console.error(title, body);
  app.exit(1);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const timeout = setTimeout(() => app.exit(1), 30000);
app.on("browser-window-created", (_e, win) => {
  win.webContents.once("did-finish-load", async () => {
    try {
      const js = (code) => win.webContents.executeJavaScript(code, true);
      for (let n = 0; n < 100; n++) {
        if (await js("!!document.querySelector('.file-entry')")) break;
        await wait(100);
      }
      await js(
        "document.querySelector('[data-action=sidebar]').click(); [...document.querySelectorAll('.file-entry')].find(e => e.textContent.includes('Welcome')).click()",
      );
      for (let n = 0; n < 100; n++) {
        if (
          await js(
            "document.querySelector('.ProseMirror')?.textContent.includes('A little room')",
          )
        )
          break;
        await wait(100);
      }
      win.setBounds({ x: 0, y: 0, width: 1280, height: 860 });
      await js("document.activeElement?.blur()");
      await wait(700);
      fs.writeFileSync(
        path.join(__dirname, "../docs/screenshots/codora.png"),
        (await win.webContents.capturePage()).toPNG(),
      );
      clearTimeout(timeout);
      app.quit();
    } catch (e) {
      console.error(e);
      app.exit(1);
    }
  });
});
require("./main.cjs");

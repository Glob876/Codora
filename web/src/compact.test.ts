// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import { CompactMode } from "./compact";
let compact: CompactMode;
beforeEach(() => {
  document.body.className = "";
  document.body.innerHTML =
    '<header class="menubar"></header><div id="editor">unsaved text</div>';
  compact = new CompactMode(document.body);
});
it("hides chrome without replacing the editor or its unsaved text", () => {
  const editor = document.querySelector("#editor");
  compact.setActive(true);
  expect(document.body.classList.contains("compact-mode")).toBe(true);
  expect(document.querySelector<HTMLElement>(".menubar")!.inert).toBe(true);
  compact.setActive(false);
  expect(document.body.classList.contains("compact-mode")).toBe(false);
  expect(document.querySelector("#editor")).toBe(editor);
  expect(editor!.textContent).toBe("unsaved text");
  expect(document.querySelector<HTMLElement>(".menubar")!.inert).toBe(false);
});
it("shows the mark for an empty document and removes it on the first character", () => {
  compact.setActive(true);
  compact.updateEmpty("");
  expect(document.body.classList.contains("compact-empty")).toBe(true);
  compact.updateEmpty(" ");
  expect(document.body.classList.contains("compact-empty")).toBe(false);
  compact.updateEmpty("");
  expect(document.body.classList.contains("compact-empty")).toBe(true);
});
it("toggles menus with Alt, ignores repeats and shortcuts, and dismisses with Escape", () => {
  compact.setActive(true);
  const alt = () =>
    new KeyboardEvent("keydown", { key: "Alt", cancelable: true });
  const event = alt();
  expect(compact.handleKey(event)).toBe(true);
  expect(event.defaultPrevented).toBe(true);
  expect(document.body.classList.contains("compact-menu-visible")).toBe(true);
  compact.handleKey(new KeyboardEvent("keydown", { key: "Alt", repeat: true }));
  compact.handleKey(
    new KeyboardEvent("keydown", { key: "Alt", ctrlKey: true }),
  );
  expect(document.body.classList.contains("compact-menu-visible")).toBe(true);
  compact.handleKey(alt());
  expect(document.body.classList.contains("compact-menu-visible")).toBe(false);
  compact.handleKey(alt());
  compact.handleKey(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(document.body.classList.contains("compact-menu-visible")).toBe(false);
  compact.setActive(false);
  expect(compact.handleKey(alt())).toBe(false);
});

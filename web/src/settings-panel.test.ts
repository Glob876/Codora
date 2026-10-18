// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { settingsPanel } from "./settings-panel";
import { defaults } from "./settings";
import { themes, themeVariables } from "./themes";

describe("preferences preview transaction", () => {
  let dialog: HTMLDialogElement;
  beforeEach(() => {
    document.body.innerHTML = "<dialog></dialog>";
    dialog = document.querySelector("dialog")!;
    document.documentElement.style.setProperty("--accent", "#123456");
    document.documentElement.style.setProperty("--panel", "#ffffff");
    document.documentElement.style.setProperty("--text", "#000000");
  });
  it("previews theme and custom colors but cancels back to the original settings", () => {
    const preview = vi.fn(),
      commit = vi.fn();
    settingsPanel(dialog, { ...defaults }, preview, commit);
    dialog
      .querySelector<HTMLButtonElement>("[data-theme-choice=matrix]")!
      .click();
    expect(preview.mock.lastCall?.[0].theme).toBe("matrix");
    const color = dialog.querySelector<HTMLInputElement>(
      "[name=primaryColor]",
    )!;
    color.value = "#abcdef";
    color.dispatchEvent(new Event("input", { bubbles: true }));
    expect(preview.mock.lastCall?.[0].primaryColor).toBe("#abcdef");
    dialog.returnValue = "cancel";
    dialog.dispatchEvent(new Event("close"));
    expect(preview.mock.lastCall?.[0]).toEqual(defaults);
    expect(commit).not.toHaveBeenCalled();
  });
  it("switches categories, validates numbers and commits only changed preferences", () => {
    const preview = vi.fn(),
      commit = vi.fn();
    settingsPanel(dialog, { ...defaults }, preview, commit);
    dialog.querySelector<HTMLButtonElement>("[data-category=editor]")!.click();
    expect(
      dialog.querySelector<HTMLElement>("[data-settings-section=editor]")!
        .hidden,
    ).toBe(false);
    const size = dialog.querySelector<HTMLInputElement>("[name=fontSize]")!;
    size.value = "999";
    size.dispatchEvent(new Event("input", { bubbles: true }));
    expect(preview).not.toHaveBeenCalled();
    size.value = "22";
    size.dispatchEvent(new Event("input", { bubbles: true }));
    dialog.returnValue = "ok";
    dialog.dispatchEvent(new Event("close"));
    expect(commit.mock.lastCall?.[0]).toEqual({ ...defaults, fontSize: 22 });
  });
  it("provides original palettes and follows system appearance", () => {
    expect(new Set(themes.map((t) => t.id)).size).toBe(9);
    expect(themeVariables("system", true)["color-scheme"]).toBe("dark");
    expect(themeVariables("unknown")["--bg"]).toBe("#ffffff");
  });
});

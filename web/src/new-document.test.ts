// @vitest-environment jsdom
import { expect, it } from "vitest";
import {
  chooseDocumentFormat,
  documentFormats,
  newDocumentName,
} from "./new-document";
import { languageName } from "./code-editor";

it("selects the requested file format with its matching save name and language", async () => {
  let dialog!: HTMLDialogElement;
  const result = chooseDocumentFormat((_title, body) => {
    document.body.innerHTML = `<dialog>${body}</dialog>`;
    return (dialog = document.querySelector("dialog")!);
  });
  const select = dialog.querySelector<HTMLSelectElement>("select")!;
  expect(select.options.length).toBe(documentFormats.length);
  select.value = "py";
  dialog.returnValue = "ok";
  dialog.dispatchEvent(new Event("close"));
  const extension = await result;
  expect(extension).toBe("py");
  expect(newDocumentName(extension!)).toBe("Новый файл.py");
  expect(languageName(newDocumentName(extension!))).toBe("Python");
});

it.each(["cancel", ""])("leaves creation cancelled on %j", async (value) => {
  let dialog!: HTMLDialogElement;
  const result = chooseDocumentFormat((_title, body) => {
    document.body.innerHTML = `<dialog>${body}</dialog>`;
    return (dialog = document.querySelector("dialog")!);
  });
  dialog.returnValue = value;
  dialog.dispatchEvent(new Event("close"));
  expect(await result).toBeNull();
});

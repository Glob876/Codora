// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import { setLanguage, tr, translateUi } from "./i18n";
import { actions } from "./commands";
beforeEach(() => setLanguage("ru"));
it("translates chrome, switches back losslessly and never translates document/user paths", () => {
  document.body.innerHTML =
    '<main><button title="Сохранить · Ctrl+S">Сохранить</button><div id="editor"><p>Сохранить</p></div><span class="file-label" data-no-translate>Настройки</span><input value="Сохранить" placeholder="Фильтр файлов…"></main>';
  const root = document.querySelector("main")!;
  setLanguage("en");
  translateUi(root);
  expect(root.querySelector("button")!.textContent).toBe("Save");
  expect(root.querySelector("button")!.title).toBe("Save · Ctrl+S");
  expect(root.querySelector("#editor")!.textContent).toBe("Сохранить");
  expect(root.querySelector(".file-label")!.textContent).toBe("Настройки");
  expect(root.querySelector("input")!.value).toBe("Сохранить");
  setLanguage("de");
  translateUi(root);
  expect(root.querySelector("button")!.textContent).toBe("Speichern");
  setLanguage("ru");
  translateUi(root);
  expect(root.querySelector("button")!.title).toBe("Сохранить · Ctrl+S");
});
it("covers English/German commands and Ukrainian preferences", () => {
  setLanguage("uk");
  expect(tr("Настройки")).toBe("Налаштування");
  for (const language of ["en", "de"]) {
    setLanguage(language);
    for (const action of actions)
      expect(tr(action.label), action.label).not.toBe(action.label);
  }
});

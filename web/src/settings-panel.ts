import { icon } from "./icons";
import { defaults, type Settings } from "./settings";
import { themes } from "./themes";
import { escapeHtml as esc } from "./escape";
export function settingsPanel(
  d: HTMLDialogElement,
  initial: Settings,
  preview: (s: Settings) => void,
  commit: (s: Settings) => void,
) {
  const draft = { ...initial };
  d.classList.add("preferences-dialog");
  const check = (key: keyof Settings, label: string, hint: string) =>
    `<label class="setting-row"><span>${label}<small>${hint}</small></span><input type="checkbox" name="${key}" ${draft[key] ? "checked" : ""}></label>`;
  const number = (
    key: keyof Settings,
    label: string,
    min: number,
    max: number,
    step = 1,
  ) =>
    key === "backgroundOpacity"
      ? `<label class="setting-row"><span>${label}</span><span class="opacity-control"><input type="range" name="backgroundOpacity" min="0" max="100" step="1" value="${draft.backgroundOpacity}"><output id="opacity-value">${draft.backgroundOpacity}%</output></span></label>`
      : `<label class="setting-row"><span>${label}</span><input type="number" name="${key}" min="${min}" max="${max}" step="${step}" value="${draft[key]}"></label>`;
  const select = (key: keyof Settings, label: string, options: string[][]) =>
    `<label class="setting-row"><span>${label}</span><select name="${key}">${options.map(([id, name]) => `<option value="${id}" ${draft[key] === id ? "selected" : ""}>${name}</option>`).join("")}</select></label>`;
  const groups = [
    [
      "appearance",
      "palette",
      "Оформление",
      `<p>Выберите настроение для своего рабочего пространства.</p><div class="theme-gallery">${themes.map((t) => `<button type="button" data-theme-choice="${t.id}" aria-pressed="${draft.theme === t.id}" style="--swatch-bg:${t.bg};--swatch-text:${t.text};--swatch-accent:${t.accent}"><span class="theme-preview">Aa<i></i><i></i></span>${t.name}</button>`).join("")}</div>${select("theme", "Цветовая схема", [...themes.map((t) => [t.id, t.name]), ["system", "Системная"]])}${number("backgroundOpacity", "Непрозрачность фона, %", 0, 100)}<p>Панели и меню на 4 процентных пункта плотнее фона. В браузере прозрачность ограничена страницей; в приложении зависит от оконного композитора.</p><h3>Своя палитра</h3><p>Цвета дополняют выбранную тему. Сброс возвращает исходную палитру.</p>${[
        ["primaryColor", "Основной · акцент", "--accent"],
        ["secondaryColor", "Второстепенный · панели", "--panel"],
        ["textColor", "Текст", "--text"],
      ]
        .map(
          ([key, label, variable]) =>
            `<label class="setting-row"><span>${label}</span><input type="color" name="${key}" value="${(draft as any)[key] || getComputedStyle(document.documentElement).getPropertyValue(variable).trim()}"></label>`,
        )
        .join(
          "",
        )}<button type="button" id="reset-palette">Сбросить палитру</button>`,
    ],
    [
      "editor",
      "pencil",
      "Редактор",
      `${select("font", "Шрифт", [
        ["serif", "С засечками"],
        ["sans", "Системный"],
        ["mono", "Моноширинный"],
      ])}${number("fontSize", "Размер текста, px", 12, 36)}${number("width", "Ширина страницы, px", 480, 1400, 20)}${number("lineHeight", "Межстрочный интервал", 1.2, 2.5, 0.1)}${number("tabSize", "Размер табуляции в исходнике", 2, 8)}${check("lineNumbers", "Номера строк", "В режиме исходного Markdown")}${check("wordWrap", "Перенос длинных строк", "В режиме исходного Markdown")}${check("spellcheck", "Проверка орфографии", "Локальная проверка средствами оболочки")}`,
    ],
    [
      "workspace",
      "sidebar",
      "Интерфейс",
      `${select("language", "Язык интерфейса", [
        ["ru", "Русский"],
        ["en", "English"],
        ["uk", "Українська"],
        ["de", "Deutsch"],
      ])}${check("animations", "Плавные анимации", "Учитывается системное уменьшение движения")}${check("toolbar", "Панель форматирования", "Быстрый доступ к оформлению текста")}${check("statusbar", "Строка состояния", "Статистика и параметры документа")}${number("sidebarWidth", "Ширина боковой панели, px", 180, 480)}${select(
        "sort",
        "Сортировка файлов",
        [
          ["name", "По имени"],
          ["modified", "По изменению"],
        ],
      )}${check("hidden", "Скрытые файлы", "Показывать в дереве папки")}${check("allFiles", "Все типы файлов", "Вместе с файлами Markdown")}`,
    ],
    [
      "writing",
      "focus",
      "Письмо",
      `${check("focus", "Фокусировка", "Приглушать соседние абзацы во время письма")}${check("typewriter", "Печатная машинка", "Удерживать текущую строку ближе к центру")}${check("autosave", "Автосохранение", "Только для документов с именем; конфликты остаются под защитой")}${number("autosaveDelay", "Задержка автосохранения, мс", 500, 30000, 100)}`,
    ],
    [
      "advanced",
      "sliders",
      "Дополнительно",
      `<label class="field">Пользовательский CSS<textarea name="customCss" rows="12" spellcheck="false">${esc(draft.customCss)}</textarea></label><p>CSS применяется локально. Внешние ресурсы блокируются. Настройки сохраняются Rust-ядром в рабочей папке.</p><button type="button" id="reset-settings">Восстановить настройки по умолчанию</button>`,
    ],
  ];
  d.innerHTML = `<form method="dialog"><header><h2>Настройки</h2><button value="cancel" class="close-dialog" aria-label="Закрыть">${icon("close")}</button></header><div class="preferences-layout"><nav aria-label="Категории настроек">${groups.map(([id, symbol, name], i) => `<button type="button" data-category="${id}" aria-current="${i === 0}">${icon(symbol)} <span>${name}</span></button>`).join("")}</nav><div class="preferences-content">${groups.map(([id, , name, body], i) => `<section data-settings-section="${id}" ${i ? "hidden" : ""}><h2>${name}</h2>${body}</section>`).join("")}</div></div><footer class="preferences-footer"><span>Предпросмотр изменений</span><button value="cancel">Отмена</button><button class="primary" value="ok">Сохранить</button></footer></form>`;
  const rerender = () => {
    preview(draft);
    d.querySelector("#opacity-value")!.textContent =
      `${draft.backgroundOpacity}%`;
    d.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("[name]").forEach((el) => {
      const value = draft[el.name as keyof Settings];
      if (el instanceof HTMLInputElement && el.type === "checkbox")
        el.checked = Boolean(value);
      else if (el instanceof HTMLInputElement && el.type === "color")
        el.value = String(
          value ||
            getComputedStyle(document.documentElement)
              .getPropertyValue(
                el.name === "primaryColor"
                  ? "--accent"
                  : el.name === "secondaryColor"
                    ? "--panel"
                    : "--text",
              )
              .trim(),
        );
      else el.value = String(value);
    });
    d.querySelectorAll<HTMLElement>("[data-theme-choice]").forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.themeChoice === draft.theme),
      ),
    );
  };
  d.querySelectorAll<HTMLButtonElement>("[data-category]").forEach(
    (b) =>
      (b.onclick = () => {
        d.querySelectorAll<HTMLElement>("[data-settings-section]").forEach(
          (s) => (s.hidden = s.dataset.settingsSection !== b.dataset.category),
        );
        d.querySelectorAll("[data-category]").forEach((n) =>
          n.setAttribute("aria-current", String(n === b)),
        );
      }),
  );
  d.querySelectorAll<HTMLButtonElement>("[data-theme-choice]").forEach(
    (b) =>
      (b.onclick = () => {
        draft.theme = b.dataset.themeChoice!;
        draft.primaryColor = draft.secondaryColor = draft.textColor = "";
        rerender();
      }),
  );
  d.querySelector<HTMLButtonElement>("#reset-palette")!.onclick = () => {
    draft.primaryColor = draft.secondaryColor = draft.textColor = "";
    rerender();
  };
  d.querySelector<HTMLButtonElement>("#reset-settings")!.onclick = () => {
    Object.assign(draft, defaults, {
      recent: initial.recent,
      pinned: initial.pinned,
    });
    rerender();
  };
  d.oninput = (event) => {
    const el = event.target;
    if (
      !(
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
      ) ||
      !el.name
    )
      return;
    if (el instanceof HTMLInputElement && el.type === "checkbox")
      (draft as any)[el.name] = el.checked;
    else if (
      el instanceof HTMLInputElement &&
      (el.type === "number" || el.type === "range")
    ) {
      if (!el.validity.valid || !el.value) return;
      (draft as any)[el.name] = Number(el.value);
    } else (draft as any)[el.name] = el.value;
    const opacityValue = d.querySelector("#opacity-value");
    if (opacityValue) opacityValue.textContent = `${draft.backgroundOpacity}%`;
    preview(draft);
  };
  // Assign a single handler even when the palette rerenders.
  d.onclose = () => {
    d.classList.remove("preferences-dialog");
    d.oninput = null;
    d.onclose = null;
    if (d.returnValue === "ok") commit(draft);
    else preview(initial);
  };
}

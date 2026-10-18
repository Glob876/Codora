import { escapeHtml } from "./escape";

export const documentFormats = [
  ["md", "Markdown"],
  ["txt", "Обычный текст"],
  ["ts", "TypeScript"],
  ["tsx", "TypeScript JSX"],
  ["js", "JavaScript"],
  ["jsx", "JavaScript JSX"],
  ["py", "Python"],
  ["rs", "Rust"],
  ["go", "Go"],
  ["java", "Java"],
  ["c", "C"],
  ["cpp", "C++"],
  ["cs", "C#"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["scss", "SCSS"],
  ["json", "JSON"],
  ["yaml", "YAML"],
  ["toml", "TOML"],
  ["xml", "XML"],
  ["sh", "Shell"],
  ["sql", "SQL"],
] as const;

export function newDocumentName(extension: string): string {
  return `Новый файл.${extension}`;
}

export async function chooseDocumentFormat(
  openDialog: (title: string, body: string) => HTMLDialogElement,
): Promise<string | null> {
  const dialog = openDialog(
    "Новый файл",
    `<label class="field">Формат файла<select id="document-format" required>${documentFormats.map(([extension, name]) => `<option value="${extension}">${escapeHtml(name)} (.${extension})</option>`).join("")}</select></label><div class="dialog-actions"><button value="cancel">Отмена</button><button value="ok" class="primary">Создать</button></div>`,
  );
  const select = dialog.querySelector<HTMLSelectElement>("#document-format")!;
  select.focus();
  return new Promise((resolve) =>
    dialog.addEventListener(
      "close",
      () => {
        resolve(
          dialog.returnValue === "ok" &&
            documentFormats.some(([extension]) => extension === select.value)
            ? select.value
            : null,
        );
      },
      { once: true },
    ),
  );
}

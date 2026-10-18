import { LanguageDescription, indentUnit } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState, type Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import {
  completeAnyWord,
  type CompletionContext,
  type CompletionResult,
  type Completion,
  snippetCompletion,
} from "@codemirror/autocomplete";

export function isMarkdown(path: string | null): boolean {
  return !path || /\.(md|markdown|mdown|mkd)$/i.test(path);
}
export function languageFor(path: string | null): LanguageDescription | null {
  if (!path) return null;
  const filename = path.split(/[\\/]/).pop()!;
  return (
    LanguageDescription.matchFilename(languages, filename) ||
    LanguageDescription.matchFilename(languages, filename.toLowerCase()) ||
    null
  );
}
export function languageName(path: string | null): string {
  return isMarkdown(path)
    ? "Markdown"
    : languageFor(path)?.name || "Plain text";
}
const keywords: Record<string, string> = {
  JavaScript:
    "async await break case catch class const continue debugger default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while yield console document window Promise JSON Math Array Object String Number Set Map",
  TypeScript:
    "abstract any as boolean declare enum implements interface keyof namespace never private protected public readonly satisfies string type unknown number",
  Python:
    "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield print len range enumerate dict list set str int self",
  Rust: "as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return Self self static struct super trait true type unsafe use where while Some None Ok Err String Vec Option Result println",
  Go: "break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil make append len error",
  Java: "abstract boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new null package private protected public return short static super switch synchronized this throw throws transient true false try void volatile while String System",
  SQL: "SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE JOIN LEFT RIGHT INNER ON AS GROUP BY ORDER HAVING LIMIT DISTINCT CREATE TABLE ALTER DROP INDEX PRIMARY KEY NOT NULL AND OR IN IS LIKE COUNT SUM AVG",
  Shell:
    "if then else elif fi for in do done while case esac function export local echo printf read cd pwd exit return set source",
};
const snippets: Record<string, Completion[]> = {
  JavaScript: [
    snippetCompletion("console.log(${value});", {
      label: "log",
      detail: "console.log",
      type: "function",
    }),
    snippetCompletion("for (const ${item} of ${items}) {\n\t${}\n}", {
      label: "forof",
      detail: "for…of",
      type: "keyword",
    }),
  ],
  Python: [
    snippetCompletion("def ${name}(${args}):\n\t${pass}", {
      label: "def",
      detail: "function",
      type: "keyword",
    }),
  ],
  Rust: [
    snippetCompletion("fn ${name}(${args}) {\n\t${}\n}", {
      label: "fn",
      detail: "function",
      type: "keyword",
    }),
  ],
};
function family(name: string): string {
  return /^(TypeScript|TSX|JSX)$/.test(name)
    ? "JavaScript"
    : name === "Bash"
      ? "Shell"
      : name;
}
export function codeCompletions(name: string) {
  return async (
    context: CompletionContext,
  ): Promise<CompletionResult | null> => {
    const word = context.matchBefore(/[\w$]+/);
    if (!word && !context.explicit) return null;
    const base = family(name);
    const words =
      `${keywords[base] || ""} ${name === "TypeScript" || name === "TSX" ? keywords.TypeScript : ""}`
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    const local = await completeAnyWord(context);
    const options: Completion[] = [
      ...(snippets[base] || []),
      ...words.map((label) => ({ label, type: "keyword", detail: name })),
      ...(local?.options || []),
    ];
    const seen = new Set<string>();
    return {
      from: word?.from ?? context.pos,
      options: options.filter(
        (option) => !seen.has(option.label) && !!seen.add(option.label),
      ),
      validFor: /^[\w$]*$/,
    };
  };
}
/** Keep language providers (HTML/CSS/JS etc.) and add local words/keywords without overriding them. */
export async function codeExtensions(
  path: string | null,
  tabSize: number,
): Promise<Extension[]> {
  const language = languageFor(path);
  const support = isMarkdown(path)
    ? markdown({ codeLanguages: languages })
    : language
      ? await language.load()
      : [];
  const semantic = /^(JavaScript|JSX|TypeScript|TSX)$/.test(languageName(path))
    ? (await import("./intelligence")).typescriptCompletions(
        path || "untitled.ts",
      )
    : null;
  return [
    support,
    indentUnit.of(" ".repeat(tabSize)),
    keymap.of([indentWithTab]),
    EditorState.languageData.of(() => [
      { autocomplete: codeCompletions(languageName(path)) },
      ...(semantic ? [{ autocomplete: semantic }] : []),
    ]),
  ];
}
export function copyPath(path: string): string {
  return path.replace(/(\.[^./]+)?$/, "-копия$1");
}

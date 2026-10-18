/** Single-document TypeScript service. No filesystem/network/project access. */
import * as ts from "typescript";
import standardLibrary from "typescript/lib/lib.es5.d.ts?raw";
import type {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

export function typescriptCompletions(path: string) {
  const filename = `/document.${path.split(".").pop()?.toLowerCase() || "ts"}`;
  let text = "";
  let version = 0;
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    jsx: ts.JsxEmit.Preserve,
    allowJs: true,
    noResolve: true,
  };
  const host: ts.LanguageServiceHost = {
    getCompilationSettings: () => options,
    getScriptFileNames: () => [filename],
    getScriptVersion: (file) => (file === filename ? String(version) : "0"),
    getScriptSnapshot: (file) =>
      file === filename
        ? ts.ScriptSnapshot.fromString(text)
        : file === "/lib.d.ts"
          ? ts.ScriptSnapshot.fromString(standardLibrary)
          : undefined,
    getCurrentDirectory: () => "/",
    getDefaultLibFileName: () => "/lib.d.ts",
    fileExists: (file) => file === filename || file === "/lib.d.ts",
    readFile: (file) =>
      file === filename
        ? text
        : file === "/lib.d.ts"
          ? standardLibrary
          : undefined,
  };
  const service = ts.createLanguageService(host);
  return (context: CompletionContext): CompletionResult | null => {
    // Keep synchronous semantic analysis bounded; all files still get syntax/word completion.
    if (context.state.doc.length > 300_000) return null;
    const word = context.matchBefore(/[\w$]*/);
    const from = word?.from ?? context.pos;
    if (
      !context.explicit &&
      from === context.pos &&
      context.state.sliceDoc(from - 1, from) !== "."
    )
      return null;
    const next = context.state.doc.toString();
    if (next !== text) {
      text = next;
      version++;
    }
    const result = service.getCompletionsAtPosition(filename, context.pos, {
      includeCompletionsForModuleExports: false,
      includeCompletionsWithInsertText: false,
    });
    if (!result) return null;
    return {
      from,
      validFor: /^[\w$]*$/,
      options: result.entries.map((entry) => ({
        label: entry.name,
        type: /method|function/.test(entry.kind)
          ? "function"
          : /property/.test(entry.kind)
            ? "property"
            : "variable",
        boost: result.isMemberCompletion ? 20 : 5,
        detail: entry.kind,
        info: () => {
          const details = service.getCompletionEntryDetails(
            filename,
            context.pos,
            entry.name,
            undefined,
            entry.source,
            undefined,
            entry.data,
          );
          const element = document.createElement("pre");
          element.textContent = details
            ? ts.displayPartsToString(details.displayParts) +
              "\n" +
              ts.displayPartsToString(details.documentation)
            : entry.name;
          return element;
        },
      })),
    };
  };
}

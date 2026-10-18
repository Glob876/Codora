import { describe, expect, it } from "vitest";
import { CompletionContext } from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";
import {
  codeCompletions,
  codeExtensions,
  copyPath,
  isMarkdown,
  languageName,
} from "./code-editor";
import { typescriptCompletions } from "./intelligence";

describe("code editing", () => {
  it("detects language from filenames without treating arbitrary text as Markdown", () => {
    for (const [path, name] of [
      ["src/main.rs", "Rust"],
      ["a.TS", "TypeScript"],
      ["x.tsx", "TSX"],
      ["x.py", "Python"],
      ["x.json", "JSON"],
      ["x.html", "HTML"],
      ["x.css", "CSS"],
      ["x.go", "Go"],
      ["x.java", "Java"],
      ["x.yaml", "YAML"],
      ["x.toml", "TOML"],
      ["x.sh", "Shell"],
      ["x.cpp", "C++"],
      ["notes.md", "Markdown"],
      ["README", "Plain text"],
    ])
      expect(languageName(path)).toBe(name);
    expect(isMarkdown("hello.txt")).toBe(false);
    expect(isMarkdown(null)).toBe(true);
    expect(copyPath("src/file.ts")).toBe("src/file-копия.ts");
  });
  it("loads local grammars for source files", async () => {
    for (const path of ["x.rs", "x.py", "x.html", "x.css", "x.json", "x.ts"]) {
      const extensions = await codeExtensions(path, 2);
      expect(
        EditorState.create({
          doc: "const value = 1",
          extensions,
        }).doc.toString(),
      ).toBe("const value = 1");
    }
  });
  it("suggests language keywords and document identifiers automatically", async () => {
    const doc = "customerName = 1\ncust";
    const context = new CompletionContext(
      EditorState.create({ doc }),
      doc.length,
      false,
    );
    const result = await codeCompletions("Python")(context);
    expect(result?.options.some((o) => o.label === "customerName")).toBe(true);
    expect(result?.options.some((o) => o.label === "def")).toBe(true);
  });
  it("offers inferred object members and built-in string methods in TS and JS", () => {
    for (const file of ["test.ts", "test.js"]) {
      const source = typescriptCompletions(file);
      for (const [doc, expected] of [
        ["const user = {name: 'Ada', age: 20}; user.", "name"],
        ["const name = 'Ada'; name.", "toUpperCase"],
        ["const user = {renamed: true}; user.", "renamed"],
      ]) {
        const result = source(
          new CompletionContext(EditorState.create({ doc }), doc.length, false),
        );
        expect(result?.options.some((o) => o.label === expected)).toBe(true);
        if (expected === "renamed")
          expect(result?.options.some((o) => o.label === "age")).toBe(false);
      }
    }
  });
});

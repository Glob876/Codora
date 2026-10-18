import { describe, it, expect } from "vitest";
import {
  headings,
  statistics,
  richCompatibility,
  safeRelativeAsset,
  fuzzyScore,
  toc,
} from "./model";
describe("lossless editor guard", () => {
  it("routes syntax not supported by rich editing to source", () => {
    for (const text of [
      "---\ntitle: X\n---\n# H",
      "[^note]: content",
      "[картинка]: images/cat.png\n\n![Кот][картинка]",
      "   [ref]: <https://example.org/path>\n\n[ref]",
      "[ref]:\n  https://example.org\n\n[ref]",
      '[reference]: https://example.org "Title"\n\n[link][reference]',
      "<details>hello</details>",
      "==marked==",
      "[TOC]",
      "> [!NOTE]\n> hello",
    ])
      expect(richCompatibility(text)).not.toBeNull();
    expect(
      richCompatibility("# Hello\n\n**world**\n\n```rust\nfn main() {}\n```"),
    ).toBeNull();
  });
});
describe("headings", () => {
  it("ignores fenced code, creates Unicode anchors and disambiguates duplicates", () => {
    expect(
      headings("# Привет\n\n```md\n# Hidden\n```\n## Привет\nTitle\n=====").map(
        (h) => [h.title, h.slug, h.line],
      ),
    ).toEqual([
      ["Привет", "привет", 0],
      ["Привет", "привет-1", 5],
      ["Title", "title", 6],
    ]);
  });
  it("generates a linked toc", () => {
    expect(toc("# A\n## B")).toBe("- [A](#a)\n  - [B](#b)");
  });
});
describe("asset boundary", () => {
  it("resolves nested local paths and rejects escapes and external schemes", () => {
    expect(safeRelativeAsset("notes/a.md", "../assets/x.png")).toBe(
      "assets/x.png",
    );
    for (const s of [
      "https://a.invalid/a.png",
      "//a.invalid/a.png",
      "javascript:alert(1)",
      "../../a.png",
      "%2e%2e/%2e%2e/a.png",
    ])
      expect(safeRelativeAsset("notes/a.md", s)).toBeNull();
  });
});
describe("statistics and quick open", () => {
  it("counts Unicode code points and multilingual words", () => {
    expect(statistics("Привет мир 🐱").words).toBe(2);
    expect(statistics("🐱").characters).toBe(1);
  });
  it("ranks contiguous file matches and rejects nonmatches", () => {
    expect(fuzzyScore("nt", "note.md")).toBeGreaterThan(-1);
    expect(fuzzyScore("xyz", "note.md")).toBe(-1);
    expect(fuzzyScore("note", "note.md")).toBeGreaterThan(
      fuzzyScore("note", "north-test.md"),
    );
  });
});

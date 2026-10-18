// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
vi.mock("./api", () => ({
  assetUrl: (p: string) => `/local-image?path=${encodeURIComponent(p)}`,
}));
import { renderDocument } from "./render";
describe("safe document rendering", () => {
  it("renders math, footnotes, inline extensions and emoji", async () => {
    const view = await renderDocument(
      "# Note\n\n==mark== H~2~O x^2^ :smile: $x^2$\n\nText[^n].\n\n[^n]: Footnote\n",
      null,
    );
    expect(view.querySelector("mark")?.textContent).toBe("mark");
    expect(view.querySelector("sub")?.textContent).toBe("2");
    expect(view.querySelector("sup")?.textContent).toBe("2");
    expect(view.querySelector(".katex")).not.toBeNull();
    expect(view.textContent).toContain("😄");
    expect(view.querySelector(".footnotes")?.textContent).toContain("Footnote");
  });
  it("removes active HTML and maps relative assets", async () => {
    const view = await renderDocument(
      '<script>alert(1)</script>\n\n<img src="../assets/a.png" onerror="alert(1)">\n\n[bad](javascript:alert(1))',
      "notes/a.md",
    );
    expect(view.querySelector("script")).toBeNull();
    expect(view.querySelector("img")?.getAttribute("onerror")).toBeNull();
    expect(view.querySelector("img")?.getAttribute("src")).toBe(
      "/local-image?path=assets%2Fa.png",
    );
    expect(
      [...view.querySelectorAll("a")].every(
        (a) => !a.href.startsWith("javascript:"),
      ),
    ).toBe(true);
  });
  it("does not preserve remote image or iframe sources", async () => {
    const view = await renderDocument(
      '![remote](https://example.invalid/image.png)\n\n<iframe src="https://example.invalid"></iframe>',
      null,
    );
    expect(view.querySelector("img")?.getAttribute("src")).toBeNull();
    expect(view.querySelector("iframe")).toBeNull();
  });
  it("builds a clickable table of contents", async () => {
    const view = await renderDocument("[TOC]\n\n# Heading\n\n## Other", null);
    expect(view.querySelector(".document-toc a")?.getAttribute("href")).toBe(
      "#heading",
    );
    expect(view.querySelector("h1")?.id).toBe("heading");
  });
});

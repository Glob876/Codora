import { escapeHtml } from "./escape";
import { marked } from "marked";
import markedFootnote from "marked-footnote";
import markedAlert from "marked-alert";
import { find as findEmoji } from "node-emoji";
import hljs from "highlight.js/lib/common";
import DOMPurify from "dompurify";
import katex from "katex";
import { assetUrl } from "./api";
import { headings, safeRelativeAsset } from "./model";
import "katex/dist/katex.min.css";

marked.use(markedFootnote(), markedAlert());
marked.use({
  gfm: true,
  breaks: false,
  extensions: [
    {
      name: "emoji",
      level: "inline",
      start: (src) => src.indexOf(":"),
      tokenizer(src) {
        const m = /^:([a-zA-Z0-9_+\-]+):/.exec(src);
        if (m) {
          const emoji = findEmoji(m[1]);
          if (emoji) return { type: "emoji", raw: m[0], text: emoji.emoji };
        }
      },
      renderer(token) {
        return token.text;
      },
    },
    {
      name: "blockMath",
      level: "block",
      start: (src) => src.indexOf("$$"),
      tokenizer(src) {
        const m = /^\$\$\s*\n([\s\S]*?)\n\$\$(?:\n|$)/.exec(src);
        if (m) return { type: "blockMath", raw: m[0], text: m[1] };
      },
      renderer(token) {
        return katex.renderToString(token.text, {
          displayMode: true,
          throwOnError: false,
          trust: false,
        });
      },
    },
    {
      name: "inlineMath",
      level: "inline",
      start: (src) => src.indexOf("$"),
      tokenizer(src) {
        const m = /^\$([^$\n]+)\$/.exec(src);
        if (m) return { type: "inlineMath", raw: m[0], text: m[1] };
      },
      renderer(token) {
        return katex.renderToString(token.text, {
          throwOnError: false,
          trust: false,
        });
      },
    },
    ...(
      [
        { name: "highlight", re: /^==([^=\n]+)==/, tag: "mark" },
        { name: "superscript", re: /^\^([^\s^]+)\^/, tag: "sup" },
        { name: "subscript", re: /^~([^\s~]+)~(?!~)/, tag: "sub" },
      ] as const
    ).map(({ name, re, tag }) => ({
      name,
      level: "inline" as const,
      start: (src: string) =>
        src.indexOf(tag === "mark" ? "==" : tag === "sup" ? "^" : "~"),
      tokenizer(src: string) {
        const m = re.exec(src);
        if (m) return { type: name, raw: m[0], text: m[1] };
      },
      renderer(token: any) {
        return `<${tag}>${escapeHtml(token.text)}</${tag}>`;
      },
    })),
  ],
});
let diagramId = 0;
export async function diagram(source: string): Promise<HTMLElement> {
  const element = document.createElement("div");
  element.className = "diagram";
  try {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme:
        document.documentElement.dataset.theme === "night" ? "dark" : "neutral",
      fontFamily: "system-ui",
      suppressErrorRendering: true,
      htmlLabels: false,
      flowchart: { htmlLabels: false },
    });
    const { svg } = await mermaid.render(
      `codora-diagram-${++diagramId}`,
      source,
    );
    element.innerHTML = DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
  } catch (e) {
    element.className = "diagram-error";
    element.textContent = `Ошибка диаграммы: ${e instanceof Error ? e.message : e}`;
  }
  return element;
}
export async function renderDocument(
  source: string,
  documentPath: string | null,
): Promise<HTMLElement> {
  const container = document.createElement("article");
  container.className = "prose";
  const text = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  // Active HTML, remote frames and automatic remote requests are deliberately excluded.
  container.innerHTML = DOMPurify.sanitize(await marked.parse(text), {
    ADD_TAGS: [
      "annotation",
      "semantics",
      "math",
      "mi",
      "mn",
      "mo",
      "msup",
      "mfrac",
      "mrow",
      "mtable",
      "mtr",
      "mtd",
    ],
    FORBID_TAGS: [
      "iframe",
      "script",
      "style",
      "video",
      "audio",
      "object",
      "embed",
      "form",
    ],
    FORBID_ATTR: ["srcset"],
  });
  container.querySelectorAll("img").forEach((img) => {
    const original = img.getAttribute("src") || "";
    const relative = safeRelativeAsset(documentPath, original);
    if (relative === null) {
      img.removeAttribute("src");
      img.alt = `[Внешнее изображение: ${img.alt || original}]`;
    } else {
      img.src = relative.startsWith("data:") ? relative : assetUrl(relative);
    }
  });
  container.querySelectorAll<HTMLElement>("pre > code").forEach((code) => {
    const lang = [...code.classList]
      .find((c) => c.startsWith("language-"))
      ?.slice(9);
    if (lang && lang !== "mermaid" && hljs.getLanguage(lang))
      code.innerHTML = hljs.highlight(code.textContent || "", {
        language: lang,
        ignoreIllegals: true,
      }).value;
  });
  const hs = headings(text);
  container.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((node, i) => {
    node.id = hs[i]?.slug || `heading-${i}`;
  });
  const tocParagraphs = [...container.querySelectorAll("p")].filter((p) =>
    /^\[toc\]$/i.test(p.textContent || ""),
  );
  for (const p of tocParagraphs) {
    const nav = document.createElement("nav");
    nav.className = "document-toc";
    for (const h of hs) {
      const a = document.createElement("a");
      a.href = `#${h.slug}`;
      a.textContent = h.title;
      a.style.paddingLeft = `${(h.level - 1) * 16}px`;
      nav.append(a);
    }
    p.replaceWith(nav);
  }
  for (const node of container.querySelectorAll("code.language-mermaid")) {
    node.parentElement?.replaceWith(await diagram(node.textContent || ""));
  }
  container.querySelectorAll("a").forEach((a) => {
    if (!a.getAttribute("href")?.startsWith("#")) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  });
  return container;
}

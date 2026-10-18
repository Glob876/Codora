export interface Heading {
  level: number;
  title: string;
  line: number;
  slug: string;
}
export function headings(markdown: string): Heading[] {
  const lines = markdown.split("\n");
  const result: Heading[] = [];
  let fence = "";
  const slugs = new Map<string, number>();
  lines.forEach((line, i) => {
    const f = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (f) {
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = "";
      return;
    }
    if (fence) return;
    let m = line.match(/^ {0,3}(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/);
    let level = m?.[1].length;
    let title = m?.[2];
    if (!m && i > 0 && /^ {0,3}(=+|-+)\s*$/.test(line) && lines[i - 1].trim()) {
      level = line.trim()[0] === "=" ? 1 : 2;
      title = lines[i - 1].trim();
    }
    if (level && title) {
      title = title.replace(/[*_`]/g, "");
      const base = title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s_-]/gu, "")
        .replace(/\s+/g, "-");
      const n = slugs.get(base) || 0;
      slugs.set(base, n + 1);
      result.push({
        level,
        title,
        line: m ? i : i - 1,
        slug: n ? `${base}-${n}` : base,
      });
    }
  });
  return result;
}
export function statistics(text: string) {
  const content = text.replace(/^---\n[\s\S]*?\n---\n/, "");
  const words =
    content.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length || 0;
  return {
    words,
    characters: [...text].length,
    lines: text.split("\n").length,
    minutes: Math.max(1, Math.ceil(words / 220)),
  };
}
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLocaleLowerCase(),
    t = target.toLocaleLowerCase();
  let i = 0,
    score = 0,
    last = -2;
  for (let n = 0; n < t.length && i < q.length; n++)
    if (t[n] === q[i]) {
      score += 10 + (n === last + 1 ? 6 : 0) - n / 100;
      last = n;
      i++;
    }
  return i === q.length ? score : -1;
}
export function richCompatibility(text: string): string | null {
  // Unsupported constructs stay in the lossless source editor. They are never parsed then silently discarded.
  if (/^---\r?\n/.test(text)) return "YAML-метаданные";
  if (/^\s*\[\^[^\]]+\]:/m.test(text)) return "сноски";
  if (/^ {0,3}\[[^\]\n]+\]:[ \t]*(?:\r?\n[ \t]*)?\S/m.test(text))
    return "ссылочные определения";
  if (/<\/?[a-z][\s\S]*?>/i.test(text)) return "HTML";
  if (/^\s*\[(?:toc)\]\s*$/im.test(text)) return "встроенное оглавление";
  if (/==\S[^\n]*?==|(?<!\$)\^[^\s^]+\^|(?<!~)~[^\s~]+~(?!~)/.test(text))
    return "расширенное оформление";
  if (/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/im.test(text))
    return "уведомления";
  return null;
}
export function safeRelativeAsset(
  documentPath: string | null,
  url: string,
): string | null {
  if (/^(data:image\/(png|jpeg|gif|webp|avif);base64,)/i.test(url)) return url;
  if (/^[a-z][\w+.-]*:|^\/\//i.test(url)) return null;
  const parts = documentPath?.split("/").slice(0, -1) || [];
  let decoded: string;
  try {
    decoded = decodeURIComponent(url.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  if (decoded.startsWith("/")) parts.length = 0;
  for (const part of decoded.split("/")) {
    if (part === "..") {
      if (!parts.length) return null;
      parts.pop();
    } else if (part !== "." && part) parts.push(part);
  }
  return parts.join("/");
}
export function toc(text: string): string {
  return headings(text)
    .map((h) => `${"  ".repeat(h.level - 1)}- [${h.title}](#${h.slug})`)
    .join("\n");
}

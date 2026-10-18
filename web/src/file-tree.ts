export interface TreeEntry {
  path: string;
  name: string;
  directory: boolean;
  modified: number;
}
/** Build depth-first sibling-sorted rows; filtered matches retain their ancestry. */
export function treeRows<T extends TreeEntry>(
  entries: T[],
  collapsed: Set<string>,
  sort: "name" | "modified",
  filter = "",
): T[] {
  const children = new Map<string, T[]>();
  const visible = new Set<string>();
  const query = filter.trim().toLocaleLowerCase();
  for (const entry of entries) {
    const parent = entry.path.split("/").slice(0, -1).join("/");
    const siblings = children.get(parent) || [];
    siblings.push(entry);
    children.set(parent, siblings);
    if (!query || entry.path.toLocaleLowerCase().includes(query)) {
      const parts = entry.path.split("/");
      for (let i = 1; i <= parts.length; i++)
        visible.add(parts.slice(0, i).join("/"));
    }
  }
  const result: T[] = [];
  const visit = (parent: string) => {
    const siblings = children.get(parent) || [];
    siblings.sort(
      (a, b) =>
        Number(b.directory) - Number(a.directory) ||
        (sort === "modified" ? b.modified - a.modified : 0) ||
        a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    for (const entry of siblings) {
      if (!visible.has(entry.path)) continue;
      result.push(entry);
      if (entry.directory && !collapsed.has(entry.path)) visit(entry.path);
    }
  };
  visit("");
  return result;
}

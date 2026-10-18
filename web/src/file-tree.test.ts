import { expect, it } from "vitest";
import { treeRows } from "./file-tree";
const entries = [
  "z.md",
  "a",
  "b",
  "a/child",
  "b/other.md",
  "a/file.md",
  "a/child/deep.md",
].map((path) => ({
  path,
  name: path.split("/").pop()!,
  directory: !path.endsWith(".md"),
  modified: path.length,
}));
it("keeps files directly under their own parent and collapses all descendants", () => {
  expect(treeRows(entries, new Set(), "name").map((e) => e.path)).toEqual([
    "a",
    "a/child",
    "a/child/deep.md",
    "a/file.md",
    "b",
    "b/other.md",
    "z.md",
  ]);
  expect(treeRows(entries, new Set(["a"]), "name").map((e) => e.path)).toEqual([
    "a",
    "b",
    "b/other.md",
    "z.md",
  ]);
});
it("sorts siblings by modification while retaining nesting and filtered ancestors", () => {
  const rows = treeRows(entries, new Set(), "modified", "deep").map(
    (e) => e.path,
  );
  expect(rows).toEqual(["a", "a/child", "a/child/deep.md"]);
  expect(
    treeRows(entries, new Set(["a"]), "modified", "deep").map((e) => e.path),
  ).toEqual(["a"]);
});

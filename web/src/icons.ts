import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Settings,
  Trash2,
  PanelLeft,
  Command,
  Heading,
  Bold,
  Italic,
  Strikethrough,
  Link,
  Image,
  Table,
  Code,
  Sigma,
  List,
  ListTodo,
  Quote,
  Focus,
  Download,
  SpellCheck,
  ArrowDownUp,
  RefreshCw,
  Palette,
  Pencil,
  SlidersHorizontal,
  Minus,
  Square,
  type IconNode,
} from "lucide";
import { escapeHtml } from "./escape";
const icons: Record<string, IconNode> = {
  folder: Folder,
  "folder-open": FolderOpen,
  file: FileText,
  right: ChevronRight,
  down: ChevronDown,
  plus: Plus,
  close: X,
  settings: Settings,
  trash: Trash2,
  sidebar: PanelLeft,
  command: Command,
  heading: Heading,
  bold: Bold,
  italic: Italic,
  strike: Strikethrough,
  link: Link,
  image: Image,
  table: Table,
  code: Code,
  math: Sigma,
  bullet: List,
  task: ListTodo,
  quote: Quote,
  focus: Focus,
  export: Download,
  spellcheck: SpellCheck,
  sort: ArrowDownUp,
  refresh: RefreshCw,
  palette: Palette,
  pencil: Pencil,
  sliders: SlidersHorizontal,
  minimize: Minus,
  maximize: Square,
};
/** Lucide's pinned SVG nodes, bundled locally, decorative and never focusable. */
export function icon(name: string): string {
  const nodes = icons[name];
  if (!nodes) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="ui-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${nodes
    .map(
      ([tag, attrs]) =>
        `<${tag} ${Object.entries(attrs)
          .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
          .join(" ")}/>`,
    )
    .join("")}</svg>`;
}

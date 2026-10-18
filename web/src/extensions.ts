/** Compile-time extension API. Documents cannot install or execute extensions. */
export interface EditorExtensionContext {
  getMarkdown(): string;
  setMarkdown(markdown: string): Promise<void>;
  insertMarkdown(markdown: string): Promise<void>;
  notify(message: string): void;
}
export interface EditorExtension {
  id: string;
  commands?: {
    id: string;
    label: string;
    run(context: EditorExtensionContext): void | Promise<void>;
  }[];
  onDocumentChange?: (markdown: string) => void;
}
/** Import and append your own extensions here. No dynamic network loading. */
export const extensions: EditorExtension[] = [];

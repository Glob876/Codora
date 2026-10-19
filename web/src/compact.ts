/** Session-only presentation state; documents and editor instances stay untouched. */
export class CompactMode {
  active = false;
  constructor(private body: HTMLElement) {}

  setActive(active: boolean) {
    this.active = active;
    this.body.classList.toggle("compact-mode", active);
    this.showMenu(false);
  }

  updateEmpty(content: string) {
    this.body.classList.toggle("compact-empty", content.length === 0);
  }

  showMenu(visible: boolean) {
    this.body.classList.toggle("compact-menu-visible", this.active && visible);
    const bar = this.body.querySelector<HTMLElement>(".menubar");
    if (bar) bar.inert = this.active && !visible;
  }

  handleKey(event: KeyboardEvent): boolean {
    if (!this.active || event.ctrlKey || event.metaKey || event.shiftKey)
      return false;
    if (event.key === "Alt" && !event.repeat) {
      event.preventDefault();
      this.showMenu(!this.body.classList.contains("compact-menu-visible"));
      return true;
    }
    if (event.key === "Escape") {
      this.showMenu(false);
      return true;
    }
    return false;
  }
}

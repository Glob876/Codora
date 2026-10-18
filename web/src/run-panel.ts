import { api } from "./api";
import { tr } from "./i18n";
export interface RunReport {
  id: string;
  path: string;
  stdout: string;
  stderr: string;
  finished: boolean;
  exit_code: number | null;
  stopped: boolean;
  truncated: boolean;
}
export function isPython(path: string): boolean {
  return /\.py$/i.test(path);
}
export class RunPanel {
  private report: RunReport | null = null;
  private starting = false;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(
    private element: HTMLElement,
    private onChange: () => void,
    private request: typeof api = api,
  ) {
    this.button("#stop-run").onclick = () => {
      void this.control().catch((error) => this.error(error));
    };
    this.button("#close-run").onclick = () => {
      this.element.hidden = true;
    };
    this.element.querySelector<HTMLFormElement>("#run-input-form")!.onsubmit = (
      event,
    ) => {
      event.preventDefault();
      const field = this.element.querySelector<HTMLInputElement>("#run-input")!;
      void this.control(field.value)
        .then(() => {
          field.value = "";
        })
        .catch((error) => this.error(error));
    };
  }
  get busy() {
    return this.starting || (!!this.report && !this.report.finished);
  }
  private button(selector: string) {
    return this.element.querySelector<HTMLButtonElement>(selector)!;
  }
  private text(selector: string, text: string) {
    this.element.querySelector(selector)!.textContent = text;
  }
  show() {
    this.element.hidden = false;
  }
  async start(path: string, revision: string) {
    if (this.busy) {
      this.show();
      return;
    }
    this.show();
    this.starting = true;
    this.report = null;
    this.text("#run-path", path);
    this.text("#run-stdout", "");
    this.text("#run-stderr", "");
    this.text("#run-status", tr("Запуск…"));
    this.onChange();
    try {
      this.report = await this.request<RunReport>("run", {
        path,
        expected_revision: revision,
      });
      this.render();
      if (!this.report.finished) this.schedule();
    } catch (error) {
      this.error(error);
      throw error;
    } finally {
      this.starting = false;
      this.onChange();
    }
  }
  private schedule() {
    this.timer = setTimeout(() => {
      void this.poll();
    }, 350);
  }
  private async poll() {
    if (!this.report || this.report.finished) return;
    try {
      this.report = await this.request<RunReport>(
        `run?id=${encodeURIComponent(this.report.id)}`,
      );
      this.render();
    } catch (error) {
      this.error(error);
    }
    if (!this.report?.finished) this.schedule();
  }
  private render() {
    const report = this.report!;
    const box = this.element.querySelector<HTMLElement>(".run-output")!;
    const bottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 20;
    this.text("#run-path", report.path);
    this.text("#run-stdout", report.stdout);
    this.text("#run-stderr", report.stderr);
    this.text(
      "#run-status",
      !report.finished
        ? tr("Выполняется…")
        : report.stopped
          ? tr("Остановлено")
          : `${tr("Код выхода")}: ${report.exit_code ?? "—"}`,
    );
    this.element.querySelector<HTMLElement>("#run-truncated")!.hidden =
      !report.truncated;
    this.button("#stop-run").disabled = report.finished;
    this.button("#send-run-input").disabled = report.finished;
    this.element.querySelector<HTMLInputElement>("#run-input")!.disabled =
      report.finished;
    if (bottom) box.scrollTop = box.scrollHeight;
    this.onChange();
  }
  private async control(input?: string) {
    if (!this.report || this.report.finished) return;
    await this.request("run/control", {
      id: this.report.id,
      ...(input !== undefined ? { input } : {}),
    });
  }
  private error(error: unknown) {
    this.text(
      "#run-status",
      error instanceof Error ? error.message : String(error),
    );
  }
  dispose() {
    clearTimeout(this.timer);
  }
}

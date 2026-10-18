// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { api } from "./api";
import { appMarkup } from "./shell";
import { isPython, RunPanel, type RunReport } from "./run-panel";
const base: RunReport = {
  id: "run-id",
  path: "hello.py",
  stdout: "",
  stderr: "",
  finished: false,
  exit_code: null,
  stopped: false,
  truncated: false,
};
afterEach(() => vi.useRealTimers());
it("renders process output as text, polls exit status and stops polling after completion", async () => {
  vi.useFakeTimers();
  document.body.innerHTML = appMarkup;
  const request = vi
    .fn<typeof api>()
    .mockResolvedValueOnce(base)
    .mockResolvedValueOnce({
      ...base,
      stdout: "<img src=x onerror=alert(1)>",
      stderr: "RuntimeError",
      finished: true,
      exit_code: 1,
    });
  const panel = new RunPanel(
    document.querySelector("#run-panel")!,
    vi.fn(),
    request as typeof api,
  );
  await panel.start("hello.py", "revision");
  expect(panel.busy).toBe(true);
  expect(request).toHaveBeenCalledWith("run", {
    path: "hello.py",
    expected_revision: "revision",
  });
  await vi.advanceTimersByTimeAsync(350);
  expect(document.querySelector("#run-stdout")!.textContent).toContain("<img");
  expect(document.querySelector("#run-stdout img")).toBeNull();
  expect(document.querySelector("#run-stderr")!.textContent).toBe(
    "RuntimeError",
  );
  expect(document.querySelector("#run-status")!.textContent).toContain("1");
  expect(panel.busy).toBe(false);
  await vi.advanceTimersByTimeAsync(2000);
  expect(request).toHaveBeenCalledTimes(2);
  panel.dispose();
});
it("sends stdin and Stop to the same run while hiding the panel leaves it running", async () => {
  vi.useFakeTimers();
  document.body.innerHTML = appMarkup;
  const request = vi.fn<typeof api>().mockResolvedValue(base);
  const panel = new RunPanel(
    document.querySelector("#run-panel")!,
    vi.fn(),
    request as typeof api,
  );
  await panel.start("hello.py", "revision");
  document.querySelector<HTMLInputElement>("#run-input")!.value = "Привет";
  document
    .querySelector("#run-input-form")!
    .dispatchEvent(new Event("submit", { cancelable: true }));
  await Promise.resolve();
  expect(request).toHaveBeenLastCalledWith("run/control", {
    id: "run-id",
    input: "Привет",
  });
  document.querySelector<HTMLButtonElement>("#close-run")!.click();
  expect(panel.busy).toBe(true);
  expect(document.querySelector<HTMLElement>("#run-panel")!.hidden).toBe(true);
  panel.show();
  document.querySelector<HTMLButtonElement>("#stop-run")!.click();
  expect(request).toHaveBeenLastCalledWith("run/control", { id: "run-id" });
  panel.dispose();
});
it("surfaces launch failures and enables another attempt", async () => {
  document.body.innerHTML = appMarkup;
  const request = vi
    .fn<typeof api>()
    .mockRejectedValue(new Error("Python не найден"));
  const panel = new RunPanel(
    document.querySelector("#run-panel")!,
    vi.fn(),
    request as typeof api,
  );
  await expect(panel.start("hello.py", "revision")).rejects.toThrow(
    "Python не найден",
  );
  expect(panel.busy).toBe(false);
  expect(document.querySelector("#run-status")!.textContent).toBe(
    "Python не найден",
  );
  expect(isPython("hello.PY")).toBe(true);
  expect(isPython("hello.py.txt")).toBe(false);
});

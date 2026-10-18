const { spawn } = require("node:child_process");
const { createInterface } = require("node:readline");

function parseHandshake(line) {
  const { url } = JSON.parse(line);
  const parsed = new URL(url);
  if (
    parsed.protocol !== "http:" ||
    parsed.hostname !== "127.0.0.1" ||
    !parsed.port ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    !/^#[0-9a-f]{64}$/.test(parsed.hash)
  ) {
    throw new Error("Некорректный адрес локального ядра");
  }
  return url;
}

function startBackend(binary, args, options = {}) {
  const child = spawn(binary, [...args, "--desktop"], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
    ...options,
  });
  // Never forward the capability URL or workspace/document details to logs.
  child.stderr.resume();
  child.stdin.on("error", () => {});
  let stopping = false;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  const ready = new Promise((resolve, reject) => {
    const lines = createInterface({ input: child.stdout });
    const timer = setTimeout(
      () => fail(new Error("Локальное ядро не ответило за 15 секунд")),
      15000,
    );
    function fail(error) {
      clearTimeout(timer);
      lines.close();
      reject(error);
    }
    child.once("error", () =>
      fail(
        new Error("Не удалось запустить файловое ядро. Пересоберите Typoha."),
      ),
    );
    child.once("exit", () =>
      fail(
        new Error(
          "Файловое ядро завершилось до открытия редактора. Проверьте путь и права доступа.",
        ),
      ),
    );
    lines.once("line", (line) => {
      try {
        const url = parseHandshake(line);
        clearTimeout(timer);
        lines.close();
        resolve(url);
      } catch {
        fail(new Error("Некорректный ответ файлового ядра"));
      }
    });
  });
  async function stop() {
    if (stopping || child.exitCode !== null || !child.pid) return;
    stopping = true;
    child.stdin.end(); // EOF also terminates the server if the shell crashes.
    const timer = setTimeout(() => child.kill("SIGKILL"), 4000);
    await exited;
    clearTimeout(timer);
  }
  return {
    child,
    ready,
    stop,
    get stopping() {
      return stopping;
    },
  };
}

function externalUrl(value) {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:", "mailto:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}
module.exports = { parseHandshake, startBackend, externalUrl };

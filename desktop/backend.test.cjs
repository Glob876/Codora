const { test } = require("node:test");
const assert = require("node:assert/strict");
const { startBackend, parseHandshake, externalUrl } = require("./backend.cjs");
const url = `http://127.0.0.1:4321/#${"a".repeat(64)}`;
test("handshake accepts only loopback capability URLs", () => {
  assert.equal(parseHandshake(JSON.stringify({ url })), url);
  for (const bad of [
    "https://example.org/#secret",
    "http://127.0.0.1:4321/",
    url.replace("127.0.0.1", "localhost"),
    url.replace("/#", "/file#"),
    url.replace("/#", "/?token=secret#"),
    url.replace("127.0.0.1", "user@127.0.0.1"),
  ]) {
    assert.throws(() => parseHandshake(JSON.stringify({ url: bad })));
  }
});
test("external links cannot open files, scripts or local capability endpoints", () => {
  for (const bad of [
    "file:///tmp/note",
    "javascript:alert(1)",
    url,
    "http://localhost:4321",
    "http://[::1]:4321",
    "https://user:pass@example.org",
  ])
    assert.equal(externalUrl(bad), false);
  for (const good of ["https://example.org/a", "mailto:test@example.org"])
    assert.equal(externalUrl(good), true);
});
test("server lifetime follows its desktop pipe", async () => {
  const script = `console.log(${JSON.stringify(JSON.stringify({ url }))}); process.stdin.resume(); process.stdin.on('end', () => process.exit(0));`;
  const backend = startBackend(process.execPath, ["-e", script, "--"]);
  assert.equal(await backend.ready, url);
  await backend.stop();
  assert.equal(backend.child.exitCode, 0);
});
test("startup failures are visible and do not disclose server output", async () => {
  const backend = startBackend(process.execPath, [
    "-e",
    "console.log('private workspace text'); process.stdin.resume()",
    "--",
  ]);
  await assert.rejects(backend.ready, {
    message: "Некорректный ответ файлового ядра",
  });
  await backend.stop();
});
test("missing executable produces a usable startup error", async () => {
  const backend = startBackend("/nonexistent/typoha-core", []);
  await assert.rejects(backend.ready, /Пересоберите Typoha/);
  await backend.stop();
});

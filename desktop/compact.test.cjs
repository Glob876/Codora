const { test } = require("node:test");
const assert = require("node:assert/strict");
const { compactController } = require("./compact.cjs");
function mockWindow(maximized = false, fullscreen = false) {
  return {
    bounds: { x: 40, y: 50, width: 1280, height: 860 },
    minimum: [760, 540],
    maximized,
    fullscreen,
    getNormalBounds() {
      return { ...this.bounds };
    },
    getMinimumSize() {
      return [...this.minimum];
    },
    isMaximized() {
      return this.maximized;
    },
    isFullScreen() {
      return this.fullscreen;
    },
    setFullScreen(value) {
      this.fullscreen = value;
    },
    unmaximize() {
      this.maximized = false;
    },
    maximize() {
      this.maximized = true;
    },
    setMinimumSize(...size) {
      this.minimum = size;
    },
    setSize(width, height) {
      Object.assign(this.bounds, { width, height });
    },
    setBounds(bounds) {
      this.bounds = bounds;
    },
    setMenuBarVisibility(value) {
      this.menuVisible = value;
    },
  };
}
for (const maximized of [false, true])
  test(`restores geometry and maximized=${maximized}`, () => {
    const window = mockWindow(maximized);
    const setCompact = compactController(window);
    setCompact(true);
    assert.deepEqual(window.minimum, [320, 240]);
    assert.equal(window.bounds.width, 480);
    assert.equal(window.bounds.height, 360);
    assert.equal(window.maximized, false);
    setCompact(true); // Repeated IPC must not overwrite original geometry.
    setCompact(false);
    assert.deepEqual(window.bounds, { x: 40, y: 50, width: 1280, height: 860 });
    assert.deepEqual(window.minimum, [760, 540]);
    assert.equal(window.maximized, maximized);
    assert.equal(window.menuVisible, false);
  });
test("restores fullscreen and rejects untyped IPC values", () => {
  const window = mockWindow(false, true);
  const setCompact = compactController(window);
  assert.throws(() => setCompact("true"));
  setCompact(true);
  assert.equal(window.fullscreen, false);
  setCompact(false);
  assert.equal(window.fullscreen, true);
});

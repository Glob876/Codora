// Keep native window geometry separate from IPC authentication.
function compactController(window) {
  let previous = null;
  return (active) => {
    if (typeof active !== "boolean") throw new Error("Invalid compact mode");
    if (active === Boolean(previous)) return;
    if (active) {
      previous = {
        bounds: window.getNormalBounds(),
        maximized: window.isMaximized(),
        fullscreen: window.isFullScreen(),
        minimum: window.getMinimumSize(),
      };
      if (previous.fullscreen) window.setFullScreen(false);
      if (previous.maximized) window.unmaximize();
      window.setMinimumSize(320, 240);
      window.setSize(480, 360, true);
    } else {
      const saved = previous;
      window.setMinimumSize(...saved.minimum);
      window.setBounds(saved.bounds, true);
      if (saved.maximized) window.maximize();
      if (saved.fullscreen) window.setFullScreen(true);
      previous = null;
    }
    window.setMenuBarVisibility(false);
  };
}
module.exports = { compactController };

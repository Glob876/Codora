export function surfaceOpacity(value: number) {
  const background = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 100;
  return { background, panel: Math.min(100, background + 4) };
}

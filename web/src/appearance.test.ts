import { expect, it } from "vitest";
import { surfaceOpacity } from "./appearance";
it("keeps panels four points more opaque and clamps invalid preferences", () => {
  expect(surfaceOpacity(80)).toEqual({ background: 80, panel: 84 });
  expect(surfaceOpacity(99)).toEqual({ background: 99, panel: 100 });
  expect(surfaceOpacity(0)).toEqual({ background: 0, panel: 4 });
  expect(surfaceOpacity(NaN)).toEqual({ background: 100, panel: 100 });
});

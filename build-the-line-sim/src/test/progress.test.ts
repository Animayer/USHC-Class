import { describe, expect, it } from "vitest";
import { createHomestead } from "../lib/homestead";
import { EMPTY_PROGRESS, STORAGE_KEY, finishedRailroads, sanitizeProgress } from "../lib/progress";
import { createRailroad } from "../lib/railroad";

describe("progress storage", () => {
  it("drops broken saves and keeps a real claim", () => {
    expect(sanitizeProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(sanitizeProgress({ homestead: { distanceMiles: 3 } }).homestead).toBeNull();
    const saved = sanitizeProgress({ homestead: createHomestead(30), reflections: { q1: "rail" } });
    expect(saved.homestead?.distanceMiles).toBe(30);
    expect(saved.reflections.q1).toBe("rail");
    expect(STORAGE_KEY).toBe("bchs-ushc-build-the-line-v1");
  });

  it("shows both Round 2 paths when the student finishes each one", () => {
    const pacific = { ...createRailroad("pacific", 0.2), done: true, tookInsider: false as const };
    const hill = { ...createRailroad("hill", 0.2), done: true };
    const both = sanitizeProgress({ completedLines: { pacific, hill }, railroad: null });
    expect(finishedRailroads(both).map((line) => line.path)).toEqual(["pacific", "hill"]);

    const pacificOnly = sanitizeProgress({ railroad: pacific });
    expect(finishedRailroads(pacificOnly).map((line) => line.path)).toEqual(["pacific"]);

    const kept = sanitizeProgress({ completedLines: { pacific, hill }, railroad: hill });
    expect(finishedRailroads(kept).map((line) => line.path)).toEqual(["pacific", "hill"]);
  });
});

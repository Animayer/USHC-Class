import { describe, expect, it } from "vitest";
import { createHomestead } from "../lib/homestead";
import { EMPTY_PROGRESS, STORAGE_KEY, sanitizeProgress } from "../lib/progress";

describe("progress storage", () => {
  it("drops broken saves and keeps a real claim", () => {
    expect(sanitizeProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(sanitizeProgress({ homestead: { distanceMiles: 3 } }).homestead).toBeNull();
    const saved = sanitizeProgress({ homestead: createHomestead(30), reflections: { q1: "rail" } });
    expect(saved.homestead?.distanceMiles).toBe(30);
    expect(saved.reflections.q1).toBe("rail");
    expect(STORAGE_KEY).toBe("bchs-ushc-build-the-line-v1");
  });
});

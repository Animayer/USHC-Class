import { describe, expect, it } from "vitest";
import { TIMELINE, TIMELINE_FACTS } from "../lib/timeline";

describe("timeline constants", () => {
  it("locks the packet dates", () => {
    expect(TIMELINE.homesteadAct).toBe("May 20, 1862");
    expect(TIMELINE.pacificRailwayAct).toBe("July 1, 1862");
    expect(TIMELINE.landGrantDoubled).toBe(1864);
    expect(TIMELINE.promontorySummit).toBe("May 10, 1869");
    expect(TIMELINE.creditMobilierExposed).toBe(1872);
    expect(TIMELINE.gliddenBarbedWire).toBe(1874);
    expect(TIMELINE.greatNorthernCompleted).toBe(1893);
    expect(TIMELINE.frontierLineGone).toBe(1890);
  });

  it("states the facts in the words the census and the statutes use", () => {
    expect(TIMELINE_FACTS).toEqual([
      "Homestead Act May 20, 1862",
      "Pacific Railway Act July 1, 1862 (grant doubled 1864)",
      "Promontory Summit May 10, 1869",
      "Credit Mobilier exposed 1872",
      "Glidden barbed wire 1874",
      "Great Northern completed 1893",
      "1890 census declared the frontier line gone",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import {
  BOND_DOLLARS_PER_MILE,
  NATIVE_LAND_EVENTS,
  SCANDAL_RISK_IF_INSIDER,
  acknowledgeRecord,
  applyHillSeason,
  applyNativeLandEvent,
  applyPacificSeason,
  closeRailroad,
  createRailroad,
  emptyBooks,
  insiderProfit,
  landGrantAcresPerMile,
  pacePlan,
  playPacificSeason,
  railroadDebrief,
  scandalExposed,
  scandalRisk,
  setInsiderContract,
  subsidyForMiles,
} from "../lib/railroad";

describe("railroad", () => {
  it("pays the statutory bond tiers per mile", () => {
    expect(BOND_DOLLARS_PER_MILE.flat).toBe(16_000);
    expect(BOND_DOLLARS_PER_MILE.foothills).toBe(32_000);
    expect(BOND_DOLLARS_PER_MILE.mountains).toBe(48_000);
    expect(subsidyForMiles("mountains", 10)).toBe(480_000);
    expect(subsidyForMiles("mountains", 10)).toBeGreaterThan(subsidyForMiles("foothills", 10));
    expect(subsidyForMiles("foothills", 10)).toBeGreaterThan(subsidyForMiles("flat", 10));
  });

  it("doubles the land grant in 1864", () => {
    expect(landGrantAcresPerMile(1864)).toBe(landGrantAcresPerMile(1862) * 2);
    expect(landGrantAcresPerMile(1862)).toBe(6400);
  });

  it("rewards speed with more subsidy and charges shoddy track later", () => {
    const fast = pacePlan("fast");
    const careful = pacePlan("careful");
    expect(subsidyForMiles("mountains", fast.miles)).toBeGreaterThan(subsidyForMiles("mountains", careful.miles));
    const fastBooks = closeRailroad(applyPacificSeason(emptyBooks(), "mountains", "fast", false));
    const carefulBooks = closeRailroad(applyPacificSeason(emptyBooks(), "mountains", "careful", false));
    expect(fastBooks.subsidyCash).toBeGreaterThan(carefulBooks.subsidyCash);
    expect(fastBooks.quality).toBeLessThan(carefulBooks.quality);
    expect(fastBooks.maintenance).toBeGreaterThan(carefulBooks.maintenance);
  });

  it("raises profit and scandal risk when the insider contract is taken", () => {
    const subsidy = subsidyForMiles("flat", 90);
    expect(insiderProfit(subsidy, true)).toBeGreaterThan(insiderProfit(subsidy, false));
    expect(scandalRisk(true)).toBe(SCANDAL_RISK_IF_INSIDER);
    expect(scandalRisk(false)).toBe(0);
    expect(scandalExposed(true, 0.1)).toBe(true);
    expect(scandalExposed(true, 0.99)).toBe(false);
    expect(scandalExposed(false, 0)).toBe(false);
    const signed = applyPacificSeason(emptyBooks(), "flat", "fast", true);
    const refused = applyPacificSeason(emptyBooks(), "flat", "fast", false);
    expect(signed.insiderProfit).toBeGreaterThan(refused.insiderProfit);
  });

  it("gives Hill traffic income and no subsidy", () => {
    const low = applyHillSeason(emptyBooks(), "low-grade");
    const steep = applyHillSeason(emptyBooks(), "steep");
    expect(low.subsidyCash).toBe(0);
    expect(steep.subsidyCash).toBe(0);
    expect(low.landGrantAcres).toBe(0);
    expect(low.trafficIncome).toBeGreaterThan(steep.trafficIncome);
    expect(low.quality).toBeGreaterThan(steep.quality);
  });

  it("does not let a Native land event move the books", () => {
    const books = applyPacificSeason(emptyBooks(), "foothills", "fast", true);
    expect(applyNativeLandEvent(books)).toEqual(books);
    const themes = [...NATIVE_LAND_EVENTS.pacific, ...NATIVE_LAND_EVENTS.hill].map((event) => event.body).join(" ");
    expect(themes).toMatch(/[Tt]reat/);
    expect(themes.toLowerCase()).toContain("plains wars");
    expect(themes.toLowerCase()).toContain("bison");
    expect(themes.toLowerCase()).toContain("reservation");
    let state = setInsiderContract(createRailroad("pacific", 0.5), false);
    const before = state.books;
    state = acknowledgeRecord(state);
    expect(state.books).toEqual(before);
    expect(state.seenEventIds).toContain("treaties");
    expect(() =>
      playPacificSeason(setInsiderContract(createRailroad("pacific", 0.2), false), "fast"),
    ).toThrow(/record/);
  });

  it("states both the subsidy case and the market case", () => {
    const pacific = railroadDebrief({ ...createRailroad("pacific", 0.1), tookInsider: true, done: true });
    const text = pacific.paragraphs.join(" ");
    expect(text).toContain("Credit Mobilier");
    expect(text).toMatch(/no traffic yet/);
    expect(text).toContain("California");
    expect(text).toMatch(/without that federal subsidy|without the subsidy|without a Pacific/);
    const hill = railroadDebrief({ ...createRailroad("hill", 0.1), done: true });
    expect(hill.paragraphs.join(" ")).toContain("1893");
    expect(hill.paragraphs.join(" ").toLowerCase()).toContain("crony");
  });
});

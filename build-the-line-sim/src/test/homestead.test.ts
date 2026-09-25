import { describe, expect, it } from "vitest";
import {
  GRASSHOPPER_YEAR,
  LOAN_AMOUNT,
  SEASON_YEARS,
  abandonClaim,
  accrueDebt,
  canProveUp,
  createHomestead,
  cropOutcome,
  drawWeather,
  fenceChoices,
  freightCost,
  homesteadDebrief,
  proveUp,
  resolveYear,
} from "../lib/homestead";

describe("homestead", () => {
  it("scales freight with distance", () => {
    const near = freightCost(8, 300);
    const mid = freightCost(30, 300);
    const far = freightCost(70, 300);
    expect(mid).toBeGreaterThan(near);
    expect(far).toBeGreaterThan(mid);
    expect(freightCost(70, 300)).toBeCloseTo(freightCost(35, 300) * 2, 0);
    expect(freightCost(0, 300)).toBe(0);
  });

  it("cuts yield in drought and cuts it again when grasshoppers hit in 1874", () => {
    const rain = cropOutcome({ crop: "wheat", weather: "rainfall", year: 1872, fence: "sod" });
    const dry = cropOutcome({ crop: "wheat", weather: "drought", year: 1872, fence: "sod" });
    const hoppers = cropOutcome({ crop: "wheat", weather: "rainfall", year: GRASSHOPPER_YEAR, fence: "sod" });
    expect(dry.bushels).toBeLessThan(rain.bushels);
    expect(hoppers.grasshoppers).toBe(true);
    expect(hoppers.bushels).toBeLessThan(rain.bushels);
    expect(rain.grasshoppers).toBe(false);
    const cornDry = cropOutcome({ crop: "corn", weather: "drought", year: 1872, fence: "none" });
    const cornRain = cropOutcome({ crop: "corn", weather: "rainfall", year: 1872, fence: "none" });
    expect(cornDry.bushels).toBeLessThan(cornRain.bushels);
  });

  it("withholds barbed wire until the Glidden patent year", () => {
    expect(fenceChoices(1873)).not.toContain("barbed");
    expect(fenceChoices(1874)).toContain("barbed");
    const state = createHomestead(8);
    expect(() => resolveYear(state, { crop: "wheat", fence: "barbed", borrow: false }, "rainfall")).toThrow(
      /not available/,
    );
  });

  it("compounds interest on borrowed money", () => {
    const once = accrueDebt(0, LOAN_AMOUNT);
    expect(once.debt).toBeGreaterThan(LOAN_AMOUNT);
    expect(once.interestCharged).toBeGreaterThan(0);
    const again = accrueDebt(once.debt, 0);
    expect(again.debt).toBeGreaterThan(once.debt);
  });

  it("requires five years of residency and improvements before prove-up", () => {
    let state = createHomestead(8);
    expect(canProveUp(state)).toBe(false);
    for (const year of SEASON_YEARS) {
      const weather = year === 1873 ? "drought" : "rainfall";
      state = resolveYear(state, { crop: "wheat", fence: year >= 1874 ? "barbed" : "sod", borrow: false }, weather);
    }
    expect(state.abandoned).toBe(false);
    expect(canProveUp(state)).toBe(true);
    expect(proveUp(state).provedUp).toBe(true);
    const left = abandonClaim(createHomestead(8));
    expect(canProveUp(left)).toBe(false);
  });

  it("explains the five-year rule and the 100th meridian", () => {
    const text = homesteadDebrief(proveUp({
      ...createHomestead(8),
      yearIndex: 5,
      hasHouse: true,
      acresCultivated: 150,
      log: SEASON_YEARS.map((year) => ({
        year,
        crop: "wheat" as const,
        fence: "sod" as const,
        borrow: false,
        weather: "rainfall" as const,
        grasshoppers: year === 1874,
        bushels: 100,
        revenue: 100,
        freight: 16,
        costs: 70,
        interestCharged: 0,
        cashAfter: 200,
        debtAfter: 0,
      })),
    })).paragraphs.join(" ");
    expect(text).toMatch(/five years/i);
    expect(text).toContain("100th meridian");
    expect(text).toContain("Enlarged Homestead Act");
  });

  it("draws the same weather from the same seed", () => {
    expect(drawWeather(42)).toEqual(drawWeather(42));
  });
});

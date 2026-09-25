import { describe, expect, it } from "vitest";
import { activeTeam, autoPlay, createGame } from "../logic/engine";
import { badges, scoreTeam, verdict } from "../logic/scoring";

describe("scoring", () => {
  it("scores an efficiency path as customer value and a privilege path as privilege", () => {
    const efficiency = activeTeam(autoPlay(createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 21 }), "efficiency"));
    const privilege = activeTeam(autoPlay(createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 21 }), "privilege"));
    const efficiencyScore = scoreTeam(efficiency);
    const privilegeScore = scoreTeam(privilege);
    expect(efficiencyScore.customer).toBeGreaterThan(privilegeScore.customer);
    expect(privilegeScore.privilege).toBeGreaterThan(efficiencyScore.privilege);
    expect(efficiencyScore.customer).toBeGreaterThanOrEqual(60);
    expect(privilegeScore.privilege).toBeGreaterThanOrEqual(60);
    expect(badges(efficiency)).toContain("Market Entrepreneur");
    expect(badges(privilege)).toContain("Political Entrepreneur");
  });

  it("names the lesson split in the verdict", () => {
    expect(verdict(80, 20).title.toLowerCase()).toContain("customers");
    expect(verdict(20, 80).title.toLowerCase()).toContain("privilege");
    expect(verdict(50, 48).text).toContain("DBQ");
  });
});

import { describe, expect, it } from "vitest";
import { cardById } from "../logic/cards";
import { acknowledge, activeTeam, autoPlay, createGame, currentYear, playCard, skipToEnd, yearsFor } from "../logic/engine";
import { shareSum } from "../logic/scoring";
import { deserialize, resultSlip, serialize } from "../logic/save";
import type { GameState } from "../logic/types";

function sumOk(state: GameState) {
  for (const team of state.teams) {
    expect(shareSum(team)).toBe(100);
    expect(team.price).toBeGreaterThanOrEqual(6);
    expect(team.price).toBeLessThanOrEqual(32);
  }
}

describe("rounds and deals", () => {
  it("starts a 10-round game in 1870 with a 26¢ gallon and shares that add to 100", () => {
    const state = createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 7 });
    expect(currentYear(state)).toBe(1870);
    expect(state.years).toEqual(yearsFor(10));
    expect(activeTeam(state).price).toBe(26);
    expect(activeTeam(state).share).toBe(14);
    expect(shareSum(activeTeam(state))).toBe(100);
    expect(activeTeam(state).hand).toHaveLength(3);
    expect(state.phase).toBe("choose");
  });

  it("uses six historical beats for the short game", () => {
    expect(yearsFor(6)).toEqual([1870, 1872, 1874, 1882, 1886, 1890]);
    const state = createGame({ mode: "teams", names: ["Red", "Blue"], rounds: 6, seed: 3 });
    expect(state.teams).toHaveLength(2);
    expect(state.years).toHaveLength(6);
  });

  it("deals both an efficiency card and a privilege card when both exist", () => {
    const state = createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 11 });
    const kinds = activeTeam(state).hand.map((id) => cardById(id).kind);
    expect(kinds).toContain("efficiency");
    expect(kinds).toContain("privilege");
    expect(activeTeam(state).hand).not.toContain("trust");
    expect(activeTeam(state).hand).not.toContain("buyout");
  });

  it("deals the same hand for the same seed", () => {
    const a = createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 99 });
    const b = createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 99 });
    expect(activeTeam(a).hand).toEqual(activeTeam(b).hand);
  });
});

describe("card effects", () => {
  it("lets better stills cut price and cost and raise opinion without heat", () => {
    let state = createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 4 });
    state = {
      ...state,
      teams: state.teams.map((team, index) => (index === 0 ? { ...team, hand: ["stills", "rebates", "lobby"] } : team)),
    };
    const before = activeTeam(state);
    state = playCard(state, "stills");
    const after = activeTeam(state);
    expect(after.price).toBeLessThan(before.price);
    expect(after.cost).toBeLessThan(before.cost);
    expect(after.played[0]?.id).toBe("stills");
    expect(after.efficiencyBuilds).toBe(1);
    sumOk(state);
  });

  it("makes secret rebates grab share and political heat", () => {
    let state = createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 4 });
    state = {
      ...state,
      teams: state.teams.map((team, index) => (index === 0 ? { ...team, hand: ["rebates", "stills", "lobby"] } : team)),
    };
    const before = activeTeam(state);
    state = playCard(state, "rebates");
    const after = activeTeam(state);
    expect(after.heat).toBeGreaterThan(before.heat);
    expect(after.opinion).toBeLessThan(before.opinion);
    expect(after.privilegeMoves).toBe(1);
    expect(state.event?.id).toBe("founding");
    sumOk(state);
  });

  it("buys out a rival and moves that share to the player", () => {
    let state = createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 4 });
    state = { ...state, roundIndex: 1 };
    const weak = activeTeam(state).rivals.map((rival) =>
      rival.id === "lakeshore" ? { ...rival, health: 30, share: 22 } : rival,
    );
    state = {
      ...state,
      teams: state.teams.map((team, index) => (index === 0 ? { ...team, rivals: weak, hand: ["buyout", "stills", "lobby"] } : team)),
    };
    const beforeShare = activeTeam(state).share;
    state = playCard(state, "buyout");
    const dead = activeTeam(state).rivals.filter((rival) => !rival.alive);
    expect(dead.length).toBeGreaterThanOrEqual(1);
    expect(activeTeam(state).share).toBeGreaterThan(beforeShare);
    expect(activeTeam(state).buyouts).toBeGreaterThanOrEqual(1);
    sumOk(state);
  });

  it("shrinks rebate gains after the Interstate Commerce Act", () => {
    const playRebate = (illegal: boolean) => {
      let state = createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 4 });
      state = {
        ...state,
        teams: state.teams.map((team, index) =>
          index === 0 ? { ...team, rebatesIllegal: illegal, hand: ["rebates", "stills", "lobby"] } : team,
        ),
      };
      const before = activeTeam(state).share;
      state = playCard(state, "rebates");
      return { gain: activeTeam(state).share - before, heat: activeTeam(state).heat, state };
    };
    const open = playRebate(false);
    const banned = playRebate(true);
    expect(banned.gain).toBeLessThan(open.gain);
    expect(banned.heat).toBeGreaterThan(open.heat);
  });

  it("does not play a card that is not in hand", () => {
    const state = createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 4 });
    const next = playCard(state, "trust");
    expect(next).toBe(state);
  });
});

describe("history cards", () => {
  it("fires the South Improvement Company in 1872 and Sherman in 1890", () => {
    let state = createGame({ mode: "solo", names: ["Ada"], rounds: 6, seed: 5 });
    state = playCard(state, activeTeam(state).hand[0]);
    expect(state.event?.fact).toContain("1870");
    state = acknowledge(state);
    expect(currentYear(state)).toBe(1872);
    state = playCard(state, activeTeam(state).hand[0]);
    expect(state.event?.title).toContain("South Improvement");
    state = skipToEnd(state);
    expect(state.phase).toBe("done");
    const titles = activeTeam(state).notes.join(" ");
    expect(state.years).toContain(1890);
    expect(titles.length).toBeGreaterThan(0);
    sumOk(state);
  });

  it("quotes the Sherman vote and keeps Tarbell after the period", () => {
    let state = createGame({ mode: "solo", names: ["Ada"], rounds: 6, seed: 8 });
    state = {
      ...state,
      roundIndex: state.years.length - 1,
      teams: state.teams.map((team, index) =>
        index === 0
          ? {
              ...team,
              share: 80,
              trustFormed: true,
              hand: ["lobby", "stills", "chemists"],
              rivals: team.rivals.map((rival) => ({ ...rival, share: 5 })),
            }
          : team,
      ),
    };
    state = playCard(state, "lobby");
    expect(state.event?.body).toContain("51");
    expect(state.event?.body).toContain("242");
    expect(activeTeam(state).trustBuster).toBe(true);
    expect(activeTeam(state).share).toBeLessThan(80);
    state = acknowledge(state);
    expect(state.phase).toBe("epilogue");
    expect(state.event?.body).toContain("1902");
    expect(state.event?.body.toLowerCase()).toContain("loaded");
    const before = activeTeam(state).share;
    state = acknowledge(state);
    expect(state.phase).toBe("done");
    expect(activeTeam(state).share).toBe(before);
    sumOk(state);
  });

  it("mentions Tidewater and the 90 percent mark when the short game jumps to 1882", () => {
    let state = createGame({ mode: "solo", names: ["Ada"], rounds: 6, seed: 2 });
    state = { ...state, roundIndex: 3 };
    expect(currentYear(state)).toBe(1882);
    state = {
      ...state,
      teams: state.teams.map((team, index) => (index === 0 ? { ...team, hand: ["stills", "rebates", "lobby"] } : team)),
    };
    state = playCard(state, "stills");
    expect(state.event?.body).toContain("Tidewater");
    expect(state.event?.body).toContain("90");
    sumOk(state);
  });
});

describe("paths and teams", () => {
  it("keeps an all-efficiency run cheaper than an all-privilege run", () => {
    const efficiency = autoPlay(createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 21 }), "efficiency");
    const privilege = autoPlay(createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 21 }), "privilege");
    expect(efficiency.phase).toBe("done");
    expect(privilege.phase).toBe("done");
    expect(activeTeam(efficiency).price).toBeLessThan(activeTeam(privilege).price);
    expect(activeTeam(efficiency).price).toBeLessThanOrEqual(11);
    expect(activeTeam(privilege).price).toBeGreaterThanOrEqual(12);
    sumOk(efficiency);
    sumOk(privilege);
  });

  it("does not let one team mutate the other", () => {
    let state = createGame({ mode: "teams", names: ["Red", "Blue"], rounds: 6, seed: 6 });
    const blueBefore = state.teams[1].share;
    state = playCard(state, activeTeam(state).hand[0]);
    expect(state.teams[1].share).toBe(blueBefore);
    expect(state.activeTeam).toBe(0);
    state = acknowledge(state);
    expect(state.activeTeam).toBe(1);
    expect(state.teams[1].hand.length).toBeGreaterThan(0);
    sumOk(state);
  });

  it("round-trips through a save", () => {
    let state = createGame({ mode: "solo", names: ["Ada"], rounds: 10, seed: 15 });
    state = playCard(state, activeTeam(state).hand[0]);
    const restored = deserialize(serialize(state));
    expect(restored).toEqual(state);
    expect(deserialize("{")).toBeNull();
    expect(resultSlip(state, 0)).toContain("DBQ Q11");
    expect(resultSlip(state, 0)).toContain("26¢");
  });
});

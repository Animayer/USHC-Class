import { describe, expect, it } from "vitest";
import { answerQuestion, autoAdvance, createGame, currentCards, currentEra, dismiss, playCard, skipToDebrief, solemnNow, visibleSnapshot } from "../logic/engine";
import { rankTeams } from "../logic/scoring";

describe("chronicle engine", () => {
  it("opens in 1922 on the headline, with Italy not yet fascist", () => {
    const state = createGame({ mode: "solo", names: ["Ada"], length: "full", seed: 4 });
    expect(state.phase).toBe("headline");
    expect(state.teams[0].role).toBe("analyst");
    expect(visibleSnapshot(state).italy.faction).not.toBe("fascist");
    expect(visibleSnapshot(state).germany.faction).toBe("weimar");
  });

  it("paints Italy after the Rome headline is dismissed, and nowhere else changes by the card", () => {
    let state = createGame({ mode: "solo", names: ["Ada"], length: "full", seed: 4 });
    const before = visibleSnapshot(state).italy.faction;
    state = dismiss(state);
    expect(state.phase).toBe("decide");
    expect(before).not.toBe("fascist");
    expect(visibleSnapshot(state).italy.faction).toBe("fascist");
    const germany = visibleSnapshot(state).germany.faction;
    const card = currentCards(state).find((item) => item.insight);
    state = playCard(state, card!.id);
    expect(visibleSnapshot(state).germany.faction).toBe(germany);
    expect(state.teams[0].insight).toBe(2);
  });

  it("does not award points for the solemn record", () => {
    let state = createGame({ mode: "solo", names: ["Ada"], length: "quick", seed: 2 });
    expect(state.phase).toBe("solemn");
    expect(solemnNow(state)?.id).toBe("holodomor");
    const points = state.teams[0].insight;
    state = dismiss(state);
    expect(state.teams[0].insight).toBe(points);
    expect(state.phase).toBe("headline");
    expect(state.seenSolemn).toContain("holodomor");
  });

  it("gives the check points only for the right answer", () => {
    let state = createGame({ mode: "solo", names: ["Ada"], length: "quick", seed: 2, notesOn: false });
    while (state.phase !== "question") state = autoAdvance(state);
    const correct = currentEra(state).question.answer;
    const before = state.teams[0].insight;
    state = answerQuestion(state, correct);
    expect(state.answer?.correct).toBe(true);
    expect(state.teams[0].insight).toBe(before + 3);
  });

  it("finishes a quick game and a full game on the historical map", () => {
    const quick = skipToDebrief(createGame({ mode: "teams", names: ["Red", "Blue", "Gold"], length: "quick", seed: 9 }));
    expect(quick.phase).toBe("debrief");
    expect(quick.badges).toContain("chronicle");
    expect(quick.badges).toContain("read-the-record");
    expect(quick.seenSolemn).toEqual(["holodomor", "nanjing", "holocaust"]);
    expect(visibleSnapshot(quick).spain.faction).toBe("nationalist");
    expect(visibleSnapshot(quick).germany.faction).not.toBe("nazi");
    const full = skipToDebrief(createGame({ mode: "solo", names: ["Ada"], length: "full", seed: 3 }));
    expect(full.phase).toBe("debrief");
    expect(full.teams[0].insight).toBeGreaterThan(20);
    expect(rankTeams(full.teams)[0].name).toBe("Ada");
  });

  it("deals the same aside for the same seed", () => {
    const a = createGame({ mode: "solo", names: ["Ada"], length: "full", seed: 11 });
    const b = createGame({ mode: "solo", names: ["Ada"], length: "full", seed: 11 });
    expect(a.aside).toBe(b.aside);
  });

  it("rotates a single desk in a quick team game", () => {
    const state = createGame({ mode: "teams", names: ["Red", "Blue"], length: "quick", seed: 1 });
    expect(state.teams.map((team) => team.role)).toEqual(["allies", "analyst"]);
    expect(state.activeTeam).toBe(0);
  });
});

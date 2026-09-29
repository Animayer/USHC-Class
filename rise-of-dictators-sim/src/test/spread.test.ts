import { describe, expect, it } from "vitest";
import { answerSpread, chooseSpreadDecision, continueSpread, createSpread, currentSpreadStep, jumpSpreadYear, meterFor, scoreReflection, setReflection, stepsFor } from "../logic/spread";
import { REFLECTIONS } from "../logic/spread";

describe("Hitler’s Spread", () => {
  it("starts at the failed putsch with an empty meter", () => {
    const state = createSpread("full");
    const step = currentSpreadStep(state);
    expect(step.year).toBe(1923);
    expect(meterFor(step.tones)).toBe(0);
    expect(state.insight).toBe(0);
  });

  it("scores the check and not the decision", () => {
    let state = createSpread("full");
    state = jumpSpreadYear(state, 1933);
    expect(currentSpreadStep(state).yearLabel).toBe("1933");
    const before = state.insight;
    state = chooseSpreadDecision(state, currentSpreadStep(state).decisions[0].id);
    expect(state.insight).toBe(before);
    state = answerSpread(state, currentSpreadStep(state).check.answer);
    expect(state.insight).toBe(10);
    expect(state.phase).toBe("feedback");
  });

  it("jumps to the later 1941 step, with the Soviet Union invaded and France already taken", () => {
    const state = jumpSpreadYear(createSpread("full"), 1941);
    const step = currentSpreadStep(state);
    expect(step.id).toBe("y1941b");
    expect(step.tones.france).toBe("nazi");
    expect(step.tones.ussr).toBe("invaded");
    expect(step.tones.britain).toBe("allied");
  });

  it("clears Nazi rule by 1945", () => {
    const state = jumpSpreadYear(createSpread("full"), 1945);
    const step = currentSpreadStep(state);
    expect(meterFor(step.tones)).toBe(0);
    expect(Object.values(step.tones)).not.toContain("nazi");
  });

  it("walks the quick path to the reflection and scores it", () => {
    let state = createSpread("quick");
    const guardMax = 40;
    for (let guard = 0; guard < guardMax && state.phase === "play"; guard += 1) {
      const step = currentSpreadStep(state);
      state = chooseSpreadDecision(state, step.decisions[0].id);
      state = answerSpread(state, step.check.answer);
      state = continueSpread(state);
    }
    expect(state.phase).toBe("reflect");
    for (const item of REFLECTIONS) state = setReflection(state, item.id, item.answer);
    const scored = scoreReflection(state);
    expect(scored.phase).toBe("done");
    expect(scored.insight).toBeGreaterThan(10);
    expect(scored.badges).toContain("stopping-point");
    expect(stepsFor("quick").length).toBeLessThan(stepsFor("full").length);
  });
});

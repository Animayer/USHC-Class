import { describe, expect, it } from "vitest";
import { advanceQuiz, createQuiz, pickQuiz, QUIZ } from "../logic/quiz";

describe("exit quiz", () => {
  it("records a perfect run with explanations along the way", () => {
    let state = createQuiz();
    for (let index = 0; index < QUIZ.length; index += 1) {
      expect(state.done).toBe(false);
      expect(state.index).toBe(index);
      state = pickQuiz(state, QUIZ[index].answer);
      expect(state.showExplain).toBe(true);
      expect(state.correctCount).toBe(index + 1);
      state = advanceQuiz(state);
    }
    expect(state.done).toBe(true);
    expect(state.correctCount).toBe(10);
  });

  it("does not count a second pick while the explanation is open", () => {
    let state = createQuiz();
    state = pickQuiz(state, 0);
    const score = state.correctCount;
    state = pickQuiz(state, 1);
    expect(state.correctCount).toBe(score);
    expect(state.picked).toBe(0);
  });
});
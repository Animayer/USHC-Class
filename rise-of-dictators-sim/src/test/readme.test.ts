import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEBRIEF_PROMPTS } from "../logic/debrief";
import { QUIZ } from "../logic/quiz";

describe("teacher sheet", () => {
  const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");

  it("prints every exit-quiz prompt", () => {
    for (const question of QUIZ) expect(readme).toContain(question.prompt);
  });

  it("prints every discussion prompt", () => {
    for (const prompt of DEBRIEF_PROMPTS) expect(readme).toContain(prompt);
  });
});

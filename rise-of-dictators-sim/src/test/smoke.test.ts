import { mkdirSync } from "node:fs";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, describe, expect, it } from "vitest";
import "../game/api";

const SHOTS: { name: string; query: string; phase: string }[] = [
  { name: "title", query: "", phase: "title" },
  { name: "map", query: "?shot=map", phase: "decide" },
  { name: "battle", query: "?shot=battle", phase: "battle" },
  { name: "headline", query: "?shot=headline", phase: "headline" },
  { name: "spread-1933", query: "?shot=spread&year=1933", phase: "spread" },
  { name: "spread-1939", query: "?shot=spread&year=1939", phase: "spread" },
  { name: "spread-1941", query: "?shot=spread&year=1941", phase: "spread" },
  { name: "spread-1945", query: "?shot=spread&year=1945", phase: "spread" },
  { name: "quiz", query: "?shot=quiz", phase: "quiz" },
];

describe("smoke", () => {
  let server: ViteDevServer;
  let browser: Browser;
  let url = "";

  afterAll(async () => {
    await browser?.close();
    await server?.close();
  });

  async function open(path = "/"): Promise<{ page: Page; errors: string[] }> {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`${url}${path}`);
    await page.waitForSelector("canvas");
    return { page, errors };
  }

  it("boots a server and shows the title with no console errors", async () => {
    server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
    await server.listen();
    const address = server.httpServer?.address();
    const port = typeof address === "object" && address ? address.port : 5173;
    url = `http://127.0.0.1:${port}/`;
    browser = await chromium.launch({ headless: true });
    const { page, errors } = await open();
    await page.waitForFunction(() => window.__RISE__?.phase() === "title");
    expect(errors, errors.join("\n")).toEqual([]);
    await page.close();
  });

  it("plays a quick round through the debrief", async () => {
    const { page, errors } = await open();
    await page.waitForFunction(() => window.__RISE__?.phase() === "title");
    await page.evaluate(() => window.__RISE__?.startQuick());
    for (let step = 0; step < 80; step += 1) {
      const phase = await page.evaluate(() => window.__RISE__?.phase());
      if (phase === "debrief") break;
      await page.evaluate(() => window.__RISE__?.act());
    }
    await page.waitForFunction(() => window.__RISE__?.phase() === "debrief");
    await page.evaluate(() => window.__RISE__?.act());
    await page.waitForFunction(() => window.__RISE__?.phase() === "record");
    expect(errors, errors.join("\n")).toEqual([]);
    await page.close();
  });

  it("opens the full chronicle on the newsreel", async () => {
    const { page, errors } = await open();
    await page.waitForFunction(() => window.__RISE__?.phase() === "title");
    await page.evaluate(() => window.__RISE__?.startFull());
    await page.waitForFunction(() => window.__RISE__?.phase() === "intro");
    for (let step = 0; step < 8; step += 1) {
      const phase = await page.evaluate(() => window.__RISE__?.phase());
      if (phase !== "intro") break;
      await page.evaluate(() => window.__RISE__?.act());
    }
    await page.waitForFunction(() => {
      const phase = window.__RISE__?.phase();
      return phase === "solemn" || phase === "headline" || phase === "tutorial" || phase === "decide";
    });
    expect(errors, errors.join("\n")).toEqual([]);
    await page.close();
  });

  it("walks Hitler's Spread to the reflection", async () => {
    const { page, errors } = await open();
    await page.waitForFunction(() => window.__RISE__?.phase() === "title");
    await page.evaluate(() => window.__RISE__?.startSpread());
    for (let step = 0; step < 80; step += 1) {
      const phase = await page.evaluate(() => window.__RISE__?.phase());
      if (phase === "spread-done") break;
      await page.evaluate(() => window.__RISE__?.act());
    }
    await page.waitForFunction(() => window.__RISE__?.phase() === "spread-done");
    expect(errors, errors.join("\n")).toEqual([]);
    await page.close();
  });

  it("finishes the ten-question exit quiz", async () => {
    const { page, errors } = await open();
    await page.waitForFunction(() => window.__RISE__?.phase() === "title");
    await page.evaluate(() => window.__RISE__?.openQuiz());
    await page.waitForFunction(() => window.__RISE__?.phase() === "quiz");
    for (let step = 0; step < 30; step += 1) {
      const phase = await page.evaluate(() => window.__RISE__?.phase());
      if (phase === "quizdone") break;
      await page.evaluate(() => window.__RISE__?.act());
    }
    await page.waitForFunction(() => window.__RISE__?.phase() === "quizdone");
    expect(errors, errors.join("\n")).toEqual([]);
    await page.close();
  });

  it("captures the review screenshots", async () => {
    mkdirSync("screenshots", { recursive: true });
    let artifactDir: string | null = "/opt/cursor/artifacts/screenshots";
    try {
      mkdirSync(artifactDir, { recursive: true });
    } catch {
      artifactDir = null;
    }
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    for (const shot of SHOTS) {
      await page.goto(`${url}${shot.query}`);
      await page.waitForFunction(
        (expected) => window.__RISE__?.ready() === true && window.__RISE__?.phase() === expected,
        shot.phase,
      );
      await page.waitForTimeout(500);
      const local = `screenshots/${shot.name}.png`;
      await page.screenshot({ path: local });
      if (artifactDir) await page.screenshot({ path: `${artifactDir}/rise-${shot.name}.png` });
    }
    expect(errors, errors.join("\n")).toEqual([]);
    await page.close();
  });
});

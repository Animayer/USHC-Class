import { chromium, type Browser } from "playwright";
import "../game/api";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, describe, expect, it } from "vitest";

describe("smoke", () => {
  let server: ViteDevServer;
  let browser: Browser;
  let url = "";

  afterAll(async () => {
    await browser?.close();
    await server?.close();
  });

  it("loads the game canvas with no console errors and enters a round", async () => {
    server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
    await server.listen();
    const address = server.httpServer?.address();
    const port = typeof address === "object" && address ? address.port : 5173;
    url = `http://127.0.0.1:${port}/`;
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(url);
    await page.waitForSelector("canvas");
    await page.waitForFunction(() => window.__OILBARON__?.phase() === "title");
    await page.evaluate(() => window.__OILBARON__?.startSoloShort());
    await page.waitForFunction(() => window.__OILBARON__?.phase() === "choose");
    expect(errors, errors.join("\n")).toEqual([]);
  });

  it("plays a full 10-round game, then play-again into a team start, with no console errors", async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(url);
    await page.waitForFunction(() => window.__OILBARON__?.phase() === "title");
    await page.evaluate(() => window.__OILBARON__?.startSoloFull());
    await page.waitForFunction(() => window.__OILBARON__?.phase() === "choose");
    for (let step = 0; step < 40; step += 1) {
      const phase = await page.evaluate(() => window.__OILBARON__?.phase());
      if (phase === "done") break;
      await page.evaluate(() => window.__OILBARON__?.act());
      await page.waitForTimeout(40);
    }
    await page.waitForFunction(() => window.__OILBARON__?.phase() === "done");
    await page.evaluate(() => window.__OILBARON__?.playAgain());
    await page.waitForFunction(() => window.__OILBARON__?.phase() === "title");
    await page.evaluate(() => window.__OILBARON__?.openTeams());
    await page.waitForFunction(() => window.__OILBARON__?.phase() === "setup");
    await page.evaluate(() => window.__OILBARON__?.startTeams());
    await page.waitForFunction(() => window.__OILBARON__?.phase() === "choose");
    expect(errors, errors.join("\n")).toEqual([]);
    await page.close();
  });
});

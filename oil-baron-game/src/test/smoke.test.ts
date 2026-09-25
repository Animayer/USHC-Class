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
});

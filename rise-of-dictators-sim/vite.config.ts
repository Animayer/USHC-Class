import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  test: {
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 120_000,
    server: {
      deps: {
        external: ["playwright"],
      },
    },
  },
});

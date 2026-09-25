import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  test: {
    environment: "node",
    testTimeout: 90_000,
    hookTimeout: 90_000,
    server: {
      deps: {
        external: ["playwright"],
      },
    },
  },
});

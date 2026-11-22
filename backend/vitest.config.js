import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.js"],
    // Each test file gets its own in-memory MongoDB, so files can run in parallel.
    testTimeout: 20000,
    hookTimeout: 60000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      exclude: ["src/server.js"],
      reporter: ["text", "html", "lcov"],
    },
  },
});

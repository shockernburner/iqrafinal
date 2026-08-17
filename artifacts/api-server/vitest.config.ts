import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Each test file gets its own module registry so module-level state doesn't leak.
    isolate: true,
    // Default timeout per test — generous to cover fake-timer coordination.
    testTimeout: 30_000,
  },
});

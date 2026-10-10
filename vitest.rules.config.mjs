import { defineConfig } from "vitest/config";

// Run through `npm run test:rules`, which starts the Firestore emulator first.
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.mjs"],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});

import { defineConfig, configDefaults } from "vitest/config";

// The Firestore rules tests need the emulator, so `npm test` skips them;
// `npm run test:rules` starts the emulator and runs only those.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "tests/rules/**"],
  },
});

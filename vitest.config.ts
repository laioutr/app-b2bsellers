import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * `#imports` is a Nuxt build alias; outside a build nothing resolves it, and a
 * test that touches a runtime file fails while resolving rather than while
 * asserting. The stub keeps resolution working — see `test/stubs/imports.ts`.
 */
export default defineConfig({
  resolve: {
    alias: {
      '#imports': fileURLToPath(new URL('./test/stubs/imports.ts', import.meta.url)),
    },
  },
});

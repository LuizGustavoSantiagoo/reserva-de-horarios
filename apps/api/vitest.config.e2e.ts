import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Os e2e limpam e preenchem o mesmo banco: um arquivo por vez.
    fileParallelism: false,
  },
});

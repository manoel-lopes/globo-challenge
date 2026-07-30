import path from 'node:path'
import { fileURLToPath } from 'node:url'
import swc from 'unplugin-swc'
import { configDefaults, defineConfig } from 'vitest/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
  test: {
    exclude: [...configDefaults.exclude],
    include: ['**/*.test.ts'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    isolate: true,
    fileParallelism: true,
    silent: true,
    coverage: {
      provider: 'istanbul',
      exclude: [
        ...configDefaults.exclude,
        '**/*.e2e-spec.ts',
        '**/prisma/**',
        'test/**',
      ],
    },
  },
})

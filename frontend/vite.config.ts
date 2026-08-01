import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { index, rootRoute, route } from '@tanstack/virtual-file-routes'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/pages',
      indexToken: 'page',
      routeFileIgnorePattern: '^(?!(page|__.*)\\.tsx$).*\\.tsx$',
      virtualRouteConfig: rootRoute('__root.tsx', [
        index('dashboard/page.tsx'),
        route('/logs', 'logs/page.tsx'),
        route('/imports', 'imports/page.tsx'),
      ]),
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./setupTests.ts'],
  },
})

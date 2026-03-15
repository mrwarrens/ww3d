import { defineConfig, defineProject } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/ww3d/',
  plugins: [react()],
  optimizeDeps: {
    include: ['zustand'],
    exclude: ['manifold-3d'],
  },
  test: {
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['tests/*.test.ts'],
          exclude: ['tests/*.browser.test.ts'],
          environment: 'node',
        },
      }),
      defineProject({
        plugins: [react()],
        optimizeDeps: {
          include: ['zustand'],
          exclude: ['manifold-3d'],
        },
        test: {
          name: 'browser',
          include: ['tests/*.browser.test.{ts,tsx}'],
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: {
                args: ['--enable-unsafe-swiftshader'],
              },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      }),
    ],
  },
})

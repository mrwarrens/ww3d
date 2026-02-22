import { defineConfig, defineProject } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['zustand'],
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
        },
        test: {
          name: 'browser',
          include: ['tests/*.browser.test.{ts,tsx}'],
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

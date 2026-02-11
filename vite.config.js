import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: {
          args: ['--enable-unsafe-swiftshader']
        }
      }),
      instances: [
        { browser: 'chromium' }
      ]
    }
  }
})

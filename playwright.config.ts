import { defineConfig, devices } from '@playwright/test'

const E2E_PORT = process.env.E2E_PORT || '3005'
const baseURL = `http://127.0.0.1:${E2E_PORT}`
const useProdServer = process.env.E2E_PROD === '1'

export default defineConfig({
    testDir: './e2e',
    timeout: 90_000,
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: 'list',
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        // Su Windows `npm run dev -- -p X` non passa correttamente le flag a Next.js
        command: useProdServer ? 'npm run start:e2e' : 'npm run dev:e2e',
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: useProdServer ? 60_000 : 120_000,
    },
})

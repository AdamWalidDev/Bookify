import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4179',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      channel: process.env.PLAYWRIGHT_CHANNEL ?? (process.platform === 'win32' ? 'chrome' : undefined),
    },
  }],
  webServer: [
    {
      command: 'dotnet run --project ../Bookify.Api --configuration Release --no-launch-profile -- --urls http://127.0.0.1:5189',
      url: 'http://127.0.0.1:5189/api/resources',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ASPNETCORE_ENVIRONMENT: 'E2E',
        Jwt__Key: 'bookify-e2e-test-signing-key-never-use-in-production',
        Jwt__Issuer: 'BookifyE2E',
        Admin__Username: 'e2e-admin',
        Admin__Password: 'e2e-password',
        Cors__AllowedOrigins__0: 'http://127.0.0.1:4179',
        Logging__LogLevel__Default: 'Warning',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4179 --strictPort',
      url: 'http://127.0.0.1:4179',
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://127.0.0.1:5189' },
    },
  ],
})

const { defineConfig } = require('@playwright/test');

const PORT = process.env.PORT || 3100;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `pnpm exec next start -H 127.0.0.1 -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});

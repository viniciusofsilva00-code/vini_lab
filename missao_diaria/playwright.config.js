import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:8010/missao_diaria/',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [{ name: 'chromium', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'python3 -m http.server 8010 -d ..',
    url: 'http://localhost:8010/missao_diaria/',
    reuseExistingServer: true,
  },
});

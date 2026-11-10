import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // sob carga (vários testes em paralelo) o servidor python às vezes atrasa; 1 nova tentativa evita falso negativo
  retries: 1,
  workers: 3,
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:8010/missao_diaria/',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'python3 -m http.server 8010 -d ..',
    url: 'http://localhost:8010/missao_diaria/',
    reuseExistingServer: true,
  },
});

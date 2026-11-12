import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4173/biblioteca-escola/', browserName: 'chromium' },
  reporter: 'list',
  webServer: { command: 'GITHUB_PAGES=true npm run build && GITHUB_PAGES=true npm run preview -- --host 127.0.0.1 --port 4173',url: 'http://127.0.0.1:4173/biblioteca-escola/',reuseExistingServer: false,timeout:120000 }
})

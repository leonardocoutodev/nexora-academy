import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',
  timeout:30_000,
  expect:{timeout:7_000,toHaveScreenshot:{animations:'disabled',maxDiffPixelRatio:0.015}},
  fullyParallel:true,
  forbidOnly:!!process.env.CI,
  retries:process.env.CI?1:0,
  workers:process.env.CI?2:undefined,
  reporter:process.env.CI?[['line'],['html',{outputFolder:'playwright-report',open:'never'}]]:'list',
  use:{
    baseURL:process.env.LC_E2E_BASE_URL||'http://127.0.0.1:8787',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'retain-on-failure',
    actionTimeout:8_000,
    navigationTimeout:15_000
  },
  webServer:process.env.LC_E2E_BASE_URL?undefined:{
    command:'node scripts/serve-public.mjs',
    url:'http://127.0.0.1:8787/api/health',
    reuseExistingServer:!process.env.CI,
    timeout:30_000
  },
  projects:[
    {name:'chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
    {name:'firefox',use:{...devices['Desktop Firefox'],viewport:{width:1440,height:900}}},
    {name:'webkit',use:{...devices['Desktop Safari'],viewport:{width:1440,height:900}}}
  ]
});

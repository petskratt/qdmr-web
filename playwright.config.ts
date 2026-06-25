import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'retain-on-failure'
	},
	webServer: {
		command: 'npm run build && npm run preview -- --port 4173 --host 127.0.0.1',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});

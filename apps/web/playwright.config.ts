import { defineConfig, devices } from "@playwright/test";

// CI installs chromium, firefox and webkit; locally set E2E_BROWSERS=chromium if only Chromium exists.
const wanted = (process.env.E2E_BROWSERS ?? "chromium,firefox,webkit").split(",").map(s => s.trim());
const all = [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
];

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  // WebKit IndexedDB checkpoint tests intermittently hit a 30s stalled phase under CI parallel load.
  // Keep all three engines, but serialize E2E in CI rather than masking failures with retries.
  workers: process.env.CI ? 1 : undefined,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4173/", trace: "retain-on-failure" },
  projects: all.filter(p => wanted.includes(p.name)),
  webServer: { command: "pnpm build && pnpm preview", url: "http://127.0.0.1:4173/", reuseExistingServer: !process.env.CI, timeout: 180_000, stdout: "pipe", stderr: "pipe" },
});

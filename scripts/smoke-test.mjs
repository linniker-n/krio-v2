import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright";

const rootUrl = process.env.KRIO_SMOKE_URL || "http://127.0.0.1:8000";
let server;

if (!process.env.KRIO_SMOKE_URL) {
  server = spawn("py", ["-3", "-m", "http.server", "8000", "--bind", "127.0.0.1"], {
    stdio: "ignore",
    shell: false
  });
  await wait(900);
}

const browser = await chromium.launch({ headless: true });

try {
  await desktopSmoke(browser);
  await mobileSmoke(browser);
  console.log("smoke ok");
} finally {
  await browser.close();
  if (server && !server.killed) {
    server.kill();
    await Promise.race([once(server, "exit"), wait(1000)]);
  }
}

async function desktopSmoke(browser) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = collectErrors(page);

  for (const path of ["index.html", "terms.html", "privacy.html", "billing-success.html", "billing-cancel.html"]) {
    await page.goto(`${rootUrl}/${path}`, { waitUntil: "domcontentloaded" });
    await page.locator("body").waitFor({ state: "visible" });
  }

  await page.goto(`${rootUrl}/index.html`, { waitUntil: "domcontentloaded" });
  await page.locator("#signupAgency").waitFor({ state: "visible" });
  await page.locator("#tabLogin").click();
  await page.locator("#loginForm").waitFor({ state: "visible" });

  await page.goto(`${rootUrl}/app/?demo=1`, { waitUntil: "networkidle" });
  await page.locator("#appShell").waitFor({ state: "visible" });
  await page.locator('[data-action="openPlanDialog"]').first().click();
  await page.locator("#planDialogTitle").waitFor({ state: "visible" });
  await page.locator('[data-action="closeDialog"]').first().click();
  await page.locator('[data-view="approval"]').click();
  await page.locator(".krio-approval").waitFor({ state: "visible" });

  await page.close();
  assertNoErrors(errors);
}

async function mobileSmoke(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const errors = collectErrors(page);

  await page.goto(`${rootUrl}/app/?demo=1`, { waitUntil: "networkidle" });
  await page.locator("#appShell").waitFor({ state: "visible" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.close();

  assertNoErrors(errors);
  if (overflow > 4) throw new Error(`mobile overflow=${overflow}`);
}

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && url.startsWith(rootUrl)) {
      errors.push(`${response.status()} ${url}`);
    }
  });
  return errors;
}

function assertNoErrors(errors) {
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

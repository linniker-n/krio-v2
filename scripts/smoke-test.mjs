import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright";

const smokePort = process.env.KRIO_SMOKE_PORT || "8131";
const rootUrl = process.env.KRIO_SMOKE_URL || `http://127.0.0.1:${smokePort}`;
const appSmokePath = "/app/";
let server;

if (!process.env.KRIO_SMOKE_URL) {
  server = spawn(process.execPath, ["scripts/dev-server.cjs"], {
    stdio: "ignore",
    shell: false,
    env: { ...process.env, PORT: smokePort, HOST: "127.0.0.1" }
  });
  await wait(900);
}

const browser = await chromium.launch({ headless: true });

try {
  await desktopSmoke(browser);
  await clientPortalSmoke(browser);
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
  await page.locator("#signupInviteField").waitFor({ state: "hidden" });
  await page.locator("#tabLogin").click();
  await page.locator("#loginForm").waitFor({ state: "visible" });
  await page.locator("#resetPasswordBtn").waitFor({ state: "visible" });

  await page.goto(`${rootUrl}${appSmokePath}?demo=1`, { waitUntil: "networkidle" });
  await page.locator("#appShell").waitFor({ state: "visible" });
  await page.locator('[data-action="openPlanDialog"]').first().click();
  await page.locator("#planDialogTitle").waitFor({ state: "visible" });
  await page.locator('[data-action="closeDialog"]').first().click();
  await page.locator('[data-view="approval"]').click();
  await page.locator(".krio-approval").waitFor({ state: "visible" });
  await page.locator("[data-approval-client]").first().click();
  await page.locator(".approval-card-open").first().click();
  await page.locator("#creativeDetailTitle").waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await page.locator("#creativeDetailTitle").waitFor({ state: "hidden" });

  await page.close();
  assertNoErrors(errors);
}

async function clientPortalSmoke(browser) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = collectErrors(page);

  await page.goto(`${rootUrl}/approval/client_alpha?demo=1`, { waitUntil: "networkidle" });
  await page.locator("#appShell").waitFor({ state: "visible" });
  await page.locator(".client-portal").waitFor({ state: "visible" });

  const result = await page.evaluate(() => ({
    bodyClient: document.body.classList.contains("role-client"),
    shellClient: document.querySelector("#appShell")?.classList.contains("client-portal-shell"),
    sidebarHidden: getComputedStyle(document.querySelector(".app-sidebar")).display === "none",
    topbarHidden: getComputedStyle(document.querySelector(".app-topbar")).display === "none",
    hasVisibleTrackerTab: Array.from(document.querySelectorAll(".app-tab")).some((button) => button.offsetParent !== null && button.textContent.includes("Tracker")),
    title: document.querySelector(".client-portal h1")?.textContent?.trim() || ""
  }));

  await page.close();
  assertNoErrors(errors);
  if (!result.bodyClient || !result.shellClient || !result.sidebarHidden || !result.topbarHidden || result.hasVisibleTrackerTab || result.title !== "Cliente Alpha") {
    throw new Error(`client portal route failed: ${JSON.stringify(result)}`);
  }
}

async function mobileSmoke(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const errors = collectErrors(page);

  await page.goto(`${rootUrl}${appSmokePath}?demo=1`, { waitUntil: "networkidle" });
  await page.locator("#appShell").waitFor({ state: "visible" });
  await page.locator('[data-view="tracker"]').click();
  await page.locator(".tracker-mobile-hint").waitFor({ state: "visible" });
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

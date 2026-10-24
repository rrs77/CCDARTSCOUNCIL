import { chromium } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const OUT = process.env.OUT_DIR || "/opt/cursor/artifacts/planner-screens";
const BASE = process.env.BASE_URL || "http://127.0.0.1:5180";

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", file);
}

async function measureDialog(page) {
  return page.evaluate(() => {
    const el = document.querySelector("[data-modal-shell]");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      width: Math.round(r.width),
      height: Math.round(r.height),
      top: Math.round(r.top),
      left: Math.round(r.left),
    };
  });
}

async function closeModals(page) {
  const x = page.locator('[role="dialog"] button[aria-label="Close"]');
  while ((await x.count()) > 0) {
    await x.last().click({ force: true });
    await page.waitForTimeout(200);
  }
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label="Close overlay"]').forEach((el) => el.click());
  });
  await page.waitForTimeout(300);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const sizes = {};

  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome-stable",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  // Desktop
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, "01_main_planner_desktop");

  // Activity card
  await page.getByText("Body Percussion Patterns", { exact: false }).first().click();
  await page.waitForTimeout(400);
  sizes.activity_card = await measureDialog(page);
  await shot(page, "02_activity_card");
  await closeModals(page);

  // Lesson plan
  await page.getByRole("button", { name: /Open lesson plan/i }).click({ force: true });
  await page.waitForTimeout(500);
  sizes.lesson_plan = await measureDialog(page);
  await shot(page, "03_lesson_plan");
  await page.getByRole("button", { name: /Flesh out with AI/i }).click();
  await page.waitForTimeout(900);
  await shot(page, "04_lesson_plan_ai");
  await closeModals(page);

  // Preview
  await page.getByRole("button", { name: /Preview lesson/i }).click({ force: true });
  await page.waitForTimeout(400);
  sizes.preview_lesson = await measureDialog(page);
  await shot(page, "05_preview_lesson");
  await closeModals(page);

  // Year
  await page.getByRole("button", { name: /^Year$/i }).click();
  await page.waitForTimeout(400);
  await shot(page, "06_year_overview");

  // Settings + curriculum dialog
  await page.getByRole("navigation").getByRole("button", { name: "Settings" }).click();
  await page.waitForTimeout(400);
  await shot(page, "07_settings");
  await page.locator("h2", { hasText: "Curriculum" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await shot(page, "07a_settings_curriculum");
  await page.getByRole("button", { name: /^Framework$/i }).click();
  await page.waitForTimeout(400);
  sizes.settings_dialog = await measureDialog(page);
  await shot(page, "07b_settings_curriculum_dialog");
  await closeModals(page);

  // Empty
  await page.getByRole("button", { name: /^Empty$/i }).click();
  await page.waitForTimeout(500);
  await shot(page, "08_empty_state");

  // Fresh load for remaining shots
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  await page.locator("button", { hasText: "Choose plan template" }).click();
  await page.waitForTimeout(400);
  sizes.template_picker = await measureDialog(page);
  await shot(page, "09_template_picker");
  await closeModals(page);

  // iPad — same modals for size parity
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);
  await shot(page, "10_main_planner_ipad");

  await page.getByText("Body Percussion Patterns", { exact: false }).first().click();
  await page.waitForTimeout(400);
  sizes.activity_card_ipad = await measureDialog(page);
  await shot(page, "10b_activity_card_ipad");
  await closeModals(page);

  await page.getByRole("button", { name: /Open lesson plan/i }).click({ force: true });
  await page.waitForTimeout(400);
  sizes.lesson_plan_ipad = await measureDialog(page);
  await shot(page, "10c_lesson_plan_ipad");
  await closeModals(page);

  await page.getByRole("button", { name: /Preview lesson/i }).click({ force: true });
  await page.waitForTimeout(400);
  sizes.preview_lesson_ipad = await measureDialog(page);
  await shot(page, "10d_preview_lesson_ipad");
  await closeModals(page);

  // Over-time amber
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  for (let i = 0; i < 4; i++) {
    const add = page.locator('[title="Add to lesson"]').nth(i % 3);
    if (await add.count()) {
      await add.click({ force: true });
      await page.waitForTimeout(150);
    }
  }
  await shot(page, "11_over_time_amber");

  // Print view
  await page.locator("button", { hasText: "Open lesson plan" }).click({ force: true });
  await page.waitForTimeout(500);
  await page.locator('[role="dialog"] button', { hasText: /^Print$/ }).click({ force: true });
  await page.waitForTimeout(500);
  await shot(page, "12_print_a4");

  await writeFile(path.join(OUT, "modal-sizes.json"), JSON.stringify(sizes, null, 2));
  console.log("modal sizes", sizes);

  const dims = Object.values(sizes).filter(Boolean);
  if (dims.length > 1) {
    const w0 = dims[0].width;
    const h0 = dims[0].height;
    const mismatches = dims.filter((d) => d.width !== w0 || d.height !== h0);
    if (mismatches.length) {
      console.warn("SIZE MISMATCH vs first modal:", { expected: dims[0], mismatches });
    } else {
      console.log("All measured modals share size", dims[0]);
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

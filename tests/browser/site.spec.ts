import { test, expect } from "@playwright/test";
test("employees can browse, search, filter, and read news without login", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "เรื่อง IT ใกล้ตัว",
  );
  await expect(page.locator(".article-card")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Cyber Security", exact: true })
    .click();
  await expect(page.locator(".article-card")).toHaveCount(2);
  await page.getByRole("button", { name: "ทั้งหมด" }).click();
  await page.getByRole("textbox", { name: "ค้นหาบทความ" }).fill("จัดระเบียบ");
  await expect(page.locator(".article-card")).toHaveCount(1);
  await page.locator(".article-card").click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "จัดระเบียบไฟล์",
  );
  await expect(page.locator(".article-content")).toContainText("ตั้งชื่อไฟล์");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("empty search and admin access are handled safely", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "ค้นหาบทความ" })
    .fill("no-such-article-9182");
  await expect(
    page.getByRole("heading", { name: "ไม่พบบทความที่ตรงกับคำค้นหา" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "แสดงบทความทั้งหมด" }).click();
  await expect(page.locator(".article-card")).toHaveCount(5);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByText("ยังไม่ได้เชื่อมต่อ Active Directory", { exact: true }),
  ).toBeVisible();
  await page.goto("/news/missing-article");
  await expect(
    page.getByRole("heading", { name: "ไม่พบหน้าที่คุณต้องการ" }),
  ).toBeVisible();
});
test("public pages pass automated WCAG A/AA checks", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/news/think-before-you-click", "/login"]) {
    await page.goto(route);
    for (const card of await page.locator(".article-grid article").all()) {
      await card.scrollIntoViewIfNeeded();
      await expect(card).toHaveCSS("opacity", "1");
    }
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});

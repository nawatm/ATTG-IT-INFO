import { createHash } from "node:crypto";
import { hashPassword } from "../../src/lib/password";
/** Local integration only. Use an isolated test database.
 * Start production server at port 3001 with AUTH_SECRET=attg-cms-integration-test-only,
 * AUTH_TRUST_HOST=true, AUTH_URL=http://127.0.0.1:3001, DATABASE_URL and dummy Entra
 * client ID/secret plus a tenant UUID issuer configured. No external identity calls occur.
 * RUN_CMS_TESTS=1 TEST_BASE_URL=http://127.0.0.1:3001 CHROMIUM_PATH=/usr/bin/chromium npx playwright test tests/browser/cms.spec.ts --project=desktop --workers=1
 */
import "dotenv/config";
import { test, expect, type BrowserContext } from "@playwright/test";
import { encode } from "@auth/core/jwt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const prefix = `integration-${Date.now()}`;
const subject = `${prefix}-admin`;
const readerSubject = `${prefix}-reader`;
let userId = "";
let readerId = "";
test.describe("CMS with locally signed test sessions", () => {
  test.skip(
    process.env.RUN_CMS_TESTS !== "1",
    "Requires explicitly enabled isolated test server",
  );
  test.beforeAll(async () => {
    userId = (
      await db.user.create({
        data: {
          subject,
          email: `${prefix}@example.invalid`,
          name: "Integration Admin",
          role: "ADMIN",
        },
      })
    ).id;
    readerId = (
      await db.user.create({
        data: {
          subject: readerSubject,
          email: `${prefix}-reader@example.invalid`,
          name: "Integration Reader",
          role: "READER",
        },
      })
    ).id;
  });
  test.afterAll(async () => {
    await db.post.deleteMany({ where: { authorId: userId } });
    await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await db.$disconnect();
  });
  async function session(context: BrowserContext, directorySubject: string) {
    const token = await encode({
      secret: "attg-cms-integration-test-only",
      salt: "authjs.session-token",
      token: { directorySubject },
      maxAge: 3600,
    });
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: token,
        url: process.env.TEST_BASE_URL ?? "http://127.0.0.1:3001",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  }
  test("admin creates a draft, publishes, edits, and deletes an article", async ({
    page,
    context,
  }) => {
    await session(context, subject);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "จัดการ ATTG IT Info" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "เพิ่มบทความ" }).click();
    await page
      .getByLabel("หัวข้อบทความ", { exact: true })
      .fill("ข่าวทดสอบระบบ CMS ภายในองค์กร");
    await page.getByLabel("URL บทความ").fill(prefix);
    await page
      .getByLabel("คำโปรย")
      .fill("ตัวอย่างบทความสำหรับทดสอบการบันทึกฉบับร่างและเผยแพร่");
    await page
      .getByLabel("เนื้อหา (")
      .fill(
        "เนื้อหาทดสอบระบบจัดการบทความ เพื่อยืนยันว่าผู้ดูแลสามารถบันทึกข้อมูลลงฐานข้อมูลจริงได้",
      );
    await page.getByRole("button", { name: "บันทึกบทความ" }).click();
    await expect(page.getByText("บันทึกบทความเรียบร้อยแล้ว")).toBeVisible();
    const post = await db.post.findUniqueOrThrow({ where: { slug: prefix } });
    expect(post.published).toBe(false);
    await page.goto(`/news/${prefix}`);
    await expect(
      page.getByRole("heading", { name: "ไม่พบหน้าที่คุณต้องการ" }),
    ).toBeVisible();
    await page.goto(`/admin/posts/${post.id}`);
    await page
      .getByLabel("หัวข้อบทความ", { exact: true })
      .fill("ข่าวทดสอบ CMS ที่แก้ไขและเผยแพร่แล้ว");
    await page.getByLabel("เผยแพร่ให้พนักงานอ่าน").check();
    await page.getByRole("button", { name: "บันทึกบทความ" }).click();
    await expect(page.getByText("บันทึกบทความเรียบร้อยแล้ว")).toBeVisible();
    await context.clearCookies();
    await page.goto(`/news/${prefix}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "ข่าวทดสอบ CMS ที่แก้ไขและเผยแพร่แล้ว",
    );
    await session(context, subject);
    await page.goto("/admin");
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("row")
      .filter({ hasText: "ข่าวทดสอบ CMS ที่แก้ไขและเผยแพร่แล้ว" })
      .getByRole("button", { name: "ลบ", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "ข่าวทดสอบ CMS ที่แก้ไขและเผยแพร่แล้ว" }),
    ).toHaveCount(0);
    expect(await db.post.findUnique({ where: { id: post.id } })).toBeNull();
  });
  test("reader is denied and a role change takes effect in the same session", async ({
    page,
    context,
  }) => {
    await session(context, readerSubject);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "รอการอนุมัติสิทธิ์" }),
    ).toBeVisible();
    await page.goto("/admin/posts/new");
    await expect(
      page.getByRole("heading", { name: "รอการอนุมัติสิทธิ์" }),
    ).toBeVisible();
    await session(context, subject);
    await page.goto("/admin");
    const row = page
      .getByRole("row")
      .filter({ hasText: `${prefix}-reader@example.invalid` });
    await row.getByRole("combobox").selectOption("EDITOR");
    await row.getByRole("button", { name: "บันทึก", exact: true }).click();
    await expect(
      row.getByRole("status").filter({ hasText: "บันทึกสิทธิ์แล้ว" }),
    ).toHaveText("บันทึกสิทธิ์แล้ว");
    await session(context, readerSubject);
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "เพิ่มบทความ" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "จัดการสิทธิ์ผู้ใช้งาน" }),
    ).toHaveCount(0);
    await db.user.update({ where: { id: readerId }, data: { role: "READER" } });
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "รอการอนุมัติสิทธิ์" }),
    ).toBeVisible();
  });
  test("admin creates local users; password login, reset and disable work without AD", async ({
    page,
    context,
    browser,
  }) => {
    const email = `${prefix}-local@example.invalid`;
    const password = "local-test-passphrase-2026";
    const newPassword = "new-local-test-passphrase-2026";
    await session(context, subject);
    await page.goto("/admin");
    await page
      .getByLabel("ชื่อผู้ใช้", { exact: true })
      .fill("Local Integration User");
    await page.getByLabel("อีเมลผู้ใช้", { exact: true }).fill(email);
    await page.getByLabel("รหัสผ่านเริ่มต้น").fill(password);
    await page.getByLabel("สิทธิ์เริ่มต้น").selectOption("EDITOR");
    await page
      .getByRole("button", { name: "เพิ่มผู้ใช้เว็บไซต์", exact: true })
      .click();
    await expect(
      page.getByText("เพิ่มผู้ใช้ภายในเว็บไซต์แล้ว", { exact: true }),
    ).toBeVisible();
    const created = await db.user.findUniqueOrThrow({ where: { email } });
    expect(created.source).toBe("LOCAL");
    expect(created.passwordHash).not.toContain(password);
    await page
      .getByRole("button", { name: "เพิ่มจาก Active Directory", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "ค้นหาผู้ใช้จาก AD", exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("link", { name: "ดูสถานะและวิธีตั้งค่า AD →" })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "การเชื่อมต่อ Active Directory",
        exact: true,
      }),
    ).toBeVisible();
    await context.clearCookies();
    await page.goto("/login");
    await page.getByLabel("อีเมล", { exact: true }).fill(email);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill("wrong-password");
    await page
      .getByRole("button", {
        name: "เข้าสู่ระบบด้วยบัญชีเว็บไซต์",
        exact: true,
      })
      .click();
    await expect(page.locator(".form-error[role=alert]")).toContainText(
      "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    );
    await page.getByLabel("อีเมล", { exact: true }).fill(email);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill(password);
    await page
      .getByRole("button", {
        name: "เข้าสู่ระบบด้วยบัญชีเว็บไซต์",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "จัดการ ATTG IT Info", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "จัดการสิทธิ์ผู้ใช้งาน", exact: true }),
    ).toHaveCount(0);
    const adminContext = await browser.newContext();
    try {
      await session(adminContext, subject);
      const adminPage = await adminContext.newPage();
      await adminPage.goto("/admin");
      const row = adminPage.getByRole("row").filter({ hasText: email });
      await row.getByText("ตั้งรหัสผ่านใหม่", { exact: true }).click();
      await row.getByLabel("รหัสผ่านใหม่", { exact: true }).fill(newPassword);
      await row
        .getByRole("button", { name: "บันทึกรหัสผ่านใหม่", exact: true })
        .click();
      await expect(
        row.getByText("เปลี่ยนรหัสผ่านแล้ว และยกเลิก session เดิม", {
          exact: true,
        }),
      ).toBeVisible();
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/login/);
      await page.getByLabel("อีเมล", { exact: true }).fill(email);
      await page.getByLabel("รหัสผ่าน", { exact: true }).fill(newPassword);
      await page
        .getByRole("button", {
          name: "เข้าสู่ระบบด้วยบัญชีเว็บไซต์",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("heading", { name: "จัดการ ATTG IT Info", exact: true }),
      ).toBeVisible();
      await row.getByRole("button", { name: "ปิดใช้งาน", exact: true }).click();
      await expect(
        row.getByText("ปิดใช้งานแล้ว และยกเลิก session เดิม", { exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(page).toHaveURL(/\/login/);
      await page.getByLabel("อีเมล", { exact: true }).fill(email);
      await page.getByLabel("รหัสผ่าน", { exact: true }).fill(newPassword);
      await page
        .getByRole("button", {
          name: "เข้าสู่ระบบด้วยบัญชีเว็บไซต์",
          exact: true,
        })
        .click();
      await expect(page.locator(".form-error[role=alert]")).toContainText(
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      );
    } finally {
      await adminContext.close();
    }
  });
  test("local login locks after five failures and recovers after the window expires", async ({
    page,
  }) => {
    const email = `${prefix}-limited@example.invalid`;
    const password = "rate-limit-test-passphrase-2026";
    await db.user.create({
      data: {
        subject: `local:${prefix}-limited`,
        email,
        name: "Rate Limit Test",
        source: "LOCAL",
        role: "EDITOR",
        passwordHash: await hashPassword(password),
      },
    });
    await page.goto("/login");
    for (let attempt = 0; attempt < 6; attempt++) {
      await page.getByLabel("อีเมล", { exact: true }).fill(email);
      await page
        .getByLabel("รหัสผ่าน", { exact: true })
        .fill(attempt === 5 ? password : "wrong-passphrase");
      await page
        .getByRole("button", {
          name: "เข้าสู่ระบบด้วยบัญชีเว็บไซต์",
          exact: true,
        })
        .click();
      await expect(page.locator(".form-error[role=alert]")).toContainText(
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      );
      await expect(
        page.getByRole("button", {
          name: "เข้าสู่ระบบด้วยบัญชีเว็บไซต์",
          exact: true,
        }),
      ).toBeEnabled();
    }
    const key = createHash("sha256").update(email).digest("hex");
    expect(
      (await db.loginAttempt.findUniqueOrThrow({ where: { key } })).attempts,
    ).toBe(6);
    await db.loginAttempt.update({
      where: { key },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await page.getByLabel("อีเมล", { exact: true }).fill(email);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill(password);
    await page
      .getByRole("button", {
        name: "เข้าสู่ระบบด้วยบัญชีเว็บไซต์",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "จัดการ ATTG IT Info", exact: true }),
    ).toBeVisible();
    expect(await db.loginAttempt.findUnique({ where: { key } })).toBeNull();
  });
});

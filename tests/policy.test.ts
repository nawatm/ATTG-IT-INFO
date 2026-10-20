import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canEdit,
  canManageUsers,
  isIdentityConfigured,
} from "../src/lib/auth-config";
import { postSchema } from "../src/lib/validation";
test("only editors and administrators can edit; only administrators manage users", () => {
  for (const role of [undefined, "READER", "guest", ""]) {
    assert.equal(canEdit(role), false);
    assert.equal(canManageUsers(role), false);
  }
  assert.equal(canEdit("EDITOR"), true);
  assert.equal(canManageUsers("EDITOR"), false);
  assert.equal(canEdit("ADMIN"), true);
  assert.equal(canManageUsers("ADMIN"), true);
});
test("identity login fails closed with missing database, secret, or tenant-specific issuer", () => {
  const env = {
    DATABASE_URL: "postgresql://example/db",
    AUTH_SECRET: "test-only",
    AUTH_MICROSOFT_ENTRA_ID_ID: "id",
    AUTH_MICROSOFT_ENTRA_ID_SECRET: "secret",
    AUTH_MICROSOFT_ENTRA_ID_ISSUER:
      "https://login.microsoftonline.com/12345678-1234-1234-1234-123456789abc/v2.0",
  };
  assert.equal(isIdentityConfigured(env), true);
  for (const key of Object.keys(env))
    assert.equal(isIdentityConfigured({ ...env, [key]: "" }), false);
  assert.equal(
    isIdentityConfigured({
      ...env,
      AUTH_MICROSOFT_ENTRA_ID_ISSUER:
        "https://login.microsoftonline.com/common/v2.0",
    }),
    false,
  );
});
test("article input validates category, slug, and content before writing", () => {
  const valid = {
    title: "ตัวอย่างข่าวสาร IT",
    slug: "it-news",
    excerpt: "ข่าวสารสำหรับพนักงานภายในบริษัท",
    content: "เนื้อหาข่าวสารเกี่ยวกับการใช้งานเทคโนโลยีอย่างปลอดภัยในบริษัท",
    category: "NEWS",
    published: false,
    featured: false,
  };
  assert.equal(postSchema.safeParse(valid).success, true);
  for (const change of [
    { slug: "../../admin" },
    { category: "OTHER" },
    { content: "" },
    { published: "true" },
    { title: "" },
    { excerpt: "" },
  ])
    assert.equal(postSchema.safeParse({ ...valid, ...change }).success, false);
});

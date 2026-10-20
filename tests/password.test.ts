import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { localUserSchema } from "../src/lib/validation";
import {
  isAuthConfigured,
  isDirectoryImportConfigured,
} from "../src/lib/auth-config";
test("passwords use unique salts and verify without accepting invalid hashes", async () => {
  const password = "test-only-passphrase-2026";
  const [one, two] = await Promise.all([
    hashPassword(password),
    hashPassword(password),
  ]);
  assert.notEqual(one, two);
  assert.equal(one.includes(password), false);
  assert.equal(await verifyPassword(password, one), true);
  assert.equal(await verifyPassword("wrong", one), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.equal(await verifyPassword(password, "malformed"), false);
  assert.equal(await verifyPassword("x".repeat(129), one), false);
});
test("local user validation normalizes email and rejects short passwords and invalid roles", () => {
  const user = {
    name: "Local User",
    email: "USER@EXAMPLE.COM",
    password: "test-only-passphrase-2026",
    role: "EDITOR",
  };
  assert.equal(localUserSchema.parse(user).email, "user@example.com");
  for (const change of [
    { password: "short" },
    { role: "OWNER" },
    { email: "not-an-email" },
    { name: "" },
  ])
    assert.equal(
      localUserSchema.safeParse({ ...user, ...change }).success,
      false,
    );
});
test("local authentication does not depend on directory; import requires explicit configuration", () => {
  assert.equal(
    isAuthConfigured({
      DATABASE_URL: "postgresql://localhost/test",
      AUTH_SECRET: "test",
    }),
    true,
  );
  assert.equal(
    isAuthConfigured({ DATABASE_URL: "postgresql://localhost/test" }),
    false,
  );
  assert.equal(
    isDirectoryImportConfigured({ DIRECTORY_IMPORT_ENABLED: "true" }),
    false,
  );
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { searchDirectory, getDirectoryUser } from "../src/lib/directory";
test("directory connector escapes search and rejects disabled accounts using mocked Graph responses", async (t) => {
  const keys = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "AUTH_MICROSOFT_ENTRA_ID_ID",
    "AUTH_MICROSOFT_ENTRA_ID_SECRET",
    "AUTH_MICROSOFT_ENTRA_ID_ISSUER",
    "DIRECTORY_IMPORT_ENABLED",
  ];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  Object.assign(process.env, {
    DATABASE_URL: "postgresql://test/db",
    AUTH_SECRET: "test",
    AUTH_MICROSOFT_ENTRA_ID_ID: "test",
    AUTH_MICROSOFT_ENTRA_ID_SECRET: "test",
    AUTH_MICROSOFT_ENTRA_ID_ISSUER:
      "https://login.microsoftonline.com/12345678-1234-1234-1234-123456789abc/v2.0",
    DIRECTORY_IMPORT_ENABLED: "true",
  });
  const enabled = {
    id: "22345678-1234-4234-8234-123456789abc",
    displayName: "Directory User",
    mail: "user@example.invalid",
    userPrincipalName: "user@example.invalid",
    accountEnabled: true,
  };
  let disabled = false;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.hostname === "login.microsoftonline.com")
      return Response.json({ access_token: "mock-test-token" });
    assert.equal(url.hostname, "graph.microsoft.com");
    if (url.pathname === "/v1.0/users") {
      assert.equal(
        url.searchParams.get("$filter"),
        "startswith(displayName,'O''Brien') or startswith(userPrincipalName,'O''Brien') or startswith(mail,'O''Brien')",
      );
      assert.equal(url.searchParams.get("$top"), "10");
      return Response.json({
        value: [enabled, { ...enabled, accountEnabled: false }],
      });
    }
    return Response.json({ ...enabled, accountEnabled: !disabled });
  });
  try {
    const users = await searchDirectory("O'Brien");
    assert.equal(users.length, 1);
    assert.equal(users[0].email, "user@example.invalid");
    assert.equal((await getDirectoryUser(enabled.id)).id, enabled.id);
    disabled = true;
    await assert.rejects(() => getDirectoryUser(enabled.id));
    await assert.rejects(() => getDirectoryUser("../../other"));
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

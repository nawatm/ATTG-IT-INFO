export function isAuthConfigured(
  env: Record<string, string | undefined> = process.env,
) {
  return Boolean(env.DATABASE_URL && env.AUTH_SECRET);
}
export function isDirectoryImportConfigured(
  env: Record<string, string | undefined> = process.env,
) {
  return env.DIRECTORY_IMPORT_ENABLED === "true" && isIdentityConfigured(env);
}
export function isIdentityConfigured(
  env: Record<string, string | undefined> = process.env,
) {
  const issuer = env.AUTH_MICROSOFT_ENTRA_ID_ISSUER ?? "";
  return Boolean(
    env.AUTH_SECRET &&
    env.AUTH_MICROSOFT_ENTRA_ID_ID &&
    env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
    /^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]{36}\/v2\.0$/i.test(
      issuer,
    ) &&
    env.DATABASE_URL,
  );
}
export function canEdit(role?: string) {
  return role === "ADMIN" || role === "EDITOR";
}
export function canManageUsers(role?: string) {
  return role === "ADMIN";
}

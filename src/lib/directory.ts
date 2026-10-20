import { z } from "zod";
import { isDirectoryImportConfigured } from "./auth-config";
export type DirectoryUser = { id: string; name: string; email: string };
const directoryUserSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1),
  mail: z.string().email().nullable().optional(),
  userPrincipalName: z.string().email(),
  accountEnabled: z.boolean(),
});
export function directoryTenant() {
  return process.env
    .AUTH_MICROSOFT_ENTRA_ID_ISSUER!.split("/")[3]
    .toLowerCase();
}
async function graph(path: string, params?: URLSearchParams) {
  if (!isDirectoryImportConfigured())
    throw new Error("DIRECTORY_NOT_CONFIGURED");
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${directoryTenant()}/oauth2/v2.0/token`,
    {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      body: new URLSearchParams({
        client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
        client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default",
      }),
    },
  );
  if (!tokenResponse.ok) throw new Error("DIRECTORY_UNAVAILABLE");
  const { access_token } = await tokenResponse.json();
  if (typeof access_token !== "string")
    throw new Error("DIRECTORY_UNAVAILABLE");
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users${path}?${params ?? new URLSearchParams({ $select: "id,displayName,mail,userPrincipalName,accountEnabled" })}`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("DIRECTORY_UNAVAILABLE");
  return response.json();
}
function parseUser(raw: unknown): DirectoryUser | null {
  const p = directoryUserSchema.safeParse(raw);
  if (!p.success || !p.data.accountEnabled) return null;
  return {
    id: p.data.id.toLowerCase(),
    name: p.data.displayName,
    email: (p.data.mail ?? p.data.userPrincipalName).toLowerCase(),
  };
}
export async function searchDirectory(query: string) {
  // Escape OData string literals before URL encoding. Do not accept a client-supplied endpoint.
  const q = query.replaceAll("'", "''");
  const data = await graph(
    "",
    new URLSearchParams({
      $filter: `startswith(displayName,'${q}') or startswith(userPrincipalName,'${q}') or startswith(mail,'${q}')`,
      $select: "id,displayName,mail,userPrincipalName,accountEnabled",
      $top: "10",
    }),
  );
  if (!Array.isArray(data.value)) throw new Error("DIRECTORY_UNAVAILABLE");
  return data.value
    .map(parseUser)
    .filter(
      (u: DirectoryUser | null): u is DirectoryUser => u !== null,
    ) as DirectoryUser[];
}
export async function getDirectoryUser(id: string) {
  if (!z.string().uuid().safeParse(id).success)
    throw new Error("INVALID_DIRECTORY_USER");
  const user = parseUser(await graph(`/${id}`));
  if (!user) throw new Error("INVALID_DIRECTORY_USER");
  return user;
}

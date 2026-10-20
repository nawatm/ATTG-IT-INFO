import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
export async function authenticateLocal(credentials: unknown) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;
  const key = createHash("sha256").update(email).digest("hex");
  const allowed = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
    const now = new Date();
    await tx.loginAttempt.deleteMany({ where: { expiresAt: { lt: now } } });
    const attempt = await tx.loginAttempt.upsert({
      where: { key },
      create: {
        key,
        attempts: 1,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      update: { attempts: { increment: 1 } },
    });
    return attempt.attempts <= 5;
  });
  if (!allowed) return null;
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, source: "LOCAL" },
  });
  const valid = await verifyPassword(password, user?.passwordHash ?? null);
  if (!valid || !user?.enabled) return null;
  await prisma.loginAttempt.deleteMany({ where: { key } });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    sessionVersion: user.sessionVersion,
  };
}

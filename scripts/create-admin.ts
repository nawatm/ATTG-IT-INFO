import "dotenv/config";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { localUserSchema } from "../src/lib/validation";
import { hashPassword } from "../src/lib/password";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main() {
  const { values } = parseArgs({
    options: { email: { type: "string" }, name: { type: "string" } },
  });
  if (!values.email || !values.name)
    throw new Error(
      "Usage: npm run admin:create -- --email <email> --name <name>",
    );
  if (!process.stdin.isTTY)
    throw new Error(
      "Run in an interactive terminal to enter a hidden password.",
    );
  const hidden = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const prompt = createInterface({
    input: process.stdin,
    output: hidden,
    terminal: true,
  });
  let password: string;
  try {
    const answer = prompt.question("");
    process.stdout.write("รหัสผ่านแอดมินใหม่ (12–128 ตัวอักษร): ");
    password = await answer;
  } finally {
    prompt.close();
    process.stdout.write("\n");
  }
  const data = localUserSchema.parse({
    email: values.email,
    name: values.name,
    password,
    role: "ADMIN",
  });
  const passwordHash = await hashPassword(data.password);
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(5847731)::text`;
    if (await tx.user.findFirst({ where: { role: "ADMIN", enabled: true } }))
      throw new Error(
        "An administrator already exists. Add users through /admin instead.",
      );
    await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: "ADMIN",
        source: "LOCAL",
        subject: `local:${randomUUID()}`,
        passwordHash,
      },
    });
  });
  console.log("Created initial local administrator. No password was logged.");
}
main()
  .catch(() => {
    console.error(
      "Could not create administrator. Check inputs (password 12–128 characters), database access, or whether an admin/email already exists.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

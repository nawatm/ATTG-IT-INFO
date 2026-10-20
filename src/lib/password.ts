import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const dummy = `scrypt$32768$8$1$${"00".repeat(16)}$${"00".repeat(64)}`;
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt);
  return `scrypt$32768$8$1$${salt}$${key.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string | null) {
  const value = encoded ?? dummy;
  if (
    password.length > 128 ||
    !/^scrypt\$32768\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(value)
  )
    return false;
  const parts = value.split("$");
  const actual = await derive(password, parts[4]);
  return (
    timingSafeEqual(actual, Buffer.from(parts[5], "hex")) && encoded !== null
  );
}

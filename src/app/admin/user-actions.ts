"use server";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import {
  localUserSchema,
  passwordSchema,
  roleSchema,
  type ActionState,
} from "@/lib/validation";
import {
  directoryTenant,
  getDirectoryUser,
  searchDirectory,
  type DirectoryUser,
} from "@/lib/directory";
import { isDirectoryImportConfigured } from "@/lib/auth-config";
function duplicate(e: unknown) {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}
export async function createLocalUser(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const p = localUserSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0].message };
  const { password, ...data } = p.data;
  try {
    await prisma.user.create({
      data: {
        ...data,
        subject: `local:${randomUUID()}`,
        source: "LOCAL",
        passwordHash: await hashPassword(password),
      },
    });
  } catch (e) {
    if (duplicate(e))
      return {
        error:
          "อีเมลนี้มีผู้ใช้งานแล้ว ไม่สามารถเพิ่มซ้ำหรือเชื่อมบัญชีอัตโนมัติได้",
      };
    throw e;
  }
  revalidatePath("/admin");
  return { success: "เพิ่มผู้ใช้ภายในเว็บไซต์แล้ว" };
}
export type DirectorySearchState = ActionState & { users?: DirectoryUser[] };
export async function findDirectoryUsers(
  _state: DirectorySearchState,
  form: FormData,
): Promise<DirectorySearchState> {
  await requireAdmin();
  if (!isDirectoryImportConfigured())
    return { error: "ยังไม่ได้ตั้งค่าการเชื่อมต่อ Active Directory" };
  const q = z.string().trim().min(2).max(80).safeParse(form.get("query"));
  if (!q.success) return { error: "กรุณาระบุชื่อหรืออีเมล 2–80 ตัวอักษร" };
  try {
    const users = await searchDirectory(q.data);
    return {
      users,
      success: users.length
        ? `พบ ${users.length} บัญชี (แสดงสูงสุด 10 บัญชี)`
        : "ไม่พบบัญชีที่เปิดใช้งานตรงกับคำค้นหา",
    };
  } catch {
    return {
      error:
        "ติดต่อ Active Directory ไม่สำเร็จ กรุณาให้ทีม IT ตรวจสอบการเชื่อมต่อและสิทธิ์อ่านรายชื่อ",
    };
  }
}
export async function importDirectoryUser(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (!isDirectoryImportConfigured())
    return { error: "ยังไม่ได้ตั้งค่าการเชื่อมต่อ Active Directory" };
  const p = z
    .object({ directoryId: z.string().uuid(), role: roleSchema })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "ข้อมูลบัญชีหรือสิทธิ์ไม่ถูกต้อง" };
  let person: DirectoryUser;
  try {
    person = await getDirectoryUser(p.data.directoryId);
  } catch {
    return { error: "ตรวจสอบบัญชีจาก Active Directory ไม่สำเร็จ" };
  }
  try {
    await prisma.user.create({
      data: {
        subject: `${directoryTenant()}:${person.id}`,
        name: person.name,
        email: person.email,
        source: "DIRECTORY",
        role: p.data.role,
      },
    });
  } catch (e) {
    if (duplicate(e))
      return {
        error: "บัญชีหรืออีเมลนี้มีอยู่แล้ว กรุณาจัดการสิทธิ์ในรายชื่อผู้ใช้",
      };
    throw e;
  }
  revalidatePath("/admin");
  return { success: "เพิ่มผู้ใช้จาก Active Directory แล้ว" };
}
export async function setUserEnabled(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const actor = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const enabled = form.get("enabled") === "true";
  if (id === actor.id) return { error: "ไม่สามารถปิดใช้งานบัญชีของตนเองได้" };
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(5847731)::text`;
    const current = await tx.user.findUnique({ where: { id: actor.id } });
    if (!current?.enabled || current.role !== "ADMIN")
      throw new Error("ไม่มีสิทธิ์จัดการผู้ใช้");
    await tx.user.update({
      where: { id },
      data: { enabled, sessionVersion: { increment: 1 } },
    });
  });
  revalidatePath("/admin");
  return {
    success: enabled
      ? "เปิดใช้งานแล้ว"
      : "ปิดใช้งานแล้ว และยกเลิก session เดิม",
  };
}
export async function resetLocalPassword(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const p = passwordSchema.safeParse(form.get("password"));
  if (!p.success) return { error: p.error.issues[0].message };
  const user = await prisma.user.findUnique({
    where: { id: String(form.get("id") ?? "") },
  });
  if (!user || user.source !== "LOCAL")
    return { error: "เปลี่ยนรหัสผ่านได้เฉพาะบัญชีภายในเว็บไซต์" };
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(p.data),
      sessionVersion: { increment: 1 },
    },
  });
  revalidatePath("/admin");
  return { success: "เปลี่ยนรหัสผ่านแล้ว และยกเลิก session เดิม" };
}

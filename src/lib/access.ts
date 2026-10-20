import "server-only";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { canEdit, isAuthConfigured } from "./auth-config";
export async function currentUser() {
  if (!isAuthConfigured()) return null;
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.enabled ? user : null;
}
export async function requireEditor() {
  const user = await currentUser();
  if (!user || !canEdit(user.role)) throw new Error("ไม่มีสิทธิ์จัดการเนื้อหา");
  return user;
}
export async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN")
    throw new Error("ไม่มีสิทธิ์จัดการผู้ใช้งาน");
  return user;
}

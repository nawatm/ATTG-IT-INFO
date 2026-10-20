"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireEditor } from "@/lib/access";
import { postSchema, type ActionState } from "@/lib/validation";
export async function savePost(
  id: string | null,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const user = await requireEditor();
  const parsed = postSchema.safeParse({
    ...Object.fromEntries(form),
    published: form.get("published") === "on",
    featured: form.get("featured") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    if (id) await prisma.post.update({ where: { id }, data: parsed.data });
    else
      await prisma.post.create({ data: { ...parsed.data, authorId: user.id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { error: "URL นี้มีอยู่แล้ว โปรดใช้ URL อื่น" };
    throw e;
  }
  revalidatePath("/", "layout");
  redirect("/admin?saved=1");
}
export async function deletePost(id: string) {
  await requireEditor();
  await prisma.post.delete({ where: { id } });
  revalidatePath("/", "layout");
}
export async function changeRole(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const role = String(form.get("role") ?? "");
  if (!["ADMIN", "EDITOR", "READER"].includes(role))
    return { error: "สิทธิ์ไม่ถูกต้อง" };
  if (id === user.id)
    return {
      error: "ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้ ให้แอดมินคนอื่นดำเนินการ",
    };
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(5847731)::text`;
    const current = await tx.user.findUnique({ where: { id: user.id } });
    if (!current?.enabled || current.role !== "ADMIN")
      throw new Error("ไม่มีสิทธิ์จัดการผู้ใช้");
    await tx.user.update({
      where: { id },
      data: { role: role as "ADMIN" | "EDITOR" | "READER" },
    });
  });
  revalidatePath("/admin");
  return { success: "บันทึกสิทธิ์แล้ว" };
}

export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/access";
import { canEdit } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/admin-forms";
export default async function EditPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user || !canEdit(user.role)) redirect("/admin");
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <main id="main" className="shell page-content">
      <Link href="/admin" className="breadcrumb">
        ← กลับหน้าจัดการ
      </Link>
      <section className="admin-panel">
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>
          แก้ไขบทความ
        </h1>
        <PostForm post={post} />
      </section>
    </main>
  );
}

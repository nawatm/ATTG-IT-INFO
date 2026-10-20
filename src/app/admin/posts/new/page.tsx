export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import { canEdit } from "@/lib/auth-config";
import { PostForm } from "@/components/admin-forms";
export default async function NewPost() {
  const user = await currentUser();
  if (!user || !canEdit(user.role)) redirect("/admin");
  return (
    <main id="main" className="shell page-content">
      <Link href="/admin" className="breadcrumb">
        ← กลับหน้าจัดการ
      </Link>
      <section className="admin-panel">
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>
          เพิ่มบทความใหม่
        </h1>
        <PostForm />
      </section>
    </main>
  );
}

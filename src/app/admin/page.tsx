import { UserManagement } from "@/components/user-management";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, LogOut } from "lucide-react";
import { currentUser } from "@/lib/access";
import { canEdit, isDirectoryImportConfigured } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { categories, formatDate } from "@/lib/content";
import { DeletePost } from "@/components/admin-forms";
import { signOut } from "@/auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "จัดการเนื้อหา" };
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const logout = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button className="secondary-button">
        <LogOut size={14} /> ออกจากระบบ
      </button>
    </form>
  );
  if (!canEdit(user.role))
    return (
      <main id="main" className="shell page-content">
        <div className="login-panel">
          <h1>รอการอนุมัติสิทธิ์</h1>
          <p>
            บัญชี {user.email} เข้าสู่ระบบแล้ว แต่ยังไม่มีสิทธิ์จัดการเนื้อหา
            กรุณาติดต่อแอดมินเพื่อขอสิทธิ์
          </p>
          {logout}
        </div>
      </main>
    );
  const [posts, users] = await Promise.all([
    prisma.post.findMany({ orderBy: { createdAt: "desc" } }),
    user.role === "ADMIN"
      ? prisma.user.findMany({
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            source: true,
            enabled: true,
          },
        })
      : Promise.resolve([]),
  ]);
  const { saved } = await searchParams;
  return (
    <main id="main" className="shell page-content">
      <div className="dashboard-title">
        <div>
          <div className="eyebrow">CONTENT MANAGEMENT</div>
          <h1>จัดการ ATTG IT Info</h1>
          <p>
            {user.name} ·{" "}
            {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ผู้จัดการเนื้อหา"}
          </p>
        </div>
        <div className="form-actions">
          <Link href="/admin/posts/new" className="primary-button">
            <Plus size={16} /> เพิ่มบทความ
          </Link>
          {logout}
        </div>
      </div>
      {saved && (
        <p role="status" className="notice">
          บันทึกบทความเรียบร้อยแล้ว
        </p>
      )}
      <section className="admin-panel">
        <h2>บทความทั้งหมด ({posts.length})</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>หัวข้อ</th>
                <th>หมวดหมู่</th>
                <th>สถานะ</th>
                <th>วันที่</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link href={`/admin/posts/${post.id}`}>{post.title}</Link>
                  </td>
                  <td>{categories[post.category]}</td>
                  <td>
                    {post.published ? "เผยแพร่" : "ฉบับร่าง"}
                    {post.featured ? " · เรื่องเด่น" : ""}
                  </td>
                  <td>{formatDate(post.createdAt)}</td>
                  <td>
                    <DeletePost id={post.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!posts.length && (
          <p className="admin-help">
            ยังไม่มีบทความ เริ่มต้นด้วยปุ่มเพิ่มบทความ
          </p>
        )}
      </section>
      {user.role === "ADMIN" && (
        <UserManagement
          users={users}
          currentUserId={user.id}
          directoryEnabled={isDirectoryImportConfigured()}
        />
      )}
    </main>
  );
}

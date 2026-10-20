"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changeRole, deletePost, savePost } from "@/app/admin/actions";
import { categories } from "@/lib/content";
import type { Post } from "@prisma/client";
function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="primary-button">
      {pending ? "กำลังบันทึก..." : children}
    </button>
  );
}
export function PostForm({ post }: { post?: Post }) {
  const [state, action] = useActionState(
    savePost.bind(null, post?.id ?? null),
    {},
  );
  return (
    <form action={action} className="admin-form">
      <label>
        หัวข้อบทความ
        <input
          name="title"
          required
          minLength={5}
          maxLength={180}
          defaultValue={post?.title}
        />
      </label>
      <div className="form-split">
        <label>
          URL บทความ (เช่น it-service-guide)
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            minLength={3}
            maxLength={160}
            defaultValue={post?.slug}
          />
        </label>
        <label>
          หมวดหมู่
          <select name="category" defaultValue={post?.category ?? "NEWS"}>
            {Object.entries(categories).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        คำโปรย
        <textarea
          name="excerpt"
          required
          minLength={15}
          maxLength={400}
          defaultValue={post?.excerpt}
          style={{ minHeight: 80 }}
        />
      </label>
      <label>
        เนื้อหา (เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่)
        <textarea
          name="content"
          required
          minLength={30}
          maxLength={100000}
          defaultValue={post?.content}
          style={{ minHeight: 300 }}
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published}
        />
        เผยแพร่ให้พนักงานอ่าน
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={post?.featured}
        />
        แสดงในเรื่องเด่น (หากมีหลายเรื่อง ระบบเลือกเรื่องใหม่ที่สุด)
      </label>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <div className="form-actions">
        <Submit>บันทึกบทความ</Submit>
      </div>
    </form>
  );
}
export function DeletePost({ id }: { id: string }) {
  const { pending } = useFormStatus();
  return (
    <form
      action={deletePost.bind(null, id)}
      className="delete-form"
      onSubmit={(e) => {
        if (!window.confirm("ยืนยันลบบทความนี้? ไม่สามารถกู้คืนจากระบบได้"))
          e.preventDefault();
      }}
    >
      <button disabled={pending} className="danger-button">
        ลบ
      </button>
    </form>
  );
}
export function RoleForm({
  id,
  role,
  disabled,
}: {
  id: string;
  role: string;
  disabled: boolean;
}) {
  const [state, action] = useActionState(changeRole, {});
  return (
    <form action={action}>
      <div className="admin-user-form">
        <input type="hidden" name="id" value={id} />
        <label>
          <span className="sr-only">สิทธิ์ผู้ใช้งาน</span>
          <select name="role" defaultValue={role} disabled={disabled}>
            <option value="READER">อ่านเท่านั้น</option>
            <option value="EDITOR">จัดการเนื้อหา</option>
            <option value="ADMIN">แอดมิน</option>
          </select>
        </label>
        {!disabled && <Submit>บันทึก</Submit>}
      </div>
      <span
        role="status"
        className={state.error ? "form-error" : "form-success"}
      >
        {state.error ?? state.success}
      </span>
    </form>
  );
}

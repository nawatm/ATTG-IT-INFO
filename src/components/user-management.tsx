"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createLocalUser,
  findDirectoryUsers,
  importDirectoryUser,
  resetLocalPassword,
  setUserEnabled,
} from "@/app/admin/user-actions";
import { RoleForm } from "./admin-forms";
import type { DirectoryUser } from "@/lib/directory";
const roleOptions = (
  <>
    <option value="READER">อ่านเท่านั้น</option>
    <option value="EDITOR">จัดการเนื้อหา</option>
    <option value="ADMIN">แอดมิน</option>
  </>
);
function Feedback({ state }: { state: { error?: string; success?: string } }) {
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={state.error ? "form-error" : "form-success"}
    >
      {state.error ?? state.success}
    </p>
  );
}
function LocalUserForm() {
  const [state, action, pending] = useActionState(createLocalUser, {});
  return (
    <form action={action} className="admin-form">
      <div className="form-split">
        <label>
          ชื่อผู้ใช้
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="off"
          />
        </label>
        <label>
          อีเมลผู้ใช้
          <input
            type="email"
            name="email"
            required
            maxLength={254}
            autoComplete="off"
          />
        </label>
      </div>
      <div className="form-split">
        <label>
          รหัสผ่านเริ่มต้น
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
          />
          <span className="admin-help">
            12–128 ตัวอักษร ส่งให้ผู้ใช้ผ่านช่องทางที่ปลอดภัย
          </span>
        </label>
        <label>
          สิทธิ์เริ่มต้น
          <select name="role" defaultValue="READER">
            {roleOptions}
          </select>
        </label>
      </div>
      <Feedback state={state} />
      <div>
        <button className="primary-button" disabled={pending}>
          {pending ? "กำลังเพิ่มผู้ใช้..." : "เพิ่มผู้ใช้เว็บไซต์"}
        </button>
      </div>
    </form>
  );
}
function ImportUser({ user }: { user: DirectoryUser }) {
  const [state, action, pending] = useActionState(importDirectoryUser, {});
  return (
    <li className="directory-result">
      <div>
        <strong>{user.name}</strong>
        <p className="admin-help">{user.email}</p>
      </div>
      <form action={action} className="admin-user-form">
        <input type="hidden" name="directoryId" value={user.id} />
        <label>
          <span className="sr-only">สิทธิ์ของ {user.name}</span>
          <select name="role" defaultValue="READER">
            {roleOptions}
          </select>
        </label>
        <button
          disabled={pending || Boolean(state.success)}
          className="secondary-button"
        >
          {pending
            ? "กำลังเพิ่ม..."
            : state.success
              ? "เพิ่มแล้ว"
              : "เพิ่มจาก AD"}
        </button>
        <Feedback state={state} />
      </form>
    </li>
  );
}
function DirectoryForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(findDirectoryUsers, {});
  return (
    <div>
      <p className="admin-help">
        ค้นหาบัญชีบริษัทที่เปิดใช้งาน แล้วเลือกเพิ่มเข้าระบบพร้อมกำหนดสิทธิ์
        โดยไม่ต้องรอให้ผู้ใช้เข้าสู่ระบบก่อน
      </p>
      {!enabled && (
        <div className="notice">
          <strong>ยังไม่ได้ตั้งค่าการเชื่อมต่อ Active Directory</strong>
          <p>ตั้งค่าการเชื่อมต่อได้ภายหลัง บัญชีเว็บไซต์ยังใช้งานได้ตามปกติ</p>
          <Link href="/admin/settings/directory" className="text-link">
            ดูสถานะและวิธีตั้งค่า AD →
          </Link>
        </div>
      )}
      <form action={action} className="admin-form">
        <label>
          ค้นหาชื่อหรืออีเมลใน AD
          <input
            name="query"
            minLength={2}
            maxLength={80}
            required
            disabled={!enabled}
          />
        </label>
        <div>
          <button disabled={!enabled || pending} className="primary-button">
            {pending ? "กำลังค้นหา..." : "ค้นหาผู้ใช้จาก AD"}
          </button>
        </div>
        <Feedback state={state} />
      </form>
      {state.users && (
        <ul className="directory-results">
          {state.users.map((user) => (
            <ImportUser key={user.id} user={user} />
          ))}
        </ul>
      )}
    </div>
  );
}
function AccountControls({
  id,
  enabled,
  local,
  own,
}: {
  id: string;
  enabled: boolean;
  local: boolean;
  own: boolean;
}) {
  const [status, enableAction, statusPending] = useActionState(
    setUserEnabled,
    {},
  );
  const [password, passwordAction, passwordPending] = useActionState(
    resetLocalPassword,
    {},
  );
  return (
    <div className="account-controls">
      {!own && (
        <form action={enableAction}>
          <input name="id" type="hidden" value={id} />
          <input name="enabled" type="hidden" value={String(!enabled)} />
          <button disabled={statusPending} className="secondary-button">
            {enabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}
          </button>
          <Feedback state={status} />
        </form>
      )}
      {local && (
        <details>
          <summary>ตั้งรหัสผ่านใหม่</summary>
          <form action={passwordAction} className="admin-form">
            <input name="id" type="hidden" value={id} />
            <label>
              รหัสผ่านใหม่
              <input
                type="password"
                name="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            <button disabled={passwordPending} className="secondary-button">
              บันทึกรหัสผ่านใหม่
            </button>
            <Feedback state={password} />
          </form>
        </details>
      )}
    </div>
  );
}
export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  source: "LOCAL" | "DIRECTORY";
  enabled: boolean;
};
export function UserManagement({
  users,
  currentUserId,
  directoryEnabled,
}: {
  users: ManagedUser[];
  currentUserId: string;
  directoryEnabled: boolean;
}) {
  const [source, setSource] = useState<"LOCAL" | "DIRECTORY">("LOCAL");
  return (
    <section className="admin-panel" aria-labelledby="user-management-title">
      <h2 id="user-management-title">จัดการสิทธิ์ผู้ใช้งาน</h2>
      <div className="filter-tabs" role="group" aria-label="วิธีเพิ่มผู้ใช้">
        <button
          type="button"
          aria-pressed={source === "LOCAL"}
          onClick={() => setSource("LOCAL")}
          className={source === "LOCAL" ? "active" : ""}
        >
          เพิ่มผู้ใช้โดยตรง
        </button>
        <button
          type="button"
          aria-pressed={source === "DIRECTORY"}
          onClick={() => setSource("DIRECTORY")}
          className={source === "DIRECTORY" ? "active" : ""}
        >
          เพิ่มจาก Active Directory
        </button>
      </div>
      <div className="user-create-panel">
        {source === "LOCAL" ? (
          <LocalUserForm />
        ) : (
          <DirectoryForm enabled={directoryEnabled} />
        )}
      </div>
      <h3 className="mb-3 font-semibold">ผู้ใช้งานทั้งหมด ({users.length})</h3>
      <p className="admin-help">
        ผู้จัดการเนื้อหาแก้ไขและลบบทความทั้งหมดได้ · แอดมินจัดการผู้ใช้เพิ่มได้
        · การปิดใช้งานบัญชีและตั้งรหัสผ่านใหม่จะยกเลิก session เดิม
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ผู้ใช้งาน</th>
              <th>ประเภทบัญชี</th>
              <th>สถานะ</th>
              <th>สิทธิ์</th>
              <th>จัดการบัญชี</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>
                    {user.name}
                    {user.id === currentUserId ? " (คุณ)" : ""}
                  </strong>
                  <br />
                  {user.email}
                </td>
                <td>
                  {user.source === "LOCAL"
                    ? "บัญชีเว็บไซต์"
                    : "Active Directory"}
                </td>
                <td>{user.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}</td>
                <td>
                  <RoleForm
                    id={user.id}
                    role={user.role}
                    disabled={user.id === currentUserId}
                  />
                </td>
                <td>
                  <AccountControls
                    id={user.id}
                    local={user.source === "LOCAL"}
                    enabled={user.enabled}
                    own={user.id === currentUserId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

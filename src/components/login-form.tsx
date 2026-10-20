"use client";
import { useActionState } from "react";
import { loginLocal } from "@/app/login/actions";
export function LoginForm() {
  const [state, action, pending] = useActionState(loginLocal, {});
  return (
    <form action={action} className="admin-form">
      <label>
        อีเมล
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          maxLength={254}
        />
      </label>
      <label>
        รหัสผ่าน
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <button className="primary-button" disabled={pending}>
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วยบัญชีเว็บไซต์"}
      </button>
    </form>
  );
}

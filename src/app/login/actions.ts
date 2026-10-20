"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isAuthConfigured } from "@/lib/auth-config";
import type { ActionState } from "@/lib/validation";
export async function loginLocal(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!isAuthConfigured()) return { error: "ยังไม่ได้ตั้งค่าระบบเข้าสู่ระบบ" };
  try {
    await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirectTo: "/admin",
    });
  } catch (e) {
    if (e instanceof AuthError)
      return {
        error:
          "อีเมลหรือรหัสผ่านไม่ถูกต้อง บัญชีอาจถูกปิดใช้งาน หากลองหลายครั้งกรุณารอ 15 นาที",
      };
    throw e;
  }
  return {};
}

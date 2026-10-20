import Link from "next/link";
import { LockKeyhole, ArrowLeft, ArrowUpRight } from "lucide-react";
import { signIn } from "@/auth";
import { isAuthConfigured, isIdentityConfigured } from "@/lib/auth-config";
import { LoginForm } from "@/components/login-form";
export const dynamic = "force-dynamic";
export const metadata = { title: "เข้าสู่ระบบผู้ดูแล" };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const enabled = isIdentityConfigured();
  return (
    <main id="main" className="shell page-content">
      <Link href="/" className="breadcrumb">
        <ArrowLeft size={15} /> กลับหน้าข่าวสาร
      </Link>
      <section className="login-panel">
        <LockKeyhole size={32} />
        <div className="eyebrow" style={{ marginTop: 20 }}>
          FOR OUR IT TEAM
        </div>
        <h1>พื้นที่สำหรับผู้ดูแล</h1>
        <p>
          จัดการข่าวสารและแบ่งปันความรู้ให้พนักงาน
          ด้วยบัญชีที่ได้รับสิทธิ์จากบริษัท
        </p>
        {error && (
          <p role="alert" className="form-error">
            ไม่สามารถเข้าสู่ระบบได้ โปรดตรวจสอบบัญชีและติดต่อผู้ดูแลระบบ
          </p>
        )}
        {isAuthConfigured() && (
          <>
            <h2 className="mb-4 font-semibold">บัญชีภายในเว็บไซต์</h2>
            <LoginForm />
            <hr className="my-6 border-[#e2e8e4]" />
          </>
        )}
        <h2 className="mb-4 font-semibold">บัญชีบริษัท / Active Directory</h2>
        {enabled ? (
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/admin" });
            }}
          >
            <button className="primary-button" type="submit">
              เข้าสู่ระบบด้วยบัญชีบริษัท <ArrowUpRight size={16} />
            </button>
          </form>
        ) : (
          <div className="notice">
            <strong>ยังไม่ได้เชื่อมต่อ Active Directory</strong>
            <br />
            สามารถตั้งค่าการเชื่อมต่อบัญชีบริษัทได้ในภายหลัง
            พนักงานยังสามารถอ่านข่าวได้โดยไม่ต้องเข้าสู่ระบบ
          </div>
        )}
        <p className="admin-help" style={{ marginTop: 24 }}>
          เฉพาะผู้ที่ได้รับสิทธิ์เท่านั้นที่สามารถแก้ไขเนื้อหาได้
        </p>
      </section>
    </main>
  );
}

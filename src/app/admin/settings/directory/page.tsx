import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import {
  isDirectoryImportConfigured,
  isIdentityConfigured,
} from "@/lib/auth-config";
export const dynamic = "force-dynamic";
export default async function DirectorySettings() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/admin");
  return (
    <main id="main" className="shell page-content">
      <Link href="/admin" className="breadcrumb">
        ← กลับหน้าจัดการผู้ใช้
      </Link>
      <section className="admin-panel">
        <h1 className="mb-5 text-2xl font-bold">
          การเชื่อมต่อ Active Directory
        </h1>
        <p>
          บัญชีเว็บไซต์ใช้งานได้โดยไม่ต้องเชื่อมต่อ AD สามารถให้ทีม IT
          ตั้งค่าการเชื่อมต่อในภายหลังได้
        </p>
        <div className="notice">
          <p>
            เข้าสู่ระบบบัญชีบริษัท:{" "}
            {isIdentityConfigured()
              ? "ตั้งค่าแล้ว — ยังต้องทดสอบกับบริษัท"
              : "ยังไม่ได้ตั้งค่า"}
          </p>
          <p>
            นำเข้ารายชื่อ:{" "}
            {isDirectoryImportConfigured()
              ? "เปิดใช้งาน — ยังต้องตรวจสอบสิทธิ์ Microsoft Graph"
              : "ยังไม่ได้เปิดใช้งาน"}
          </p>
        </div>
        <h2>ขั้นตอนสำหรับทีม IT</h2>
        <ol className="list-decimal space-y-3 pl-6">
          <li>
            ยืนยันว่าบริษัทใช้ Microsoft Entra ID หรือ AD ภายใน หากใช้ LDAP/AD
            FS ต้องเพิ่มตัวเชื่อมต่อตามระบบจริง
          </li>
          <li>
            สำหรับ Entra ID ให้ตั้ง App Registration แบบ single tenant และ
            callback ที่ <code>/api/auth/callback/microsoft-entra-id</code>
          </li>
          <li>
            ตั้งค่า Client ID, Client secret และ tenant issuer ผ่าน environment
            ของเซิร์ฟเวอร์ โดยไม่ส่งรหัสลับในแชต
          </li>
          <li>
            อนุญาต Microsoft Graph Application permission:{" "}
            <code>User.Read.All</code> พร้อม admin consent
            เพื่ออ่านและตรวจสอบบัญชีที่เปิดใช้งาน
          </li>
          <li>
            ตั้ง <code>DIRECTORY_IMPORT_ENABLED=true</code>{" "}
            แล้วเริ่มเซิร์ฟเวอร์ใหม่
            จากนั้นค้นหาและนำเข้าผู้ใช้จากหน้าจัดการผู้ใช้
          </li>
        </ol>
        <p className="notice">
          บัญชี AD จะยืนยันตัวตนกับบริษัท ไม่สามารถตั้งรหัสผ่าน AD
          จากเว็บไซต์นี้
          และจะไม่ผูกกับบัญชีเว็บไซต์ที่ใช้อีเมลเดียวกันโดยอัตโนมัติ
        </p>
      </section>
    </main>
  );
}

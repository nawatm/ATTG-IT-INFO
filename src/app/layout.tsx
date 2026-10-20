import type { Metadata } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components/navbar";
export const metadata: Metadata = {
  title: {
    default: "ATTG IT Info — เชื่อมต่อทุกเรื่อง IT",
    template: "%s | ATTG IT Info",
  },
  description: "ข่าวสาร ความรู้ และความปลอดภัยด้าน IT สำหรับพนักงาน ATTG",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <a href="#main" className="skip-link">
          ข้ามไปยังเนื้อหา
        </a>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

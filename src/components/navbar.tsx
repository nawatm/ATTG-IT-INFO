import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
export function Navbar() {
  return (
    <header className="site-header">
      <nav aria-label="เมนูหลัก" className="shell nav">
        <Link href="/" className="brand" aria-label="ATTG IT Info หน้าแรก">
          <span className="brand-mark">
            ATTG<span>●</span>
          </span>
          <span className="brand-divider" />
          <span className="brand-sub">
            IT INFO<span>IT SYSTEM MANAGEMENT</span>
          </span>
        </Link>
        <Link href="/#news" className="nav-news">
          News <ArrowUpRight size={14} />
        </Link>
        <Link href="/admin" className="admin-link">
          <LockKeyhole size={15} />
          <span>Login Admin</span>
          <ArrowUpRight size={14} />
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <Link href="/" className="brand-mark">
          ATTG<span>●</span>
        </Link>
        <p>
          เชื่อมต่อความรู้ ดูแลความปลอดภัย ไปด้วยกัน
          <br />
          <span>IT System Management · ATTG IT Info</span>
        </p>
        <span className="footer-note">เพื่อพนักงาน ATTG ทุกคน</span>
      </div>
    </footer>
  );
}

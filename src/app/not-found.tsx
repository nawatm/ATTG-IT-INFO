import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="shell page-content">
      <div className="empty-state">
        <span className="eyebrow">404 / PAGE NOT FOUND</span>
        <h1>ไม่พบหน้าที่คุณต้องการ</h1>
        <p>บทความนี้อาจยังไม่ได้เผยแพร่ หรือถูกลบไปแล้ว</p>
        <Link href="/" className="primary-button">
          กลับหน้าข่าวสาร
        </Link>
      </div>
    </main>
  );
}

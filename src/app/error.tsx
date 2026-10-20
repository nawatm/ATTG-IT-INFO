"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="shell page-content">
      <div className="empty-state">
        <h1>ไม่สามารถโหลดข้อมูลได้ในขณะนี้</h1>
        <p>โปรดลองอีกครั้ง หรือติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่</p>
        <button onClick={reset} className="primary-button">
          ลองอีกครั้ง
        </button>
      </div>
    </main>
  );
}

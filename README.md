# ATTG IT Info

เว็บข่าวสารภายในบริษัทจากแผนก IT System Management ใช้ Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, Prisma และ PostgreSQL

## สิ่งที่มีในเวอร์ชันนี้

- พนักงานอ่านข่าวและบทความได้โดยไม่ต้องเข้าสู่ระบบ ค้นหาและกรอง 3 หมวดหมู่ได้
- หน้าอ่านบทความ รองรับมือถือ แท็บเล็ต เดสก์ท็อป และ reduced motion
- CMS เพิ่ม แก้ไข ลบ ฉบับร่าง เผยแพร่ และเลือกเรื่องเด่น
- `READER` อ่านอย่างเดียว, `EDITOR` จัดการบทความทั้งหมด, `ADMIN` จัดการบทความและสิทธิ์ผู้ใช้งาน
- เตรียม Auth.js Microsoft Entra ID แบบ single tenant; **ยังไม่ได้เชื่อมต่อ AD ของบริษัทจริง** หากบริษัทใช้ LDAP/AD FS ต้องปรับผู้ให้บริการหลังทราบข้อมูล
- ผู้ดูแลเพิ่มบัญชีเว็บไซต์ด้วยชื่อ อีเมล รหัสผ่าน และสิทธิ์ได้โดยตรง โดยไม่ต้องเชื่อม AD
- ค้นหาและเพิ่มบัญชีจาก Entra ID ผ่าน Microsoft Graph ได้หลังตั้งค่าการเชื่อมต่อ บัญชี AD ไม่เก็บรหัสผ่านในเว็บ
- เปิด–ปิดบัญชี และตั้งรหัสผ่านใหม่สำหรับบัญชีเว็บไซต์ โดยยกเลิก session เดิมทันที
- ไม่มีบัญชีแอดมินสาธารณะหรือรหัสผ่านเริ่มต้น ต้องสร้างแอดมินคนแรกผ่านคำสั่ง bootstrap ที่ระบุด้านล่าง

## เริ่มต้นสำหรับผู้พัฒนาครั้งแรก

ต้องมี Node.js 22.12 ขึ้นไป (ทดสอบบน 24), npm และ PostgreSQL 17 หรือ Docker Compose

```bash
npm ci
cp .env.example .env
# แก้ DATABASE_URL และ POSTGRES_PASSWORD ให้ตรงกัน
# ค่าที่ให้มาใช้ทดสอบในเครื่องเท่านั้น เปลี่ยนรหัสผ่านก่อนใช้งานจริง

docker compose up -d db
npm run db:generate
npm run db:deploy
# ทางเลือก: เพิ่ม 5 บทความตัวอย่าง คำสั่งนี้ไม่ทับบทความเดิม
npm run db:seed
npm run dev
```

เปิดเว็บพัฒนาที่พอร์ต 3000 หน้าผู้ดูแลอยู่ `/admin` หากต้องการดูหน้าจออย่างเดียวโดยไม่ใช้ฐานข้อมูล ให้ไม่กำหนด `DATABASE_URL` ระบบจะแสดงข้อมูลตัวอย่างพร้อมป้ายกำกับ ไม่รองรับการบันทึกในโหมดนี้

บทความตัวอย่างไม่ใช่ประกาศจริงของบริษัท ให้แอดมินปรับเนื้อหาและช่องทางติดต่อก่อนใช้งานจริง

## บัญชีเว็บไซต์และแอดมินคนแรก

1. ตั้ง `AUTH_SECRET` ใน `.env` เป็นค่าที่สร้างด้วย `openssl rand -base64 32` (ไม่ใช้ค่าตัวอย่าง และไม่ commit ไฟล์นี้) แล้วเริ่มเซิร์ฟเวอร์ใหม่
2. หลังรัน migration แล้ว สร้างแอดมินคนแรกจาก terminal แบบ interactive:

```bash
npm run admin:create -- --email your.name@company.com --name "ชื่อผู้ดูแล"
```

คำสั่งจะถามรหัสผ่านโดยไม่แสดงอักขระ และใช้ได้เฉพาะเมื่อยังไม่มีแอดมินที่เปิดใช้งาน ระบบไม่เปิดให้บุคคลทั่วไปสมัครเป็นแอดมินผ่านเว็บ

3. เข้า `/login` เลือกบัญชีเว็บไซต์ ใช้อีเมลและรหัสผ่านที่ตั้งไว้
4. ใน `/admin` ส่วน **จัดการสิทธิ์ผู้ใช้งาน** เลือก **เพิ่มผู้ใช้โดยตรง** กรอกชื่อ อีเมล รหัสผ่าน 12–128 ตัวอักษร และสิทธิ์
5. ผู้ดูแลสามารถเปิด–ปิดบัญชี และตั้งรหัสผ่านใหม่ให้บัญชีเว็บไซต์จากตารางได้ บัญชีของตนเองปิดใช้งานหรือลดสิทธิ์เองไม่ได้

รหัสผ่านเก็บเป็น scrypt hash พร้อม salt ไม่เก็บ plaintext และไม่แสดงรหัสเดิม การรีเซ็ตรหัสผ่านหรือปิดบัญชีจะยกเลิก session เดิมทั้งหมด การเข้าสู่ระบบบัญชีเว็บไซต์จำกัด 5 ครั้งต่ออีเมลใน 15 นาที โดยบันทึกจำนวนครั้งใน PostgreSQL ใช้ HTTPS ก่อนใช้งานจริง และส่งรหัสเริ่มต้นผ่านช่องทางที่ปลอดภัย

## เชื่อมบัญชีบริษัท (ให้ทีม IT ช่วยตั้งค่า)

1. ตรวจสอบก่อนว่าบริษัทใช้ Entra ID, AD FS หรือ LDAP ระบบเวอร์ชันนี้เตรียมเฉพาะ Entra ID ไว้
2. สร้าง App Registration แบบ single tenant กำหนด redirect URI เป็น `https://<โดเมนเว็บ>/api/auth/callback/microsoft-entra-id` (local development ใช้ origin ของเครื่องพัฒนา)
3. ตั้ง `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET` และ `AUTH_MICROSOFT_ENTRA_ID_ISSUER=https://login.microsoftonline.com/<tenant-UUID>/v2.0` ในระบบจัดเก็บ secrets ของเซิร์ฟเวอร์ ไม่ใช้ `common` หรือ tenant ส่วนบุคคล
4. สร้าง `AUTH_SECRET` ด้วย `openssl rand -base64 32` และตั้ง `AUTH_URL` เป็น origin จริงของเว็บ ใช้ HTTPS ใน production
5. กำหนด `BOOTSTRAP_ADMIN_SUBJECT=<tenant-UUID>:<object-UUID>` โดยใช้ Tenant ID และ Object ID ของผู้ดูแลคนแรกจาก Entra ค่านี้ไม่ใช่อีเมล เมื่อผู้ใช้คนนี้เข้าสู่ระบบและยังไม่มีแอดมิน ระบบจะให้สิทธิ์ ADMIN จากนั้นลบ bootstrap ออกจาก environment
6. หากต้องการค้นหาและนำเข้ารายชื่อก่อนผู้ใช้เข้าเว็บ ให้เพิ่ม Microsoft Graph **Application permission `User.Read.All`** พร้อม admin consent แล้วตั้ง `DIRECTORY_IMPORT_ENABLED=true` จากนั้นเริ่มเซิร์ฟเวอร์ใหม่ ดูสถานะที่ `/admin/settings/directory` และเลือก **เพิ่มจาก Active Directory** ใน `/admin` ค้นหาชื่อ/อีเมลแล้วเลือกบัญชีและสิทธิ์ (แสดงสูงสุด 10 บัญชีต่อคำค้นหา)
7. ระบบตรวจบัญชีจาก Graph ซ้ำก่อนนำเข้า และนำเข้าเฉพาะบัญชีที่เปิดใช้งาน ไม่ผูกกับบัญชีเว็บไซต์ที่มีอีเมลตรงกันโดยอัตโนมัติ บัญชี AD ใหม่ที่เข้าสู่ระบบเองจะเริ่มด้วย READER ส่วนบัญชีที่นำเข้าล่วงหน้าจะใช้สิทธิ์ที่แอดมินกำหนด
8. ทดสอบการเข้าสู่ระบบและออกจากระบบจริง พร้อมนโยบาย MFA/Conditional Access ของบริษัท ก่อนเปิดใช้งาน

เครือข่ายต้องเข้าถึง `login.microsoftonline.com` และ `graph.microsoft.com` สำหรับตัวเชื่อมต่อ Entra/Graph ส่วน LDAP/AD FS ยังไม่ได้รองรับ และต้องเพิ่มตัวเชื่อมต่อตามระบบจริงของบริษัท

หากอยู่หลัง reverse proxy ให้ตั้ง origin และ forwarded headers อย่างถูกต้องตาม Auth.js ตั้ง `AUTH_TRUST_HOST=true` เฉพาะเมื่อ proxy ที่เชื่อถือได้ล้างและกำหนด host headers เอง ระบบอ่านสิทธิ์จากฐานข้อมูลทุกคำขอที่เกี่ยวข้อง การลดสิทธิ์จึงไม่ต้องรอ session หมดอายุ

**ไม่ส่ง client secret หรือรหัสผ่านในแชต และห้าม commit `.env`** บัญชี AD จริงยังไม่ได้ทดสอบในสภาพแวดล้อมนี้

## คำสั่งที่ใช้บ่อย

```bash
npm run build         # generate Prisma client + production build + TypeScript
npm start             # รัน production build
npm run typecheck
npm test              # ทดสอบ validation และนโยบายสิทธิ์
npm run db:migrate -- --name describe_change  # สร้าง migration ระหว่างพัฒนา
npm run db:deploy     # ใช้ migration ที่มีอยู่ โดยไม่ reset ข้อมูล
```

Browser tests (ต้องใช้ฐานข้อมูลที่มี sample seed และปิด company login):

```bash
npx playwright install chromium
# รัน npm start ในอีก terminal ก่อน
npx playwright test tests/browser/site.spec.ts
# หากเครื่องมี Chromium อยู่แล้ว:
CHROMIUM_PATH=/usr/bin/chromium npx playwright test tests/browser/site.spec.ts
```

การทดสอบ CMS แบบ session จำลองในเครื่อง (ไม่ทดแทนการทดสอบ Entra จริง) มีใน `tests/browser/cms.spec.ts` ครอบคลุมการสร้างบัญชีเว็บไซต์และล็อกอินด้วยรหัสผ่านจริงของบัญชีทดสอบด้วย ต้องตั้งค่าตามส่วนหัวของไฟล์และใช้ฐานข้อมูลสำหรับทดสอบเท่านั้น ห้ามรัน suite นี้พร้อมกับ public browser suite เพราะใช้ฐานข้อมูลร่วมกัน

## โครงสร้างโค้ด

- `src/app` หน้าเว็บ, Server Actions และ auth endpoint
- `src/components` Navbar, การ์ดข่าว, ส่วนหน้าแรก และแบบฟอร์ม CMS ที่ใช้ซ้ำได้
- `src/lib` การอ่านข้อมูล, Prisma, validation และการตรวจสิทธิ์ฝั่ง server
- `src/auth.ts` จุดเชื่อมต่อ Entra ID และ session
- `prisma` schema, migration และ seed
- `tests` การทดสอบ policy และ browser

## ก่อนให้พนักงานใช้งานจริง

การไม่บังคับ login ไม่ได้จำกัดผู้ชมไว้เฉพาะพนักงาน ต้องให้ทีม IT วางเว็บไว้บน intranet, VPN หรือระบบควบคุมเครือข่ายของบริษัท อย่าเปิดเว็บไซต์ที่มีข้อมูลภายในบนอินเทอร์เน็ตโดยไม่มีข้อจำกัดการเข้าถึง

กำหนดที่ติดตั้งและโดเมน เชื่อม Entra จริง สำรองฐานข้อมูล และทดสอบการกู้คืนก่อนใช้งาน PostgreSQL ใน Compose ผูกพอร์ตเฉพาะ loopback เนื้อหาเป็น plain text เพื่อไม่ให้ผู้เขียนแทรก HTML/script ไม่มีอัปโหลดรูป, rich text editor, audit log หรือระบบกู้คืนบทความในเวอร์ชันนี้

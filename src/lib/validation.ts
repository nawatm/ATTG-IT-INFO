import { z } from "zod";
export const postSchema = z.object({
  title: z.string().trim().min(5, "หัวข้อต้องมีอย่างน้อย 5 ตัวอักษร").max(180),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "URL ต้องเป็นตัวอักษรอังกฤษเล็ก ตัวเลข หรือขีดกลาง",
    ),
  excerpt: z
    .string()
    .trim()
    .min(15, "คำโปรยต้องมีอย่างน้อย 15 ตัวอักษร")
    .max(400),
  content: z
    .string()
    .trim()
    .min(30, "เนื้อหาต้องมีอย่างน้อย 30 ตัวอักษร")
    .max(100000),
  category: z.enum(["NEWS", "SECURITY", "KNOWLEDGE"]),
  published: z.boolean(),
  featured: z.boolean(),
});
export type ActionState = { error?: string; success?: string };

export const roleSchema = z.enum(["READER", "EDITOR", "ADMIN"]);
export const passwordSchema = z
  .string()
  .min(12, "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร")
  .max(128, "รหัสผ่านยาวได้ไม่เกิน 128 ตัวอักษร");
export const localUserSchema = z.object({
  name: z.string().trim().min(2, "กรุณาระบุชื่ออย่างน้อย 2 ตัวอักษร").max(120),
  email: z
    .string()
    .trim()
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: passwordSchema,
  role: roleSchema,
});

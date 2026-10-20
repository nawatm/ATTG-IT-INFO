import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getPosts } from "@/lib/posts";
import { categories, formatDate } from "@/lib/content";
import { ArticleArt } from "@/components/news-home";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { posts } = await getPosts();
  const post = posts.find((p) => p.slug === slug);
  return { title: post?.title ?? "ไม่พบบทความ", description: post?.excerpt };
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { posts, demo } = await getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  return (
    <main id="main" className="shell page-content">
      <article className="article-page">
        <Link href="/#news" className="breadcrumb">
          <ArrowLeft size={15} /> กลับไปยังข่าวสารทั้งหมด
        </Link>
        {demo && <div className="notice">บทความตัวอย่างสำหรับสาธิตระบบ</div>}
        <span className={`badge badge-${post.category.toLowerCase()}`}>
          {categories[post.category]}
        </span>
        <h1>{post.title}</h1>
        <div className="article-meta">
          <span>{formatDate(post.createdAt)}</span>
          <span>· IT System Management</span>
          <span>
            <Clock3 size={14} /> อ่าน{" "}
            {Math.max(1, Math.ceil(post.content.length / 800))} นาที
          </span>
        </div>
        <ArticleArt category={post.category} large />
        <p className="article-excerpt">{post.excerpt}</p>
        <div className="article-content">
          {post.content.split(/\n\s*\n/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <hr style={{ margin: "35px 0", borderColor: "#e2e8e4" }} />
        <Link href="/#news" className="secondary-button">
          <ArrowLeft size={15} /> อ่านเรื่องอื่น ๆ
        </Link>
      </article>
    </main>
  );
}

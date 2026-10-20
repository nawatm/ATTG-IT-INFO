"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Search,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Megaphone,
  Clock3,
  Wifi,
  LockKeyhole,
  X,
} from "lucide-react";
import {
  categories,
  formatDate,
  type Article,
  type CategoryKey,
} from "@/lib/content";
const icons = { NEWS: Megaphone, SECURITY: ShieldCheck, KNOWLEDGE: BookOpen };
export function ArticleArt({
  category,
  large = false,
}: {
  category: CategoryKey;
  large?: boolean;
}) {
  const Icon = icons[category];
  return (
    <div
      className={`article-art art-${category.toLowerCase()} ${large ? "art-large" : ""}`}
      aria-hidden="true"
    >
      <div className="art-grid" />
      <span className="art-orbit orbit-one" />
      <span className="art-orbit orbit-two" />
      <div className="art-icon">
        <Icon strokeWidth={1.15} />
      </div>
      <span className="art-caption">
        {category === "SECURITY"
          ? "STAY AWARE. STAY SECURE."
          : category === "NEWS"
            ? "CONNECTED TO WHAT MATTERS."
            : "A LITTLE KNOWLEDGE. A BIG DIFFERENCE."}
      </span>
      <span className="art-corner">
        ATTG / IT INFO <ArrowUpRight size={13} />
      </span>
      {large && (
        <>
          <span className="security-chip">
            <LockKeyhole size={14} /> SECURE YOUR DIGITAL WORLD
          </span>
          <span className="art-dot dot-one" />
          <span className="art-dot dot-two" />
        </>
      )}
    </div>
  );
}
export function NewsHome({ posts, demo }: { posts: Article[]; demo: boolean }) {
  const [category, setCategory] = useState<CategoryKey | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const reduce = useReducedMotion();
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (category === "ALL" || p.category === category) &&
          `${p.title} ${p.excerpt} ${categories[p.category]}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
      ),
    [posts, category, query],
  );
  return (
    <main id="main">
      <section className="hero">
        <div className="shell">
          <div className="eyebrow">
            <span className="status-dot" /> YOUR EVERYDAY IT COMPANION
          </div>
          <div className="hero-row">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1>
                เรื่อง IT ใกล้ตัว
                <br />
                รู้ไว้{" "}
                <span className="hero-green">
                  ทำงานง่ายขึ้น
                  <svg
                    viewBox="0 0 440 16"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M3 12 Q200 -4 436 7" />
                  </svg>
                </span>
                <span className="heading-star">✳</span>
              </h1>
              <p className="hero-copy">
                อัปเดตข่าวสาร เติมความรู้ และสร้างเกราะป้องกันในโลกดิจิทัล
                <br className="desktop-break" /> พื้นที่เรื่อง IT จากทีม IT
                System Management เพื่อพนักงานทุกคน
              </p>
              <a href="#news" className="primary-button">
                สำรวจข่าวสารและความรู้ <ArrowDown size={17} />
              </a>
            </motion.div>
            <div className="hero-aside">
              <span className="aside-symbol">
                <Wifi size={24} />
              </span>
              <p>
                Better informed.
                <br />
                <strong>Better connected.</strong>
              </p>
              <span className="aside-line" />
              <small>
                เรื่องเทคโนโลยี เข้าใจง่าย
                <br />
                ใช้ได้จริงในทุกวัน
              </small>
            </div>
          </div>
          <div className="topic-strip">
            <span>
              <Megaphone /> ข่าวสารจากทีม IT
            </span>
            <span>
              <ShieldCheck /> ปลอดภัยในโลกดิจิทัล
            </span>
            <span>
              <BookOpen /> เรียนรู้และทำงานอย่างมั่นใจ
            </span>
            <span className="strip-label">
              MADE FOR OUR PEOPLE <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
      </section>
      <section
        className="shell featured-section"
        aria-labelledby="featured-title"
      >
        <div className="section-kicker">
          <span className="tiny-square" />
          <h2 id="featured-title">เรื่องเด่นที่ไม่อยากให้พลาด</h2>
          <span className="section-english">IN THE SPOTLIGHT</span>
        </div>
        {featured ? (
          <Link href={`/news/${featured.slug}`} className="featured-card">
            <ArticleArt category={featured.category} large />
            <div className="featured-copy">
              <span
                className={`badge badge-${featured.category.toLowerCase()}`}
              >
                {categories[featured.category]}
              </span>
              <h3>{featured.title}</h3>
              <p>{featured.excerpt}</p>
              <div className="article-meta">
                <span>{formatDate(featured.createdAt)}</span>
                <span>·</span>
                <span>
                  <Clock3 size={13} /> อ่าน 3 นาที
                </span>
              </div>
              <span className="text-link">
                อ่านเรื่องนี้{" "}
                <span className="circle-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </span>
            </div>
          </Link>
        ) : (
          <div className="empty-state">ยังไม่มีบทความเผยแพร่</div>
        )}
      </section>
      <section
        id="news"
        className="shell news-section"
        aria-labelledby="news-title"
      >
        <div className="news-heading">
          <div>
            <div className="eyebrow small">THE IT UPDATE</div>
            <h2 id="news-title">
              อัปเดตเรื่อง IT <span>ไปด้วยกัน</span>
            </h2>
            <p>ข่าวสารและสาระน่ารู้ คัดมาให้คุณในที่เดียว</p>
          </div>
          <label className="search-field">
            <Search size={18} />
            <span className="sr-only">ค้นหาบทความ</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาเรื่องที่สนใจ..."
            />
            {query && (
              <button aria-label="ล้างคำค้นหา" onClick={() => setQuery("")}>
                <X size={15} />
              </button>
            )}
          </label>
        </div>
        <div className="filter-row">
          <div className="filter-tabs" role="group" aria-label="กรองหมวดหมู่">
            {(["ALL", ...Object.keys(categories)] as const).map((key) => (
              <button
                key={key}
                aria-pressed={category === key}
                className={category === key ? "active" : ""}
                onClick={() => setCategory(key as CategoryKey | "ALL")}
              >
                {key === "ALL" ? "ทั้งหมด" : categories[key as CategoryKey]}
                {key === "ALL" && <span>{posts.length}</span>}
              </button>
            ))}
          </div>
          <span className="result-count" aria-live="polite">
            {filtered.length} บทความ
          </span>
        </div>
        <div className="article-grid">
          {filtered.map((post, i) => (
            <motion.article
              key={post.id}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.2) }}
            >
              <Link className="article-card" href={`/news/${post.slug}`}>
                <ArticleArt category={post.category} />
                <div className="card-body">
                  <div className="card-top">
                    <span
                      className={`badge badge-${post.category.toLowerCase()}`}
                    >
                      {categories[post.category]}
                    </span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="card-bottom">
                    <span>IT System Management</span>
                    <ArrowUpRight size={19} />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <Search size={28} />
            <h3>ไม่พบบทความที่ตรงกับคำค้นหา</h3>
            <p>ลองเปลี่ยนคำค้นหา หรือเลือกดูหมวดหมู่ทั้งหมด</p>
            <button
              className="secondary-button"
              onClick={() => {
                setQuery("");
                setCategory("ALL");
              }}
            >
              แสดงบทความทั้งหมด
            </button>
          </div>
        )}
      </section>
      <section className="shell">
        <div className="awareness-banner">
          <span className="banner-icon">
            <ShieldCheck size={35} />
          </span>
          <div>
            <span className="eyebrow small">
              A SMALL HABIT. A SAFER WORKPLACE.
            </span>
            <h2>ความปลอดภัย เริ่มต้นที่เราทุกคน</h2>
            <p>
              ไม่แชร์รหัสผ่าน ไม่คลิกลิงก์ที่ไม่มั่นใจ พบสิ่งผิดปกติให้แจ้งทีม
              IT
            </p>
          </div>
          <button
            onClick={() => {
              setCategory("SECURITY");
              setQuery("");
              document
                .getElementById("news")
                ?.scrollIntoView({ behavior: reduce ? "instant" : "smooth" });
            }}
            className="banner-link"
          >
            รู้ทันภัยไซเบอร์ <ArrowRight size={18} />
          </button>
          <Sparkles className="banner-spark" aria-hidden="true" />
        </div>
      </section>
      {demo && (
        <div className="shell demo-note">
          โหมดตัวอย่าง · บทความเพื่อสาธิตระบบ ยังไม่ได้เชื่อมต่อฐานข้อมูลบริษัท
        </div>
      )}
    </main>
  );
}

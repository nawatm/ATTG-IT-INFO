import { getPosts } from "@/lib/posts";
import { NewsHome } from "@/components/news-home";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { posts, demo } = await getPosts();
  return <NewsHome posts={posts} demo={demo} />;
}

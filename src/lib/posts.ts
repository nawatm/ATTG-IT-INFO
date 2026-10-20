import "server-only";
import { prisma } from "./prisma";
import { samplePosts, type Article } from "./content";
export async function getPosts(): Promise<{ posts: Article[]; demo: boolean }> {
  if (!process.env.DATABASE_URL) return { posts: samplePosts, demo: true };
  return {
    posts: await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    }),
    demo: false,
  };
}

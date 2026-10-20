import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { samplePosts } from "../src/lib/content";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main() {
  for (const { id, ...post } of samplePosts)
    await db.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: { ...post, published: true },
    });
  console.log("Seeded 5 sample articles; existing articles preserved.");
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

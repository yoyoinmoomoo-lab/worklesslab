import Link from "next/link";
import { getBlogPosts } from "@/lib/notion-blog";

// 매 요청마다 데이터를 가져오도록 설정 (캐싱 비활성화)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default async function BlogPage() {
  let posts: Awaited<ReturnType<typeof getBlogPosts>> = [];
  let error: string | null = null;

  try {
    posts = await getBlogPosts();
  } catch (err) {
    console.error("Error loading blog posts:", err);
    error = "⚠️ 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.";
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Blog</h1>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          {error}
        </div>
      )}

      {!error && posts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>아직 발행된 글이 없습니다.</p>
        </div>
      )}

      {!error && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="border-b border-gray-200 pb-6 last:border-b-0"
            >
              <Link
                href={`/blog/${post.slug}`}
                className="block hover:opacity-80 transition-opacity"
              >
                <h2 className="text-xl font-semibold mb-2 text-[#222222] hover:text-[#007AFF]">
                  {post.title}
                </h2>
                <div className="text-sm text-gray-500 mb-2">
                  {post.author ? `${post.author} · ${formatDate(post.createdTime)}` : formatDate(post.createdTime)}
                </div>
                {post.summary && (
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                    {post.summary}
                  </p>
                )}
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


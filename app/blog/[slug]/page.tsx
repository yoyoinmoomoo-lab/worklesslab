import { notFound } from "next/navigation";
import { getBlogPostBySlug, getAllSlugs } from "@/lib/notion-blog";
import BlockRenderer from "@/components/blog/BlockRenderer";

// 매 요청마다 데이터를 가져오도록 설정 (캐싱 비활성화)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  } catch {
    return dateString;
  }
}

export async function generateStaticParams() {
  try {
    // 환경 변수가 없으면 빈 배열 반환 (동적 라우팅으로 처리)
    if (!process.env.NOTION_BLOG_TOKEN || !process.env.NOTION_BLOG_DATA_SOURCE_ID) {
      return [];
    }
    const slugs = await getAllSlugs();
    return slugs.map((slug) => ({
      slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    // 빌드 실패 방지를 위해 빈 배열 반환
    return [];
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  let post = null;
  let error = null;

  try {
    post = await getBlogPostBySlug(params.slug);
    if (!post) {
      error = "게시글을 찾을 수 없습니다.";
    }
  } catch (err) {
    console.error("Error loading blog post:", err);
    error = "⚠️ 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.";
  }

  if (error || !post) {
    return (
      <div>
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          {error || "게시글을 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[#222222]">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 mb-4">
          {post.author && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {post.author}
            </span>
          )}
          <div className="text-sm text-gray-500">
            {formatDate(post.createdTime)}
          </div>
        </div>
        <hr className="border-gray-300" />
      </header>

      <div className="prose max-w-none">
        <BlockRenderer blocks={post.blocks} />
      </div>
    </article>
  );
}


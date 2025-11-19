import { Client } from "@notionhq/client";

// Blog 전용 Notion Client (Feedback과 분리)
const notion = new Client({
  auth: process.env.NOTION_BLOG_TOKEN,
});

const BLOG_DATA_SOURCE_ID = process.env.NOTION_BLOG_DATA_SOURCE_ID;

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  createdTime: string;
  published: boolean;
}

export interface BlogPostWithBlocks extends BlogPost {
  blocks: any[];
}

/**
 * Published된 모든 블로그 포스트 목록 가져오기
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!BLOG_DATA_SOURCE_ID || !process.env.NOTION_BLOG_TOKEN) {
    throw new Error("Notion blog credentials not configured");
  }

  try {
    const response = await notion.dataSources.query({
      data_source_id: BLOG_DATA_SOURCE_ID,
      filter: {
        property: "Published",
        checkbox: { equals: true },
      },
      sorts: [
        {
          property: "CreatedTime",
          direction: "descending",
        },
      ],
    });

    const posts: BlogPost[] = response.results.map((page: any) => {
      const props = page.properties || {};
      
      // Title 추출
      const titleProp = props.Name;
      const title = titleProp?.title?.[0]?.plain_text || "Untitled";

      // Slug 추출
      const slugProp = props.Slug;
      const slug = slugProp?.rich_text?.[0]?.plain_text || "";

      // Summary 추출
      const summaryProp = props.Summary;
      const summary = summaryProp?.rich_text?.[0]?.plain_text || "";

      // CreatedTime 추출
      const createdTimeProp = props.CreatedTime;
      const createdTime = createdTimeProp?.created_time || page.created_time || "";

      return {
        id: page.id,
        title,
        slug,
        summary,
        createdTime,
        published: props.Published?.checkbox || false,
      };
    });

    return posts;
  } catch (error: any) {
    console.error("Error fetching blog posts:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      body: error?.body,
    });
    throw error;
  }
}

/**
 * Slug로 특정 블로그 포스트 가져오기
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPostWithBlocks | null> {
  if (!BLOG_DATA_SOURCE_ID || !process.env.NOTION_BLOG_TOKEN) {
    throw new Error("Notion blog credentials not configured");
  }

  try {
    // 먼저 slug로 페이지 찾기
    const response = await notion.dataSources.query({
      data_source_id: BLOG_DATA_SOURCE_ID,
      filter: {
        and: [
          {
            property: "Published",
            checkbox: { equals: true },
          },
          {
            property: "Slug",
            rich_text: { equals: slug },
          },
        ],
      },
    });

    if (response.results.length === 0) {
      return null;
    }

    const page = response.results[0] as any;
    const props = page.properties || {};

    // Title 추출
    const titleProp = props.Name;
    const title = titleProp?.title?.[0]?.plain_text || "Untitled";

    // Slug 추출
    const slugProp = props.Slug;
    const foundSlug = slugProp?.rich_text?.[0]?.plain_text || "";

    // Summary 추출
    const summaryProp = props.Summary;
    const summary = summaryProp?.rich_text?.[0]?.plain_text || "";

    // CreatedTime 추출
    const createdTimeProp = props.CreatedTime;
    const createdTime = createdTimeProp?.created_time || page.created_time || "";

    // Blocks 가져오기 (재귀적으로 모든 children 포함)
    const blocks = await getAllBlocks(page.id);

    return {
      id: page.id,
      title,
      slug: foundSlug,
      summary,
      createdTime,
      published: props.Published?.checkbox || false,
      blocks,
    };
  } catch (error: any) {
    console.error("Error fetching blog post:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      body: error?.body,
    });
    throw error;
  }
}

/**
 * 모든 blocks를 재귀적으로 가져오기 (has_more 처리 포함)
 */
async function getAllBlocks(blockId: string): Promise<any[]> {
  const allBlocks: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });

    for (const block of response.results) {
      allBlocks.push(block);

      // children이 있는 경우 재귀적으로 가져오기
      if ("has_children" in block && block.has_children) {
        const children = await getAllBlocks(block.id);
        allBlocks.push(...children);
      }
    }

    cursor = response.next_cursor || undefined;
  } while (cursor);

  return allBlocks;
}

/**
 * 모든 slug 목록 가져오기 (generateStaticParams용)
 */
export async function getAllSlugs(): Promise<string[]> {
  const posts = await getBlogPosts();
  return posts.map((post) => post.slug).filter((slug) => slug.length > 0);
}


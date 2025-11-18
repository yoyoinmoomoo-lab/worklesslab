import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { message, source } = await req.json();
    if (!message || message.trim().length < 3) {
      return NextResponse.json(
        { ok: false, error: "short" },
        { status: 400 }
      );
    }

    // source에 따른 페이지 이름 매핑
    const pageName =
      source === "rent"
        ? "전월세"
        : source === "subscription"
        ? "월구독료"
        : "기타";

    // 하위 호환성: NOTION_FEEDBACK_SOURCE 또는 NOTION_FEEDBACK_DB 둘 다 지원
    const dataSourceId = (process.env.NOTION_FEEDBACK_SOURCE || process.env.NOTION_FEEDBACK_DB)?.trim();
    const token = process.env.NOTION_TOKEN?.trim();

    if (!dataSourceId || !token || dataSourceId.length === 0 || token.length === 0) {
      return NextResponse.json(
        { ok: false, error: "notion_not_configured" },
        { status: 500 }
      );
    }

    // 메시지 + 경로/UA 저장 (스냅샷 제외)
    const ua = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";

    const body: any = {
      parent: {
        type: "data_source_id",
        data_source_id: dataSourceId,
      },
      template: {
        type: "template_id",
        template_id: "2a7670adb05a805cab4fe139106803a5",
      },
      properties: {
        내용: {
          rich_text: [{ text: { content: message } }],
        },
        경로: { url: referer || null },
        UA: {
          rich_text: [{ text: { content: ua.slice(0, 500) } }],
        },
        생성일: {
          date: { start: new Date().toISOString() },
        },
        페이지: {
          select: { name: pageName },
        },
      },
    };

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2025-09-03",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ ok: false, error: t }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}


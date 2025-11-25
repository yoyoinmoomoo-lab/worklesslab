"use client";

import Editor from "@/components/notion-cover/Editor";
import Hero from "@/components/notion-cover/Hero";
import FontLoader from "@/components/notion-cover/FontLoader";
import { FeedbackBox } from "@/components/tools/FeedbackBox";

export default function NotionCoverMakerPage() {
  return (
    <>
      <FontLoader />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <Editor />
      </div>
      {/* 피드백 박스 (상시 노출, 에디터 아래) */}
      <section className="mt-10 border-t border-gray-200 pt-6">
        <FeedbackBox source="notioncover" />
      </section>
    </>
  );
}


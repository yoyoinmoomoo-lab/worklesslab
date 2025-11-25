import Link from "next/link";

export default function ToolsPage() {
  const tools = [
    {
      title: "전월세 계산기",
      description: "보증금·월세·관리비·이자 등을 입력해 여러 매물의 월·총 비용을 비교하세요.",
      href: "/tools/rent",
    },
    {
      title: "월 구독료 계산기",
      description: "여러 구독 서비스의 월/연 총액을 한눈에 계산하세요.",
      href: "/tools/subscription",
    },
    {
      title: "노션 커버 메이커",
      description: "이미지를 업로드해 노션 커버에 딱 맞는 사이즈로 조정하고 다운로드하세요.",
      href: "/tools/notion-cover-maker",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Tools</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{tool.title}</h2>
            <p className="text-sm text-gray-600">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}


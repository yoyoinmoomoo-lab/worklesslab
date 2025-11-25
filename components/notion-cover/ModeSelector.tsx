"use client";

import { useEditorStore } from "@/store/notionCoverStore";
import type { Mode } from "@/types/notion-cover";

export default function ModeSelector() {
  const { mode, setMode } = useEditorStore();

  const modes: { value: Mode; label: string; desc: string }[] = [
    {
      value: "fill",
      label: "Fill",
      desc: "비율 유지 확대, 중앙 크롭",
    },
    {
      value: "fit",
      label: "Fit",
      desc: "전체 보이게 배치",
    },
    {
      value: "tile",
      label: "Tile",
      desc: "반복 패턴",
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3 text-[#222222]">배치 모드</h2>
      <div className="space-y-2">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
              mode === m.value
                ? "border-[#007AFF] bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="font-medium text-[#222222]">{m.label}</div>
            <div className="text-sm text-gray-600">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}


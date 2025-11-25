"use client";

import { useEditorStore } from "@/store/notionCoverStore";

const FONTS = [
  "Inter",
  "Noto Sans KR",
  "IBM Plex Sans",
  "JetBrains Mono",
  "system-ui",
];

export default function TextOverlayPanel() {
  const { text, setText } = useEditorStore();

  if (!text.enabled) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={false}
            onChange={(e) => setText({ enabled: e.target.checked })}
          />
          <span className="text-sm font-medium text-gray-700">텍스트 오버레이 사용</span>
        </label>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[#222222]">텍스트 오버레이</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={text.enabled}
            onChange={(e) => setText({ enabled: e.target.checked })}
          />
          <span className="text-sm text-gray-700">사용</span>
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">내용</label>
          <input
            type="text"
            value={text.content}
            onChange={(e) => setText({ content: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-[#222222]"
            placeholder="텍스트 입력"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">폰트</label>
          <select
            value={text.font}
            onChange={(e) => setText({ font: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-[#222222]"
          >
            {FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">크기</label>
            <input
              type="number"
              value={text.size}
              onChange={(e) =>
                setText({ size: parseInt(e.target.value) || 48 })
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-[#222222]"
              min="12"
              max="200"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">두께</label>
            <select
              value={text.weight}
              onChange={(e) =>
                setText({ weight: parseInt(e.target.value) })
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-[#222222]"
            >
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">
            문자간격: {text.tracking}px
          </label>
          <input
            type="range"
            min="-5"
            max="20"
            value={text.tracking}
            onChange={(e) =>
              setText({ tracking: parseInt(e.target.value) })
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">색상</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={text.color}
              onChange={(e) => setText({ color: e.target.value })}
              className="w-12 h-12 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={text.color}
              onChange={(e) => setText({ color: e.target.value })}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-[#222222]"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={text.shadow}
              onChange={(e) => setText({ shadow: e.target.checked })}
            />
            <span className="text-sm text-gray-700">그림자 효과</span>
          </label>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">정렬</label>
          <div className="flex gap-2">
            {(["left", "center", "right"] as const).map((align) => (
              <button
                key={align}
                onClick={() => setText({ align })}
                className={`flex-1 px-2 py-1 rounded border transition-colors ${
                  text.align === align
                    ? "bg-[#007AFF] text-white border-[#007AFF]"
                    : "bg-white border-gray-300 text-[#222222]"
                }`}
              >
                {align === "left" ? "왼쪽" : align === "center" ? "가운데" : "오른쪽"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useEditorStore } from "@/store/notionCoverStore";

const PRESETS = [
  { name: "Desktop (권장)", width: 1500, height: 600 },
  { name: "Tablet", width: 1170, height: 290 },
  { name: "Mobile", width: 1170, height: 445 },
];

export default function SizePresetPanel() {
  const { output, setOutput, showSafeZone, setShowSafeZone } = useEditorStore();

  const handlePreset = (width: number, height: number) => {
    setOutput({ width, height });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3 text-[#222222]">사이즈</h2>

      <div className="space-y-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePreset(preset.width, preset.height)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
              output.width === preset.width && output.height === preset.height
                ? "border-[#007AFF] bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="font-medium text-[#222222]">{preset.name}</div>
            <div className="text-sm text-gray-600">
              {preset.width} × {preset.height}
            </div>
          </button>
        ))}

        <div className="pt-2 border-t">
          <div className="text-sm font-medium mb-2 text-gray-700">커스텀</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600">폭</label>
              <input
                type="number"
                value={output.width}
                onChange={(e) => {
                  const width = parseInt(e.target.value) || 1500;
                  // 5:2 비율 자동 유도 (선택사항 - 높이가 기본값일 때만)
                  if (output.height === 600 || output.height === 1200) {
                    const height = Math.round(width * (2 / 5));
                    setOutput({ width, height });
                  } else {
                    setOutput({ width });
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-[#222222]"
                placeholder="1500"
                min="100"
                max="10000"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">높이</label>
              <input
                type="number"
                value={output.height}
                onChange={(e) => {
                  const height = parseInt(e.target.value) || 600;
                  // 5:2 비율 자동 유도 (선택사항 - 폭이 기본값일 때만)
                  if (output.width === 1500 || output.width === 3000) {
                    const width = Math.round(height * (5 / 2));
                    setOutput({ width, height });
                  } else {
                    setOutput({ height });
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-[#222222]"
                placeholder="600"
                min="100"
                max="10000"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSafeZone}
              onChange={(e) => setShowSafeZone(e.target.checked)}
            />
            <span className="text-sm text-gray-700">세이프존 표시 (중앙 40%)</span>
          </label>
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500 space-y-1">
            <div>📏 Notion 권장 비율: 5 : 2</div>
            <div>💡 JPG 또는 PNG, 72 DPI 권장</div>
          </div>
        </div>
      </div>
    </div>
  );
}


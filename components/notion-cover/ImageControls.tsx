"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/store/notionCoverStore";

export default function ImageControls() {
  const {
    mode,
    imageOffset,
    imageScale,
    imageRotation,
    tileOffset,
    tileScale,
    setImageOffset,
    setImageScale,
    setImageRotation,
    setTileOffset,
    setTileScale,
  } = useEditorStore();

  // 로컬 state로 입력 중간 상태 관리
  const [xInput, setXInput] = useState(String(imageOffset.x));
  const [yInput, setYInput] = useState(String(imageOffset.y));
  const [tileXInput, setTileXInput] = useState(String(tileOffset.x));
  const [tileYInput, setTileYInput] = useState(String(tileOffset.y));

  // imageOffset이 외부에서 변경되면 로컬 state 동기화
  useEffect(() => {
    setXInput(String(imageOffset.x));
    setYInput(String(imageOffset.y));
  }, [imageOffset.x, imageOffset.y]);

  useEffect(() => {
    setTileXInput(String(tileOffset.x));
    setTileYInput(String(tileOffset.y));
  }, [tileOffset.x, tileOffset.y]);

  if (mode === "tile") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3 text-[#222222]">타일 조정</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              스케일: {tileScale.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.1"
              max="4"
              step="0.1"
              value={tileScale}
              onChange={(e) => setTileScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">X 오프셋</label>
              <input
                type="number"
                value={tileXInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setTileXInput(val);
                  if (val !== "" && val !== "-") {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      setTileOffset({ ...tileOffset, x: num });
                    }
                  }
                }}
                onBlur={() => {
                  if (tileXInput === "" || tileXInput === "-") {
                    setTileOffset({ ...tileOffset, x: 0 });
                    setTileXInput("0");
                  } else {
                    const num = parseInt(tileXInput, 10);
                    if (!isNaN(num)) {
                      setTileOffset({ ...tileOffset, x: num });
                      setTileXInput(String(num));
                    }
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-[#222222]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Y 오프셋</label>
              <input
                type="number"
                value={tileYInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setTileYInput(val);
                  if (val !== "" && val !== "-") {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      setTileOffset({ ...tileOffset, y: num });
                    }
                  }
                }}
                onBlur={() => {
                  if (tileYInput === "" || tileYInput === "-") {
                    setTileOffset({ ...tileOffset, y: 0 });
                    setTileYInput("0");
                  } else {
                    const num = parseInt(tileYInput, 10);
                    if (!isNaN(num)) {
                      setTileOffset({ ...tileOffset, y: num });
                      setTileYInput(String(num));
                    }
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-[#222222]"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3 text-[#222222]">이미지 조정</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            확대/축소: {(imageScale * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="4"
            step="0.1"
            value={imageScale}
            onChange={(e) => setImageScale(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            회전: {imageRotation}°
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={imageRotation}
            onChange={(e) => setImageRotation(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">X 위치</label>
            <input
              type="number"
              value={xInput}
              onChange={(e) => {
                const val = e.target.value;
                setXInput(val);
                if (val !== "" && val !== "-") {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    setImageOffset({ ...imageOffset, x: num });
                  }
                }
              }}
              onBlur={() => {
                if (xInput === "" || xInput === "-") {
                  setImageOffset({ ...imageOffset, x: 0 });
                  setXInput("0");
                } else {
                  const num = parseInt(xInput, 10);
                  if (!isNaN(num)) {
                    setImageOffset({ ...imageOffset, x: num });
                    setXInput(String(num));
                  }
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-[#222222]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Y 위치</label>
            <input
              type="number"
              value={yInput}
              onChange={(e) => {
                const val = e.target.value;
                setYInput(val);
                if (val !== "" && val !== "-") {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    setImageOffset({ ...imageOffset, y: num });
                  }
                }
              }}
              onBlur={() => {
                if (yInput === "" || yInput === "-") {
                  setImageOffset({ ...imageOffset, y: 0 });
                  setYInput("0");
                } else {
                  const num = parseInt(yInput, 10);
                  if (!isNaN(num)) {
                    setImageOffset({ ...imageOffset, y: num });
                    setYInput(String(num));
                  }
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-[#222222]"
            />
          </div>
        </div>
        <div className="text-xs text-gray-500">
          키보드 화살표 키로 미세 조정 가능 (Shift: 10px)
        </div>
      </div>
    </div>
  );
}


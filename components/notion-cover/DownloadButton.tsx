"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/store/notionCoverStore";

interface DownloadButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const AD_DURATION = 5; // 5초 광고 카운트다운

export default function DownloadButton({ canvasRef }: DownloadButtonProps) {
  const {
    output,
    mode,
    setOutput,
    background,
    text,
    tileOffset,
    tileScale,
    imageOffset,
    imageScale,
    imageRotation,
  } = useEditorStore();
  const [showAdGate, setShowAdGate] = useState(false);
  const [countdown, setCountdown] = useState(AD_DURATION);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  // 편집 상태를 추적하기 위한 ref
  const prevEditStateRef = useRef<string>("");

  // 편집 상태가 변경되면 광고 게이트 닫기
  useEffect(() => {
    const currentEditState = JSON.stringify({
      mode,
      background,
      text,
      tileOffset,
      tileScale,
      imageOffset,
      imageScale,
      imageRotation,
      output,
    });

    if (prevEditStateRef.current && prevEditStateRef.current !== currentEditState) {
      // 편집이 발생했고 광고 게이트가 열려있으면 닫기
      if (showAdGate) {
        setShowAdGate(false);
        setCountdown(AD_DURATION);
        if (countdownRef.current) {
          clearTimeout(countdownRef.current);
        }
      }
    }

    prevEditStateRef.current = currentEditState;
  }, [
    mode,
    background,
    text,
    tileOffset,
    tileScale,
    imageOffset,
    imageScale,
    imageRotation,
    output,
    showAdGate,
  ]);

  useEffect(() => {
    if (showAdGate && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [showAdGate, countdown]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `notion-cover_${mode}_${output.width}x${output.height}.${output.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      output.format === "png" ? "image/png" : "image/jpeg",
      output.format === "jpeg" ? output.quality : undefined
    );
  };

  const handleDownloadClick = () => {
    setShowAdGate(true);
    setCountdown(AD_DURATION);
  };

  // 광고 게이트 표시 중
  if (showAdGate) {
    return (
      <div className="mt-4 space-y-6">
        {/* 광고 영역 - 명확히 분리 */}
        <div
          className="border border-gray-300 rounded p-3"
          role="complementary"
          aria-label="광고"
        >
          <p className="text-xs text-gray-600 mb-3">광고</p>
          {/* 광고 슬롯 (실제 AdSense 코드로 교체) */}
          <div
            id="adsense-slot"
            className="bg-gray-100 rounded min-h-[250px] flex items-center justify-center"
          >
            <div className="text-center text-gray-400 text-sm">
              <div className="mb-2">광고 영역</div>
              <div className="text-xs">
                (AdSense 광고 단위가 여기에 표시됩니다)
              </div>
            </div>
          </div>
        </div>

        {/* 다운로드 패널 - 광고와 분리, 최소 24px 여백 */}
        <div className="space-y-3">
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-600">
                잠시만요… 준비 중입니다. ({countdown}초)
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                다운로드를 시작할 수 있어요.
              </p>
            )}
          </div>
          <button
            disabled={countdown > 0}
            onClick={() => {
              handleDownload();
              setShowAdGate(false);
              setCountdown(AD_DURATION);
            }}
            className="w-full px-6 py-3 bg-[#007AFF] text-white font-semibold rounded-lg hover:bg-[#0051D5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다운로드
          </button>
        </div>
      </div>
    );
  }

  // 일반 다운로드 버튼
  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setOutput({ format: "png" })}
          className={`flex-1 px-3 py-2 rounded border transition-colors ${
            output.format === "png"
              ? "bg-[#007AFF] text-white border-[#007AFF]"
              : "bg-white border-gray-300 text-[#222222]"
          }`}
        >
          PNG
        </button>
        <button
          onClick={() => setOutput({ format: "jpeg" })}
          className={`flex-1 px-3 py-2 rounded border transition-colors ${
            output.format === "jpeg"
              ? "bg-[#007AFF] text-white border-[#007AFF]"
              : "bg-white border-gray-300 text-[#222222]"
          }`}
        >
          JPEG
        </button>
      </div>
      {output.format === "jpeg" && (
        <div className="mb-2">
          <label className="block text-xs text-gray-600 mb-1">
            품질: {Math.round(output.quality * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={output.quality}
            onChange={(e) =>
              setOutput({ quality: parseFloat(e.target.value) })
            }
            className="w-full"
          />
        </div>
      )}
      <button
        onClick={handleDownloadClick}
        className="w-full px-6 py-3 bg-[#007AFF] text-white font-semibold rounded-lg hover:bg-[#0051D5] transition-colors"
      >
        다운로드 ({output.format.toUpperCase()})
      </button>
    </div>
  );
}


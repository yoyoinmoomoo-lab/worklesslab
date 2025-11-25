"use client";

import { useEditorStore } from "@/store/notionCoverStore";

interface PreviewCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  showSafeZone: boolean;
  isRendering: boolean;
}

export default function PreviewCanvas({
  canvasRef,
  showSafeZone,
  isRendering,
}: PreviewCanvasProps) {
  const { output } = useEditorStore();

  return (
    <div className="relative">
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{
            maxHeight: "600px",
            objectFit: "contain",
          }}
        />
        {showSafeZone && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                90deg,
                transparent 0%,
                transparent 30%,
                rgba(255, 0, 0, 0.1) 30%,
                rgba(255, 0, 0, 0.1) 35%,
                transparent 35%,
                transparent 65%,
                rgba(255, 0, 0, 0.1) 65%,
                rgba(255, 0, 0, 0.1) 70%,
                transparent 70%
              )`,
            }}
          />
        )}
        {isRendering && (
          <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
            <div className="text-white font-medium">렌더링 중...</div>
          </div>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-600 text-center">
        {output.width} × {output.height}px
      </div>
    </div>
  );
}


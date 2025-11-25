"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/notionCoverStore";
import { loadImageFromFile } from "@/utils/notion-cover/imageUtils";
import { extractDominantColors, getBrightestAndDarkest } from "@/utils/notion-cover/colorExtractor";
import { renderCover } from "@/utils/notion-cover/renderer";
import ImageUpload from "./ImageUpload";
import ModeSelector from "./ModeSelector";
import BackgroundPanel from "./BackgroundPanel";
import SizePresetPanel from "./SizePresetPanel";
import PreviewCanvas from "./PreviewCanvas";
import DownloadButton from "./DownloadButton";
import TextOverlayPanel from "./TextOverlayPanel";
import ImageControls from "./ImageControls";

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const {
    image,
    mode,
    background,
    output,
    text,
    tileOffset,
    tileScale,
    imageOffset,
    imageScale,
    imageRotation,
    setImage,
    setImageOffset,
    setImageScale,
    showSafeZone,
  } = useEditorStore();

  // 자동 렌더링 (실시간 미리보기)
  useEffect(() => {
    if (image?.bitmap && canvasRef.current) {
      handleRender();
    }
  }, [
    image,
    mode,
    background,
    output,
    text,
    tileOffset,
    tileScale,
    imageOffset,
    imageScale,
    imageRotation,
  ]);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!image) return;

      // input, textarea, select 등 입력 요소에 포커스가 있으면 무시
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          (activeElement instanceof HTMLElement && activeElement.isContentEditable))
      ) {
        return;
      }

      const step = e.shiftKey ? 10 : 1;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setImageOffset({ ...imageOffset, x: imageOffset.x - step });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setImageOffset({ ...imageOffset, x: imageOffset.x + step });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setImageOffset({ ...imageOffset, y: imageOffset.y - step });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setImageOffset({ ...imageOffset, y: imageOffset.y + step });
      } else if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setImageScale(Math.min(4, imageScale + 0.1));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setImageScale(Math.max(0.1, imageScale - 0.1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [image, imageOffset, imageScale, setImageOffset, setImageScale]);

  const handleImageUpload = async (file: File) => {
    try {
      console.log("Uploading file:", file.name, file.type, file.size);
      
      // 파일 크기 체크 (20MB 제한)
      if (file.size > 20 * 1024 * 1024) {
        alert("Image size is too large. Please select a file under 20MB.");
        return;
      }

      const imageData = await loadImageFromFile(file);
      console.log("Image loaded:", imageData);
      
      if (!imageData.bitmap) {
        throw new Error("이미지를 로드할 수 없습니다.");
      }

      setImage(imageData);

      // 자동 색상 추출 및 그라데이션 제안
      try {
        const colors = await extractDominantColors(imageData.bitmap);
        if (colors.length >= 2) {
          const { brightest, darkest } = getBrightestAndDarkest(colors);
          // 그라데이션 제안은 BackgroundPanel에서 처리
        }
      } catch (colorError) {
        console.warn("Color extraction failed:", colorError);
        // 색상 추출 실패는 치명적이지 않으므로 계속 진행
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      alert(`Image upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleRender = async () => {
    if (!image?.bitmap || !canvasRef.current) return;

    setIsRendering(true);
    try {
      await renderCover(canvasRef.current, {
        image,
        mode,
        background,
        output,
        text,
        tileOffset,
        tileScale,
        imageOffset,
        imageScale,
        imageRotation,
      });
    } catch (error) {
      console.error("Render failed:", error);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 컨트롤 패널 */}
        <div className="lg:col-span-1 space-y-6">
          <ImageUpload onUpload={handleImageUpload} />

          {image && (
            <>
              <ModeSelector />
              <ImageControls />
              <BackgroundPanel />
              <SizePresetPanel />
              <TextOverlayPanel />
            </>
          )}
        </div>

        {/* 우측 미리보기 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sticky top-4">
            <PreviewCanvas
              canvasRef={canvasRef}
              showSafeZone={showSafeZone}
              isRendering={isRendering}
            />
            {image && <DownloadButton canvasRef={canvasRef} />}
          </div>
        </div>
      </div>
    </div>
  );
}


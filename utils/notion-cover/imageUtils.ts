// 이미지 유틸리티 함수
import type { ImageData } from "@/types/notion-cover";

export async function loadImageFromFile(
  file: File
): Promise<ImageData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });
    
    // createImageBitmap이 지원되지 않는 경우를 대비
    if (!window.createImageBitmap) {
      throw new Error("createImageBitmap을 지원하지 않는 브라우저입니다.");
    }

    const imageBitmap = await createImageBitmap(blob);
    
    if (!imageBitmap) {
      throw new Error("이미지 비트맵을 생성할 수 없습니다.");
    }

    // EXIF orientation 처리 (간단 버전, 실제로는 EXIF.js 필요)
    let exifOrientation = 1;
    try {
      // 기본값으로 1 (정상) 사용
      // 실제 구현 시 EXIF.js로 orientation 읽기
    } catch (e) {
      console.warn("EXIF orientation detection failed", e);
    }

    const originalUrl = URL.createObjectURL(file);

    return {
      bitmap: imageBitmap,
      exifOrientation,
      originalUrl,
    };
  } catch (error) {
    console.error("loadImageFromFile error:", error);
    throw error;
  }
}

export function applyExifOrientation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  orientation: number
): void {
  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      break;
  }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}


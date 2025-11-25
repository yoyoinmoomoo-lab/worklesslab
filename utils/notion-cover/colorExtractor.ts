// 간단한 색상 추출 유틸리티
// 실제로는 colorthief나 vibrant.js를 사용하는 것이 좋지만,
// 브라우저에서 직접 구현한 간단 버전
import { hexToRgb } from "./imageUtils";

export async function extractDominantColors(
  imageBitmap: ImageBitmap,
  count: number = 8
): Promise<string[]> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(imageBitmap.width, 200);
  canvas.height = Math.min(imageBitmap.height, 200);
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // 간단한 색상 히스토그램
  const colorMap = new Map<string, number>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) continue; // 투명도 무시

    // 색상을 16단계로 양자화
    const qr = Math.floor(r / 16) * 16;
    const qg = Math.floor(g / 16) * 16;
    const qb = Math.floor(b / 16) * 16;

    const key = `${qr},${qg},${qb}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  // 빈도순으로 정렬
  const sorted = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);

  return sorted.map(([key]) => {
    const [r, g, b] = key.split(",").map(Number);
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  });
}

export function getBrightestAndDarkest(colors: string[]): {
  brightest: string;
  darkest: string;
} {
  if (colors.length < 2) {
    return { brightest: "#ffffff", darkest: "#000000" };
  }

  let brightest = colors[0];
  let darkest = colors[0];
  let maxBrightness = 0;
  let minBrightness = 255;

  colors.forEach((color) => {
    const rgb = hexToRgb(color);
    const brightness = (rgb.r + rgb.g + rgb.b) / 3;

    if (brightness > maxBrightness) {
      maxBrightness = brightness;
      brightest = color;
    }
    if (brightness < minBrightness) {
      minBrightness = brightness;
      darkest = color;
    }
  });

  return { brightest, darkest };
}


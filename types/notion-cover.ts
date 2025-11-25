// Notion Cover Maker 타입 정의
export type Mode = "fill" | "fit" | "tile";

export type BackgroundType = "solid" | "gradient" | "blur";

export type OutputFormat = "png" | "jpeg";

export interface ImageData {
  bitmap: ImageBitmap | null;
  exifOrientation: number;
  originalUrl: string;
}

export interface BackgroundSolid {
  type: "solid";
  color: string;
}

export interface BackgroundGradient {
  type: "gradient";
  color1: string;
  color2: string;
  angle: number; // 0-360
  auto?: boolean; // 자동 추출 여부
}

export interface BackgroundBlur {
  type: "blur";
  radius: number;
  scale: number;
}

export type Background = BackgroundSolid | BackgroundGradient | BackgroundBlur;

export interface SizePreset {
  name: string;
  width: number;
  height: number;
}

export interface OutputSettings {
  width: number;
  height: number;
  format: OutputFormat;
  quality: number; // 0-1 for JPEG
}

export interface TextOverlay {
  enabled: boolean;
  content: string;
  font: string;
  weight: number;
  size: number;
  tracking: number;
  shadow: boolean;
  align: "center" | "left" | "right";
  color: string;
}

export interface EditorState {
  image: ImageData | null;
  mode: Mode;
  background: Background;
  output: OutputSettings;
  text: TextOverlay;
  tileOffset: { x: number; y: number };
  tileScale: number;
  imageOffset: { x: number; y: number };
  imageScale: number;
  imageRotation: number;
  showSafeZone: boolean;
}


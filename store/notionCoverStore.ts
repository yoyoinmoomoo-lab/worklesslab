// Notion Cover Maker 스토어 (Zustand)
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  EditorState,
  ImageData,
  Mode,
  Background,
  OutputSettings,
  TextOverlay,
} from "@/types/notion-cover";

interface EditorStore extends EditorState {
  isDirty: boolean;
  isReady: boolean;
  setImage: (image: ImageData | null) => void;
  setMode: (mode: Mode) => void;
  setBackground: (background: Background) => void;
  setOutput: (output: Partial<OutputSettings>) => void;
  setText: (text: Partial<TextOverlay>) => void;
  setTileOffset: (offset: { x: number; y: number }) => void;
  setTileScale: (scale: number) => void;
  setImageOffset: (offset: { x: number; y: number }) => void;
  setImageScale: (scale: number) => void;
  setImageRotation: (rotation: number) => void;
  setShowSafeZone: (show: boolean) => void;
  markDirty: () => void;
  markReady: () => void;
  reset: () => void;
}

const defaultState: EditorState = {
  image: null,
  mode: "fill",
  background: { type: "solid", color: "#ffffff" },
  output: {
    width: 1500,
    height: 600,
    format: "png",
    quality: 0.9,
  },
  text: {
    enabled: false,
    content: "",
    font: "Inter",
    weight: 400,
    size: 48,
    tracking: 0,
    shadow: false,
    align: "center",
    color: "#ffffff",
  },
  tileOffset: { x: 0, y: 0 },
  tileScale: 1,
  imageOffset: { x: 0, y: 0 },
  imageScale: 1,
  imageRotation: 0,
  showSafeZone: false,
};

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      ...defaultState,
      isDirty: true,
      isReady: false,
      setImage: (image) => set({ image, isDirty: true, isReady: false }),
      setMode: (mode) => set({ mode, isDirty: true, isReady: false }),
      setBackground: (background) => set({ background, isDirty: true, isReady: false }),
      setOutput: (output) =>
        set((state) => ({
          output: { ...state.output, ...output },
          isDirty: true,
          isReady: false,
        })),
      setText: (text) =>
        set((state) => ({
          text: { ...state.text, ...text },
          isDirty: true,
          isReady: false,
        })),
      setTileOffset: (tileOffset) => set({ tileOffset, isDirty: true, isReady: false }),
      setTileScale: (tileScale) => set({ tileScale, isDirty: true, isReady: false }),
      setImageOffset: (imageOffset) => set({ imageOffset, isDirty: true, isReady: false }),
      setImageScale: (imageScale) => set({ imageScale, isDirty: true, isReady: false }),
      setImageRotation: (imageRotation) => set({ imageRotation, isDirty: true, isReady: false }),
      setShowSafeZone: (showSafeZone) => set({ showSafeZone }),
      markDirty: () => set({ isDirty: true, isReady: false }),
      markReady: () => set({ isDirty: false, isReady: true }),
      reset: () => set({ ...defaultState, isDirty: true, isReady: false }),
    }),
    {
      name: "notion-cover-editor",
      partialize: (state) => ({
        mode: state.mode,
        background: state.background,
        output: state.output,
        text: state.text,
        showSafeZone: state.showSafeZone,
      }),
    }
  )
);


import type { Size } from "./types.js";

export const getResizedImageDimensions = ({ width, height }: Size): Size => {
  const longEdge = Math.max(width, height);
  if (longEdge <= 2560) return { width, height };
  const scale = 2560 / longEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
};

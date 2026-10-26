import type { ImageOutputOptions } from "../core/types.js";
import { requireFinite } from "../core/validation.js";

export const exportImage = (
  canvas: HTMLCanvasElement,
  { format = "jpeg", quality }: ImageOutputOptions,
): string => {
  if (quality !== undefined) {
    requireFinite(quality);
    if (quality < 0 || quality > 1) throw new RangeError("Quality must be between 0 and 1");
  }
  const mimeType = `image/${format}`;
  const result = canvas.toDataURL(mimeType, quality);
  if (!result.startsWith(`data:${mimeType};`)) {
    throw new Error(`Unable to encode ${mimeType}`);
  }
  return result;
};

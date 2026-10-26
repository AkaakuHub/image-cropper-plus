import { getResizedImageDimensions } from "../core/imageDimensions.js";
import type { NormalizeImageOptions } from "../core/types.js";
import { exportImage } from "./exportImage.js";
import { convertHeicImage, isHeicImage } from "./heic.js";
import { getContext, loadImage } from "./loadImage.js";

export const normalizeImage = async (
  source: string,
  { convertHeic = true, format = "jpeg", quality = 0.92 }: NormalizeImageOptions = {},
): Promise<string> => {
  let normalized = source;
  if (convertHeic) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Unable to fetch image: ${response.status}`);
    const buffer = await response.arrayBuffer();
    if (isHeicImage(buffer)) normalized = await convertHeicImage(buffer);
  }
  const image = await loadImage(normalized);
  const size = getResizedImageDimensions({
    width: image.naturalWidth,
    height: image.naturalHeight,
  });
  if (size.width === image.naturalWidth && size.height === image.naturalHeight) return normalized;
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  getContext(canvas).drawImage(image, 0, 0, size.width, size.height);
  return exportImage(canvas, { format, quality });
};

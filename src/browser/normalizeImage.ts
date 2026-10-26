import { getResizedImageDimensions } from "../core/imageDimensions.js";
import { convertHeicImage, isHeicImage } from "./heic.js";
import { getContext, loadImage } from "./loadImage.js";

export const normalizeImage = async (source: string): Promise<string> => {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Unable to fetch image: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const normalized = isHeicImage(buffer) ? await convertHeicImage(buffer) : source;
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
  return canvas.toDataURL("image/jpeg", 0.92);
};

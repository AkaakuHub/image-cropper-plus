import { getCropDrawOffset, getRadianAngle } from "../core/geometry.js";
import type { Area } from "../core/types.js";
import { requireFinite, requireSize } from "../core/validation.js";
import { getContext, loadImage } from "./loadImage.js";

export const cropImage = async (source: string, area: Area, rotation = 0): Promise<string> => {
  requireSize(area);
  for (const value of [area.x, area.y, rotation]) requireFinite(value);
  const width = Math.round(area.width);
  const height = Math.round(area.height);
  if (width <= 0 || height <= 0) throw new RangeError("Invalid crop dimensions");
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = getContext(canvas);
  const offset = getCropDrawOffset(
    { width: image.naturalWidth, height: image.naturalHeight },
    { x: Math.round(area.x), y: Math.round(area.y) },
    rotation,
  );
  context.translate(offset.x, offset.y);
  context.rotate(getRadianAngle(rotation));
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  return canvas.toDataURL("image/jpeg");
};

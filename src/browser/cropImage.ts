import { getCropDrawOffset, getRadianAngle } from "../core/geometry.js";
import type { Area, CropImageOptions } from "../core/types.js";
import { requireFinite, requireSize } from "../core/validation.js";
import { exportImage } from "./exportImage.js";
import { getContext, loadImage } from "./loadImage.js";

export const cropImage = async (
  source: string,
  area: Area,
  { rotation = 0, outputSize, ...output }: CropImageOptions = {},
): Promise<string> => {
  requireSize(area);
  for (const value of [area.x, area.y, rotation]) requireFinite(value);
  const width = Math.round(area.width);
  const height = Math.round(area.height);
  if (width <= 0 || height <= 0) throw new RangeError("Invalid crop dimensions");
  if (outputSize !== undefined) {
    requireSize(outputSize);
    if (!Number.isInteger(outputSize.width) || !Number.isInteger(outputSize.height))
      throw new RangeError("Output dimensions must be positive integers");
  }
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize?.width ?? width;
  canvas.height = outputSize?.height ?? height;
  const context = getContext(canvas);
  const offset = getCropDrawOffset(
    { width: image.naturalWidth, height: image.naturalHeight },
    { x: Math.round(area.x), y: Math.round(area.y) },
    rotation,
  );
  context.scale(canvas.width / width, canvas.height / height);
  context.translate(offset.x, offset.y);
  context.rotate(getRadianAngle(rotation));
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  return exportImage(canvas, output);
};

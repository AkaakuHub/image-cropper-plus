import { getMinimumZoom, restrictCropPosition } from "./geometry.js";
import { getCropArea, getCropSize, getMediaSize } from "./layout.js";
import type { CropOptions, CropResult } from "./types.js";
import { clamp, requireFinite, requireSize } from "./validation.js";

export const calculateCrop = ({
  imageSize,
  viewportSize,
  position = { x: 0, y: 0 },
  zoom = 1,
  rotation = 0,
  orientation = "landscape",
}: CropOptions): CropResult => {
  requireSize(imageSize);
  requireSize(viewportSize);
  for (const value of [position.x, position.y, zoom, rotation]) requireFinite(value);
  const nextRotation = clamp(rotation, -180, 180);
  const aspect = orientation === "landscape" ? 16 / 9 : 9 / 16;
  const mediaSize = getMediaSize(imageSize, viewportSize);
  const cropSize = getCropSize(mediaSize, viewportSize, aspect, nextRotation);
  const minimumZoom = getMinimumZoom(mediaSize, cropSize, nextRotation);
  const maximumZoom = Math.max(10, minimumZoom);
  const nextZoom = clamp(zoom, minimumZoom, maximumZoom);
  const nextPosition = restrictCropPosition(position, mediaSize, cropSize, nextRotation, nextZoom);
  return {
    position: nextPosition,
    zoom: nextZoom,
    rotation: nextRotation,
    orientation,
    minimumZoom,
    maximumZoom,
    mediaSize,
    cropSize,
    area: getCropArea(imageSize, mediaSize, cropSize, nextPosition, aspect, nextRotation, nextZoom),
  };
};

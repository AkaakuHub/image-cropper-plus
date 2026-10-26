import { getRotatedSize } from "./geometry.js";
import type { Area, Point, Size } from "./types.js";
import { clamp } from "./validation.js";

export const getMediaSize = (imageSize: Size, viewportSize: Size): Size => {
  const scale = Math.min(
    1,
    viewportSize.width / imageSize.width,
    viewportSize.height / imageSize.height,
  );
  return { width: imageSize.width * scale, height: imageSize.height * scale };
};

export const getCropSize = (
  mediaSize: Size,
  viewportSize: Size,
  aspect: number,
  rotation: number,
): Size => {
  const rotatedSize = getRotatedSize(mediaSize.width, mediaSize.height, rotation);
  const width = Math.min(rotatedSize.width, viewportSize.width);
  const height = Math.min(rotatedSize.height, viewportSize.height);
  return width > height * aspect
    ? { width: height * aspect, height }
    : { width, height: width / aspect };
};

export const getCropArea = (
  imageSize: Size,
  mediaSize: Size,
  cropSize: Size,
  position: Point,
  aspect: number,
  rotation: number,
  zoom: number,
): Area => {
  const displayed = getRotatedSize(mediaSize.width, mediaSize.height, rotation);
  const natural = getRotatedSize(imageSize.width, imageSize.height, rotation);
  const percentages = {
    x: clamp(
      (((displayed.width - cropSize.width / zoom) / 2 - position.x / zoom) / displayed.width) * 100,
      0,
      100,
    ),
    y: clamp(
      (((displayed.height - cropSize.height / zoom) / 2 - position.y / zoom) / displayed.height) *
        100,
      0,
      100,
    ),
    width: clamp(((cropSize.width / displayed.width) * 100) / zoom, 0, 100),
    height: clamp(((cropSize.height / displayed.height) * 100) / zoom, 0, 100),
  };
  const width = Math.round(clamp((percentages.width * natural.width) / 100, 0, natural.width));
  const height = Math.round(clamp((percentages.height * natural.height) / 100, 0, natural.height));
  const size =
    natural.width >= natural.height * aspect
      ? { width: Math.round(height * aspect), height }
      : { width, height: Math.round(width / aspect) };
  return {
    ...size,
    x: Math.round(clamp((percentages.x * natural.width) / 100, 0, natural.width - size.width)),
    y: Math.round(clamp((percentages.y * natural.height) / 100, 0, natural.height - size.height)),
  };
};

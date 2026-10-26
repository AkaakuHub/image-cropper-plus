import type { Point, Size } from "./types.js";

export const getRadianAngle = (degrees: number): number => (degrees * Math.PI) / 180;

export const getRotatedSize = (width: number, height: number, rotation: number): Size => {
  const radians = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height: Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  };
};

export const getCropDrawOffset = (imageSize: Size, position: Point, rotation: number): Point => {
  const size = getRotatedSize(imageSize.width, imageSize.height, rotation);
  return { x: size.width / 2 - position.x, y: size.height / 2 - position.y };
};

export const getMinimumZoom = (mediaSize: Size, cropSize: Size, rotation: number): number => {
  const radians = getRadianAngle(rotation);
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  return Math.max(
    (cosine * cropSize.width + sine * cropSize.height) / mediaSize.width,
    (sine * cropSize.width + cosine * cropSize.height) / mediaSize.height,
  );
};

export const restrictCropPosition = (
  position: Point,
  mediaSize: Size,
  cropSize: Size,
  rotation: number,
  zoom: number,
): Point => {
  const radians = getRadianAngle(rotation);
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const isValid = (point: Point): boolean =>
    [-1, 1].every((horizontal) =>
      [-1, 1].every((vertical) => {
        const x = (horizontal * cropSize.width) / 2 - point.x;
        const y = (vertical * cropSize.height) / 2 - point.y;
        return (
          Math.abs(x * cosine + y * sine) <= (mediaSize.width * zoom) / 2 &&
          Math.abs(-x * sine + y * cosine) <= (mediaSize.height * zoom) / 2
        );
      }),
    );

  if (isValid(position)) return position;
  let lowerBound = 0;
  let upperBound = 1;
  for (let index = 0; index < 20; index += 1) {
    const ratio = (lowerBound + upperBound) / 2;
    if (isValid({ x: position.x * ratio, y: position.y * ratio })) {
      lowerBound = ratio;
    } else {
      upperBound = ratio;
    }
  }
  return { x: position.x * lowerBound, y: position.y * lowerBound };
};

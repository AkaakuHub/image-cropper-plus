import type { Size } from "./types.js";

export const requireFinite = (value: number): void => {
  if (!Number.isFinite(value)) {
    throw new RangeError("Expected a finite number");
  }
};

export const requireSize = (size: Size): void => {
  requireFinite(size.width);
  requireFinite(size.height);
  if (size.width <= 0 || size.height <= 0) {
    throw new RangeError("Image and viewport dimensions must be positive");
  }
};

export const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

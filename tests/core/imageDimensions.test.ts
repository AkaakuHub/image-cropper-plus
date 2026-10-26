import { describe, expect, it } from "vitest";
import { getResizedImageDimensions } from "../../src/core/imageDimensions.js";

describe("getResizedImageDimensions", () => {
  it.each([
    [
      { width: 1920, height: 1080 },
      { width: 1920, height: 1080 },
    ],
    [
      { width: 2560, height: 1440 },
      { width: 2560, height: 1440 },
    ],
    [
      { width: 6000, height: 4000 },
      { width: 2560, height: 1707 },
    ],
    [
      { width: 4000, height: 6000 },
      { width: 1707, height: 2560 },
    ],
  ])("%jの長辺を2560px以下に収める", (input, output) => {
    expect(getResizedImageDimensions(input)).toEqual(output);
  });
});

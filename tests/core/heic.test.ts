import { describe, expect, it } from "vitest";
import { isHeicImage } from "../../src/browser/heic.js";

describe("HEICのヘッダー判定", () => {
  it.each(["ftypmif1", "ftypmsf1", "ftypheic", "ftypheix", "ftyphevc", "ftyphevx"])(
    "%sをHEICとして認識する",
    (header) => {
      expect(isHeicImage(new TextEncoder().encode(`0000${header}`).buffer)).toBe(true);
    },
  );

  it.each(["", "PNG", "0000ftypavif", "0000ftypjpeg"])("%sをHEICとして扱わない", (header) => {
    expect(isHeicImage(new TextEncoder().encode(header).buffer)).toBe(false);
  });
});

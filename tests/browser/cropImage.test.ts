import { afterEach, describe, expect, it, vi } from "vitest";
import { cropImage } from "../../src/browser/cropImage.js";

const drawing = vi.hoisted(() => ({
  scale: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
}));
vi.mock("../../src/browser/loadImage.js", () => ({
  loadImage: async () => ({ naturalWidth: 1600, naturalHeight: 900 }),
  getContext: () => drawing,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("出力寸法を指定した切り抜き", () => {
  it("切り抜き範囲を指定したピクセル寸法へ拡縮する", async () => {
    const canvas = { width: 0, height: 0, toDataURL: () => "data:image/png;base64,result" };
    vi.stubGlobal("document", { createElement: () => canvas });
    await cropImage(
      "source",
      { x: 100, y: 50, width: 800, height: 450 },
      {
        format: "png",
        outputSize: { width: 1920, height: 1080 },
      },
    );
    expect([canvas.width, canvas.height]).toEqual([1920, 1080]);
    expect(drawing.scale).toHaveBeenCalledWith(2.4, 2.4);
    expect(drawing.translate).toHaveBeenCalledWith(700, 400);
    expect(drawing.drawImage).toHaveBeenCalledWith(
      expect.objectContaining({ naturalWidth: 1600 }),
      -800,
      -450,
    );
  });

  it.each([
    { width: 0, height: 1080 },
    { width: 1920.5, height: 1080 },
    { width: 1920, height: Number.NaN },
  ])("不正な出力寸法を拒否する: %j", async (outputSize) => {
    await expect(
      cropImage("source", { x: 0, y: 0, width: 800, height: 450 }, { outputSize }),
    ).rejects.toThrow(RangeError);
  });
});

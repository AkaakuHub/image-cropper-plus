import { describe, expect, it } from "vitest";
import { calculateCrop } from "../../src/index.js";
import fixtures from "../fixtures/cropAreas.json" with { type: "json" };

const dimensions = {
  imageSize: { width: 1920, height: 1080 },
  viewportSize: { width: 640, height: 480 },
};

describe("calculateCrop", () => {
  it("既定値で画像全体を16:9で切り抜く", () => {
    const result = calculateCrop(dimensions);
    expect(result.area).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
    expect(result.mediaSize).toEqual({ width: 640, height: 360 });
    expect(result.cropSize).toEqual(result.mediaSize);
    expect(result.zoom).toBe(1);
    expect(result.aspect).toBe(16 / 9);
  });

  it.each([9 / 16, 1, 4 / 3, 2.35])("引数の比率%sを切り抜き枠へ反映する", (aspect) => {
    const result = calculateCrop({ ...dimensions, aspect });
    expect(result.cropSize.width / result.cropSize.height).toBeCloseTo(aspect);
    expect(Math.abs(result.area.width - result.area.height * aspect)).toBeLessThanOrEqual(1);
  });

  it("元のクロッパーと同じピクセル範囲を返す", () => {
    for (const { input, area } of fixtures) {
      expect(calculateCrop(input).area).toEqual(area);
    }
  });

  it("拡大時のドラッグ位置を出力座標に変換する", () => {
    const result = calculateCrop({ ...dimensions, zoom: 2, position: { x: 100, y: -50 } });
    expect(result.position).toEqual({ x: 100, y: -50 });
    expect(result.area).toEqual({ width: 960, height: 540, x: 330, y: 345 });
  });

  it("倍率と回転角度を既存の操作範囲内に制限する", () => {
    const small = calculateCrop({ ...dimensions, zoom: -1, rotation: -999 });
    expect(small.zoom).toBe(small.minimumZoom);
    expect(small.rotation).toBe(-180);
    const large = calculateCrop({ ...dimensions, zoom: 999, rotation: 999 });
    expect(large.zoom).toBe(large.maximumZoom);
    expect(large.maximumZoom).toBe(10);
    expect(large.rotation).toBe(180);
  });

  it("極端な縦横比でも枠を覆う倍率を確保する", () => {
    const result = calculateCrop({
      ...dimensions,
      imageSize: { width: 10000, height: 10 },
      rotation: 45,
    });
    expect(result.minimumZoom).toBeGreaterThan(10);
    expect(result.maximumZoom).toBe(result.minimumZoom);
    expect(result.zoom).toBe(result.minimumZoom);
  });

  it("回転とドラッグを組み合わせても枠の四隅を画像内に収める", () => {
    for (const aspect of [16 / 9, 9 / 16, 1, 4 / 3]) {
      for (let rotation = -180; rotation <= 180; rotation += 5) {
        for (const zoom of [0.1, 1.5, 4]) {
          const result = calculateCrop({
            ...dimensions,
            aspect,
            rotation,
            zoom,
            position: { x: 5000, y: -3000 },
          });
          const angle = (result.rotation * Math.PI) / 180;
          for (const horizontal of [-1, 1]) {
            for (const vertical of [-1, 1]) {
              const x = (horizontal * result.cropSize.width) / 2 - result.position.x;
              const y = (vertical * result.cropSize.height) / 2 - result.position.y;
              expect(Math.abs(x * Math.cos(angle) + y * Math.sin(angle))).toBeLessThanOrEqual(
                (result.mediaSize.width * result.zoom) / 2 + 1e-8,
              );
              expect(Math.abs(-x * Math.sin(angle) + y * Math.cos(angle))).toBeLessThanOrEqual(
                (result.mediaSize.height * result.zoom) / 2 + 1e-8,
              );
            }
          }
        }
      }
    }
  });

  it("向きと表示領域を変更しても入力オブジェクトを変更しない", () => {
    const input = { ...dimensions, zoom: 2, position: { x: 50, y: -30 } };
    const previous = structuredClone(input);
    const landscape = calculateCrop(input);
    const portrait = calculateCrop({ ...input, ...landscape, aspect: 9 / 16 });
    const resized = calculateCrop({
      ...input,
      ...portrait,
      viewportSize: { width: 300, height: 400 },
    });
    expect(input).toEqual(previous);
    expect(portrait.cropSize.width / portrait.cropSize.height).toBeCloseTo(9 / 16);
    expect(resized.cropSize.width).toBeLessThanOrEqual(300);
    expect(resized.cropSize.height).toBeLessThanOrEqual(400);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "無効な寸法や比率%sを拒否する",
    (value) => {
      expect(() => calculateCrop({ ...dimensions, aspect: value })).toThrow(RangeError);
      expect(() =>
        calculateCrop({ ...dimensions, imageSize: { width: value, height: 100 } }),
      ).toThrow(RangeError);
      expect(() =>
        calculateCrop({ ...dimensions, viewportSize: { width: 100, height: value } }),
      ).toThrow(RangeError);
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "有限でない操作値%sを拒否する",
    (value) => {
      expect(() => calculateCrop({ ...dimensions, zoom: value })).toThrow(RangeError);
      expect(() => calculateCrop({ ...dimensions, rotation: value })).toThrow(RangeError);
      expect(() => calculateCrop({ ...dimensions, position: { x: value, y: 0 } })).toThrow(
        RangeError,
      );
    },
  );
});

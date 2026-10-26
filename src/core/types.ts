export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Area extends Size, Point {}

export interface CropOptions {
  readonly imageSize: Size;
  readonly viewportSize: Size;
  readonly position?: Point;
  readonly zoom?: number;
  readonly rotation?: number;
  readonly aspect?: number;
}

export interface CropResult {
  readonly position: Point;
  readonly zoom: number;
  readonly rotation: number;
  readonly aspect: number;
  readonly minimumZoom: number;
  readonly maximumZoom: number;
  readonly mediaSize: Size;
  readonly cropSize: Size;
  readonly area: Area;
}

export type ImageFormat = "jpeg" | "png" | "webp";

export interface ImageOutputOptions {
  readonly format?: ImageFormat;
  readonly quality?: number;
}

export interface CropImageOptions extends ImageOutputOptions {
  readonly outputSize?: Size;
  readonly rotation?: number;
}

export interface NormalizeImageOptions extends ImageOutputOptions {
  readonly convertHeic?: boolean;
}

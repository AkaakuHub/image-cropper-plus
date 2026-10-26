export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Area extends Size, Point {}

export type CropOrientation = "landscape" | "portrait";

export interface CropOptions {
  readonly imageSize: Size;
  readonly viewportSize: Size;
  readonly position?: Point;
  readonly zoom?: number;
  readonly rotation?: number;
  readonly orientation?: CropOrientation;
}

export interface CropResult {
  readonly position: Point;
  readonly zoom: number;
  readonly rotation: number;
  readonly orientation: CropOrientation;
  readonly minimumZoom: number;
  readonly maximumZoom: number;
  readonly mediaSize: Size;
  readonly cropSize: Size;
  readonly area: Area;
}

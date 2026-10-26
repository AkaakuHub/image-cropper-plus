import { type CropResult, normalizeImage, type Size } from "image-cropper-plus";

export const viewportSize = { width: 320, height: 240 };
export const formats = ["jpeg", "png", "webp"] as const;
export const aspects = [16 / 9, 9 / 16, 1, 4 / 3];
export const aspectLabels = ["16:9", "9:16", "1:1", "4:3"];

export interface SelectedImage {
  source: string;
  imageSize: Size;
  filename: string;
}

export const readImage = async (file: File, convertHeic: boolean): Promise<SelectedImage> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("画像を読み込めませんでした。"));
    };
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.onabort = () => reject(new Error("画像の読み込みを中止しました。"));
    reader.readAsDataURL(file);
  });
  const source = await normalizeImage(dataUrl, { convertHeic, format: "png" });
  const image = new Image();
  image.src = source;
  await image.decode();
  return {
    source,
    imageSize: { width: image.naturalWidth, height: image.naturalHeight },
    filename: source === dataUrl ? file.name : "image.png",
  };
};

export const previewStyle = (crop: CropResult) => ({
  width: `${crop.mediaSize.width}px`,
  height: `${crop.mediaSize.height}px`,
  transform: `translate(-50%, -50%) translate(${crop.position.x}px, ${crop.position.y}px) rotate(${crop.rotation}deg) scale(${crop.zoom})`,
});

export const frameStyle = (crop: CropResult) => ({
  width: `${crop.cropSize.width}px`,
  height: `${crop.cropSize.height}px`,
});

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "画像を処理できませんでした。";

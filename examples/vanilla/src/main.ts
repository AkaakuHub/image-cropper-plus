import { type CropOptions, type CropResult, calculateCrop, cropImage } from "image-cropper-plus";
import {
  errorMessage,
  formats,
  frameStyle,
  previewStyle,
  readImage,
  type SelectedImage,
  viewportSize,
} from "../../shared/image.js";
import "../../shared/style.css";

const element = <T extends HTMLElement>(id: string): T => {
  const found = document.querySelector<T>(`#${id}`);
  if (!found) throw new Error(`Element missing: ${id}`);
  return found;
};
const file = element<HTMLInputElement>("file");
const heic = element<HTMLInputElement>("heic");
const stage = element<HTMLDivElement>("stage");
const preview = element<HTMLImageElement>("preview");
const frame = element<HTMLDivElement>("frame");
const controls = element<HTMLFieldSetElement>("controls");
const aspect = element<HTMLSelectElement>("aspect");
const rotation = element<HTMLInputElement>("rotation");
const zoom = element<HTMLInputElement>("zoom");
const format = element<HTMLSelectElement>("format");
const error = element<HTMLParagraphElement>("error");
const download = element<HTMLAnchorElement>("download");
const result = element<HTMLImageElement>("result");
let image: SelectedImage | null = null;
let crop: CropResult | null = null;
let busy = false;
let drag: { id: number; x: number; y: number } | null = null;

const update = (patch: Partial<CropOptions> = {}): void => {
  if (!image) return;
  crop = calculateCrop({ ...crop, ...patch, imageSize: image.imageSize, viewportSize });
  preview.src = image.source;
  preview.hidden = false;
  frame.hidden = false;
  Object.assign(preview.style, previewStyle(crop));
  Object.assign(frame.style, frameStyle(crop));
  aspect.value = String(crop.aspect);
  rotation.value = String(crop.rotation);
  zoom.min = String(crop.minimumZoom);
  zoom.max = String(crop.maximumZoom);
  zoom.value = String(crop.zoom);
};

const run = async (operation: () => Promise<void>): Promise<void> => {
  busy = true;
  file.disabled = true;
  controls.disabled = true;
  error.hidden = true;
  try {
    await operation();
  } catch (cause) {
    error.textContent = errorMessage(cause);
    error.hidden = false;
  } finally {
    busy = false;
    file.disabled = false;
    controls.disabled = !crop;
  }
};

file.addEventListener("change", () => {
  const selected = file.files?.[0];
  if (!selected) return;
  void run(async () => {
    image = await readImage(selected, heic.checked);
    crop = null;
    download.hidden = true;
    update();
  });
});
aspect.addEventListener("change", () => update({ aspect: Number(aspect.value) }));
rotation.addEventListener("input", () => update({ rotation: rotation.valueAsNumber }));
zoom.addEventListener("input", () => update({ zoom: zoom.valueAsNumber }));
element("reset-rotation").addEventListener("click", () => update({ rotation: 0 }));
element("reset-zoom").addEventListener("click", () => {
  if (crop) update({ zoom: crop.minimumZoom });
});

stage.addEventListener("pointerdown", (event) => {
  if (!crop || busy || !event.isPrimary) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener("pointermove", (event) => {
  if (!crop || busy || !drag || drag.id !== event.pointerId) return;
  update({
    position: {
      x: crop.position.x + event.clientX - drag.x,
      y: crop.position.y + event.clientY - drag.y,
    },
  });
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
});
stage.addEventListener("lostpointercapture", () => {
  drag = null;
});
stage.addEventListener("pointerup", (event) => {
  if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
});
stage.addEventListener(
  "wheel",
  (event) => {
    if (!crop || busy) return;
    event.preventDefault();
    update({ zoom: crop.zoom - event.deltaY / 200 });
  },
  { passive: false },
);

const showResult = (source: string, filename: string): void => {
  result.src = source;
  download.href = source;
  download.download = filename;
  download.hidden = false;
};
element("complete").addEventListener("click", () => {
  const selectedFormat = formats.find((value) => value === format.value);
  if (!image || !crop || !selectedFormat) return;
  const currentImage = image;
  const currentCrop = crop;
  void run(async () =>
    showResult(
      await cropImage(currentImage.source, currentCrop.area, {
        rotation: currentCrop.rotation,
        format: selectedFormat,
      }),
      `crop.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`,
    ),
  );
});
element("skip").addEventListener("click", () => {
  if (image) showResult(image.source, image.filename);
});

<script setup lang="ts">
import {
  type CropOptions,
  type CropResult,
  calculateCrop,
  cropImage,
  type ImageFormat,
  type Point,
} from "image-cropper-plus";
import { ref, shallowRef } from "vue";
import {
  aspectLabels,
  aspects,
  errorMessage,
  formats,
  frameStyle,
  previewStyle,
  readImage,
  type SelectedImage,
  viewportSize,
} from "../../shared/image.js";

const editor = shallowRef<{ image: SelectedImage; crop: CropResult } | null>(null);
const convertHeic = ref(true);
const format = ref<ImageFormat>("jpeg");
const output = shallowRef<{ source: string; filename: string } | null>(null);
const busy = ref(false);
const error = ref("");
let drag: (Point & { id: number }) | null = null;

const update = (patch: Partial<CropOptions>) => {
  const current = editor.value;
  if (!current) return;
  editor.value = {
    image: current.image,
    crop: calculateCrop({
      ...current.crop,
      ...patch,
      imageSize: current.image.imageSize,
      viewportSize,
    }),
  };
};
const run = async (operation: () => Promise<void>) => {
  busy.value = true;
  error.value = "";
  try {
    await operation();
  } catch (cause) {
    error.value = errorMessage(cause);
  } finally {
    busy.value = false;
  }
};
const select = (event: Event) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  const file = event.target.files?.[0];
  if (!file) return;
  void run(async () => {
    const image = await readImage(file, convertHeic.value);
    editor.value = { image, crop: calculateCrop({ imageSize: image.imageSize, viewportSize }) };
    output.value = null;
  });
};
const complete = () =>
  run(async () => {
    const current = editor.value;
    if (!current) return;
    const selectedFormat = format.value;
    const source = await cropImage(current.image.source, current.crop.area, {
      rotation: current.crop.rotation,
      format: selectedFormat,
    });
    output.value = {
      source,
      filename: `crop.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`,
    };
  });
const pointerDown = (event: PointerEvent) => {
  if (
    !editor.value ||
    busy.value ||
    !event.isPrimary ||
    !(event.currentTarget instanceof HTMLElement)
  )
    return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  event.currentTarget.setPointerCapture(event.pointerId);
};
const pointerMove = (event: PointerEvent) => {
  if (!editor.value || busy.value || !drag || drag.id !== event.pointerId) return;
  const position = editor.value.crop.position;
  update({
    position: { x: position.x + event.clientX - drag.x, y: position.y + event.clientY - drag.y },
  });
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
};
const pointerUp = (event: PointerEvent) => {
  if (
    event.currentTarget instanceof HTMLElement &&
    event.currentTarget.hasPointerCapture(event.pointerId)
  )
    event.currentTarget.releasePointerCapture(event.pointerId);
};
const setNumber = (event: Event, key: "zoom" | "rotation" | "aspect") => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)
    update({ [key]: Number(event.target.value) });
};
const setFormat = (event: Event) => {
  if (!(event.target instanceof HTMLSelectElement)) return;
  const value = event.target.value;
  const next = formats.find((entry) => entry === value);
  if (next) format.value = next;
};
</script>

<template>
  <main>
    <h1>Vueの使用例</h1>
    <label
      >画像<input type="file" accept="image/*,.heic,.heif" :disabled="busy" @change="select"></label
    >
    <label><input v-model="convertHeic" type="checkbox">HEIC変換</label>
    <p v-if="error" role="alert">{{ error }}</p>
    <div
      class="stage"
      @pointerdown="pointerDown"
      @pointermove="pointerMove"
      @pointerup="pointerUp"
      @lostpointercapture="drag = null"
    >
      <template v-if="editor">
        <img
          :src="editor.image.source"
          alt="編集中の画像"
          :draggable="false"
          :style="previewStyle(editor.crop)"
        >
        <div class="frame" :style="frameStyle(editor.crop)" />
      </template>
    </div>
    <fieldset :disabled="!editor || busy">
      <label
        >縦横比<select :value="editor?.crop.aspect ?? 16 / 9" @change="setNumber($event, 'aspect')">
          <option v-for="(aspect, index) in aspects" :key="aspect" :value="aspect">
            {{ aspectLabels[index] }}
          </option>
        </select></label
      >
      <label
        >回転<input
          type="range"
          min="-180"
          max="180"
          :value="editor?.crop.rotation ?? 0"
          @input="setNumber($event, 'rotation')"
        ></label
      >
      <button type="button" @click="update({ rotation: 0 })">回転をリセット</button>
      <label
        >倍率<input
          type="range"
          :min="editor?.crop.minimumZoom ?? 1"
          :max="editor?.crop.maximumZoom ?? 10"
          step="0.01"
          :value="editor?.crop.zoom ?? 1"
          @input="setNumber($event, 'zoom')"
        ></label
      >
      <button type="button" @click="editor && update({ zoom: editor.crop.minimumZoom })">
        倍率をリセット
      </button>
      <label
        >出力形式<select :value="format" @change="setFormat">
          <option v-for="value in formats" :key="value" :value="value">
            {{ value.toUpperCase() }}
          </option>
        </select></label
      >
      <button type="button" @click="complete">切り抜く</button>
      <button
        type="button"
        @click="
          editor && (output = { source: editor.image.source, filename: editor.image.filename })
        "
      >
        元画像を使用
      </button>
    </fieldset>
    <a v-if="output" :href="output.source" :download="output.filename"
      ><img :src="output.source" alt="出力画像"></a
    >
  </main>
</template>

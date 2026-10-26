import {
  type CropOptions,
  type CropResult,
  calculateCrop,
  cropImage,
  type ImageFormat,
  type Point,
} from "image-cropper-plus";
import { useRef, useState } from "react";
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

interface Editor {
  image: SelectedImage;
  crop: CropResult;
}

export function App() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [convertHeic, setConvertHeic] = useState(true);
  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [output, setOutput] = useState<{ source: string; filename: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const drag = useRef<(Point & { id: number }) | null>(null);
  const crop = editor?.crop;

  const update = (patch: Partial<CropOptions>) => {
    setEditor(
      (current) =>
        current && {
          image: current.image,
          crop: calculateCrop({
            ...current.crop,
            ...patch,
            imageSize: current.image.imageSize,
            viewportSize,
          }),
        },
    );
  };
  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  const select = (file: File) =>
    run(async () => {
      const image = await readImage(file, convertHeic);
      setEditor({ image, crop: calculateCrop({ imageSize: image.imageSize, viewportSize }) });
      setOutput(null);
    });
  const complete = () =>
    run(async () => {
      if (!editor) return;
      const source = await cropImage(editor.image.source, editor.crop.area, {
        rotation: editor.crop.rotation,
        format,
      });
      setOutput({ source, filename: `crop.${format === "jpeg" ? "jpg" : format}` });
    });

  return (
    <main>
      <h1>Reactの使用例</h1>
      <label>
        画像
        <input
          type="file"
          accept="image/*,.heic,.heif"
          disabled={busy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void select(file);
          }}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={convertHeic}
          onChange={(event) => setConvertHeic(event.currentTarget.checked)}
        />
        HEIC変換
      </label>
      {error && <p role="alert">{error}</p>}
      <div
        className="stage"
        onPointerDown={(event) => {
          if (!crop || busy || !event.isPrimary) return;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!crop || busy || !drag.current || drag.current.id !== event.pointerId) return;
          update({
            position: {
              x: crop.position.x + event.clientX - drag.current.x,
              y: crop.position.y + event.clientY - drag.current.y,
            },
          });
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      >
        {editor && (
          <>
            <img
              src={editor.image.source}
              alt="編集中の画像"
              draggable={false}
              style={previewStyle(editor.crop)}
            />
            <div className="frame" style={frameStyle(editor.crop)} />
          </>
        )}
      </div>
      <fieldset disabled={!crop || busy}>
        <label>
          縦横比
          <select
            value={crop?.aspect ?? 16 / 9}
            onChange={(event) => update({ aspect: Number(event.currentTarget.value) })}
          >
            {aspects.map((aspect, index) => (
              <option key={aspect} value={aspect}>
                {aspectLabels[index]}
              </option>
            ))}
          </select>
        </label>
        <label>
          回転
          <input
            type="range"
            min={-180}
            max={180}
            value={crop?.rotation ?? 0}
            onChange={(event) => update({ rotation: event.currentTarget.valueAsNumber })}
          />
        </label>
        <button type="button" onClick={() => update({ rotation: 0 })}>
          回転をリセット
        </button>
        <label>
          倍率
          <input
            type="range"
            min={crop?.minimumZoom ?? 1}
            max={crop?.maximumZoom ?? 10}
            step={0.01}
            value={crop?.zoom ?? 1}
            onChange={(event) => update({ zoom: event.currentTarget.valueAsNumber })}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (crop) update({ zoom: crop.minimumZoom });
          }}
        >
          倍率をリセット
        </button>
        <label>
          出力形式
          <select
            value={format}
            onChange={(event) => {
              const next = formats.find((value) => value === event.currentTarget.value);
              if (next) setFormat(next);
            }}
          >
            {formats.map((value) => (
              <option key={value} value={value}>
                {value.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => void complete()}>
          切り抜く
        </button>
        <button
          type="button"
          onClick={() => {
            if (editor) setOutput({ source: editor.image.source, filename: editor.image.filename });
          }}
        >
          元画像を使用
        </button>
      </fieldset>
      {output && (
        <a href={output.source} download={output.filename}>
          <img src={output.source} alt="出力画像" />
        </a>
      )}
    </main>
  );
}

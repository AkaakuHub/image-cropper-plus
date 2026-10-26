# image-cropper-plus

[hasujimakuのクロッパー](https://github.com/AkaakuHub/hasujimaku/tree/33ed8319b1c2f37c4245a6bacfeea9dc4fb45217/src/components/crop)から、画像処理と座標計算を抽出したTypeScriptライブラリです。React・Vue・Svelte・通常のJavaScriptで共通して使えます。

## インストール

```sh
pnpm add image-cropper-plus
```

ESM形式です。型定義を同梱しています。画像処理にはブラウザのCanvas APIを使います。ReactやUIライブラリには依存しません。

## 使い方

```ts
import { calculateCrop, cropImage, normalizeImage } from "image-cropper-plus";

const source = await normalizeImage(selectedImageUrl, { format: "png" });
const image = new Image();
image.crossOrigin = "anonymous";
image.src = source;
await image.decode();

const crop = calculateCrop({
  imageSize: { width: image.naturalWidth, height: image.naturalHeight },
  viewportSize: { width: 640, height: 480 },
  aspect: 4 / 3,
  position: { x: 0, y: 0 },
  zoom: 1,
  rotation: 0,
});

const result = await cropImage(source, crop.area, {
  rotation: crop.rotation,
  format: "webp",
  quality: 0.9,
});
```

入力にはData URL、Blob URL、画像URLを指定できます。別ドメインの画像には配信元のCORS許可が必要です。ファイル入力では`URL.createObjectURL(file)`でURLを作り、処理とプレビューが終わったら`URL.revokeObjectURL(url)`で解放してください。

## 公開API

実行時に公開する関数は次の3つだけです。内部モジュールへの直接インポートはできません。

### calculateCrop(options): CropResult

DOMやUIの状態を変更せず、描画サイズと出力範囲を計算します。Node.jsでも利用できます。

| 引数           | 内容                                                    | 既定値           |
| -------------- | ------------------------------------------------------- | ---------------- |
| `imageSize`    | 前処理後の画像のピクセル寸法                            | 必須             |
| `viewportSize` | 表示領域のCSSピクセル寸法                               | 必須             |
| `aspect`       | クロップ枠の幅÷高さ。正の有限数を指定します             | `16 / 9`         |
| `position`     | 表示領域の中心からの画像移動量。CSSピクセルで指定します | `{ x: 0, y: 0 }` |
| `zoom`         | 画像の拡大率                                            | `1`              |
| `rotation`     | 時計回りの角度。−180～180度に制限します                 | `0`              |

`aspect`には`16 / 9`、`9 / 16`、`1`、`4 / 3`などを渡せます。固定の選択肢はありません。

返り値の`position`と`zoom`は、回転した画像がクロップ枠を覆うように補正済みです。UIではこの値を状態と描画に使用してください。`minimumZoom`は枠を覆う最小倍率、`maximumZoom`は`Math.max(10, minimumZoom)`です。

`mediaSize`は拡大前の画像表示サイズ、`cropSize`は中央に置くクロップ枠のサイズです。`area`は回転後の画像の外接矩形を基準にした切り抜き範囲です。`cropImage`にそのまま渡してください。画像と表示領域の寸法は正の有限数で指定し、画像の読み込みや領域の測定が済んでから計算します。

### cropImage(source, area, options?): Promise&lt;string&gt;

指定範囲を切り抜き、Data URLを返します。

| オプション | 内容                               | 既定値           |
| ---------- | ---------------------------------- | ---------------- |
| `rotation` | 計算に使った回転角度               | `0`              |
| `format`   | `"jpeg"`・`"png"`・`"webp"`        | `"jpeg"`         |
| `quality`  | JPEG・WebPの品質。0～1を指定します | ブラウザの既定値 |

PNGは可逆圧縮なので`quality`は適用されません。ブラウザが指定形式で出力できない場合はエラーになります。

### normalizeImage(source, options?): Promise&lt;string&gt;

HEICをPNGへ変換し、長辺が2560pxを超える画像を縦横比を保って縮小します。変換も縮小も不要なら入力URLを返します。

| オプション    | 内容                                        | 既定値   |
| ------------- | ------------------------------------------- | -------- |
| `convertHeic` | HEICを検出して変換するか                    | `true`   |
| `format`      | 縮小画像の形式。`"jpeg"`・`"png"`・`"webp"` | `"jpeg"` |
| `quality`     | 縮小画像のJPEG・WebP品質。0～1を指定します  | `0.92`   |

```ts
const source = await normalizeImage(url, { convertHeic: false, format: "png" });
```

`convertHeic: false`では、HEICの検出と変換を省略します。HEICを読み込めるかどうかはブラウザの対応状況によります。HEIC変換用の`heic2any`は、変換が必要なときだけ動的に読み込みます。

PNG・WebPで透過を残す場合、前処理にも`format: "png"`を指定してください。前処理の既定値は移植元と同じJPEGなので、縮小時に透過情報が失われます。

## UIとの接続

画像の選択、ダイアログ、入力イベント、ローディング表示はUI側で管理します。描画先の中央に画像と枠を置き、画像へ次のサイズと変形を適用します。

```ts
Object.assign(image.style, {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: `${crop.mediaSize.width}px`,
  height: `${crop.mediaSize.height}px`,
  maxWidth: "none",
  maxHeight: "none",
  transformOrigin: "center",
  transform: `translate(-50%, -50%) translate(${crop.position.x}px, ${crop.position.y}px) rotate(${crop.rotation}deg) scale(${crop.zoom})`,
});
```

親要素は`position: relative; overflow: hidden`にします。クロップ枠は`cropSize`の寸法で中央に描画します。

| 操作                             | UIから渡す値                                                              |
| -------------------------------- | ------------------------------------------------------------------------- |
| ドラッグ                         | 前回の`position`にポインターの移動量を加えます                            |
| ホイール・ピンチ・倍率スライダー | 変更後の`zoom`を渡します                                                  |
| 回転スライダー・回転ジェスチャー | 変更後の`rotation`を渡します                                              |
| 横・縦・任意比率の切り替え       | 変更後の`aspect`を渡します                                                |
| 倍率リセット                     | `zoom: crop.minimumZoom`を渡します                                        |
| 回転リセット                     | `rotation: 0`を渡します                                                   |
| 表示領域のリサイズ               | 変更後の`viewportSize`を渡します                                          |
| 決定                             | `cropImage(source, crop.area, { rotation: crop.rotation })`を呼び出します |
| 元画像を使用                     | 前処理後の`source`をそのまま採用します                                    |
| キャンセル                       | 適用済みの画像を維持して編集UIを閉じます                                  |

各操作後に`calculateCrop`で再計算します。返り値は次回の入力へ渡せるので、Reactなら状態更新、Vueならリアクティブな値の更新に接続できます。ポインターやタッチイベントの登録はパッケージに含めていません。

複数の画像を続けて選択する場合は選択ごとのIDをUI側で管理し、古い前処理結果を適用しないようにしてください。各画像処理関数の失敗はPromiseの拒否で通知します。

## 開発

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm pack
```

配布対象は`dist`、README、NOTICEです。元のクロッパーの計算例と、位置制限・回転・比率・縮小・HEIC判定をテストしています。移植元と計算処理の権利表示は[NOTICE](./NOTICE)に記載しています。

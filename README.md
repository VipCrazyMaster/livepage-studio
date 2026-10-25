# Livepage Studio

**Edit an HTML file the way you edit a slide.**

AI can now produce a finished, self-contained HTML page in one shot — a deck, a report, a course module. But the page is never *done*: a sentence needs rewording, a number changes, a chart needs a new value, a photo should be swapped.

Paying for that with another prompt loop is wasteful, and installing a whole website builder to move one paragraph is absurd.

Livepage Studio is the small tool in between: **open the `.html` file, click the thing, change it, save.** No build step, no project model, no server, no re-generation.

## Why not a page builder

| | Typical builder | Livepage Studio |
|---|---|---|
| How it loads your file | Parses it into the builder's own component model | Loads the real file in an iframe and edits the live DOM |
| `<script>` tags | Stripped by default | Untouched — the page keeps working |
| Canvas / WebGL / charts | Flattened to a bitmap or lost | Still live; editable through their data |
| Saving | Regenerates HTML from the model | Serialises the document you actually edited |
| Result | "Close, but it broke my page" | The same page, with your edits |

That difference is the whole point. If the deliverable is a single `.html` file, the editor has to be able to *hold* a single `.html` file.

## What you can do

- **Text** — double-click to rewrite in place, or use the inspector: font, size, weight, colour, line height, letter spacing, alignment.
- **Move** — press and drag anything; the surrounding layout does not shift. `Alt`+arrows nudge, `Shift` for 10px.
- **Structure** — duplicate, delete, reorder, free-position, undo/redo (`⌘Z`).
- **Charts** — if the page exposes data (`window.PPT_DATA`) and a renderer (`window.PptCharts`), the inspector turns it into an editable table and redraws live. Values are written back on save.
- **Images** — replace `<img>` content or CSS background images; large files are recompressed automatically.
- **Page backdrop** — swap the full-page background layer per slide (`window.PLATE_URLS`).
- **Zoom** — `Ctrl`/`⌘` + wheel (trackpad pinch works too), 25%–300%, `⌘0` resets.
- **Language** — Chinese / English UI, remembered locally.
- **Context menu** — localised, and aware of what you right-clicked.
- **Deck navigation** — slides are detected from `<section>` elements and listed on the left.

## Quick start

```bash
cd app
./run.sh        # macOS / Linux
run.bat         # Windows
```

The editor opens with `app/sample/sample.html`, a four-slide demo that exercises text editing, an editable canvas chart, an image swap and a per-slide backdrop.

> Opening `index.html` directly from Finder will not work: browsers block an iframe from touching a `file://` sibling. The app detects this and tells you to use the launcher.

## Build the desktop app

Needs Node 20+, Rust 1.77+, and the platform toolchain.

```bash
cd desktop
npm install
npx tauri build --bundles app,dmg     # macOS → .app + .dmg
npx tauri build --bundles nsis        # Windows → setup .exe
```

Bundles land in `desktop/src-tauri/target/release/bundle/`. The desktop build adds native open/save dialogs and atomic writes, so saving overwrites your file safely instead of downloading a copy.

CI builds both platforms natively (`.github/workflows/build-desktop.yml`) — run it from the Actions tab to get a Windows `.exe` without a Windows machine.

## How it works

```
app/index.html     editor shell: top bar, slide list, inspector, canvas host
app/js/lp-core.js  engine bridge: selection, styles, ops, charts, theme, save/open
app/js/lp-ui.js    panels, context menu, zoom, image/backdrop replacement, donate
app/js/lp-i18n.js  zh/en dictionary
app/jsconfig.json  keeps editor tooling scoped to first-party JS
app/libs/builder/  VvvebJs editing engine (Apache-2.0)
desktop/           Tauri v2 wrapper
DESIGN.md          design system and accepted trade-offs
```

Saving is not a rebuild: the live DOM is serialised, then the runtime data objects (`PPT_DATA`, `PLATE_URLS`) are written back into their original `<script>` blocks so chart and backdrop edits survive the round trip.

## Using it on your own pages

The editor assumes nothing beyond a normal HTML document:

- **Slides are optional.** Any `<section>` becomes a slide; `data-title` names it in the list.
- **Text must be real DOM text**, not an image or canvas — that is what makes in-place editing possible.
- **Charts are optional.** Expose data as `window.PPT_DATA[key]` and draw it from `window.PptCharts.render(canvas, key, progress)`; the inspector will find it.
- **Per-slide backdrops are optional.** Provide `window.PLATE_URLS` as an array of image URLs.
- **Assets should be inline or relative** if you want the saved file to stay self-contained.

## Limits, stated plainly

- Saving is a DOM round trip, so untouched bytes may be normalised (attribute quoting, entity encoding). Expect a small size delta on very large files.
- Values inside hand-written prose are not linked to chart data — editing a chart does not rewrite a sentence that mentions the old number.
- The shell is desktop-first; it is not designed for editing on a phone.
- Not signed or notarised: macOS asks you to right-click → Open the first time, Windows shows a SmartScreen prompt.
- The donate dialog expects an optional `app/assets/donate-qr.jpg` that is **not** in this repository; without it the dialog shows a hint.

## License

Apache License 2.0 — see `LICENSE`. Third-party attributions are in `NOTICE` and `app/Credits.md`.

---

## 中文说明

**像改幻灯片一样改 HTML。**

AI 已经能一次生成完整的单文件 HTML，但页面永远不会"一次到位"：改一句话、换一个数字、调一处配色。为这点小修改再跑一遍 AI 不值得，为了挪一段文字去装一套建站软件更不值得。

Livepage Studio 就是中间那个小工具：**打开 HTML 文件，点中要改的地方，改完保存。** 不需要构建、不需要项目工程、不需要服务器、不需要重新生成。

它和常见建站软件的根本区别是：那些工具会把页面解析成自己的组件模型再重新生成（脚本被剥掉、canvas 变图片、样式被重写）；而它是把真实页面装进 iframe，直接改活的 DOM，再原样序列化回去。

**用法**：`cd app && ./run.sh`，启动后自带一个四页示例（可改文字、可编辑图表、可换图片、可换整页背景）。

**桌面版**：`cd desktop && npm install && npx tauri build --bundles app,dmg`（Windows 用 `--bundles nsis`），带原生打开/保存对话框，直接覆盖保存原文件。

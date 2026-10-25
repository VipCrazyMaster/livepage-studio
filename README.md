# Livepage Studio

<details>
<summary><b>中文说明（点击展开）</b></summary>

### 像改幻灯片一样改一个自包含的 HTML 文件

就地改、不构建、不重新生成。

AI 已经能一次产出完整的单文件 HTML：一份课件、一份报告、一个课程模块。但页面永远不是"完成品"——改一句话、换一个数字、图表换个值、替换一张图。

为这点小修改再跑一遍 AI 不值得，为了挪一段文字去装一套建站软件更不值得。

Livepage Studio 就是中间那个小工具：**打开 `.html` 文件，点中要改的地方，改完保存。**

#### 为什么不用通用建站软件

| | 常见建站软件 | Livepage Studio |
|---|---|---|
| 载入方式 | 解析成自己的组件模型 | 真实文件装进 iframe，直接改活的 DOM |
| `<script>` | 默认被剥掉 | 原样保留，页面继续能跑 |
| canvas / WebGL / 图表 | 拍平成图片或丢失 | 仍然活着，可通过数据编辑 |
| 保存 | 从模型重新生成 HTML | 序列化你真正编辑过的文档 |
| 结果 | "差不多，但把我的页面搞坏了" | 同一个页面，加上你的修改 |

这个差别就是全部重点：如果交付物是一个 `.html` 文件，编辑器就必须能**装得下**一个 `.html` 文件。

#### 能做什么

- **文字** —— 双击就地改写；或用右侧检查器调字体、字号、字重、颜色、行高、字距、对齐。
- **移动** —— 按住任意元素拖动，周围内容不会跟着跳。`Alt`+方向键微调，`Shift` 一次 10px。
- **结构** —— 复制、删除、上移下移、自由定位、撤销重做（`⌘Z`）。
- **图表** —— 页面若提供 `window.PPT_DATA` 与 `window.PptCharts.render(canvas, key, progress)`，检查器会把它变成可编辑表格并实时重绘，保存时写回页面。
- **图片** —— 替换 `<img>` 内容或 CSS 背景图；大图自动压缩，避免文件膨胀。
- **整页背景** —— 按页替换背景层（`window.PLATE_URLS`）。
- **缩放** —— `Ctrl`/`⌘` + 滚轮（触控板捏合也行），25%–300%，`⌘0` 复位。
- **界面语言** —— 中英文切换，本地记忆。
- **右键菜单** —— 跟随界面语言，且按元素类型变化。
- **幻灯片导航** —— 自动识别 `<section>` 生成左侧列表。

#### 快速开始

```bash
cd app
./run.sh        # macOS / Linux
run.bat         # Windows
```

启动后自动载入 `app/sample/sample.html`：一个四页示例，演示改文字、改图表、换图片、换整页背景。

> 直接在 Finder 里双击 `index.html` 不行：浏览器不允许 iframe 访问 `file://` 同级文件。程序会检测到这种情况并提示你用启动脚本。

#### 构建桌面版

需要 Node 20+、Rust 1.77+ 和对应平台工具链。

```bash
cd desktop
npm install
npx tauri build --bundles app,dmg     # macOS → .app + .dmg
npx tauri build --bundles nsis        # Windows → 安装程序 .exe
```

产物在 `desktop/src-tauri/target/release/bundle/`。桌面版带原生打开/保存对话框和原子写入，保存是**覆盖原文件**，不会下载副本。

CI 会在两个平台上原生构建（`.github/workflows/build-desktop.yml`）——在 Actions 里点一次就能拿到 Windows `.exe`，不需要 Windows 电脑。

#### 实现方式

```
app/index.html     编辑器外壳：顶栏、幻灯片列表、检查器、画布容器
app/js/lp-core.js  引擎桥接：选择、样式、元素操作、图表、主题、存取
app/js/lp-ui.js    面板、右键菜单、缩放、图片/背景替换、打赏
app/js/lp-i18n.js  中英文词表
app/jsconfig.json  把编辑器工具链限制在自研 JS 上
app/libs/builder/  VvvebJs 编辑引擎（Apache-2.0）
desktop/           Tauri v2 桌面封装
DESIGN.md          设计系统与已知取舍
```

保存不是"从模型重建"：先把活的 DOM 序列化，再把运行时数据对象（`PPT_DATA`、`PLATE_URLS`）写回它们原本所在的 `<script>` 块，这样图表和背景的修改才能在存盘后保留。

#### 用在你自己页面上

除了"是一个正常 HTML 文档"，编辑器没有额外假设：

- **幻灯片是可选的**：任何 `<section>` 都会被当作一页，`data-title` 用作列表标题。
- **文字必须是真实 DOM 文本**，不能是图片或 canvas —— 这是就地编辑的前提。
- **图表是可选的**：把数据挂在 `window.PPT_DATA[key]`，并用 `window.PptCharts.render(...)` 绘制，检查器会自动识别。
- **整页背景是可选的**：提供 `window.PLATE_URLS`（图片地址数组）。
- **资源建议内联或相对路径**，这样导出的文件仍然是自包含的。

#### 直说的限制

- 保存走 DOM 往返，未改动的字节可能被规范化（属性引号、实体编码）。超大文件会有小幅体积变化。
- 正文里手写的数字不会与图表数据联动——改图表不会自动改写"−43.78 mmHg"这种写在句子里的值。
- 外壳是桌面优先设计，不适合在手机上编辑。
- 未签名、未公证：macOS 首次需右键→打开，Windows 会弹 SmartScreen。
- 打赏弹层需要可选的 `app/assets/donate-qr.jpg`，该文件**不在本仓库**；缺失时弹层只显示提示。

#### 开源协议与致谢

Apache License 2.0 —— 见 `LICENSE`。第三方声明见 `NOTICE` 与 `app/Credits.md`。

这个工具站在别人肩膀上：编辑器的核心思路来自 VvvebJs（把真实页面装进 iframe、直接改活的 DOM），桌面壳能这么轻是因为 Tauri。项目地址与逐套许可见下方英文部分的三张表。

</details>

**Edit a self-contained HTML file the way you edit a slide** — in place, no build step, no re-generation.

AI can now produce a finished, self-contained HTML page in one shot — a deck, a report, a course module. But the page is never *done*: a sentence needs rewording, a number changes, a chart needs a new value, a photo should be swapped.

Paying for that with another prompt loop is wasteful, and installing a whole website builder to move one paragraph is absurd.

Livepage Studio is the small tool in between: **open the `.html` file, click the thing, change it, save.**

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
- **Charts** — if the page exposes `window.PPT_DATA` and a `window.PptCharts.render(canvas, key, progress)` function, the inspector turns it into an editable table and redraws live. Values are written back on save.
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
- **Charts are optional.** Expose data as `window.PPT_DATA[key]` and draw it from `window.PptCharts.render(...)`; the inspector will find it.
- **Per-slide backdrops are optional.** Provide `window.PLATE_URLS` as an array of image URLs.
- **Assets should be inline or relative** if you want the saved file to stay self-contained.

## Limits, stated plainly

- Saving is a DOM round trip, so untouched bytes may be normalised (attribute quoting, entity encoding). Expect a small size delta on very large files.
- Values inside hand-written prose are not linked to chart data — editing a chart does not rewrite a sentence that mentions the old number.
- The shell is desktop-first; it is not designed for editing on a phone.
- Not signed or notarised: macOS asks you to right-click → Open the first time, Windows shows a SmartScreen prompt.
- The donate dialog expects an optional `app/assets/donate-qr.jpg` that is **not** in this repository; without it the dialog shows a hint.

## License

Apache License 2.0 — see `LICENSE`. Third-party attributions are in `NOTICE`.

## Credits & thanks

Livepage Studio stands on other people's work. The editor exists because VvvebJs showed that editing a live DOM in an iframe is the right shape for this problem; the desktop build exists because Tauri made a small native shell practical.

### Editor runtime

| Project | License | Link |
|---|---|---|
| VvvebJs — visual HTML builder engine | Apache-2.0 | https://github.com/givanz/VvvebJs |
| Bootstrap 5.3.3 | MIT | https://github.com/twbs/bootstrap |
| Popper 2.9.2 | MIT | https://github.com/floating-ui/floating-ui |
| CodeMirror 5 | MIT | https://github.com/codemirror/codemirror5 |
| Swiper 11 | MIT | https://github.com/nolimits4web/swiper |
| JSZip 3.7.1 | MIT / GPL-3.0 | https://github.com/Stuk/jszip |
| AOS — animate on scroll | MIT | https://github.com/michalsnik/aos |
| Coloris — colour picker | MIT | https://github.com/melloware/coloris |
| Bootstrap Colorpicker | MIT | https://github.com/itsjavi/bootstrap-colorpicker |

### Desktop shell

| Project | License | Link |
|---|---|---|
| Tauri v2 | Apache-2.0 / MIT | https://github.com/tauri-apps/tauri |
| tauri-plugin-dialog, tauri-plugin-fs | Apache-2.0 / MIT | https://github.com/tauri-apps/plugins-workspace |
| rfd — native file dialogs | MIT | https://github.com/PolyMeilex/rfd |
| base64 (Rust) | MIT / Apache-2.0 | https://github.com/marshallpierce/rust-base64 |
| serde · serde_json | MIT / Apache-2.0 | https://github.com/serde-rs/serde |

### Icons & fonts

| Set | License | Link |
|---|---|---|
| Ionicons (bundled in `app/fonts/ionicons`) | MIT | https://ionic.io/ionicons |
| Line Awesome (bundled in `app/fonts/line-awesome`) | MIT | https://icons8.com/line-awesome |

The engine also ships inline SVG icon sets (Eva, Feather, Themify, Boxicons, Linea, Dripicons and others). Their individual licenses — MIT and CC BY 4.0 — are listed set by set in `app/Credits.md`, alongside `NOTICE`.

Thanks to the VvvebJs maintainers for a genuinely hackable engine, to the Tauri team for a desktop shell that stays small, and to everyone who files an issue on the projects above instead of silently forking. If this tool saves you a round trip to an AI, consider buying one of them a coffee too.

# Livepage Studio

**[English](README.md)** · **中文**

像改幻灯片一样改一个自包含的 HTML 文件 —— 就地改、不构建、不重新生成。

AI 已经能一次产出完整的单文件 HTML：一份课件、一份报告、一个课程模块。但页面永远不是"完成品"——改一句话、换一个数字、图表换个值、替换一张图。

为这点小修改再跑一遍 AI 不值得，为了挪一段文字去装一套建站软件更不值得。

Livepage Studio 就是中间那个小工具：**打开 `.html` 文件，点中要改的地方，改完保存。**

## 为什么不用通用建站软件

| | 常见建站软件 | Livepage Studio |
|---|---|---|
| 载入方式 | 解析成自己的组件模型 | 真实文件装进 iframe，直接改活的 DOM |
| `<script>` | 默认被剥掉 | 原样保留，页面继续能跑 |
| canvas / WebGL / 图表 | 拍平成图片或丢失 | 仍然活着，可通过数据编辑 |
| 保存 | 从模型重新生成 HTML | 序列化你真正编辑过的文档 |
| 结果 | "差不多，但把我的页面搞坏了" | 同一个页面，加上你的修改 |

这个差别就是全部重点：如果交付物是一个 `.html` 文件，编辑器就必须能**装得下**一个 `.html` 文件。

## 能做什么

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

## 快速开始

```bash
cd app
./run.sh        # macOS / Linux
run.bat         # Windows
```

启动后自动载入 `app/sample/sample.html`：一个四页示例，演示改文字、改图表、换图片、换整页背景。

> 直接在 Finder 里双击 `index.html` 不行：浏览器不允许 iframe 访问 `file://` 同级文件。程序会检测到这种情况并提示你用启动脚本。

## 构建桌面版

需要 Node 20+、Rust 1.77+ 和对应平台工具链。

```bash
cd desktop
npm install
npx tauri build --bundles app,dmg     # macOS → .app + .dmg
npx tauri build --bundles nsis        # Windows → 安装程序 .exe
```

产物在 `desktop/src-tauri/target/release/bundle/`。桌面版带原生打开/保存对话框和原子写入，保存是**覆盖原文件**，不会下载副本。

CI 会在两个平台上原生构建（`.github/workflows/build-desktop.yml`）——在 Actions 里点一次就能拿到 Windows `.exe`，不需要 Windows 电脑。

## 实现方式

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

## 用在你自己页面上

除了"是一个正常 HTML 文档"，编辑器没有额外假设：

- **幻灯片是可选的**：任何 `<section>` 都会被当作一页，`data-title` 用作列表标题。
- **文字必须是真实 DOM 文本**，不能是图片或 canvas —— 这是就地编辑的前提。
- **图表是可选的**：把数据挂在 `window.PPT_DATA[key]`，并用 `window.PptCharts.render(...)` 绘制，检查器会自动识别。
- **整页背景是可选的**：提供 `window.PLATE_URLS`（图片地址数组）。
- **资源建议内联或相对路径**，这样导出的文件仍然是自包含的。

## 直说的限制

- 保存走 DOM 往返，未改动的字节可能被规范化（属性引号、实体编码）。超大文件会有小幅体积变化。
- 正文里手写的数字不会与图表数据联动——改图表不会自动改写"−43.78 mmHg"这种写在句子里的值。
- 外壳是桌面优先设计，不适合在手机上编辑。
- 未签名、未公证：macOS 首次需右键→打开，Windows 会弹 SmartScreen。
- 打赏弹层需要可选的 `app/assets/donate-qr.jpg`，该文件**不在本仓库**；缺失时弹层只显示提示。

## 开源协议

Apache License 2.0 —— 见 `LICENSE`。第三方声明见 `NOTICE`。

## 引用与致谢

这个工具是站在别人肩膀上的：编辑器的核心思路来自 VvvebJs（把真实页面装进 iframe、直接改活的 DOM），桌面壳能这么轻是因为 Tauri。

### 编辑器运行时

| 项目 | 许可 | 地址 |
|---|---|---|
| VvvebJs — 可视化 HTML 编辑器引擎 | Apache-2.0 | https://github.com/givanz/VvvebJs |
| Bootstrap 5.3.3 | MIT | https://github.com/twbs/bootstrap |
| Popper 2.9.2 | MIT | https://github.com/floating-ui/floating-ui |
| CodeMirror 5 | MIT | https://github.com/codemirror/codemirror5 |
| Swiper 11 | MIT | https://github.com/nolimits4web/swiper |
| JSZip 3.7.1 | MIT / GPL-3.0 | https://github.com/Stuk/jszip |
| AOS — 滚动动画 | MIT | https://github.com/michalsnik/aos |
| Coloris — 取色器 | MIT | https://github.com/melloware/coloris |
| Bootstrap Colorpicker | MIT | https://github.com/itsjavi/bootstrap-colorpicker |

### 桌面封装

| 项目 | 许可 | 地址 |
|---|---|---|
| Tauri v2 | Apache-2.0 / MIT | https://github.com/tauri-apps/tauri |
| tauri-plugin-dialog、tauri-plugin-fs | Apache-2.0 / MIT | https://github.com/tauri-apps/plugins-workspace |
| rfd — 原生文件对话框 | MIT | https://github.com/PolyMeilex/rfd |
| base64（Rust） | MIT / Apache-2.0 | https://github.com/marshallpierce/rust-base64 |
| serde · serde_json | MIT / Apache-2.0 | https://github.com/serde-rs/serde |

### 图标与字体

| 图标集 | 许可 | 地址 |
|---|---|---|
| Ionicons（位于 `app/fonts/ionicons`） | MIT | https://ionic.io/ionicons |
| Line Awesome（位于 `app/fonts/line-awesome`） | MIT | https://icons8.com/line-awesome |

引擎另外内联了若干 SVG 图标集（Eva、Feather、Themify、Boxicons、Linea、Dripicons 等），逐套许可（MIT 与 CC BY 4.0）列在 `app/Credits.md` 与 `NOTICE` 中。

感谢 VvvebJs 的维护者做出了一个真正可改的引擎，感谢 Tauri 团队让桌面壳保持轻量，也感谢所有选择提 issue 而不是默默 fork 的人。如果这个工具帮你省下了一次和 AI 的来回，也请顺手给上面某个项目点个 star。

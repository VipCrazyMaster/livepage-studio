# Livepage Studio

**English** · **[中文](README.zh-CN.md)**

Edit a self-contained HTML file the way you edit a slide — in place, no build step, no re-generation.

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

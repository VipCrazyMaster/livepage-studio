# Livepage Studio

A desktop-first visual editor for **rich, self-contained single-file HTML pages** — courseware, decks, reports, anything that ships as one `.html` file with inline CSS, inline scripts, canvas charts and base64 assets.

Most page builders rebuild your document from their own model: they strip `<script>`, flatten canvas, and lose state. Livepage Studio does the opposite — it loads the real page in an iframe, edits the live DOM in place, and serialises it back.

## Features

- **True WYSIWYG text editing** — double-click to rewrite, or edit through the inspector (font, size, weight, colour, line height, letter spacing, alignment).
- **Drag to move** — press and drag any element; the rest of the layout stays put. `Alt`+arrows nudge, `Shift` for 10px.
- **Element operations** — duplicate, delete, move up/down, free positioning, undo/redo (`⌘Z`).
- **Canvas charts you can edit** — if the page exposes structured data (`window.PPT_DATA`) and a renderer (`window.PptCharts`), the inspector turns it into an editable table and redraws live. Values are written back on save.
- **Image replacement** — replace `<img>` elements or CSS background images. Large files are recompressed automatically.
- **Page backdrop replacement** — swap the full-page background layer per slide (`window.PLATE_URLS`).
- **Zoom** — `Ctrl`/`⌘` + wheel (or trackpad pinch) from 25% to 300%, `⌘0` to reset.
- **Chinese / English UI** — toggle in the top bar, remembered locally.
- **Context menu** — localised, context-aware (text, images, charts).
- **Deck navigation** — auto-detects `section` slides and builds a jump list.
- **Export** — one file out, scripts and assets intact.

## Quick start (web)

```bash
cd app
./run.sh          # macOS / Linux  (uses python3 -m http.server)
run.bat           # Windows
```

Then open the printed URL. The editor loads `app/sample/sample.html` so you can try every feature immediately.

> Opening `index.html` directly via `file://` will not work: browsers block cross-file access for iframes. The app detects this and tells you to use the launcher.

## Build the desktop app

Requires Node 20+, Rust 1.77+, and the platform toolchain.

```bash
cd desktop
npm install
npx tauri build --bundles app,dmg                 # macOS
npx tauri build --bundles nsis                    # Windows
```

Installers land in `desktop/src-tauri/target/release/bundle/`.

Cross-compiling the Windows installer from macOS is possible but unsupported upstream; `.github/workflows/build-desktop.yml` builds both platforms natively in CI instead.

## How it works

```
app/index.html     editor shell (top bar, deck list, inspector, canvas host)
app/js/lp-core.js  engine bridge: selection, styles, ops, charts, theme, save/open
app/js/lp-ui.js    UI: panels, context menu, zoom, image/backdrop replacement, donate
app/js/lp-i18n.js  zh/en dictionary
app/css/app.css    shell styling
app/libs/builder/  VvvebJs editing engine (Apache-2.0)
desktop/           Tauri v2 wrapper (native dialogs, atomic saves)
DESIGN.md          design system and known trade-offs
```

Saving is **not** a rebuild from a model: the live DOM is serialised, then the runtime data objects (`PPT_DATA`, `PLATE_URLS`) are written back into their original `<script>` blocks so chart and backdrop edits survive the round trip.

## Sample deck

`app/sample/sample.html` is original sample content. It demonstrates:

- four full-screen slides with `data-title` labels
- an editable canvas chart (`window.PPT_DATA` + `window.PptCharts`)
- an image that can be replaced
- a per-slide backdrop layer (`window.PLATE_URLS`)

Use it as a template for your own pages — the editor only needs sections, real DOM text, and optionally those two globals.

## Notes

- Your files stay local. Nothing is uploaded anywhere.
- The donate dialog expects an optional `app/assets/donate-qr.jpg`; that file is **not** committed, so forks show a hint instead of someone else's payment code.
- `demo`/customer content is not part of this repository.

## License

Apache License 2.0 — see `LICENSE`. Third-party attributions are in `NOTICE` and `app/Credits.md`.

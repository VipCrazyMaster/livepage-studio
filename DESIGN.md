# Livepage Studio Design System

## 1. Atmosphere & Identity

Livepage Studio is a quiet production cockpit for editing rich interactive courseware. The shell stays dark, compact, and operational so the authored page remains the visual focus. Its signature is the teal selection language: restrained teal outlines, active rows, and focus states connect the deck navigator, canvas selection, and inspector without competing with the document.

The app icon states the product in one image: a bone page with a single element held inside a teal selection frame, with the pointer resting on it. No letters or logos — the selection frame is the brand mark.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---:|---|
| Surface/base | `--lp-bg` | `#0e1412` | Workspace background |
| Surface/panel | `--lp-bg-1` | `#141b18` | Top bar and side panels |
| Surface/control | `--lp-bg-2` | `#1a231f` | Inputs and table headers |
| Surface/hover | `--lp-bg-3` | `#212b26` | Hovered and focused controls |
| Text/primary | `--lp-text` | `#e9e4d9` | Primary labels and values |
| Text/secondary | `--lp-muted` | `#8b968f` | Labels and metadata |
| Text/tertiary | `--lp-faint` | `#5f6a64` | Hints and inactive metadata |
| Border/subtle | `--lp-line` | `rgba(255,255,255,.07)` | Panel dividers |
| Border/default | `--lp-line-2` | `rgba(255,255,255,.12)` | Controls and focus boundaries |
| Accent/primary | `--lp-accent` | `#0f7e71` | Primary action and active state |
| Accent/highlight | `--lp-accent-2` | `#6fd8c8` | Selection, focus, current item |
| Status/destructive | `--lp-danger` | `#b8442f` | Delete and destructive actions |

Accent colors are reserved for interaction and selection. The embedded document owns its own palette.

## 3. Typography

| Level | Size | Weight | Line height | Usage |
|---|---:|---:|---:|---|
| App label | 12px | 500 | 1.4 | Buttons and field labels |
| App body | 13px | 400 | 1.5 | Inspector and deck list |
| Caption | 11px | 500 | 1.5 | Metadata, hints, overlines |
| Mono | 10-11px | 500 | 1.6 | Element selectors and slide IDs |

- UI: `-apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif`
- Technical labels: `ui-monospace, SFMono-Regular, Menlo, monospace`
- Authored-document typography is edited independently and must never be replaced by shell typography.

## 4. Spacing & Layout

- Base unit: 4px.
- Top bar: 48px.
- Left deck rail: 236px.
- Right inspector: 344px.
- Shell: fixed top bar; deck, canvas, and inspector own independent vertical scrolling.
- Canvas is the flexible middle region and must have `min-width: 0` and `min-height: 0`.
- Inspector tables may scroll horizontally; the primary shell must not.

## 5. Components

### Top bar
- Structure: brand, file status, file actions, history, viewport, preview.
- States: default, hover, active viewport, dirty document, preview active.
- Accessibility: native buttons, visible focus ring, Chinese labels or title text.

### Deck row
- Structure: page number, title, chapter and stable ID metadata.
- States: default, hover, current.
- Layout: left panel is the vertical scroll owner.

### Canvas selection overlay
- Structure: name badge, bounding outline, compact layer actions.
- States: hidden, selected, text-editing.
- Layout: overlay layer exactly matches the iframe viewport and uses iframe-local coordinates.
- Accessibility: inspector duplicates every icon action with labeled buttons.

### Inspector field
- Structure: label plus input/select/color control.
- States: default, hover, focus, disabled.
- Accessibility: labels remain visible; color also shows its hex value.

### Chart data grid
- Structure: title/unit fields, panel selector, categories and series table.
- States: editable, overflow-scroll, row/series add and remove.
- Layout: inspector owns vertical scroll; grid wrapper owns horizontal scroll.

### Theme disclosure
- Structure: collapsed summary, document font variables, document color variables.
- States: closed and open.

## 6. Motion & Interaction

- Micro interaction: 120-160ms ease-out for button and active-state feedback.
- Standard panel changes: 200ms ease-in-out.
- No decorative motion in the editor shell.
- Preview and document animations are preserved rather than removed.
- Reduced-motion preferences must suppress non-essential shell transitions.

## 7. Depth & Surface

Mixed strategy: tonal surface shifts separate the main shell; borders define controls; shadows are reserved for the canvas and floating selection toolbar. All shadows carry the green-black workspace hue.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- Target WCAG 2.2 AA for the editor shell.
- Every action must be keyboard reachable with a visible focus indicator.
- Body and control text should meet 4.5:1 contrast.
- Destructive actions must be clearly labeled and undoable.
- Panel scroll ownership must remain predictable at 1280px and above.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| App shell is desktop-first | `app/index.html` | Mac/Windows packaging is the target; narrow mobile editing is not a product goal | Revisit only if tablet editing becomes required |
| Imported HTML executes scripts | iframe document | Required for faithful Three.js/canvas preview | Keep desktop bridge isolated; add stricter sandbox policy before packaging |

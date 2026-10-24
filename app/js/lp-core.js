/* Livepage Studio — engine bridge.
   Wraps the VvvebJs builder (Apache-2.0) with the API the editor UI talks to. */
(function () {
  "use strict";

  const LP = (window.Livepage = window.Livepage || {});
  const core = (LP.core = {});

  core.state = {
    sections: [],
    currentIndex: -1,
    ready: false,
    fileName: "sample.html",
    dirty: false,
    originalHtml: null,
    rootTags: null,
  };

  core.captureOriginal = function (html) {
    core.state.originalHtml = html;
    const htmlTag = /<html[^>]*>/i.exec(html);
    const bodyTag = /<body[^>]*>/i.exec(html);
    core.state.rootTags = htmlTag && bodyTag ? { html: htmlTag[0], body: bodyTag[0] } : null;
  };

  core.frame = () => window.FrameWindow;
  core.doc = () => window.FrameDocument;
  core.builder = () => window.Vvveb.Builder;
  core.selected = () => window.Vvveb.Builder.selectedEl || null;

  /* ---------------- document loading ---------------- */

  const SHIM = `<script data-lp-shim>(function(){
  var h = window.history;
  ["replaceState","pushState"].forEach(function(m){
    var f = h[m];
    h[m] = function(){ try { return f.apply(h, arguments); } catch (e) { return undefined; } };
  });
  window.addEventListener("error", function(e){ if (e && e.message && /replaceState|pushState/.test(e.message)) e.preventDefault(); });
})();</script>`;

  /* Keeps history/pushState from throwing when the document is loaded from
     srcdoc or a blob (the courseware calls replaceState with a relative URL). */
  core.injectShim = function (html) {
    if (html.indexOf("data-lp-shim") !== -1) return html;
    return html.replace(/<head([^>]*)>/i, "<head$1>" + SHIM);
  };

  core.stripShim = function (html) {
    return html.replace(/<script[^>]*data-lp-shim[^>]*>[\s\S]*?<\/script>/i, "");
  };

  core.loadUrl = function (url, done) {
    core.state.fileName = url.split("/").pop() || url;
    fetch(url)
      .then((r) => (r.ok ? r.text() : null))
      .then((html) => {
        if (html) core.captureOriginal(html);
      })
      .catch(() => {})
      .finally(() => {
        window.Vvveb.Builder.init(url, function () {
          core.afterLoad(done);
        });
      });
  };

  core.loadHtml = function (html, name, done) {
    const prepared = core.injectShim(html);
    core.captureOriginal(html);
    core.state.fileName = name || "untitled.html";
    /* srcdoc keeps the frame same-origin (a blob: URL would be cross-origin and
       the editor could not reach its DOM). The shim absorbs replaceState. */
    const frame = window.Vvveb.Builder.iframe;
    frame.addEventListener(
      "load",
      function () {
        core.afterLoad(done);
      },
      { once: true }
    );
    window.Vvveb.Builder.loadHtml(prepared);
  };

  core.hideEditorArtifacts = function () {
    const doc = core.doc();
    if (!doc) return;
    let style = doc.getElementById("lp-editor-only");
    if (!style) {
      style = doc.createElement("style");
      style.id = "lp-editor-only";
      doc.head.appendChild(style);
    }
    style.textContent =
      "#vvvebjs-new-section{display:none !important}" +
      "#vvvebjs-new-section + *{margin-top:0 !important}";
  };

  core.afterLoad = function (done) {
    core.hideEditorArtifacts();
    core.state.sections = core.readSections();
    core.state.ready = true;
    core.state.dirty = false;
    core.charts.refreshBaseline();
    if (done) done();
    document.dispatchEvent(new CustomEvent("lp:ready", { detail: { sections: core.state.sections.length } }));
  };

  /* ---------------- sections / navigation ---------------- */

  core.readSections = function () {
    const doc = core.doc();
    if (!doc) return [];
    return Array.from(doc.querySelectorAll("section.beat")).map((el, i) => ({
      el,
      index: i,
      id: el.id,
      chapter: el.dataset.chapter || "",
      title:
        el.dataset.title ||
        el.querySelector("h1,h2,h3")?.textContent?.trim() ||
        el.id ||
        "第 " + (i + 1) + " 页",
    }));
  };

  core.goTo = function (index, smooth) {
    const s = core.state.sections[index];
    if (!s) return;
    const win = core.frame();
    const top = s.el.getBoundingClientRect().top + win.scrollY;
    win.scrollTo({ top, behavior: smooth === false ? "auto" : "smooth" });
    core.setCurrent(index);
  };

  core.setCurrent = function (index) {
    if (core.state.currentIndex === index) return;
    core.state.currentIndex = index;
    document.dispatchEvent(new CustomEvent("lp:slide", { detail: { index } }));
  };

  core.sectionOf = function (el) {
    return el && el.closest ? el.closest("section.beat") : null;
  };

  /* ---------------- selection ---------------- */

  core.select = function (el) {
    if (!el) {
      window.Vvveb.Builder.selectNode(null);
      document.dispatchEvent(new CustomEvent("lp:select", { detail: { el: null } }));
      return;
    }
    window.Vvveb.Builder.selectNode(el);
    document.dispatchEvent(new CustomEvent("lp:select", { detail: { el } }));
  };

  /* ---------------- element operations ---------------- */

  core.markDirty = function () {
    if (core.state.dirty) return;
    core.state.dirty = true;
    document.dispatchEvent(new CustomEvent("lp:dirty", { detail: { dirty: true } }));
  };

  core.duplicate = function (el) {
    const node = el || core.selected();
    if (!node || node.tagName === "BODY" || node.tagName === "HTML") return null;
    core.builder().cloneNode(node);
    core.markDirty();
    const clone = node.nextElementSibling;
    if (clone) core.select(clone);
    return clone;
  };

  core.remove = function (el) {
    const node = el || core.selected();
    if (!node || node.tagName === "BODY" || node.tagName === "HTML") return;
    const parent = node.parentNode;
    if (!parent) return;
    const next = node.nextSibling;
    window.Vvveb.Undo.addMutation({
      type: "childList",
      target: parent,
      removedNodes: [node],
      nextSibling: next,
    });
    node.remove();
    core.markDirty();
    core.select(null);
  };

  core.moveUp = function (el) {
    const node = el || core.selected();
    if (!node) return;
    core.builder().moveNodeUp(node);
    core.markDirty();
  };

  core.moveDown = function (el) {
    const node = el || core.selected();
    if (!node) return;
    core.builder().moveNodeDown(node);
    core.markDirty();
  };

  /* Free positioning: switches the element to position:absolute inside its
     offset parent and lets the user drag it. Layout flow is opt-in per element. */
  core.setFreePosition = function (el, free) {
    const node = el || core.selected();
    if (!node) return;
    if (free) {
      const cs = core.frame().getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const parent = node.offsetParent || node.parentElement;
      const prect = parent.getBoundingClientRect();
      core.patchStyle(node, {
        position: "absolute",
        left: Math.round(rect.left - prect.left - (parent.clientLeft || 0)) + "px",
        top: Math.round(rect.top - prect.top - (parent.clientTop || 0)) + "px",
        width: Math.round(rect.width) + "px",
        "z-index": cs.zIndex === "auto" ? "2" : cs.zIndex,
      });
    } else {
      core.patchStyle(node, { position: "", left: "", top: "", width: "", "z-index": "" });
    }
  };

  core.nudge = function (el, dx, dy) {
    const node = el || core.selected();
    if (!node) return;
    const cs = core.frame().getComputedStyle(node);
    const left = parseFloat(node.style.left || "0") + dx;
    const top = parseFloat(node.style.top || "0") + dy;
    const props = { left: Math.round(left) + "px", top: Math.round(top) + "px" };
    if (cs.position === "static") props.position = "relative";
    core.patchStyle(node, props);
  };

  /* ---------------- text and style ---------------- */

  const STYLE_UNDO = new WeakMap();

  /* Applies inline styles to one element and records a single undo step
     (coalesced per element until commitStyle() is called). */
  core.patchStyle = function (el, props) {
    const node = el || core.selected();
    if (!node) return;
    if (!STYLE_UNDO.has(node)) STYLE_UNDO.set(node, node.getAttribute("style") || "");
    const before = STYLE_UNDO.get(node);
    Object.entries(props).forEach(([k, v]) => {
      if (v === "" || v == null) node.style.removeProperty(k);
      else node.style.setProperty(k, String(v));
    });
    const after = node.getAttribute("style") || "";
    if (before !== after) {
      window.Vvveb.Undo.addMutation({
        type: "attributes",
        target: node,
        attributeName: "style",
        oldValue: before,
        newValue: after,
      });
      STYLE_UNDO.delete(node);
      core.markDirty();
    }
    document.dispatchEvent(new CustomEvent("lp:style", { detail: { el: node } }));
  };

  core.text = function (el, value) {
    const node = el || core.selected();
    if (!node) return;
    const before = node.innerHTML;
    node.textContent = value;
    window.Vvveb.Undo.addMutation({
      type: "attributes",
      target: node,
      attributeName: "innerHTML",
      oldValue: before,
      newValue: node.innerHTML,
    });
    core.markDirty();
  };

  /* Effective (computed) style that the inspector should show. */
  core.styleOf = function (el) {
    if (!el) return null;
    const cs = core.frame().getComputedStyle(el);
    return {
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      textAlign: cs.textAlign,
      position: cs.position,
    };
  };

  /* ---------------- history ---------------- */

  core.undo = () => window.Vvveb.Undo.undo();
  core.redo = () => window.Vvveb.Undo.redo();

  /* ---------------- charts ---------------- */

  core.charts = {
    /* Some canvases show whichever dataset a tab selects, so the canvas has no
       fixed key. Wrapping the renderer records canvas -> key as the page draws. */
    hook() {
      const win = core.frame();
      if (!win || !win.PptCharts || win.PptCharts.__lpHooked) return;
      const original = win.PptCharts.render;
      win.PptCharts.render = function (canvas, key, progress) {
        if (canvas && key) canvas.dataset.lpKey = key;
        return original.apply(this, arguments);
      };
      win.PptCharts.__lpHooked = true;
    },
    keyOf(canvas) {
      const win = core.frame();
      if (!canvas) return null;
      if (canvas.dataset.ppt && win?.PPT_DATA?.[canvas.dataset.ppt]) return canvas.dataset.ppt;
      return canvas.dataset.lpKey || null;
    },
    list() {
      const doc = core.doc();
      const win = core.frame();
      if (!doc || !win || !win.PPT_DATA) return [];
      return Array.from(doc.querySelectorAll("canvas[data-ppt]")).map((canvas) => {
        const key = core.charts.keyOf(canvas);
        return { key, canvas, data: key ? win.PPT_DATA[key] : null };
      });
    },
    get(key) {
      return core.frame()?.PPT_DATA?.[key] || null;
    },
    update(key, data) {
      const win = core.frame();
      if (!win || !win.PPT_DATA || !win.PPT_DATA[key]) return false;
      win.PPT_DATA[key] = data;
      core.charts.render(key);
      core.markDirty();
      return true;
    },
    render(key) {
      const win = core.frame();
      const doc = core.doc();
      if (!win || !doc || !win.PptCharts) return;
      const canvas =
        doc.querySelector('canvas[data-ppt="' + key + '"]') ||
        doc.querySelector('canvas[data-lp-key="' + key + '"]');
      if (canvas) win.PptCharts.render(canvas, key, 1);
      document.dispatchEvent(new CustomEvent("lp:chart", { detail: { key } }));
    },
    refreshBaseline() {
      const doc = core.doc();
      if (!doc) return;
      core.charts.hook();
      const active = doc.querySelector(".market-tabs .is-on");
      if (active) active.click();
    },
    renderAll() {
      core.charts.list().forEach((c) => c.key && core.charts.render(c.key));
    },
  };

  /* ---------------- theme (CSS custom properties) ---------------- */

  core.theme = {
    vars() {
      const doc = core.doc();
      if (!doc) return {};
      const out = {};
      [doc.documentElement, doc.body].forEach((el) => {
        if (!el) return;
        for (const sheet of Array.from(doc.styleSheets || [])) {
          let rules;
          try {
            rules = sheet.cssRules;
          } catch (e) {
            continue;
          }
          for (const rule of Array.from(rules || [])) {
            if (rule.selectorText === ":root" || rule.selectorText === "html") {
              for (const name of Array.from(rule.style || [])) {
                if (name.startsWith("--")) out[name] = rule.style.getPropertyValue(name).trim();
              }
            }
          }
        }
      });
      return out;
    },
    setVar(name, value) {
      const doc = core.doc();
      if (!doc) return;
      doc.documentElement.style.setProperty(name, value);
      core.markDirty();
      document.dispatchEvent(new CustomEvent("lp:theme", { detail: { name, value } }));
    },
  };

  /* ---------------- save / open ---------------- */

  function replaceAssignment(text, name, value) {
    let at = text.indexOf(name + " =");
    if (at < 0) at = text.indexOf(name + "=");
    if (at < 0) return null;
    let i = text.indexOf("=", at) + 1;
    while (i < text.length && /\s/.test(text[i])) i++;
    if (text[i] !== "{" && text[i] !== "[") return null;
    let depth = 0;
    let quote = "";
    for (let j = i; j < text.length; j++) {
      const c = text[j];
      if (quote) {
        if (c === "\\") {
          j++;
          continue;
        }
        if (c === quote) quote = "";
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        quote = c;
        continue;
      }
      if (c === "{" || c === "[") depth++;
      else if (c === "}" || c === "]") {
        depth--;
        if (depth === 0) return text.slice(0, i) + JSON.stringify(value) + text.slice(j + 1);
      }
    }
    return null;
  }

  /* Chart and backdrop data live in runtime objects, but saving serialises the
     DOM, so the script text has to be rewritten or those edits are lost. */
  core.syncRuntimeData = function () {
    const doc = core.doc();
    const win = core.frame();
    if (!doc || !win) return;
    const targets = [
      ["window.PPT_DATA", win.PPT_DATA],
      ["window.PLATE_URLS", win.PLATE_URLS],
    ];
    doc.querySelectorAll("script:not([src])").forEach((script) => {
      let text = script.textContent;
      let changed = false;
      for (const [name, value] of targets) {
        if (!value || text.indexOf(name) === -1) continue;
        const next = replaceAssignment(text, name, value);
        if (next && next !== text) {
          text = next;
          changed = true;
        }
      }
      if (changed) script.textContent = text;
    });
  };

  core.toHtml = function () {
    core.syncRuntimeData();
    let html = window.Vvveb.Builder.getHtml(false, true);
    html = core.stripShim(html);
    const tags = core.state.rootTags;
    if (tags) {
      html = html.replace(/<html[^>]*>/i, tags.html).replace(/<body[^>]*>/i, tags.body);
    }
    html = html.replace(/<style id="vvvebjs-styles">\s*<\/style>/i, "");
    html = html.replace(/<style id="lp-drag-cursor">[\s\S]*?<\/style>/gi, "");
    html = html.replace(/<style id="lp-editor-only">[\s\S]*?<\/style>/gi, "");
    return html;
  };

  const desktopInvoke = () =>
    window.__TAURI__ && window.__TAURI__.core ? window.__TAURI__.core.invoke : null;

  core.isDesktop = function () {
    return !!desktopInvoke();
  };

  function markSaved() {
    core.state.dirty = false;
    document.dispatchEvent(new CustomEvent("lp:dirty", { detail: { dirty: false } }));
    document.dispatchEvent(
      new CustomEvent("lp:saved", { detail: { path: core.state.filePath, name: core.state.fileName } })
    );
  }

  core.save = async function () {
    const invoke = desktopInvoke();
    if (!invoke) return null;
    const suggested = core.state.fileName.replace(/\.html?$/i, "") + "-edited.html";
    const path = await invoke("save_html", {
      path: core.state.filePath || null,
      contents: core.toHtml(),
      suggestedName: suggested,
    });
    if (!path) return null;
    core.state.filePath = path;
    core.state.fileName = path.split(/[\\/]/).pop();
    markSaved();
    return path;
  };

  core.download = function () {
    if (core.isDesktop()) return core.save();
    const html = core.toHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = core.state.fileName.replace(/\.html?$/i, "") + "-edited.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    markSaved();
    return Promise.resolve(null);
  };

  core.openNative = async function () {
    const invoke = desktopInvoke();
    if (!invoke) return null;
    const file = await invoke("open_html");
    if (!file) return null;
    core.state.filePath = file.path;
    return new Promise((resolve) => {
      core.loadHtml(file.contents, file.path.split(/[\\/]/).pop(), () => resolve(core.state.sections));
    });
  };

  core.openFile = function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        core.state.filePath = null;
        core.loadHtml(String(reader.result), file.name, () => resolve(core.state.sections));
      };
      reader.readAsText(file, "utf-8");
    });
  };

  /* ---------------- boot ---------------- */

  core.boot = function (url) {
    core.loadUrl(url || window.LIVEPAGE_DEFAULT_DOC || "document.html");
  };
})();

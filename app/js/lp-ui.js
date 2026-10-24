/* Livepage Studio — editor UI (inspector, topbar, chart & theme panels). */
(function () {
  "use strict";

  const LP = window.Livepage;
  const core = LP.core;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const t = (zh) => (window.LP_I18N ? window.LP_I18N.t(zh) : zh);
  const isEn = () => !!(window.LP_I18N && window.LP_I18N.locale === "en");

  function h(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null) continue;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (k === "value") node.value = v;
        else node.setAttribute(k, v);
      }
    }
    (Array.isArray(children) ? children : children ? [children] : []).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  const FONTS = [
    ["AlibabaPuHuiTi", t("阿里巴巴普惠体（内置）")],
    ["PingFang SC", t("苹方 PingFang SC")],
    ["Hiragino Sans GB", t("冬青黑体")],
    ["Microsoft YaHei", t("微软雅黑")],
    ["Source Han Sans SC", t("思源黑体")],
    ["Songti SC", t("宋体-简")],
    ["SimSun", t("宋体")],
    ["KaiTi", t("楷体")],
    ["Georgia", t("Georgia（西文衬线）")],
    ["Times New Roman", "Times New Roman"],
    ["Arial", "Arial"],
    ["Helvetica Neue", "Helvetica Neue"],
  ];

  const ui = (LP.ui = {});

  /* ------------------------------------------------------------------ */
  /* topbar                                                              */
  /* ------------------------------------------------------------------ */

  function buildTopbar() {
    const host = $("#top-panel");
    if (!host || host.dataset.lp) return;
    host.dataset.lp = "1";
    host.classList.add("lp-topbar");
    host.innerHTML = "";

    const brand = h("div", { class: "lp-brand" }, [
      h("span", { class: "lp-brand-mark", text: "LP" }),
      h("span", { class: "lp-brand-name", text: "Livepage Studio" }),
    ]);

    const file = h("div", { class: "lp-file" }, [
      h("span", { class: "lp-file-name", id: "lp-file-name", text: core.state.fileName }),
      h("span", { class: "lp-dirty", id: "lp-dirty", title: t("有未保存的修改") }),
    ]);

    const btn = (label, title, onClick, extra) =>
      h("button", { type: "button", class: "lp-btn " + (extra || ""), title, onclick: onClick }, label);

    const fileInput = h("input", {
      type: "file",
      accept: ".html,.htm",
      style: "display:none",
      onchange: (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) core.openFile(f);
        e.target.value = "";
      },
    });

    const actions = h("div", { class: "lp-actions" }, [
      btn(t("打开"), t("打开本地 HTML"), () => {
        if (core.isDesktop()) core.openNative();
        else fileInput.click();
      }),
      btn(t("保存"), t("导出为单个 HTML 文件"), () => core.download(), "lp-btn-primary"),
      h("span", { class: "lp-sep" }),
      btn("↶", t("撤销 (⌘Z)"), () => core.undo()),
      btn("↷", t("重做 (⇧⌘Z)"), () => core.redo()),
      h("span", { class: "lp-sep" }),
      btn(t("桌面"), t("桌面视图"), () => setViewport("desktop")),
      btn(t("平板"), t("平板视图"), () => setViewport("tablet")),
      btn(t("手机"), t("手机视图"), () => setViewport("mobile")),
      h("span", { class: "lp-sep" }),
      btn(t("预览"), t("进入预览模式"), () => togglePreview()),
      h("span", { class: "lp-sep" }),
      btn(t("打赏"), t("请作者喝杯咖啡"), () => openDonate(), "lp-btn-donate"),
      btn(window.LP_I18N && window.LP_I18N.locale === "en" ? "中" : "EN", t("语言"), () => {
        if (window.LP_I18N) window.LP_I18N.toggle();
      }, "lp-btn-lang"),
    ]);

    host.append(brand, file, actions, fileInput);

    document.addEventListener("lp:dirty", (e) => {
      $("#lp-dirty").classList.toggle("is-on", !!e.detail.dirty);
    });
  }

  let currentViewport = "desktop";

  function setViewport(kind) {
    const widths = { desktop: 0, tablet: 834, mobile: 390 };
    const wrapper = document.getElementById("iframe-wrapper");
    if (!wrapper) return;
    if (currentViewport === kind && kind !== "desktop") kind = "desktop";
    currentViewport = kind;
    const w = widths[kind] || 0;
    wrapper.style.width = w ? w + "px" : "";
    wrapper.style.margin = w ? "0 auto" : "";
    wrapper.dataset.viewport = kind;
    $$(".lp-actions .lp-btn").forEach((b) => b.classList.remove("is-on"));
    const label = { desktop: t("桌面"), tablet: t("平板"), mobile: t("手机") }[kind];
    $$(".lp-actions .lp-btn").forEach((b) => {
      if (b.textContent === label) b.classList.add("is-on");
    });
    const doc = core.doc();
    if (doc) window.dispatchEvent(new Event("resize"));
    zoomState.value = 1;
    clearZoomStyles(true);
    showZoomBadge(1);
  }

  function togglePreview() {
    const on = !document.body.classList.contains("lp-preview");
    document.body.classList.toggle("lp-preview", on);
    if (on && window.Vvveb) {
      window.Vvveb.Builder.selectNode(null);
      const box = document.getElementById("select-box");
      if (box) box.style.display = "none";
    }
    const btn = $$(".lp-actions .lp-btn").find((b) => b.textContent === t("预览") || b.textContent === t("退出预览"));
    if (btn) {
      btn.textContent = on ? t("退出预览") : t("预览");
      btn.classList.toggle("is-on", on);
    }
  }

  function localizeSelectionToolbar() {
    const map = { "up-btn": "上移", "down-btn": "下移", "clone-btn": "复制", "delete-btn": "删除", "parent-btn": "选择父级" };
    Object.entries(map).forEach(([id, zh]) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute("title", t(zh));
    });
  }

  function showRightPanel() {
    const builder = document.getElementById("vvveb-builder");
    const panel = document.getElementById("right-panel");
    if (!builder || !panel) return;
    builder.classList.remove("no-right-panel");
    panel.style.display = "";
    document.body.style.setProperty("--builder-right-panel-width", "");
    if (window.Vvveb && Vvveb.Components) {
      Vvveb.Components.componentPropertiesElement = "#right-panel .component-properties";
    }
  }

  /* ------------------------------------------------------------------ */
  /* left panel: deck                                                    */
  /* ------------------------------------------------------------------ */

  function buildDeck() {
    const host = $("#pages-tabs");
    if (!host) return;
    host.innerHTML = "";
    const list = h("div", { class: "lp-deck", id: "lp-deck" });
    core.state.sections.forEach((s, i) => {
      const row = h("button", { type: "button", class: "lp-slide", "data-index": String(i) }, [
        h("span", { class: "lp-slide-no", text: String(i + 1).padStart(2, "0") }),
        h("span", { class: "lp-slide-body" }, [
          h("span", { class: "lp-slide-title", text: s.title }),
          h("span", {
          class: "lp-slide-meta",
          text: (s.chapter ? (isEn() ? "Ch. " + s.chapter + " · " : "第 " + s.chapter + " 章 · ") : "") + s.id,
        }),
        ]),
      ]);
      row.addEventListener("click", () => core.goTo(i));
      list.appendChild(row);
    });
    host.appendChild(list);
  }

  function syncDeck(index) {
    const list = $("#lp-deck");
    if (!list) return;
    $$(".lp-slide", list).forEach((n, i) => n.classList.toggle("is-current", i === index));
    const cur = $(".lp-slide.is-current", list);
    if (cur) cur.scrollIntoView({ block: "nearest" });
  }

  /* ------------------------------------------------------------------ */
  /* right panel: inspector                                              */
  /* ------------------------------------------------------------------ */

  function buildInspector() {
    const tabs = $$("#properties-tabs").find((n) => n.closest("#right-panel"));
    const content = tabs && tabs.parentElement.querySelector(".tab-content");
    if (!tabs || !content) return;
    const existing = document.getElementById("lp-inspector");
    if (existing) {
      existing.remove();
      const link = tabs.querySelector('a[href="#lp-inspector"]');
      if (link) link.closest("li").remove();
    }

    const li = h("li", { class: "nav-item" }, [
      h("a", {
        class: "nav-link active",
        "data-bs-toggle": "tab",
        href: "#lp-inspector",
        role: "tab",
        html: "<span>" + t("属性") + "</span>",
      }),
    ]);
    tabs.insertBefore(li, tabs.firstChild);
    $$("a", tabs).forEach((a) => {
      if (a.getAttribute("href") !== "#lp-inspector") a.classList.remove("active");
    });

    const pane = h("div", { class: "tab-pane show active", id: "lp-inspector", role: "tabpanel" });
    content.insertBefore(pane, content.firstChild);
    $$(".tab-pane", content).forEach((p) => {
      if (p.id !== "lp-inspector") p.classList.remove("show", "active");
    });

    pane.append(
      h("div", { class: "lp-insp-empty", id: "lp-insp-empty" }, [
        h("p", { text: t("点击画布中的任意元素开始编辑") }),
        h("p", { class: "lp-hint", text: t("双击文字可直接改写 · ⌘Z 撤销 · 选中图表可改数据") }),
      ]),
      h("div", { id: "lp-insp-body", style: "display:none" }),
      backdropCard(),
      themePanel()
    );
  }

  function rebuildUi() {
    const host = document.getElementById("top-panel");
    if (host) {
      host.removeAttribute("data-lp");
      host.innerHTML = "";
    }
    buildTopbar();
    buildDeck();
    buildInspector();
    renderInspector();
    updateBackdrop();
  }

  function backdropIndexOfNow() {
    const win = core.frame();
    const urls = win && win.PLATE_URLS;
    if (!urls || !urls.length) return -1;
    const at = core.state.currentIndex < 0 ? 0 : core.state.currentIndex;
    return Math.max(0, Math.min(urls.length - 1, at));
  }

  function updateBackdrop() {
    const preview = document.getElementById("lp-backdrop-preview");
    const info = document.getElementById("lp-backdrop-info");
    if (!preview || !info) return;
    const win = core.frame();
    const urls = win && win.PLATE_URLS;
    const index = backdropIndexOfNow();
    if (!urls || index < 0) {
      info.textContent = t("未找到可替换的背景层");
      return;
    }
    preview.src = urls[index] || "";
    info.textContent = isEn() ? "Page " + (index + 1) + " / " + urls.length : "第 " + (index + 1) + " 页 / 共 " + urls.length + " 页";
  }

  function applyBackdrop(dataUrl) {
    const win = core.frame();
    const doc = core.doc();
    if (!win || !doc || !win.PLATE_URLS) return;
    const index = backdropIndexOfNow();
    if (index < 0) return;
    win.PLATE_URLS[index] = dataUrl;
    doc.querySelectorAll("#plate img").forEach((img) => {
      if (img.style.opacity !== "0") img.src = dataUrl;
    });
    core.markDirty();
    updateBackdrop();
  }

  function backdropCard() {
    const win = core.frame();
    const hasPlate = !!(win && win.PLATE_URLS && win.PLATE_URLS.length);
    if (!hasPlate) return sectionCard(t("页面背景"), [h("p", { class: "lp-hint", text: t("未找到可替换的背景层") })]);

    const preview = h("img", { class: "lp-img-preview", id: "lp-backdrop-preview", alt: "" });
    const info = h("span", { class: "lp-img-info", id: "lp-backdrop-info" });
    const picker = h("input", {
      type: "file",
      accept: "image/*",
      style: "display:none",
      onchange: async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = "";
        if (!file) return;
        applyBackdrop(await fileToDataUrl(file, 2400, 0.86));
      },
    });
    const choose = async () => {
      if (!core.isDesktop()) return picker.click();
      const picked = await window.__TAURI__.core.invoke("pick_image");
      if (!picked) return;
      const blob = await (await fetch(picked.dataUrl)).blob();
      applyBackdrop(await fileToDataUrl(new File([blob], picked.name, { type: blob.type }), 2400, 0.86));
    };

    setTimeout(updateBackdrop, 0);
    return sectionCard(t("页面背景"), [
      h("div", { class: "lp-img-row" }, [preview, info]),
      h("div", { class: "lp-btn-row" }, [h("button", { type: "button", class: "lp-btn", text: t("替换背景图"), onclick: () => choose() })]),
      picker,
      h("p", { class: "lp-hint", text: t("背景图会随页面切换自动替换，仅影响当前这一页。") }),
    ]);
  }

  function sectionCard(title, children) {
    return h("section", { class: "lp-card" }, [h("h3", { class: "lp-card-title", text: title })].concat(children));
  }

  function field(label, control) {
    return h("label", { class: "lp-field" }, [h("span", { class: "lp-field-label", text: label }), control]);
  }

  function buildElementPanel(el) {
    const cs = core.styleOf(el);
    const tag = el.tagName.toLowerCase();
    const cls = (el.className || "").toString().split(/\s+/).filter(Boolean).slice(0, 3).join(".");

    const size = h("input", { class: "lp-input", type: "number", min: "6", max: "300", step: "1", value: Math.round(parseFloat(cs.fontSize)) || 16 });
    const unit = h("select", { class: "lp-input lp-input-unit" }, ["px", "rem", "em", "%"].map((u) => h("option", { value: u, text: u })));
    size.addEventListener("input", () => core.patchStyle(el, { "font-size": size.value + unit.value }));
    unit.addEventListener("change", () => core.patchStyle(el, { "font-size": size.value + unit.value }));

    const family = h(
      "select",
      { class: "lp-input" },
      FONTS.map(([value, label]) => h("option", { value, text: label, selected: cs.fontFamily.includes(value) ? "selected" : null }))
    );
    family.addEventListener("change", () => core.patchStyle(el, { "font-family": family.value }));

    const color = h("input", { class: "lp-color", type: "color", value: toHex(cs.color) });
    color.addEventListener("input", () => {
      core.patchStyle(el, { color: color.value });
      const hex = document.getElementById("lp-color-hex");
      if (hex) hex.textContent = color.value;
    });

    const weight = h(
      "select",
      { class: "lp-input" },
      [["300", t("细")], ["400", t("常规")], ["500", t("中等")], ["600", t("半粗")], ["700", t("粗")], ["900", t("特粗")]].map(([v, t]) =>
        h("option", { value: v, text: t, selected: cs.fontWeight === v ? "selected" : null })
      )
    );
    weight.addEventListener("change", () => core.patchStyle(el, { "font-weight": weight.value }));

    const align = h("div", { class: "lp-seg" }, ["left", "center", "right", "justify"].map((a) =>
      h("button", {
        type: "button",
        class: "lp-seg-btn" + (cs.textAlign === a ? " is-on" : ""),
        title: a,
        text: { left: t("左"), center: t("中"), right: t("右"), justify: t("两端") }[a],
        onclick: (e) => {
          core.patchStyle(el, { "text-align": a });
          $$(".lp-seg-btn", e.target.parentElement).forEach((b) => b.classList.remove("is-on"));
          e.target.classList.add("is-on");
        },
      })
    ));

    const lhRatio = (parseFloat(cs.lineHeight) || 16 * 1.75) / (parseFloat(cs.fontSize) || 16);
    const lh = h("input", { class: "lp-input", type: "number", step: "0.05", min: "0.8", max: "3", value: lhRatio.toFixed(2) });
    lh.addEventListener("input", () => core.patchStyle(el, { "line-height": lh.value }));

    const ls = h("input", { class: "lp-input", type: "number", step: "0.5", min: "-5", max: "20", value: (parseFloat(cs.letterSpacing) || 0).toFixed(1) });
    ls.addEventListener("input", () => core.patchStyle(el, { "letter-spacing": ls.value + "px" }));

    const italicBtn = h("button", {
      type: "button",
      class: "lp-btn lp-btn-tiny" + (cs.fontStyle === "italic" ? " is-on" : ""),
      text: t("斜体"),
      onclick: () => core.patchStyle(el, { "font-style": cs.fontStyle === "italic" ? "normal" : "italic" }),
    });

    const isFree = cs.position === "absolute";
    const freeBtn = h("button", {
      type: "button",
      class: "lp-btn lp-btn-tiny" + (isFree ? " is-on" : ""),
      text: isFree ? t("自由定位：开") : t("自由定位"),
      onclick: () => {
        core.setFreePosition(el, !isFree);
        renderInspector();
      },
    });

    const nodes = [
      h("div", { class: "lp-el-head" }, [
        h("span", { class: "lp-el-tag", text: tag + (cls ? "." + cls : "") }),
        h("button", { type: "button", class: "lp-link", text: t("编辑文字"), onclick: () => startTextEdit(el) }),
      ]),
      sectionCard(t("文字"), [
        field(t("字体"), family),
        h("div", { class: "lp-row" }, [field(t("字号"), h("div", { class: "lp-inline" }, [size, unit])), field(t("字重"), weight)]),
        h("div", { class: "lp-row" }, [field(t("颜色"), h("div", { class: "lp-color-field" }, [color, h("span", { class: "lp-color-hex", id: "lp-color-hex", text: toHex(cs.color) })])), field(t("行高（倍）"), lh)]),
        h("div", { class: "lp-row" }, [field(t("字距（px）"), ls), field(t("对齐"), align)]),
        h("div", { class: "lp-row lp-row-actions" }, [italicBtn]),
      ]),
      sectionCard(t("元素"), [
        h("div", { class: "lp-btn-row" }, [
          h("button", { type: "button", class: "lp-btn", text: t("上移"), onclick: () => core.moveUp(el) }),
          h("button", { type: "button", class: "lp-btn", text: t("下移"), onclick: () => core.moveDown(el) }),
          h("button", { type: "button", class: "lp-btn", text: t("复制"), onclick: () => core.duplicate(el) }),
          h("button", { type: "button", class: "lp-btn lp-btn-danger", text: t("删除"), onclick: () => core.remove(el) }),
        ]),
        h("div", { class: "lp-btn-row" }, [freeBtn]),
        h("p", { class: "lp-hint", text: t("自由定位后可用方向键微调（Shift+方向键 10px）") }),
      ]),
    ];
    const imgCard = imageCard(el);
    if (imgCard) nodes.splice(1, 0, imgCard);
    return nodes;
  }

  function fileToDataUrl(file, maxDim = 2000, quality = 0.9) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result);
        const probe = new Image();
        probe.onload = () => {
          const longest = Math.max(probe.naturalWidth, probe.naturalHeight);
          if (longest <= maxDim && file.size <= 1.5e6) return resolve(raw);
          const scale = Math.min(1, maxDim / longest);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(probe.naturalWidth * scale);
          canvas.height = Math.round(probe.naturalHeight * scale);
          canvas.getContext("2d").drawImage(probe, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        probe.onerror = () => resolve(raw);
        probe.src = raw;
      };
      reader.readAsDataURL(file);
    });
  }

  function applyImage(el, dataUrl, isImg) {
    if (isImg) {
      const before = el.getAttribute("src") || "";
      el.setAttribute("src", dataUrl);
      window.Vvveb.Undo.addMutation({
        type: "attributes",
        target: el,
        attributeName: "src",
        oldValue: before,
        newValue: dataUrl,
      });
    } else {
      const before = el.getAttribute("style") || "";
      el.style.backgroundImage = 'url("' + dataUrl + '")';
      if (!el.style.backgroundSize) el.style.backgroundSize = "cover";
      if (!el.style.backgroundPosition) el.style.backgroundPosition = "center";
      window.Vvveb.Undo.addMutation({
        type: "attributes",
        target: el,
        attributeName: "style",
        oldValue: before,
        newValue: el.getAttribute("style"),
      });
    }
    core.markDirty();
  }

  function imageCard(el) {
    const win = core.frame();
    const isImg = el.tagName === "IMG";
    const bg = win.getComputedStyle(el).backgroundImage || "none";
    const bgMatch = /^url\(["']?(.*?)["']?\)/.exec(bg);
    if (!isImg && !bgMatch) return null;

    const current = isImg ? el.getAttribute("src") || "" : bgMatch[1];
    const preview = h("img", { class: "lp-img-preview", src: current, alt: "" });
    const info = h("span", { class: "lp-img-info", text: isImg ? t("页面图片") : t("背景图片") });
    const picker = h("input", {
      type: "file",
      accept: "image/*",
      style: "display:none",
      onchange: async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = "";
        if (!file) return;
        const dataUrl = await fileToDataUrl(file);
        applyImage(el, dataUrl, isImg);
        preview.src = dataUrl;
        info.textContent = (isImg ? t("已替换 · ") : t("背景已替换 · ")) + file.name;
      },
    });

    const choose = async () => {
      if (!core.isDesktop()) return picker.click();
      const picked = await window.__TAURI__.core.invoke("pick_image");
      if (!picked) return;
      const blob = await (await fetch(picked.dataUrl)).blob();
      const dataUrl = await fileToDataUrl(new File([blob], picked.name, { type: blob.type }));
      applyImage(el, dataUrl, isImg);
      preview.src = dataUrl;
      info.textContent = (isImg ? t("已替换 · ") : t("背景已替换 · ")) + picked.name;
    };

    return sectionCard(t("图片"), [
      h("div", { class: "lp-img-row" }, [preview, info]),
      h("div", { class: "lp-btn-row" }, [
        h("button", { type: "button", class: "lp-btn", text: t("替换图片"), onclick: () => choose() }),
      ]),
      picker,
      h("p", { class: "lp-hint", text: t("支持 JPG / PNG / WebP；超过 2000px 或 1.5MB 会自动压缩，避免导出文件膨胀。") }),
    ]);
  }

  /* ---------------- zoom (ctrl/cmd + wheel, pinch) ---------------- */

  const zoomState = { value: 1 };

  function ensureZoomHost() {
    let host = document.getElementById("lp-zoom");
    if (host) return host;
    const wrapper = document.getElementById("iframe-wrapper");
    if (!wrapper) return null;
    host = document.createElement("div");
    host.id = "lp-zoom";
    wrapper.parentElement.insertBefore(host, wrapper);
    host.appendChild(wrapper);
    return host;
  }

  function clearZoomStyles(keepWidth) {
    const wrapper = document.getElementById("iframe-wrapper");
    const host = document.getElementById("lp-zoom");
    if (!wrapper || !host) return;
    wrapper.style.transform = "";
    wrapper.style.transformOrigin = "";
    wrapper.style.height = "";
    host.style.width = "";
    host.style.height = "";
    if (!keepWidth) wrapper.style.width = "";
  }

  function showZoomBadge(value) {
    let badge = document.getElementById("lp-zoom-badge");
    if (!badge) {
      badge = h("div", { class: "lp-zoom-badge", id: "lp-zoom-badge" });
      document.getElementById("canvas").appendChild(badge);
    }
    badge.textContent = Math.round(value * 100) + "%";
    badge.classList.add("is-visible");
    badge.classList.toggle("is-off", Math.abs(value - 1) < 0.001);
    clearTimeout(badge._timer);
    badge._timer = setTimeout(() => badge.classList.remove("is-visible"), 1400);
  }

  function applyZoom(next) {
    const wrapper = document.getElementById("iframe-wrapper");
    const host = ensureZoomHost();
    if (!wrapper || !host) return;
    const z = Math.max(0.25, Math.min(3, next));
    const canvas = document.getElementById("canvas");
    const cs = getComputedStyle(canvas);
    const contentW =
      canvas.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
    const contentH =
      canvas.clientHeight - parseFloat(cs.paddingTop || 0) - parseFloat(cs.paddingBottom || 0);
    const pinnedW = parseFloat(wrapper.style.width);
    if (z === 1) {
      zoomState.value = 1;
      clearZoomStyles(false);
      if (pinnedW > 0) wrapper.style.width = pinnedW + "px";
      showZoomBadge(1);
      return;
    }
    const baseW = Math.round(pinnedW > 0 ? pinnedW : contentW);
    const baseH = Math.round(contentH);
    clearZoomStyles(true);
    zoomState.value = z;
    wrapper.style.transformOrigin = "top left";
    wrapper.style.transform = z === 1 ? "" : "scale(" + z + ")";
    wrapper.style.width = baseW + "px";
    wrapper.style.height = baseH + "px";
    host.style.width = Math.round(baseW * z) + "px";
    host.style.height = Math.round(baseH * z) + "px";
    showZoomBadge(z);
  }

  function zoomFactor(deltaY) {
    return Math.min(1.25, Math.max(0.8, Math.exp(-deltaY * 0.0018)));
  }

  function bindZoom() {
    ensureZoomHost();
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      if (Math.abs(zoomState.value - 1) < 0.001) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => applyZoom(zoomState.value), 200);
    });
    const canvas = document.getElementById("canvas");
    if (canvas) {
      canvas.addEventListener(
        "wheel",
        (e) => {
          if (!(e.ctrlKey || e.metaKey)) return;
          e.preventDefault();
          applyZoom(zoomState.value * zoomFactor(e.deltaY));
        },
        { passive: false }
      );
    }
  }

  /* ---------------- donate ---------------- */

  function closeDonate() {
    const modal = document.getElementById("lp-donate");
    if (modal) modal.classList.remove("is-open");
  }

  function openDonate() {
    let modal = document.getElementById("lp-donate");
    if (!modal) {
      modal = h("div", { class: "lp-modal", id: "lp-donate" }, [
        h("div", { class: "lp-modal-card" }, [
          h("button", { type: "button", class: "lp-modal-close", text: "×", title: t("关闭"), onclick: closeDonate }),
          h("div", { class: "lp-modal-head" }, [h("h2", { text: t("请作者喝杯咖啡") }), h("p", { text: t("如果它帮你省下了时间，欢迎打赏一杯咖啡；不打赏也照样好用。") })]),
          h("img", {
            class: "lp-modal-qr",
            src: "assets/donate-qr.jpg",
            alt: t("支付宝收款二维码"),
            onerror: (e) => {
              e.target.style.display = "none";
              const note = document.getElementById("lp-donate-note");
              if (note) note.style.display = "";
            },
          }),
          h("p", { class: "lp-modal-hint", id: "lp-donate-note", style: "display:none", text: t("把收款码放到 app/assets/donate-qr.jpg 即可显示（该文件不会提交到仓库）。") }),
          h("p", { class: "lp-modal-hint", text: t("支付宝扫码 · 金额随意") }),
        ]),
      ]);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeDonate();
      });
      document.body.appendChild(modal);
    }
    modal.classList.add("is-open");
  }

  function toHex(rgb) {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || "");
    if (!m) return "#000000";
    return "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
  }

  function startTextEdit(el) {
    core.select(el);
    const tryEdit = () => {
      if (window.Vvveb.WysiwygEditor && el.getAttribute("contenteditable") === null) {
        window.Vvveb.WysiwygEditor.edit(el);
      }
      el.focus();
    };
    tryEdit();
    setTimeout(tryEdit, 30);
  }

  /* ---------------- chart panel ---------------- */

  function chartPanelFor(el) {
    const canvas = el && el.closest ? el.closest("canvas[data-ppt]") : null;
    if (!canvas) return null;
    const key = canvas.dataset.ppt;
    const data = core.charts.get(key);
    if (!data) return null;
    return buildChartEditor(key, data);
  }

  function buildChartEditor(key, original) {
    let data = JSON.parse(JSON.stringify(original));
    const body = h("div", { class: "lp-chart-body" });
    const commit = debounce(() => core.charts.update(key, data), 60);

    const refresh = () => {
      body.innerHTML = "";
      body.appendChild(chartFields(key, data, refresh, commit));
    };
    refresh();

    return sectionCard(t("图表数据 · ") + key, [
      h("p", { class: "lp-hint", text: t("修改后画布会实时重绘，保存时写回 PPT_DATA。") }),
      body,
    ]);
  }

  function chartFields(key, data, refresh, commit) {
    const nodes = [];
    const numberInput = (value, onChange) => {
      const input = h("input", { class: "lp-cell-input", type: "number", step: "any", value });
      input.addEventListener("input", () => {
        const v = parseFloat(input.value);
        if (!Number.isNaN(v)) {
          onChange(v);
          commit();
        }
      });
      return input;
    };
    const textInput = (value, onChange) => {
      const input = h("input", { class: "lp-cell-input", type: "text", value });
      input.addEventListener("input", () => {
        onChange(input.value);
        commit();
      });
      return input;
    };

    if (data.title !== undefined) {
      nodes.push(field(t("标题"), textInput(data.title || "", (v) => (data.title = v))));
    }
    if (data.unit !== undefined) {
      nodes.push(field(t("单位"), textInput(data.unit || "", (v) => (data.unit = v))));
    }

    const panelList = data.panels || null;
    if (panelList) {
      const select = h(
        "select",
        { class: "lp-input" },
        panelList.map((p, i) => h("option", { value: String(i), text: p.title || "面板 " + (i + 1) }))
      );
      let active = 0;
      const panelBox = h("div", { class: "lp-panel-box" });
      const drawPanel = () => {
        panelBox.innerHTML = "";
        panelBox.appendChild(panelBody(panelList[active], data, refresh, commit));
      };
      select.addEventListener("change", () => {
        active = Number(select.value);
        drawPanel();
      });
      nodes.push(field(t("面板"), select), panelBox);
      drawPanel();
    } else {
      nodes.push(panelBody(data, data, refresh, commit));
    }

    return h("div", {}, nodes);
  }

  function panelBody(panel, data, refresh, commit) {
    const kind = data.kind;
    const wrap = h("div", {});

    if (panel.title !== undefined && panel !== data) {
      const t = h("input", { class: "lp-input", type: "text", value: panel.title || "" });
      t.addEventListener("input", () => {
        panel.title = t.value;
        commit();
      });
      wrap.appendChild(field(t("面板标题"), t));
    }

    if (kind === "trend") {
      wrap.appendChild(trendTable(panel, refresh, commit));
      return wrap;
    }
    if (kind === "hBar" || kind === "hBar-panels" || kind === "donut-panels") {
      wrap.appendChild(itemsTable(panel, refresh, commit));
      return wrap;
    }
    wrap.appendChild(groupedTable(panel, refresh, commit));
    return wrap;
  }

  function groupedTable(panel, refresh, commit) {
    const cats = panel.categories || [];
    const series = panel.series || [];
    const table = h("table", { class: "lp-grid" });
    const thead = h("thead", {}, [
      h("tr", {}, [h("th", { text: t("类目") })].concat(
        series.map((s, si) =>
          h("th", {}, [
            h("input", {
              class: "lp-cell-input lp-cell-head",
              type: "text",
              value: s.name || "",
              oninput: (e) => {
                s.name = e.target.value;
                commit();
              },
            }),
            h("input", {
              class: "lp-color lp-color-tiny",
              type: "color",
              value: namedColor(s.color),
              oninput: (e) => {
                s.color = e.target.value;
                commit();
              },
            }),
            h("button", {
              type: "button",
              class: "lp-x",
              title: t("删除系列"),
              text: "×",
              onclick: () => {
                panel.series.splice(si, 1);
                refresh();
                commit();
              },
            }),
          ])
        )
      )),
    ]);

    const tbody = h("tbody");
    cats.forEach((cat, ci) => {
      tbody.appendChild(
        h("tr", {}, [
          h("td", {}, [
            h("input", {
              class: "lp-cell-input",
              type: "text",
              value: cat,
              oninput: (e) => {
                panel.categories[ci] = e.target.value;
                commit();
              },
            }),
          ]),
        ].concat(
          series.map((s) =>
            h("td", {}, [
              (() => {
                const input = h("input", { class: "lp-cell-input", type: "number", step: "any", value: s.values?.[ci] ?? 0 });
                input.addEventListener("input", () => {
                  const v = parseFloat(input.value);
                  if (!Number.isNaN(v)) {
                    s.values[ci] = v;
                    commit();
                  }
                });
                return input;
              })(),
            ])
          )
        ).concat([
          h("td", {}, [
            h("button", {
              type: "button",
              class: "lp-x",
              text: "×",
              title: t("删除类目"),
              onclick: () => {
                panel.categories.splice(ci, 1);
                series.forEach((s) => s.values.splice(ci, 1));
                refresh();
                commit();
              },
            }),
          ]),
        ]))
      );
    });

    table.append(thead, tbody);
    return h("div", { class: "lp-table-wrap" }, [
      table,
      h("div", { class: "lp-btn-row" }, [
        h("button", {
          type: "button",
          class: "lp-btn lp-btn-tiny",
          text: t("+ 类目"),
          onclick: () => {
            panel.categories.push(t("新类目"));
            series.forEach((s) => s.values.push(0));
            refresh();
            commit();
          },
        }),
        h("button", {
          type: "button",
          class: "lp-btn lp-btn-tiny",
          text: t("+ 系列"),
          onclick: () => {
            panel.series.push({ name: t("新系列"), color: "teal", values: panel.categories.map(() => 0) });
            refresh();
            commit();
          },
        }),
      ]),
    ]);
  }

  function itemsTable(panel, refresh, commit) {
    const items = panel.items || (panel.items = []);
    const table = h("table", { class: "lp-grid" });
    table.appendChild(h("thead", {}, [h("tr", {}, [h("th", { text: t("名称") }), h("th", { text: t("数值") }), h("th")])]));
    const tbody = h("tbody");
    items.forEach((item, i) => {
      const name = h("input", {
        class: "lp-cell-input",
        type: "text",
        value: item.name || "",
        oninput: (e) => {
          item.name = e.target.value;
          commit();
        },
      });
      const value = h("input", { class: "lp-cell-input", type: "number", step: "any", value: item.value ?? 0 });
      value.addEventListener("input", () => {
        const v = parseFloat(value.value);
        if (!Number.isNaN(v)) {
          item.value = v;
          commit();
        }
      });
      tbody.appendChild(
        h("tr", {}, [
          h("td", {}, [name]),
          h("td", {}, [value]),
          h("td", {}, [
            h("button", {
              type: "button",
              class: "lp-x",
              text: "×",
              onclick: () => {
                items.splice(i, 1);
                refresh();
                commit();
              },
            }),
          ]),
        ])
      );
    });
    table.appendChild(tbody);
    return h("div", { class: "lp-table-wrap" }, [
      table,
      h("div", { class: "lp-btn-row" }, [
        h("button", {
          type: "button",
          class: "lp-btn lp-btn-tiny",
          text: t("+ 条目"),
          onclick: () => {
            items.push({ name: t("新条目"), value: 0 });
            refresh();
            commit();
          },
        }),
      ]),
    ]);
  }

  function trendTable(panel, refresh, commit) {
    const cats = panel.categories || (panel.categories = []);
    const values = panel.values || (panel.values = []);
    const growth = panel.growth || (panel.growth = []);
    const table = h("table", { class: "lp-grid" });
    table.appendChild(
      h("thead", {}, [h("tr", {}, [h("th", { text: t("类目") }), h("th", { text: t("数值") }), h("th", { text: t("增长率") }), h("th")])])
    );
    const tbody = h("tbody");
    cats.forEach((cat, i) => {
      const c = h("input", {
        class: "lp-cell-input",
        type: "text",
        value: cat,
        oninput: (e) => {
          cats[i] = e.target.value;
          commit();
        },
      });
      const v = h("input", { class: "lp-cell-input", type: "number", step: "any", value: values[i] ?? 0 });
      v.addEventListener("input", () => {
        const n = parseFloat(v.value);
        if (!Number.isNaN(n)) {
          values[i] = n;
          commit();
        }
      });
      const g = h("input", { class: "lp-cell-input", type: "number", step: "any", value: growth[i] ?? 0 });
      g.addEventListener("input", () => {
        const n = parseFloat(g.value);
        if (!Number.isNaN(n)) {
          growth[i] = n;
          commit();
        }
      });
      tbody.appendChild(
        h("tr", {}, [
          h("td", {}, [c]),
          h("td", {}, [v]),
          h("td", {}, [g]),
          h("td", {}, [
            h("button", {
              type: "button",
              class: "lp-x",
              text: "×",
              onclick: () => {
                cats.splice(i, 1);
                values.splice(i, 1);
                growth.splice(i, 1);
                refresh();
                commit();
              },
            }),
          ]),
        ])
      );
    });
    table.appendChild(tbody);

    const nodes = [
      h("div", { class: "lp-table-wrap" }, [
        table,
        h("div", { class: "lp-btn-row" }, [
          h("button", {
            type: "button",
            class: "lp-btn lp-btn-tiny",
            text: t("+ 类目"),
            onclick: () => {
              cats.push(t("新类目"));
              values.push(0);
              growth.push(0);
              refresh();
              commit();
            },
          }),
        ]),
      ]),
    ];

    if (panel.quarters && typeof panel.quarters === "object") {
      const qNodes = [];
      Object.entries(panel.quarters).forEach(([label, arr]) => {
        const row = h("div", { class: "lp-q-row" }, [h("span", { class: "lp-q-label", text: label })]);
        arr.forEach((val, i) => {
          const input = h("input", { class: "lp-cell-input", type: "number", step: "any", value: val });
          input.addEventListener("input", () => {
            const n = parseFloat(input.value);
            if (!Number.isNaN(n)) {
              panel.quarters[label][i] = n;
              commit();
            }
          });
          row.appendChild(input);
        });
        qNodes.push(row);
      });
      nodes.push(sectionCard(t("季度拆分"), qNodes));
    }
    return h("div", {}, nodes);
  }

  const NAMED_COLORS = { teal: "#0f7e71", control: "#8fa7b6", amber: "#b6782c", red: "#b8442f" };
  function namedColor(v) {
    if (!v) return "#0f7e71";
    if (v.startsWith("#") || v.startsWith("rgb")) return v;
    return NAMED_COLORS[v] || "#0f7e71";
  }

  /* ---------------- theme panel ---------------- */

  function themePanel() {
    const vars = core.theme.vars();
    const fontVars = ["--serif", "--sans", "--latin"].filter((k) => vars[k]);
    const wanted = ["--teal", "--teal-l", "--amber", "--amber-l", "--red", "--ink", "--bone", "--muted"];
    const colorVars = wanted.filter((k) => vars[k]);

    const fontRows = fontVars.map((name) => {
      const select = h(
        "select",
        { class: "lp-input" },
        FONTS.map(([value, label]) => h("option", { value: `"${value}", sans-serif`, text: label }))
      );
      const current = (vars[name] || "").split(",")[0].replace(/["']/g, "");
      if (FONTS.some(([v]) => v === current)) select.value = `"${current}", sans-serif`;
      select.addEventListener("change", () => {
        core.theme.setVar(name, select.value);
        document.dispatchEvent(new CustomEvent("lp:theme-changed"));
      });
      return field({ "--serif": t("标题字体"), "--sans": t("正文字体"), "--latin": t("西文字体") }[name] || name, select);
    });

    const colorRows = colorVars.map((name) => {
      const value = vars[name];
      const input = h("input", { class: "lp-color", type: "color", value: toHex(value) });
      input.addEventListener("input", () => {
        core.theme.setVar(name, input.value);
        document.dispatchEvent(new CustomEvent("lp:theme-changed"));
      });
      return h("div", { class: "lp-theme-color" }, [
        h("span", { class: "lp-theme-swatch" }),
        h("span", { class: "lp-theme-name", text: name.replace("--", "") }),
        input,
      ]);
    });

    const details = h("details", { class: "lp-details" }, [
      h("summary", { class: "lp-details-summary", text: t("主题与全局样式") }),
      h("div", { class: "lp-details-body" }, [
        h("p", { class: "lp-hint", text: t("这些是文档级 CSS 变量，改动会作用于全部页面。") }),
        h("div", { class: "lp-theme-fonts" }, fontRows),
        h("div", { class: "lp-theme-colors" }, colorRows),
      ]),
    ]);

    return details;
  }

  /* ------------------------------------------------------------------ */
  /* inspector render loop                                               */
  /* ------------------------------------------------------------------ */

  function renderInspector() {
    const body = $("#lp-insp-body");
    const empty = $("#lp-insp-empty");
    if (!body) return;
    const el = core.selected();
    if (!el || el.tagName === "BODY" || el.tagName === "HTML") {
      body.style.display = "none";
      empty.style.display = "";
      return;
    }
    empty.style.display = "none";
    body.style.display = "";
    body.innerHTML = "";
    body.scrollTop = 0;

    const isChart = el.tagName === "CANVAS" && el.dataset.ppt;
    if (isChart) {
      body.appendChild(chartCard(el));
      body.appendChild(elementOpsCard(el));
      return;
    }
    buildElementPanel(el).forEach((n) => body.appendChild(n));
  }

  function elementOpsCard(el) {
    const cs = core.styleOf(el);
    const isFree = cs.position === "absolute";
    const freeBtn = h("button", {
      type: "button",
      class: "lp-btn lp-btn-tiny" + (isFree ? " is-on" : ""),
      text: isFree ? t("自由定位：开") : t("自由定位"),
      onclick: () => {
        core.setFreePosition(el, !isFree);
        renderInspector();
      },
    });
    return sectionCard(t("元素"), [
      h("div", { class: "lp-btn-row" }, [
        h("button", { type: "button", class: "lp-btn", text: t("上移"), onclick: () => core.moveUp(el) }),
        h("button", { type: "button", class: "lp-btn", text: t("下移"), onclick: () => core.moveDown(el) }),
        h("button", { type: "button", class: "lp-btn", text: t("复制"), onclick: () => core.duplicate(el) }),
        h("button", { type: "button", class: "lp-btn lp-btn-danger", text: t("删除"), onclick: () => core.remove(el) }),
      ]),
      h("div", { class: "lp-btn-row" }, [freeBtn]),
      h("p", { class: "lp-hint", text: t("按住元素拖动即可移动（不会挤动其他元素）；Alt+方向键微调，Alt+Shift 加速；双击文字编辑。") }),
    ]);
  }

  function chartCard(el) {
    const key = core.charts.keyOf(el);
    const data = key ? core.charts.get(key) : null;
    if (!data) {
      return sectionCard(t("图表"), [
        h("p", { class: "lp-hint", text: t("该画布尚未绘制出可编辑的数据集，切换一次图表标签后再试。") }),
      ]);
    }
    return buildChartEditor(key, data);
  }

  /* ------------------------------------------------------------------ */
  /* canvas interaction: selection + keyboard                            */
  /* ------------------------------------------------------------------ */

  /* ---------------- canvas context menu ---------------- */

  let ctxMenu = null;

  function closeContextMenu() {
    if (ctxMenu) {
      ctxMenu.remove();
      ctxMenu = null;
    }
  }

  function openContextMenu(pageX, pageY, el) {
    closeContextMenu();
    const win = core.frame();
    const isImg = el.tagName === "IMG";
    const bg = win.getComputedStyle(el).backgroundImage || "none";
    const hasBg = bg.includes("url(");
    const hasText = !isImg && (el.textContent || "").trim().length > 0;

    const entries = [];
    if (hasText) entries.push({ label: t("编辑文字"), run: () => startTextEdit(el) });
    if (isImg || hasBg) {
      entries.push({
        label: t("替换图片"),
        run: () => {
          core.select(el);
          const pane = document.querySelector("#right-panel .tab-content");
          if (pane) pane.scrollTop = 0;
        },
      });
    }
    if (entries.length) entries.push({ sep: true });
    entries.push({ label: t("复制"), run: () => core.duplicate(el) });
    entries.push({ label: t("上移"), run: () => core.moveUp(el) });
    entries.push({ label: t("下移"), run: () => core.moveDown(el) });
    entries.push({
      label: isFreePositioned(el) ? t("自由定位：开") : t("自由定位"),
      run: () => {
        core.setFreePosition(el, !isFreePositioned(el));
        renderInspector();
      },
    });
    entries.push({ sep: true });
    entries.push({ label: t("删除"), danger: true, run: () => core.remove(el) });

    const menu = h("div", { class: "lp-ctx", role: "menu" });
    entries.forEach((entry) => {
      if (entry.sep) {
        menu.appendChild(h("hr"));
        return;
      }
      menu.appendChild(
        h("button", {
          type: "button",
          class: entry.danger ? "is-danger" : null,
          text: entry.label,
          onclick: () => {
            closeContextMenu();
            entry.run();
          },
        })
      );
    });
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(pageX, window.innerWidth - rect.width - 8)) + "px";
    menu.style.top = Math.max(8, Math.min(pageY, window.innerHeight - rect.height - 8)) + "px";
    ctxMenu = menu;
  }

  function isFreePositioned(el) {
    return core.frame().getComputedStyle(el).position !== "static";
  }

  const boundDocs = new WeakSet();

  function bindCanvasEvents() {
    const doc = core.doc();
    if (!doc || boundDocs.has(doc)) return;
    boundDocs.add(doc);
    const win = core.frame();
    localizeSelectionToolbar();

    let gesture = null;
    const DRAG_THRESHOLD = 4;

    function dragTarget(node) {
      let el = node;
      while (el && el.nodeType === 1) {
        if (el.tagName === "BODY" || el.tagName === "HTML") return null;
        if (el.classList && el.classList.contains("beat")) return null;
        if (el.tagName !== "SPAN" && el.tagName !== "EM" && el.tagName !== "B" && el.tagName !== "I" && el.tagName !== "SMALL") return el;
        el = el.parentElement;
      }
      return null;
    }

    doc.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      if (document.body.classList.contains("lp-preview")) return;
      if (window.Vvveb?.WysiwygEditor?.isActive) return;
      if (!e.target || e.target.nodeType !== 1) return;
      const el = dragTarget(e.target);
      if (!el) return;
      gesture = { el, x: e.clientX, y: e.clientY, dragging: false, left: 0, top: 0, beforeStyle: "" };
      const pressStyle = doc.createElement("style");
      pressStyle.id = "lp-drag-cursor";
      pressStyle.textContent =
        "*,*::before,*::after{cursor:move !important;-webkit-user-select:none !important;user-select:none !important}";
      doc.head.appendChild(pressStyle);
      const wrap = document.getElementById("iframe-wrapper");
      if (wrap) wrap.style.cursor = "move";
    }, true);

    doc.addEventListener("pointermove", (e) => {
      if (!gesture) return;
      const dx = e.clientX - gesture.x;
      const dy = e.clientY - gesture.y;

      if (!gesture.dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        const el = gesture.el;
        core.select(el);
        gesture.beforeStyle = el.getAttribute("style") || "";
        if (win.getComputedStyle(el).position === "static") el.style.position = "relative";
        gesture.left = parseFloat(el.style.left || "0");
        gesture.top = parseFloat(el.style.top || "0");
        gesture.dragging = true;
        document.body.classList.add("lp-dragging");
        const box = document.getElementById("select-box");
        if (box) box.style.display = "none";
      }

      gesture.el.style.left = Math.round(gesture.left + dx) + "px";
      gesture.el.style.top = Math.round(gesture.top + dy) + "px";
      e.preventDefault();
    }, { passive: false });

    const endGesture = () => {
      if (!gesture) return;
      const g = gesture;
      gesture = null;
      document.body.classList.remove("lp-dragging");
      const wrap = document.getElementById("iframe-wrapper");
      if (wrap) wrap.style.cursor = "";
      const stale = core.doc()?.getElementById("lp-drag-cursor");
      if (stale) stale.remove();
      if (!g.dragging) return core.select(g.el);
      const afterStyle = g.el.getAttribute("style") || "";
      if (afterStyle !== g.beforeStyle) {
        window.Vvveb.Undo.addMutation({
          type: "attributes",
          target: g.el,
          attributeName: "style",
          oldValue: g.beforeStyle,
          newValue: afterStyle,
        });
        core.markDirty();
      }
      core.select(g.el);
    };
    doc.addEventListener("pointerup", endGesture);
    doc.addEventListener("pointercancel", endGesture);
    win.addEventListener("pointerup", endGesture);
    bindKeys(doc);

    doc.addEventListener(
      "wheel",
      (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        applyZoom(zoomState.value * zoomFactor(e.deltaY));
      },
      { passive: false }
    );

    doc.addEventListener("contextmenu", (e) => {
      if (document.body.classList.contains("lp-preview")) return;
      if (!e.target || e.target.nodeType !== 1) return;
      e.preventDefault();
      const el = dragTarget(e.target);
      if (!el) return;
      core.select(el);
      const iframe = document.getElementById("iframe1");
      const ir = iframe.getBoundingClientRect();
      const zoomX = ir.width / (win.innerWidth || 1);
      const zoomY = ir.height / (win.innerHeight || 1);
      openContextMenu(ir.left + e.clientX * zoomX, ir.top + e.clientY * zoomY, el);
    });

    doc.addEventListener("click", (e) => {
      if (document.body.classList.contains("lp-preview")) return;
      const t = e.target;
      if (!t || t.nodeType !== 1) return;
      if (t.closest("#vvvebjs-styles")) return;
      core.select(t);
      if (t.closest(".market-tabs button")) {
        setTimeout(() => {
          const canvas = doc.querySelector('canvas[data-ppt="marketMain"]');
          if (canvas) core.select(canvas);
        }, 450);
      }
    });

    win.addEventListener("scroll", () => {
      closeContextMenu();
      const mid = win.scrollY + win.innerHeight / 2;
      let best = 0;
      let dist = Infinity;
      core.state.sections.forEach((s, i) => {
        const top = s.el.getBoundingClientRect().top + win.scrollY;
        const d = Math.abs(top + s.el.offsetHeight / 2 - mid);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      core.setCurrent(best);
    }, { passive: true });
  }

  function bindKeys(target) {
    if (!target || target.__lpKeys) return;
    target.__lpKeys = true;
    target.addEventListener("keydown", (e) => {
      const active = target.activeElement;
      const editing =
        (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) ||
        (active && active.isContentEditable) ||
        window.Vvveb?.WysiwygEditor?.isActive;
      const meta = e.metaKey || e.ctrlKey;
      if (e.key === "Escape") {
        closeContextMenu();
        return closeDonate();
      }
      if (meta && (e.key === "0" || e.key === "=" || e.key === "+" || e.key === "-")) {
        e.preventDefault();
        if (e.key === "0") applyZoom(1);
        else if (e.key === "-") applyZoom(zoomState.value / 1.1);
        else applyZoom(zoomState.value * 1.1);
        return;
      }
      if (meta && e.key.toLowerCase() === "z") {
        if (editing) return;
        e.preventDefault();
        e.shiftKey ? core.redo() : core.undo();
        return;
      }
      if (editing) return;
      const el = core.selected();
      if (!el) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        core.remove(el);
      } else if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        core.duplicate(el);
      } else if (e.altKey && e.key.startsWith("Arrow")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        core.nudge(el, dx, dy);
      }
    }, true);
  }

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */

  ui.boot = function () {
    document.documentElement.setAttribute("data-bs-theme", "dark");
    document.addEventListener("lp:ready", () => {
      showRightPanel();
      buildTopbar();
      buildDeck();
      buildInspector();
      bindCanvasEvents();
      bindZoom();
      zoomState.value = 1;
      clearZoomStyles(true);
      syncDeck(0);
      const nameEl = $("#lp-file-name");
      if (nameEl) nameEl.textContent = core.state.fileName;
      renderInspector();
    });
    document.addEventListener("lp:slide", (e) => {
      syncDeck(e.detail.index);
      updateBackdrop();
    });
    if (window.LP_I18N) window.LP_I18N.onChange(() => rebuildUi());
    document.addEventListener("lp:saved", (e) => {
      const nameEl = $("#lp-file-name");
      if (nameEl && e.detail.name) nameEl.textContent = e.detail.name;
    });
    document.addEventListener("lp:select", () => renderInspector());
    document.addEventListener("lp:style", () => {
      /* keep panel values in sync when styles change from canvas */
    });
    document.addEventListener("lp:theme-changed", () => {
      core.charts.renderAll();
    });
    document.addEventListener("click", (e) => {
      if (ctxMenu && !ctxMenu.contains(e.target)) closeContextMenu();
    });
    bindKeys(document);
    core.boot();
  };
})();

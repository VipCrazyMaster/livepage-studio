/* Livepage Studio — UI language (zh default, en optional). */
(function () {
  "use strict";

  const EN = {
    "阿里巴巴普惠体（内置）": "Alibaba PuHuiTi (built-in)",
    "苹方 PingFang SC": "PingFang SC",
    "冬青黑体": "Hiragino Sans GB",
    "微软雅黑": "Microsoft YaHei",
    "思源黑体": "Source Han Sans SC",
    "宋体-简": "Songti SC",
    "宋体": "SimSun",
    "楷体": "KaiTi",
    "Georgia（西文衬线）": "Georgia (Latin serif)",
    "有未保存的修改": "Unsaved changes",
    "打开": "Open",
    "打开本地 HTML": "Open a local HTML file",
    "保存": "Save",
    "导出为单个 HTML 文件": "Export as a single HTML file",
    "撤销 (⌘Z)": "Undo (⌘Z)",
    "重做 (⇧⌘Z)": "Redo (⇧⌘Z)",
    "桌面": "Desktop",
    "桌面视图": "Desktop view",
    "平板": "Tablet",
    "平板视图": "Tablet view",
    "手机": "Mobile",
    "手机视图": "Mobile view",
    "预览": "Preview",
    "进入预览模式": "Enter preview",
    "退出预览": "Exit preview",
    "打赏": "Tip",
    "请作者喝杯咖啡": "Buy the author a coffee",
    "点击画布中的任意元素开始编辑": "Click any element on the canvas to start editing",
    "双击文字可直接改写 · ⌘Z 撤销 · 选中图表可改数据":
      "Double-click text to rewrite it · ⌘Z to undo · select a chart to edit its data",
    "细": "Light",
    "常规": "Regular",
    "中等": "Medium",
    "半粗": "Semibold",
    "粗": "Bold",
    "特粗": "Black",
    "左": "Left",
    "中": "Center",
    "右": "Right",
    "两端": "Justify",
    "斜体": "Italic",
    "自由定位：开": "Free position: on",
    "自由定位": "Free position",
    "编辑文字": "Edit text",
    "文字": "Text",
    "字体": "Font",
    "字号": "Size",
    "字重": "Weight",
    "颜色": "Color",
    "行高（倍）": "Line height (×)",
    "字距（px）": "Letter spacing (px)",
    "对齐": "Align",
    "元素": "Element",
    "上移": "Move up",
    "下移": "Move down",
    "复制": "Duplicate",
    "删除": "Delete",
    "自由定位后可用方向键微调（Shift+方向键 10px）":
      "With free position on, nudge with arrow keys (Shift = 10px)",
    "页面图片": "Page image",
    "背景图片": "Background image",
    "已替换 · ": "Replaced · ",
    "背景已替换 · ": "Backdrop replaced · ",
    "图片": "Image",
    "替换图片": "Replace image",
    "支持 JPG / PNG / WebP；超过 2000px 或 1.5MB 会自动压缩，避免导出文件膨胀。":
      "JPG / PNG / WebP. Images over 2000px or 1.5MB are compressed so the exported file stays small.",
    "关闭": "Close",
    "如果它帮你省下了时间，欢迎打赏一杯咖啡；不打赏也照样好用。":
      "If it saved you some time, feel free to buy me a coffee. It works just as well if you don't.",
    "支付宝收款二维码": "Alipay payment QR code",
    "支付宝扫码 · 金额随意": "Scan with Alipay · any amount",
    "图表数据 · ": "Chart data · ",
    "修改后画布会实时重绘，保存时写回 PPT_DATA。":
      "The canvas redraws live; values are written back to PPT_DATA when you save.",
    "标题": "Title",
    "单位": "Unit",
    "面板": "Panel",
    "面板标题": "Panel title",
    "类目": "Category",
    "删除系列": "Remove series",
    "删除类目": "Remove category",
    "+ 类目": "+ Category",
    "新类目": "New category",
    "+ 系列": "+ Series",
    "新系列": "New series",
    "名称": "Name",
    "数值": "Value",
    "+ 条目": "+ Item",
    "新条目": "New item",
    "增长率": "Growth",
    "季度拆分": "Quarterly split",
    "标题字体": "Heading font",
    "正文字体": "Body font",
    "西文字体": "Latin font",
    "主题与全局样式": "Theme & global styles",
    "这些是文档级 CSS 变量，改动会作用于全部页面。":
      "Document-level CSS variables; changes apply to every page.",
    "按住元素拖动即可移动（不会挤动其他元素）；Alt+方向键微调，Alt+Shift 加速；双击文字编辑。":
      "Drag an element to move it (others stay put); Alt+Arrow nudges, Alt+Shift moves 10px; double-click text to edit.",
    "图表": "Chart",
    "该画布尚未绘制出可编辑的数据集，切换一次图表标签后再试。":
      "This canvas has no editable dataset yet. Switch a chart tab once, then try again.",
    "属性": "Properties",
    "页面背景": "Page backdrop",
    "替换背景图": "Replace backdrop",
    "本页的整幅背景图（跨页淡入的那一层）":
      "The full-page backdrop for this slide (the cross-fading layer)",
    "背景图会随页面切换自动替换，仅影响当前这一页。":
      "The backdrop is swapped per slide; this only changes the current page.",
    "未找到可替换的背景层": "No backdrop layer found in this document",
    "语言": "Language",
    "中文": "中文",
    "英文": "English",
    "面板 ": "Panel ",
    "选择父级": "Select parent",
    "把收款码放到 app/assets/donate-qr.jpg 即可显示（该文件不会提交到仓库）。":
      "Drop your QR image at app/assets/donate-qr.jpg to show it (that file is not committed).",
  };

  const state = {
    locale: (localStorage.getItem("lp-locale") || "zh").toLowerCase() === "en" ? "en" : "zh",
  };

  function t(zh) {
    if (state.locale === "zh") return zh;
    return Object.prototype.hasOwnProperty.call(EN, zh) ? EN[zh] : zh;
  }

  function apply(root) {
    const doc = root || document;
    doc.documentElement.setAttribute("lang", state.locale === "zh" ? "zh-CN" : "en");
  }

  const listeners = new Set();

  window.LP_I18N = {
    t,
    get locale() {
      return state.locale;
    },
    setLocale(next) {
      state.locale = next === "en" ? "en" : "zh";
      localStorage.setItem("lp-locale", state.locale);
      apply();
      listeners.forEach((fn) => fn(state.locale));
    },
    toggle() {
      window.LP_I18N.setLocale(state.locale === "zh" ? "en" : "zh");
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    apply,
  };

  apply();
})();

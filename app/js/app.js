/* Livepage Studio — entry point. */
(function () {
  "use strict";

  function fileProtocolNotice() {
    const dir = location.pathname.replace(/\/index\.html?$/i, "");
    const wrap = document.createElement("div");
    wrap.className = "lp-blocker";
    wrap.innerHTML = [
      '<div class="lp-blocker-card">',
      '<div class="lp-brand"><span class="lp-brand-mark">LP</span><span class="lp-brand-name">Livepage Studio</span></div>',
      "<h1>请通过本地服务打开</h1>",
      "<p>浏览器不允许 <code>file://</code> 页面读取同目录的 HTML 文件，直接双击 <code>index.html</code> 会停在空白编辑器。这是浏览器的同源策略，不是文件损坏。</p>",
      '<p class="lp-blocker-label">在终端执行：</p>',
      "<pre><code>cd " + dir + "\n./run.sh</code></pre>",
      "<p class=\"lp-blocker-hint\">脚本会启动本地服务并自动打开浏览器；Windows 用 <code>run.bat</code>。</p>",
      "</div>",
    ].join("");
    document.body.classList.add("lp-blocked");
    document.body.innerHTML = "";
    document.body.appendChild(wrap);
  }

  function start() {
    if (location.protocol === "file:") {
      fileProtocolNotice();
      return;
    }
    if (!window.Livepage || !window.Livepage.ui) return;
    window.Livepage.ui.boot();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

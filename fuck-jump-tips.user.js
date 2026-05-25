// ==UserScript==
// @name         外部链接自动跳转 Auto Jump Cleaner (Rule Engine)
// @namespace    https://github.com/dengshenkk/fuck-jump-tips
// @version      1.01
// @description  自动跳过第三方跳转确认（规则引擎版）
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const DEBUG = false;

  /* ---------------- 工具 ---------------- */

  const log = (...args) => DEBUG && console.log("[AutoJump]", ...args);

  const getURLParam = (keys) => {
    try {
      const url = new URL(location.href);
      for (const key of keys) {
        const val = url.searchParams.get(key);
        if (val) return decodeURIComponent(val);
      }
    } catch { }
    return null;
  };

  const isExternal = (url) => {
    try {
      const u = new URL(url, location.origin);
      return u.host !== location.host;
    } catch {
      return false;
    }
  };

  const isSimplePage = () =>
    document.querySelectorAll("a,button").length <= 6;

  const isRedirectLike = () => {
    const text = document.body?.innerText || "";
    return /即将离开|访问第三方|跳转提示/.test(text);
  };

  /* ---------------- 核心动作 ---------------- */

  const Actions = {
    bypass() {
      const target = getURLParam(["url", "target", "dest", "u"]);
      if (target && target.startsWith("http")) {
        log("bypass →", target);
        location.replace(target);
        return true;
      }
      return false;
    },

    autoClick() {
      const KEYWORDS = ["继续", "前往", "访问", "跳转", "确定"];
      const els = document.querySelectorAll("a,button");

      for (const el of els) {
        const text = (el.innerText || "").trim();
        if (!text) continue;

        if (!KEYWORDS.some(k => text.includes(k))) continue;

        const href =
          el.href ||
          el.dataset?.url ||
          el.getAttribute("data-href");

        if (!href || !isExternal(href)) continue;

        log("click →", text);
        el.click();
        return true;
      }
      return false;
    },

    accelerateTimer() {
      const raw = window.setTimeout;
      window.setTimeout = (fn, delay, ...args) => {
        if (delay > 1000) delay = 0;
        return raw(fn, delay, ...args);
      };
    }
  };

  /* ---------------- 规则定义 ---------------- */

  function isVisible(el) {
    return !!(
      el &&
      el.offsetParent !== null &&
      getComputedStyle(el).visibility !== "hidden"
    );
  }

  function waitAndClick(selector, options = {}) {
    const { once = true, timeout = 10000 } = options;

    let done = false;

    const observer = new MutationObserver(() => {
      if (done) return;

      const el = document.querySelector(selector);

      if (el && isVisible(el)) {
        el.click();
        done = true;

        if (once) observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 超时保护
    if (timeout) {
      setTimeout(() => observer.disconnect(), timeout);
    }
    return true;
  }
  const rules = [
    // ❌ 完全禁用（防误触站点）
    {
      name: "block-linuxdo",
      match: () => location.host.includes("linux.do"),
      run: () => {
        waitAndClick(".modal-container .d-modal__footer button.btn.btn-icon-text.btn-primary");
        return true;
      }
    },

    // ✅ URL 直跳（最高优先级）
    {
      name: "direct-bypass",
      match: () => true,
      run: () => Actions.bypass()
    },

    // ✅ 已知跳转站
    {
      name: "known-redirect",
      match: () =>
        ["link.zhihu.com", "weibo.cn", "jump.bdimg.com"]
          .some(h => location.host.includes(h)),
      run: () => {
        Actions.accelerateTimer();
        return Actions.autoClick();
      }
    },

    // ✅ 通用安全策略（严格限制）
    {
      name: "generic-safe",
      match: () => isRedirectLike() && isSimplePage(),
      run: () => {
        Actions.accelerateTimer();
        return Actions.autoClick();
      }
    }
  ];

  /* ---------------- 引擎 ---------------- */

  function runEngine() {
    for (const rule of rules) {
      try {
        if (rule.match()) {
          log("rule:", rule.name);

          const done = rule.run();
          if (done) return;
        }
      } catch (e) {
        log("error:", e);
      }
    }
  }

  /* ---------------- 启动 ---------------- */

  function init() {
    runEngine();

    window.addEventListener("DOMContentLoaded", () => {
      const observer = new MutationObserver(runEngine);
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      runEngine();
    });
  }

  init();

})();
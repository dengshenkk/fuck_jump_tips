// ==UserScript==
// @name         国内站点外部链接自动跳转
// @namespace    https://github.com/nicepkg/fuck-jump-tips
// @version      1.0.0
// @description  自动跳过知乎、掘金、CSDN、微博、微信公众号、Gitee 等站点的外部链接确认页
// @author       nicepkg
// @match        *://link.zhihu.com/*
// @match        *://link.juejin.cn/*
// @match        *://link.csdn.net/*
// @match        *://weibo.cn/sinaurl*
// @match        *://mp.weixin.qq.com/mp/external_link_report*
// @match        *://gitee.com/link*
// @match        *://*.jianshu.com/go-wild*
// @match        *://c.pc.qq.com/*
// @match        *://www.so.com/link*
// @match        *://www.sogou.com/link*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zhihu.com
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        window.close
// @run-at       document-start
// @connect      *
// ==/UserScript==

(function () {
    'use strict';

    // 站点配置：域名 -> 提取规则
    const SITE_RULES = [
        {
            name: '知乎',
            test: (host, path) => host === 'link.zhihu.com',
            getTarget: () => getUrlParam('target'),
        },
        {
            name: '掘金',
            test: (host, path) => host === 'link.juejin.cn',
            getTarget: () => getUrlParam('target'),
            // 掘金需要额外等待页面渲染后点击按钮（备用方案）
            onFail: () => {
                const btn = document.querySelector('#app .middle-page button');
                if (btn) btn.click();
            },
        },
        {
            name: 'CSDN',
            test: (host, path) => host === 'link.csdn.net',
            getTarget: () => getUrlParam('target'),
        },
        {
            name: '微博',
            test: (host, path) => host === 'weibo.cn' && path.includes('/sinaurl'),
            getTarget: () => getUrlParam('u') || getUrlParam('toasturl') || getUrlParam('url'),
        },
        {
            name: '微信公众号',
            test: (host, path) => host === 'mp.weixin.qq.com' && path.includes('/external_link_report'),
            getTarget: () => getUrlParam('url'),
        },
        {
            name: 'Gitee',
            test: (host, path) => host === 'gitee.com' && path.includes('/link'),
            // Gitee 使用 href 参数或直接从页面中的跳转链接提取
            getTarget: () => {
                const href = getUrlParam('href');
                if (href) return href;
                // 备用：从页面 meta refresh 或 script 中提取
                const meta = document.querySelector('meta[http-equiv="refresh"]');
                if (meta) {
                    const match = meta.content.match(/url=(.+)/i);
                    if (match) return decodeURIComponent(match[1]);
                }
                // 备用：从页面第一个链接提取
                const link = document.querySelector('a[href]:not([href^="#"]):not([href^="javascript"])');
                if (link && !link.href.includes('gitee.com')) return link.href;
                return null;
            },
            // Gitee 可能需要等待页面加载
            delay: 300,
        },
        {
            name: '简书',
            test: (host, path) => host.includes('jianshu.com') && path.includes('/go-wild'),
            getTarget: () => getUrlParam('url'),
        },
        {
            name: 'QQ',
            test: (host, path) => host === 'c.pc.qq.com',
            getTarget: () => getUrlParam('pfurl'),
        },
        {
            name: '360搜索',
            test: (host, path) => host === 'www.so.com' && path.includes('/link'),
            getTarget: () => getUrlParam('url'),
        },
        {
            name: '搜狗',
            test: (host, path) => host === 'www.sogou.com' && path.includes('/link'),
            getTarget: () => getUrlParam('url') || getUrlParam('web'),
        },
    ];

    function getUrlParam(name) {
        const value = new URLSearchParams(location.search).get(name);
        if (!value) return null;
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    }

    function redirect(targetUrl) {
        if (!targetUrl) return false;
        // 确保是完整 URL
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }
        // 使用 GM_openInTab 替换当前页面（可能需要目标站点允许）
        // 如果目标站点被 CSP 限制，尝试 top.location
        try {
            window.top.location.href = targetUrl;
        } catch {
            location.href = targetUrl;
        }
        return true;
    }

    function main() {
        const host = location.hostname;
        const path = location.pathname;

        const rule = SITE_RULES.find(r => r.test(host, path));
        if (!rule) return;

        const delay = rule.delay || 0;

        const attempt = () => {
            const target = rule.getTarget();
            if (target) {
                console.log(`[自动跳转] ${rule.name}: ${target}`);
                redirect(target);
            } else if (rule.onFail) {
                console.log(`[自动跳转] ${rule.name}: URL 提取失败，尝试备用方案`);
                rule.onFail();
            }
        };

        if (delay > 0) {
            setTimeout(attempt, delay);
        } else {
            // 尽可能早地执行
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', attempt);
            } else {
                attempt();
            }
        }
    }

    main();
})();

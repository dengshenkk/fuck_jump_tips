# fuck-jump-tips

自动跳过国内站点外部链接二次确认页的油猴脚本。

## 背景

国内很多网站点击外部链接时会弹出一个中间确认页，需要手动点击"继续访问"才能跳转。这个脚本自动完成这个过程，让你无感跳转。

## 覆盖站点

| 站点 | 匹配模式 |
|---|---|
| 知乎 | `link.zhihu.com` |
| 掘金 | `link.juejin.cn` |
| CSDN | `link.csdn.net` |
| 微博 | `weibo.cn/sinaurl` |
| 微信公众号 | `mp.weixin.qq.com/mp/external_link_report` |
| Gitee | `gitee.com/link` |
| 简书 | `jianshu.com/go-wild` |
| QQ | `c.pc.qq.com` |
| 360搜索 | `www.so.com/link` |
| 搜狗 | `www.sogou.com/link` |

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 打开 Tampermonkey 管理面板，点击「+」新建脚本
3. 将 [`fuck-jump-tips.user.js`](./fuck-jump-tips.user.js) 的内容粘贴进去
4. Ctrl+S 保存

## 工作原理

脚本通过 `@match` 精确匹配各站点的确认页 URL，在页面加载初期（`document-start`）就从 URL 参数中提取目标地址并直接跳转，用户几乎看不到确认页。

## 添加新站点

编辑 `SITE_RULES` 数组，添加一条规则即可：

```javascript
{
    name: '站点名',
    test: (host, path) => host === 'example.com' && path.includes('/redirect'),
    getTarget: () => getUrlParam('目标URL的参数名'),
}
```

同时在文件头部添加对应的 `@match` 规则。

# Fuck Jump Tips - 解决方案

## 项目概述

自动跳过国内站点外部链接二次确认页的油猴脚本。

## 实现方案

### 脚本结构

```
fuck-jump-tips/
├── README.md                 # 项目说明文档
├── fuck-jump-tips.user.js    # 油猴脚本主文件
└── solution.md               # 本方案文档
```

### 核心功能

1. **URL 参数提取**：从确认页 URL 中提取目标链接地址
2. **自动跳转**：直接跳转到目标地址，跳过确认页
3. **弹窗检测与处理**：智能检测页面弹窗，自动点击"继续访问"按钮

---

## 弹窗检测机制

### 检测流程

```
页面加载 → URL参数提取 → 页面元素分析 → 查找继续按钮 → 模拟点击
                    ↓
            MutationObserver 监听动态弹窗
```

### 四层检测策略

#### 策略1：文本内容匹配

通过关键词匹配按钮文本，按优先级排序：

| 关键词 | 优先级 |
|---|---|
| 继续访问 | 1 |
| 继续 | 2 |
| 立即前往 | 3 |
| 前往 | 4 |
| 访问 | 5 |
| 确认 | 6 |
| 确定 | 7 |
| 跳转 | 8 |

#### 策略2：Class 名称匹配

匹配常见的按钮 class：
- `continue`, `confirm`, `submit`, `ok`, `yes`, `next`
- `btn-primary`, `primary-btn`, `action-btn`
- `external-link`, `link-confirm`

#### 策略3：结构化查找

根据弹窗结构定位按钮：
- 查找 `.modal`, `.dialog`, `.popup`, `[role="dialog"]`
- 通常确认按钮位于弹窗底部右侧

#### 策略4：弹窗内查找

检测可见弹窗中的按钮：
- `display !== 'none'`
- `visibility !== 'hidden'`
- 元素尺寸 > 0

### 动态弹窗监听

使用 `MutationObserver` 监听 DOM 变化：

```javascript
const observer = new MutationObserver((mutations) => {
    // 检测新添加的弹窗元素
    // 自动查找并点击继续按钮
});
```

监听 10 秒后自动停止，避免性能影响。

### 目标链接提取

从页面元素中提取目标 URL 的方法：

1. **链接按钮**：查找 `<a href="http...">` 按钮
2. **Data 属性**：提取 `data-url`, `data-target`, `data-href`
3. **脚本变量**：从 `<script>` 中匹配 `targetUrl`, `redirectUrl` 等

---

## 覆盖站点

| 站点 | 匹配模式 | 处理方式 |
|---|---|---|
| 知乎 | `link.zhihu.com` | URL 参数提取 |
| 掘金 | `link.juejin.cn` | URL 参数提取 |
| CSDN | `link.csdn.net` | URL 参数提取 |
| 微博 | `weibo.cn/sinaurl` | URL 参数提取 |
| 微信公众号 | `mp.weixin.qq.com/mp/external_link_report` | URL 参数提取 |
| Gitee | `gitee.com/link` | URL 参数提取 |
| 简书 | `jianshu.com/go-wild` | URL 参数提取 |
| QQ | `c.pc.qq.com` | URL 参数提取 |
| 360搜索 | `www.so.com/link` | URL 参数提取 |
| 搜狗 | `www.sogou.com/link` | URL 参数提取 |
| linuxDo | `linux.do` | URL 参数提取 + 按钮点击 |

### 技术实现

#### 1. Tampermonkey 元数据配置

```javascript
// @run-at document-start  // 页面加载初期执行
// @grant none             // 不需要特殊权限
```

#### 2. 目标 URL 提取

脚本检查常见的 URL 参数名：
- `target`
- `url`
- `link`
- `redirect`
- `goto`
- `dst`
- `to`

#### 3. 站点分发处理

根据 `window.location.hostname` 判断当前站点，调用对应的处理函数。

## 使用方法

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 打开 Tampermonkey 管理面板，点击「+」新建脚本
3. 将 `fuck-jump-tips.user.js` 的内容粘贴进去
4. Ctrl+S 保存

## 工作原理

脚本通过 `@match` 精确匹配各站点的确认页 URL，在页面加载初期（`document-start`）就从 URL 参数中提取目标地址并直接跳转，用户几乎看不到确认页。

有些网址是弹窗确认，需要点击"继续访问"才能跳转，脚本会自动点击"继续访问"按钮。

## 后续优化建议

1. **添加更多站点**：根据用户反馈添加更多需要处理的站点
2. **优化按钮识别**：使用更智能的方式识别"继续访问"按钮
3. **添加日志功能**：记录跳转日志，方便调试
4. **配置选项**：允许用户自定义开启/关闭特定站点的处理

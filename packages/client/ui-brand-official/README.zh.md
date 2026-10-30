---
description: "面向所有构建的 Lingxi Office 矢量图案，用于侧栏与会话首页；供选择或替换品牌呈现的用户与维护者阅读。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-brand-official

[English](README.md) | 中文

## 概述

本包让侧栏与会话首页显示 Lingxi Office 六瓣花标志，并在侧栏显示品牌名称。所有构建 profile 都会生效。品牌为 Lingxi Office 的部署应选择本包；使用其他品牌的部署应提供替代品牌包。本包不保留运行时状态，也不影响模型请求。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在采用 Lingxi Office 品牌的部署中，将本插件挂载到浏览器插件名单。

### 选择 profile

插件挂载时即注册品牌，不受 `DSH_CLIENT_BUILD_PROFILE` 影响。侧栏与会话首页共用同一套六瓣花矢量几何。浏览器标题仍由独立的构建设置控制。

### 替换品牌

自有身份的部署不组合本包，而是组合另一个占据侧栏与会话首屏 slot 的包。占据 slot 是唯一的组合路径；这里不存在任何品牌配置面。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

侧栏填充作为一组感知声明的注册集安装；会话首屏在其声明组件存在时独立注册。声明撤回或插件释放时，相应注册都会撤回。浏览器侧位于 [`src/client/index.ts`](src/client/index.ts)，Node 侧是空的 Loader 入口。浏览器标题属于构建环境（`DSH_CLIENT_TITLE`），不属于 slot 系统。

矢量母版位于 `artwork/mark.svg` 与 `artwork/name.svg`。在仓库根目录运行 `pnpm --filter @deepseek-ai/dsh-desktop run render:brand-assets`，即可重新生成桌面、安装器、欢迎页、favicon、Web 安装图标和 Client 几何资源。花朵采用六种纯色填充和平滑曲线，不包含位图描摹杂点。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

当品牌面不够用时阅读以下页面。它们从本包占据的 slot 进入渲染这些 slot 的外壳。

- [ui-sidebar](../ui-sidebar/README.zh.md)——声明 `sidebar.brand.mark` 与 `sidebar.brand.name` 并渲染其回退。
- [Web 客户端架构](../../../docs/subsystems/web-client.zh.md)——浏览器插件行如何加载并注册 slot。

-----

<a id="model-experience"></a>
## 模型体验

无，因为本包只贡献浏览器呈现；这里没有任何内容进入模型请求。

#### KV Cache 影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


这些限制界定了品牌呈现的供给方式。它们是当前包约束，不是品牌设计对比或任务积压。

- **只有一组填充**——替代呈现属于占据相同 slot 的另一个 Cordis 包。
- **浏览器标题独立**——`DSH_CLIENT_TITLE` 在构建时选择标题文本，而非通过 UI slot。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

无。

</details>

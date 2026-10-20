---
title: 系统概览
updated: 2026-10-19
sources:
  - AGENTS.md
  - web/paths/node.ts
  - web/scripts/build-web.ts
---

# 系统概览

authentik 是身份提供方。Django 核心拥有用户、应用、Flow、策略、来源和协议配置；Rust 服务与 Go outpost 提供原生组件。前端通过生成的 OpenAPI 客户端使用核心 API。

前端 Admin、User、Flow 共用 Lit 元素、配置、Brand 和用户上下文。`web/paths/node.ts#EntryPoint` 定义三个应用、standalone、RAC、polyfill 和全局 CSS 的打包入口；`web/scripts/build-web.ts` 用 esbuild 写入 `web/dist/`。浏览器页面和静态资源还依赖服务端提供的模板和运行配置，构建通过不代表完整登录流程可用。

## See Also

- [数据流](data-flow.md)
- [目录结构](directory-structure.md)
- [前端模块](../modules/frontend.md)

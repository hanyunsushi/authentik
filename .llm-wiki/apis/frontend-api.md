---
title: 前端 API 边界
updated: 2026-10-20
sources:
  - AGENTS.md
  - web/AGENTS.md
  - packages/client-ts/package.json
  - web/src/flow/FlowExecutor.ts
  - web/src/common/page-preparation.ts
  - web/src/common/api/client.ts
---

# 前端 API 边界

前端只通过 `@goauthentik/api` 访问 authentik API。该包通过 `web/packages/client-ts` 链接到仓库根的 `packages/client-ts`，入口是 `src/index.ts`。不引入 fetch/Axios 替代现有调用。

`schema.yml` 与 `packages/client-*` 是生成产物。API 变化从 Python 核心修改后通过 `make gen` 生成；前端改造期间保留现有生成契约。`FlowExecutor` 使用 `FlowsApi` 和 challenge 类型推进认证流程，不应通过视觉调整改写其协议。

`aki()` 的 `PagePreparationMiddleware` 只在路由准备期记录请求及响应体终态：读取 response clone 以避免提前入场，返回原响应供生成客户端继续解析；错误同样结束等待，非准备期不缓冲响应。该中间件不定义端点、不代替生成API、不改变认证提交或返回类型。

## See Also

- [数据流](../architecture/data-flow.md)
- [前端模块](../modules/frontend.md)

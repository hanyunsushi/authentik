---
title: 前端数据流
updated: 2026-10-19
sources:
  - web/src/admin/ak-interface-admin.ts
  - web/src/user/ak-interface-user.ts
  - web/src/flow/FlowExecutor.ts
  - web/README.md
---

# 前端数据流

服务端页面加载应用 bundle，Interface 获取 Config、Brand 及适用时的 SessionUser，通过上下文交给子组件。Admin/User 路由选择页面，页面使用 `@goauthentik/api` 的生成客户端访问服务端。登录阶段由 `web/src/flow/FlowExecutor.ts#FlowExecutor` 渲染 challenge、提交响应并推进 Flow。

Brand 提供主题、标识和默认 Flow；API、会话、权限和 Flow 执行都属于前端视觉改造需要保留的行为契约。

## See Also

- [系统概览](overview.md)
- [API 边界](../apis/frontend-api.md)

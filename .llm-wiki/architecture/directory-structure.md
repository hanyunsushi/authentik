---
title: 目录结构
updated: 2026-10-19
sources:
  - AGENTS.md
  - web/AGENTS.md
---

# 目录结构

| 路径 | 职责 |
| --- | --- |
| `web/src/admin/`、`user/`、`flow/` | 三个主界面 |
| `web/src/elements/`、`components/`、`common/` | 基础元素、上下文组件和通用库 |
| `web/src/styles/`、`packages/theme/` | CSS 层、设计 token 和主题包 |
| `web/scripts/`、`web/bundler/`、`web/paths/` | 构建、插件和入口 |
| `web/test/`、`web/e2e/`、`web/.storybook/` | 测试与组件预览 |
| `packages/client-{ts,go,rust}/`、`schema.yml` | 生成的 API 契约；不手工修改 |
| `authentik/`、`lifecycle/`、`src/`、`internal/`、`cmd/` | 服务端、启动与 outpost |
| `website/` | Docusaurus 文档和集成站点 |
| `.frontend-index/` | 本地生成的前端文本定位清单；已忽略 |

## See Also

- [系统概览](overview.md)
- [开发入口](../guides/development.md)

---
title: authentik Wiki Schema
updated: 2026-10-23
last_synced_commit: 4297af2fd7f674ad1d2b665c7826ce150d39d0aa
commit_policy: committed
authority_entry: ../agent.md
---

# 文档所有权

`agent.md` 指向本地 Obsidian 权威文档，负责环境、验证、部署、人工决定和待确认事项；本 Wiki 负责源码架构和开发指南。`AGENTS.md` 负责 Agent 行为规则。人工维护的 README 和上游文档不由 Wiki 覆盖。

# 项目元数据

- 名称：authentik；多语言 monorepo。
- 前端：TypeScript、Lit 3、PatternFly 4、esbuild；pnpm 独立 workspace 位于仓库根、`web/` 和 `website/`。
- 服务端：Django、Python、Rust；outpost 包含 Go 实现；存储使用 PostgreSQL。
- 测试入口：前端 Vitest、Playwright；后端测试命令见上游 `AGENTS.md`。
- 前端打包入口：`web/paths/node.ts#EntryPoint`。

# 约定

文章采用相对 Markdown 链接，从[索引](_index.md)两次点击内可达。源码路径相对项目根目录，符号名为稳定引用；文档仅记录已读取的源码事实，不推断生产状态。Wiki纳入Git，源码与部署脚本检查点为`d4fd76aa8`。Git负责时间线，不创建`_log.md`。

See Also: [权威文档](../agent.md)、[同步状态](_sync-state.md)。

---
title: authentik 文档同步状态
updated: 2026-11-06
head_commit: 36c4f2768b8fa5fde4beaf88c031f92db18444a3
---

# 双入口导航发布同步

Doc Impact Map：共用User导航、Admin分组与activePath归Console模块；Motion/SVG例外和共享控件归设计模块；同版本部署备份/代码回退归备份与保留指南；运行、恢复与未验边界归authority及[脱敏回执](guides/authentik-navigation-release-20261106.json)。干净归档380项/Host52项、类型/lint/格式和Web/SFE/MFE/Host构建通过。本地3511/OCI3513运行文件、790迁移、OIDC摘要和访问组配置核对；只有系统OOBE Blueprint应用时间戳刷新，逐字段dump对照无配置变化。原生和Console已提交发布并完成精确保留/异机摘要，生产登录态菜单、实体触摸、其他引擎及完整恢复未验收。既有注册/访问组dirty源码保留。

部署脚本把configuration纳入manifest封存；同版本前端失败保留数据库，只恢复override和镜像。语法及隔离命令mock的前端/完整回退分支通过；实际发布备份/健康验证通过，未执行生产故障或全库恢复演练。CodeGraph Node22增量sync；前端文本清单沿用本次已验证源。

文档lint：15份Markdown、92处本地引用，0断链；JSON、authority软链和diff空白检查通过。

## 透明磨砂发布同步

Doc Impact Map：磨砂材质/范围归对应设计模块；发布身份、恢复与未验范围归agent.md；六应用共享脱敏回执在Console Wiki。核对源提交、暂存和dirty边界，仅同步本批发布；无关源码/文档保持。CodeGraph MCP不可用。六仓118份Markdown/1668处本地链接、JSON、authority软链及diff检查通过；OpenStock官方docs:sync/docs:check通过（25页/173内部链接）。证据归Console `output/frosted-release-20261113/docs-lint.json`。

## 三站优选路由同步

Doc Impact Map：共享拓扑/DCV/回滚归Console路由指南，运行与私有备份归各项目authority，脱敏配置及验证归Console三站回执。四仓现有暂存/dirty范围已核对，只提交本批文档；配置-only，不触发应用重建。CodeGraph无源码结构变化；六仓118份Markdown/1685本地链接零断链，authority软链接与OpenStock官方docs检查（25页/174内部链接）通过；索引覆盖和证据归Console `output/managed-edge-20261113/`。

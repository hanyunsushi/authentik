---
title: authentik 文档同步状态
updated: 2026-11-06
head_commit: 36c4f2768b8fa5fde4beaf88c031f92db18444a3
---

# 双入口导航发布同步

Doc Impact Map：共用User导航、Admin分组与activePath归Console模块；Motion/SVG例外和共享控件归设计模块；同版本部署备份/代码回退归备份与保留指南；运行、恢复与未验边界归authority及[脱敏回执](guides/authentik-navigation-release-20261106.json)。干净归档380项/Host52项、类型/lint/格式和Web/SFE/MFE/Host构建通过。本地3511/OCI3513运行文件、790迁移、OIDC摘要和访问组配置核对；只有系统OOBE Blueprint应用时间戳刷新，逐字段dump对照无配置变化。原生和Console已提交发布并完成精确保留/异机摘要，生产登录态菜单、实体触摸、其他引擎及完整恢复未验收。既有注册/访问组dirty源码保留。

部署脚本把configuration纳入manifest封存；同版本前端失败保留数据库，只恢复override和镜像。语法及隔离命令mock的前端/完整回退分支通过；实际发布备份/健康验证通过，未执行生产故障或全库恢复演练。CodeGraph Node22增量sync；前端文本清单沿用本次已验证源。

文档lint：15份Markdown、92处本地引用，0断链；JSON、authority软链和diff空白检查通过。

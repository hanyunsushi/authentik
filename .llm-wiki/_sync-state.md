---
title: authentik 文档同步状态
updated: 2026-10-23
head_commit: 4297af2fd7f674ad1d2b665c7826ce150d39d0aa
---

# Doc Impact Map

| 改动 | 所有者 |
| --- | --- |
| Admin/User菜单互斥及原权限边界 | modules/console-microfrontend.md |
| 按钮内光、原生Dialog、空态插画、门户卡片 | modules/first-design-system.md、web/src/styles/first/README.md |
| 检查/浏览器/部署证据 | agent.md |

# 核验

48文件376项测试与类型通过；CodeGraph和前端文本索引重新生成。Wiki内部链接、索引覆盖及authority软链接在提交前核验。规范类别沿用现有类型；fixture/真实运行/生产证据分开。运行产物身份由authority维护。

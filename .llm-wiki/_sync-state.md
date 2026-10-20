---
title: authentik 文档同步状态
updated: 2026-10-20
base_commit: 0f5f4a6150be2c4c32712b21c58ea95fc03283d2
head_commit: d4fd76aa8b1d30d35ddab67bbef88bc75d7cadef
---

# Doc Impact Map

| 工作区变化 | 文档所有者 |
| --- | --- |
| 第一设计系统 token、自托管字体、文档层/Shadow DOM 接入 | `modules/frontend.md`、`modules/first-design-system.md` |
| Admin/User/Flow 壳、Motion导航/模型桥接、真实按钮/刷新、Tooltip、DotMatrix、原生页面滚动、图表颜色 | `modules/first-design-system.md` |
| TTF 打包、翻译目录提取、测试和 Storybook 命令、文本索引目录过滤 | `guides/development.md`；执行证据归 `agent.md` |
| 完整镜像、专用 Docker ignore、本地 Compose、OCI 迁移/校验/恢复脚本及历史兼容包 | `guides/development.md`、`deploy/oci-full/README.md` |
| Flow空白点阵门控、共享按钮/输入/状态卡、布尔开关与品牌底线 | `modules/first-design-system.md`；运行验证/发布归 `agent.md` |
| 校验图标绘制/文字内距、门户动作菜单内容宽度与方形SVG按钮 | `modules/first-design-system.md`；运行验证/发布归 `agent.md` |
| 路由请求准备门控、SSR/局部点阵、inline宿主块盒揭示、菜单top layer、品牌版本与顶栏侧栏视觉修正 | `modules/first-design-system.md`、`modules/frontend.md`、`apis/frontend-api.md` |
| 静态模块下载诊断、Identification隐藏账户与注册入口配置的历史核对 | `modules/frontend.md`；运行/备份证据归`agent.md` |
| 邀请注册blueprint、登录入口、普通用户组、marketing零绑定及定向恢复/事务验证 | `guides/registration.md`、`modules/frontend.md`、`deploy/oci-full/README.md`；运行/备份证据归`agent.md` |
| 官方PostgreSQL备份、持久目录、本项目发布前备份及调度边界 | `guides/backup-and-restore.md`；备份库存与调度核对归`agent.md` |
| Git、真实浏览器范围、测试结果、镜像身份、数据库迁移、备份与当前部署 | `agent.md` |
| 持续读取设计规范、分类注释、API/认证行为约束 | 根及 `web/AGENTS.md` |

# 当前同步范围

源码以上游main的`0f5f4a615`为基线，初始化规则、第一设计系统和注册配置已提交到`d4fd76aa8`。共同样式在实际 AKElement shadow roots 接入；主导航由Lit数据模型桥接canonical React Motion独占DOM，原路由/权限与三套应用生成API客户端保留；自定义视觉改动仅在后端模板修改SSR占位点阵，未修改服务端逻辑、迁移或 API schema。跨版本完整部署使用匹配的上游前后端并验证数据库迁移，同版本视觉发布要求迁移数不变；环境与发布结果由权威文档维护。前端结构由 CodeGraph 查询及源文件确认，运行证据单独记录在权威文档。

独立配置变更按用户授权启用邀请注册并移除marketing应用绑定，保留营销管理员读写/普通用户只读，不修改认证业务源码、Provider或镜像。两端注册Flow事务验证通过，生产普通用户通过marketing策略；定向恢复演练后事务回滚。真实新用户生产浏览器SSO未验证，已由权威明确区分。有效邀请仅保存在私有文件。 已核对内置Read-only后台审阅组与普通注册组的角色边界，结构说明归注册指南，实时权限数量归权威；未修改权限配置。

# Lint

- 12 篇 Wiki 从索引两次点击可达；相对链接、来源路径、孤立页和 `agent.md` 双向入口已检查。
- `agent.md` 为有效 Obsidian 软链接；环境/验证/部署事实只由权威文档持有。
- 设计规范、字体来源与局部样式边界在源码 README 中可定位，未知分类或未授权的 canonical 规范更改为 0。
- `git diff --check` 通过。CodeGraph 与前端文本索引已同步；测试、构建和浏览器边界见权威文档。
- 源码检查点`d4fd76aa8`已提交，包含第一设计系统、兼容/完整部署及邀请注册配置。上游字体许可证及固定兼容patch通过专用Git属性保留原始字节；私有env和有效邀请码未进入提交。提交前类型、lint、格式及Python语法通过，本文档同步不重建或部署镜像。
- fixture专项、本地完整backend与已登录生产后台分开验证；路由准备/入场时序、总览inline宿主真实模块动画、菜单top layer/品牌版本和1167/390px页面证据归权威文档。生产新登录/SSO往返、全部业务路由、iframe Flow、物理触摸与系统低动态未完整验收。

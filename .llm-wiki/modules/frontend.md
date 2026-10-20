---
title: 前端与样式
updated: 2026-10-20
sources:
  - web/src/admin/ak-interface-admin.ts
  - web/src/user/ak-interface-user.ts
  - web/src/flow/FlowExecutor.ts
  - web/src/styles/README.md
  - web/paths/node.ts
---

# 前端与样式

| 页面 | URL 前缀 | 源码入口 |
| --- | --- | --- |
| 管理后台 | `/if/admin/` | `web/src/admin/ak-interface-admin.ts#AdminInterface`；路由 `web/src/admin/Routes.ts` |
| 用户门户 | `/if/user/` | `web/src/user/ak-interface-user.ts#UserInterface`；路由 `web/src/user/Routes.ts` |
| 登录与认证流程 | `/if/flow/` | `web/src/flow/FlowExecutor.ts#FlowExecutor`；阶段 `web/src/flow/stages/` |

每个应用的 `index.entrypoint.ts` 为打包入口。共享基础元素位于 `elements/`，依赖应用上下文的组件位于 `components/`；接口访问通过生成客户端。

共享 `RouterView` 负责完整内容区准备与裁切入场，`page-preparation.ts` 记录准备期生成客户端请求。加载点阵和内容不会同时入场；具体责任见[第一设计系统适配](first-design-system.md)。

## CSS 边界

`interface.global.css` 服务 Admin/User，`flows.global.css` 服务 Flow，`static.global.css` 服务静态模板。全局层顺序由 `web/src/styles/layers.css` 定义；CSS custom properties 可以跨 Shadow DOM 传递，普通页面 CSS 选择器不能直接穿透组件 shadow root。组件还可能导入同目录 CSS 或内联 Lit `css`。

上游 token 位于 `web/src/styles/global/theme/`；fork 的第一设计系统 token、字体、共享规则和文档边界位于 `web/src/styles/first/`。`design` 层置于 `mode` 与 `brand` 之间；`components.css` 同时在各个 AKElement 的共享 shadow 样式末尾加载。后台、门户和认证各有专项壳 CSS，细节见[第一设计系统适配](first-design-system.md)。

## See Also

- [数据流](../architecture/data-flow.md)
- [开发入口](../guides/development.md)

## 登录识别与入口边界

Identification挑战由生成API提供。`authentik/stages/identification/stage.py`在`pretend_user_exists`开启且未合并密码阶段时，允许未知账户进入后续密码步骤；它不代表创建了账户或认证成功。`web/src/flow/stages/identification/IdentificationStage.ts#renderFooter`只有在服务端提供`enrollUrl`时显示注册链接；对应Identification Stage的`enrollment_flow`，不能仅加一个前端按钮代替注册Flow配置。当前及历史设置的只读核验归[项目权威文档](../../agent.md)。

路由动态模块下载失败属于页面代码准备失败，不能等同密码验证失败。诊断需核对实际资源响应、完整长度/哈希及当前构建，再验证真实页面；单次HTTP 200仍可能在响应体传输中断，容器静态文件存在也不证明公网交付完整。

邀请管理沿用`InvitationForm`、`InvitationEnrollmentFlowForm`；本项目使用声明式注册配置显式禁止无邀请继续。邀请链接由`itoken`传入；手输凭证使用Prompt的`token`字段，必须先收集再执行Invitation Stage。用户写入阶段可为新用户指定普通组，应用通过PolicyBinding独立授权；空应用绑定默认放行，应用内部权限仍由应用负责。流程、配置验证及恢复见[邀请注册指南](../guides/registration.md)，生产状态归项目权威文档。

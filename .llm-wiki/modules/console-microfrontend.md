---
title: Console 原生 ESM 接入
updated: 2026-10-21
sources:
  - web/src/console/microfrontend.ts
  - web/src/console/Interface.ts
  - web/src/console/oidc.ts
  - web/src/common/console.ts
  - web/scripts/build-microfrontend.ts
  - deploy/oci-full/blueprints/console-microfrontend.yaml
  - deploy/oci-full/apply-console-microfrontend.py
  - deploy/oci-full/verify-console-api.py
---

# 边界

Admin与User沿用原Lit路由、业务组件、生成API客户端和权限判断，导出Console的`mount/navigate/unmount`生命周期。Host提供唯一顶栏、侧栏和文档滚动；原账户、抽屉与命令面板入口挂载到Host顶栏槽。登录、邀请注册、MFA继续使用原生IdP流程，不嵌套Flow界面，不复制用户数据库。

# OAuth与API

独立公开客户端`kreeper-console-authentik`，应用slug为`console-authentik`。Code+PKCE通过`openid-client`执行state/nonce/issuer/签名校验；回调先清理URL中的一次性材料，PKCE状态十分钟内单次使用。令牌只在当前标签页sessionStorage保存。API scope为原生`goauthentik.io/api`；使用生成客户端的accessToken回调和`credentials: omit`，经`/api/authentik/api/v3`代理。Host不使用管理员服务凭据，不把菜单可见性当权限检查。

刷新请求合并，注销/清理后迟到的刷新不得恢复会话。失效会话回到登录入口。其他项目的Provider、issuer、用户组、权限与原登录/注册流程不由此接入修改。配置脚本在事务内校验其他应用及OAuth Provider序列化摘要不变。

通知每60秒及标签页恢复可见时通过当前OAuth身份读取；嵌入模式不连接使用IdP Cookie身份的原生WebSocket，避免跨会话消息混用。

# 路由和生命周期

路径为`/authentik/if/admin/...`、`/authentik/if/user/...`。Host持有History，业务导航发布给Host；查询参数和片段保留。原生路由加载门控负责点阵、内容隐藏与入场动画。请求取消中间件先于准备计数中间件运行，保证同一请求对象能完成计数。

卸载取消API请求、轮询、可见性/导航/抽屉监听、命令动画帧，清理顶栏槽、消息容器、API缓存及已注册上下文。消息容器监听随连接/断开注册和移除。原生独立站仍使用其原文档主题与滚动条。

# 构建与配置

在`web/`运行`pnpm run build:microfrontend`，生成`authentik-microfrontend.js`、`authentik.css`和按需模块。`CONSOLE_MFE_ASSET_BASE`与`CONSOLE_MFE_OUT_DIR`支持不可变发布；默认产物`web/dist-console/`已忽略。文档CSS限定在`.console-authentik-surface`，Shadow DOM保留原样式。

配置前备份数据库。把蓝图复制到服务器容器`/tmp/console-microfrontend.yaml`，然后通过`ak shell`执行`apply-console-microfrontend.py`；生产回调为`https://console.kreeper.cc/authentik/auth/callback`，退出回调为`https://console.kreeper.cc/authentik/`。本地同源回调使用`http://127.0.0.1:4316`，通过`console_blueprint_context`覆盖蓝图context。无需修改既有客户端回调。

# 验证

`web/test/unit/console-oidc.test.ts`覆盖返回路径、损坏会话、一次性回调、过期回调、刷新合并与注销竞争。`verify-console-api.py`在事务中验证真实原生OAuth API身份、管理员写入、普通用户403、scope缺失拒绝，并回滚临时数据。浏览器及部署证据由[项目权威文档](../../agent.md)保存，不由测试通过推断生产身份验证。

## See Also

- [Wiki索引](../_index.md)
- [前端API边界](../apis/frontend-api.md)
- [Console发布指南](/Users/hinaw/console-kreeper/.llm-wiki/guides/releases.md)

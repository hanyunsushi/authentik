---
title: 邀请注册与应用访问
updated: 2026-10-20
---

# 配置责任

`deploy/oci-full/blueprints/invitation-enrollment.yaml`声明注册Flow、邀请码Prompt、Invitation Stage、账户字段、密码策略、普通用户组及登录页入口。`marketing-unrestricted-access.yaml`移除marketing Application的PolicyBinding。`configure-registration.py`先验证两个blueprint，再以同一事务应用，并保存受保护的变更前快照；它不替换服务镜像、不修改OIDC Provider或既有用户。

# 注册流程

登录Identification Stage的`enrollment_flow`指向`kreeper-invitation-enrollment`，前端沿用生成API的`enrollUrl`显示注册链接。该流程仅供未登录用户使用；已有登录态时应在无痕窗口打开，不能把“流程不适用于当前用户”误判为注册失效。

顺序为邀请码Prompt → Invitation校验 → 账户信息Prompt → User Write → User Login。邀请码字段为`token`，邀请链接的`itoken`自动填入同一字段；原生凭证为UUID。Invitation Stage明确设置`continue_flow_without_invitation=false`。错误或过期邀请进入拒绝页，重新从注册入口开始。

原生单次邀请在Invitation Stage校验通过时消费，尚未完成后续账户创建也会被消费；保留当前流程会话可继续，离开后重新开始需要新邀请。不能将邀请对象加入受管理blueprint，避免自动重建已消费的凭证。

账户表单收集用户名、邮箱、显示名称和两次密码，密码至少12个字符；此流程不包含邮箱所有权验证。User Write创建激活的`external`用户，加入`kreeper-registered-users`普通组，不授予管理员身份。注册后继续登录。既有`pretend_user_exists`隐藏账户存在性的设置独立于注册，不因新增入口而改变。

# 手动创建账户

`UserForm`的企业内部/外部是账户`type`，用于区分内部员工与外部顾问/客户的企业功能范围，并不直接授予管理员角色。普通创建入口没有用户组字段，创建时`groups`和`roles`均为空；它不会自动加入邀请注册组。保存后打开用户详情的“组”页签，选择“添加到现有组”，即可分配`kreeper-registered-users`等组。邀请注册Flow则由User Write自动加组。

marketing当前无应用绑定限制，普通有效账户即使尚未加入注册组也可登录并只读；注册组便于统一管理，并非该应用的访问前提。管理员写权限仍由`authentik Admins`组映射；用户类型不代替这个组。

# 邀请维护

管理员进入“流程和阶段 → 邀请”（`/if/admin/flow/stages/invitations`）创建邀请，选择“邀请注册”流程，设置到期时间并启用单次使用。邀请链接或UUID可交给受邀者。凭证不进入源码、Wiki或截图；也不在未获授权时发送邮件。

# 应用与角色

`authentik Read-only`是内置后台审阅组，关联同名RBAC角色，授予`access_admin_interface`及各模型的`view_*`权限；它不代表营销应用的只读角色。`kreeper-registered-users`是本项目邀请注册使用的普通组，不关联RBAC角色，不授予后台查看或写入权限。普通应用使用者加入后者即可，只有需要审阅IdP后台时才分配前者；组权限可与账户的其他组/直接角色叠加。

应用访问与应用内部写权限分别管理。marketing的空PolicyBinding默认允许通过该应用策略，仍需有效登录；营销服务端继续根据已验证OIDC `groups`识别`authentik Admins`管理员，普通用户只读，写入由服务端返回403。注册不会自动授予其他应用的内部角色、额度或管理员身份。其他应用绑定不由这两个blueprint修改。

# 验证与恢复

`verify-registration.py`通过真实安装的Flow执行API验证空码、错误码、过期码、链接预填、密码长度/一致性、普通用户创建及单次重放；若存在marketing，还检查新用户通过其PolicyEngine。所有测试用户和邀请在事务结束时回滚。连续阶段可能跳转同一执行地址，验证脚本按阶段跟随，而非使用Django的重复地址判定。

`rollback-registration.py`使用`configuration-before.json`恢复登录页入口和营销原绑定，并停用本次两个受管理blueprint。保留已创建账户和邀请等数据，将注册Flow改为仅超级管理员可进入，关闭匿名直接链接。若入口或营销绑定已被其他操作修改，脚本拒绝覆盖。恢复前先核对现状；命令见[配置部署说明](../../deploy/oci-full/README.md#注册配置)。运行位置、备份、镜像与已执行验证由[项目权威](../../agent.md)维护。

## OpenStock OIDC boundary

OpenStock 使用独立 confidential OIDC application/client，沿用 openid/profile/email mappings；下游从验证后的 issuer+subject 识别用户，groups 只用于应用内部角色，不执行邮箱隐式关联或父域共享 Cookie。其启动与回调隔离协议由 [OpenStock 认证模块](/Users/hinaw/openstock/.llm-wiki/modules/auth-database.md)维护，运行配置与真实验收状态在各自权威文档中，不能从应用创建推断登录成功。

## See Also

- [前端与样式](../modules/frontend.md)
- [开发指南](development.md)
- [Wiki索引](../_index.md)

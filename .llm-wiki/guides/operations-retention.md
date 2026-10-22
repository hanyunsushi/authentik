---
title: Authentik发布、备份与保留合同
updated: 2026-10-22
---

# 入口与优先级

按用户2026-10-22统一决定落地project-development-workflow。当前运行版另计，最多保留三个真实可用回滚版本；历史误删不追补，之后随实际发布自然积累。本文替代历史段落中无上限保留/只保留tag的清理描述；实时版本、恢复点数量及验收归[项目权威](../../agent.md)，不能从目录数量推断恢复能力。

# 项目合同

| 项目 | 约束 |
| --- | --- |
| 运行单元 | authentik-oci；server/worker应用；PostgreSQL保持运行 |
| 服务器目录 | /home/ubuntu/authentik-oci |
| 必需恢复材料 | PostgreSQL官方pg_dump；/data、certs、templates、GeoIP、configuration；Compose/override/env；数据库secret key |
| 保护边界 | authentik-oci_database；正式上传/证书/密钥；原Provider与应用权限 |
| 保留集合 | 三次有效历史发布前恢复点；历史缺失不追补。仅同版本前端回退且后端/迁移一致可按经验证兼容性保留当前库，跨迁移回退必须成套恢复 |
| 发布方法 | 本地9000独立数据环境与OCI共用一次构建镜像，核对config/manifest摘要及RootFS；只更新server/worker。 |

# 备份与恢复

共享工具源码由[Console OCI恢复工具](/Users/hinaw/console-kreeper/scripts/oci-recovery.py)维护，服务器安装入口为`/usr/local/lib/kreeper-oci-operations/recovery.py`。默认只读计划，apply显式短暂停应用写入，数据库服务及正式卷不停止、不替换。

```sh
sudo python3 /usr/local/lib/kreeper-oci-operations/recovery.py authentik
sudo python3 /usr/local/lib/kreeper-oci-operations/recovery.py authentik --apply
```

恢复点位于`/home/ubuntu/oci-recovery/authentik/<UTC时间>/`，包含manifest、数据导出（适用时）、文件归档、原路径/权限/大小/SHA-256、镜像身份、私有容器清单与恢复说明。PostgreSQL用pg_restore目录验证，Mongo用mongorestore --dryRun，SQLite用integrity_check；这些检查不等同于完整启动恢复演练。当前基线在下次切换后才成为历史回滚点，不重复生成三份假历史。

备份包含秘密，只允许0700目录/0600文件，不入Git；私有异机副本另存于运维机`~/.local/share/oci-recovery/`并校验SHA-256，访问依赖该运维机，不能宣称已配置云端定时灾备。镜像还由Docker保留，异机镜像导出需按实际摘要核对，不把清单当镜像内容。

恢复前验证manifest和artifact可用性、保护当前状态、在隔离环境演练。恢复数据库/内容是独立数据回退，普通代码回滚不隐式执行全库覆盖。配置/密钥与外部依赖按项目表同步恢复；同机材料不等于异地灾备。

# 精确清理工具

共享执行器为[OCI保留校验工具](/Users/hinaw/console-kreeper/scripts/oci-retention.py)，服务器入口`/usr/local/lib/kreeper-oci-operations/retention.py`。清单必须显式列出删除路径/镜像、保留版本、有效恢复点和健康路由。先运行`sudo python3 /usr/local/lib/kreeper-oci-operations/retention.py /绝对路径/plan.json --seal`生成只读回执，复核后以同一清单加`--apply`；任何容器身份、挂载、服务PID或候选元数据漂移均拒绝。工具不扫描项目根决定删除对象，不删卷，不重启服务。历史材料不足时允许少于三个回滚。

# 发布和清理

读取agent.md和Git状态→审核所有待发布源码/生成物→必要测试/类型/构建→提交推送到项目现有发布分支（无远端不擅自公开私有数据项目）→版本/数据恢复点→限定项目切换→健康、路由、digest/版本、挂载和数据哈希验证→精确清理→权威/Wiki同步及Git收尾。文档-only提交不触发无意义应用重建。

清理默认dry-run，保存明确候选路径/ID、保护集和引用检查。只删除已验证无引用的过期版本、重复传输/解包包、失败空归档、构建缓存和无用测试输出。不可遍历项目根按目录名保留删除，不因Docker显示reclaimable就删回滚；不得down -v、volume prune、删正式数据或重建状态服务。清理后核对active artifact、全部正式挂载、数据库可连接、关键路由与df。

# See Also

- [项目权威](../../agent.md)
- [Wiki索引](../_index.md)

# 本轮验收

本轮源码检查点`f01482acb`；本地9000与OCI共用一次构建；3512个运行文件、790项迁移、身份对象数量与OIDC issuer/JWKS核对通过。仅server/worker替换，其余10个容器不变。 Authentik新镜像和三个同版本前端回滚`ff30c7cfd4d8`、`307b7137f9e6`、`1b041cc9f4fc`；逐文件核对后端一致。历史误删数据库不可重建；这些代码回退可共用现有兼容数据基线，跨迁移恢复须另行成套验证。 具体活动digest、恢复清单、私有副本及未验范围归[项目权威](../../agent.md)。共享OCI结果见[发布与恢复验收](/Users/hinaw/console-kreeper/.llm-wiki/guides/oci-runtime-and-recovery.md)。

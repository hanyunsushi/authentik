# 完整镜像与 OCI 同步

此目录从主工作区构建完整的 Linux/arm64 authentik 镜像，供本地和 OCI 的 server、worker 共用。版本从 `authentik/__init__.py` 读取。`Dockerfile` 沿用 `lifecycle/container/Dockerfile` 的固定基础镜像、Rust、Python 依赖和运行层；浏览器层使用同一源码快照预先构建的 `web/dist` 与 `web/authentik`。不将不同版本的前端覆盖到旧后端。

`Dockerfile.dockerignore` 明确保留生成资源路径中的 `node_modules` 片段；这是 esbuild 输出的生产资源，不能沿用忽略依赖目录的规则将其排除。发布前逐文件核对完整 dist。

## 构建

先保存源码清单及每个文件的 SHA256，为该快照分配唯一构建号。部署记录保存清单，不使用脏工作区的 Git HEAD 代替完整源码身份。生产前端和完整镜像必须使用相同的 `GIT_BUILD_HASH`：

```sh
GIT_BUILD_HASH="$AUTHENTIK_BUILD_ID" NODE_ENV=production node web/scripts/build-web.ts
GIT_BUILD_HASH="$AUTHENTIK_BUILD_ID" NODE_ENV=production pnpm --dir web run build:sfe
docker build --platform linux/arm64 --progress plain \
  -f deploy/oci-full/Dockerfile \
  --build-arg VERSION="$AUTHENTIK_VERSION" \
  --build-arg GIT_BUILD_HASH="$AUTHENTIK_BUILD_ID" \
  -t "authentik-custom:$AUTHENTIK_VERSION-$AUTHENTIK_BUILD_ID" .
```

构建时禁止修改源码及产物。GeoIP 下载遵循上游的可选 MaxMind secret 路径；未提供凭据时镜像不包含 GeoIP 数据库。此时从既有运行实例保留两份 `.mmdb`，保存 SHA256 清单并接入两端的只读 `/geoip` 数据卷；演练和正式验证均核对这些文件。数据文件不提交源码。

只构建一次，通过 `docker save` / `docker load` 将该镜像送到 OCI。核对传输包 SHA256、镜像 config digest、全部 RootFS 层和运行配置，镜像 tag、版本字符串相同本身不够。Docker 经典存储的 `.Id` 是 config digest，containerd 存储的 `.Id` 可以是 OCI manifest digest，二者并非同一类型；从传输包的 `index.json`、OCI manifest 与 config blob 校验其引用关系，并在 `image-identity.json` 保存两种 digest。

磁盘紧张时保留完整`image-final.tar.gz`，Docker可直接加载gzip归档。使用旧归档重建增量镜像时，先核对增量包SHA256，再逐个验证新manifest引用的config/layer摘要；最终压缩归档包含全部引用，不能仅保存增量。压缩历史raw tar须先验证解压SHA256等于原文件，并保存压缩回执后才移除raw副本；不删除运行镜像、回滚tag或数据库/数据备份。

历史`source/`快照视为不可修改：同文件SHA256及权限一致时可通过原子hardlink去重，保留各发布路径和逐文件清单，回执为`source-deduplication.json`。后续发布使用正常copytree建立独立副本后再应用增量，禁止直接修改旧快照中的共享inode；数据库、配置及运行卷不参与去重。

## 本地运行

`compose.local.yml` 使用独立的 `authentik-local` 项目和命名卷，仅发布 loopback 9000/9443。`local.env` 被忽略提交，权限应为 0600，包含本地随机数据库密码、secret key、数据库连接参数，以及与 OCI 相同的完整 `AUTHENTIK_IMAGE`。自动初始化还必须配置 `AUTHENTIK_WEB__BASE_URL=http://127.0.0.1:9000`；新版本在初始化后拒绝使用空 Base URL 启动。不复制 OCI 的 `.env`、生产数据库或身份数据到本机。

```sh
docker compose --env-file deploy/oci-full/local.env \
  -f deploy/oci-full/compose.local.yml up -d --wait --wait-timeout 480
```

本地是独立安装，业务数据与生产不同；版本、镜像和编译产物一致。Storybook 6006 继续提供样本场景，完整应用在 9000。

启动前将发布保存的 GeoIP 数据放入 `authentik-local_geoip` 卷，并核对 `geoip-manifest.json`。OCI 使用 `./geoip:/geoip:ro`；该目录和原有数据/证书/模板一起备份。只读挂载不会将 GeoIP 数据重新写入镜像。

## OCI 演练与切换

固定项目为 `authentik-oci`。发布文件保存在服务器 `releases/<build_id>/`，包括 `artifact-manifest.json`、相同镜像、验证脚本和源码快照。先将备份恢复到独立的 `authentik-upgrade-check-db`，使用新镜像的正常 server 启动流程演练系统迁移和 Django 迁移。不挂载生产数据或 Docker socket，不启动演练 worker。

`verify.py <build_id> <image_id> --stage` 核对迁移、身份数量、Base URL、源码及静态文件哈希、匿名 Flow、两套 OIDC discovery/JWKS。成功后才允许执行 `deploy.py`。同版本且不改服务端逻辑/依赖的视觉发布可用 `deploy.py <build_id> <image_id> --frontend-only`：必须提供健康的 `local-verification.json`、前一发布的源码清单和 `migration_expectation=unchanged`。脚本逐文件拒绝除 SSR placeholder 外的后端差异，正式验证要求迁移数保持不变；不以伪造的演练回执代替验证。

`deploy.py <build_id> <image_id>` 停止本项目 server/worker，生成一致性 PostgreSQL dump、TOC 和数据/配置备份，保存旧镜像及容器信息，然后只更新这两个服务。原始 Compose、`.env`、PostgreSQL、正式卷和其他应用保持不变。切换包含短暂停机。实际镜像、版本、备份目录及验证结果由[项目权威文档](../../agent.md)维护。

## 恢复

迁移后的降级必须恢复整个备份数据库、数据目录及旧镜像。仅切换旧镜像不构成有效回退。发布失败时脚本自动执行备份内的 `rollback.py`；人工恢复入口为：

```sh
sudo python3 "$AUTHENTIK_BACKUP/rollback.py" "$AUTHENTIK_BACKUP"
```

脚本只接受该项目的备份路径，失败时保留迁移后的目录供排查。保留 dump、配置、secret 与旧镜像，不执行 `compose down -v` 或全局 prune。临时演练卷仅在正式验证通过后按名称清理。

同版本视觉发布可选择 `--target frontend-release --build-arg PREVIOUS_IMAGE=<已核对的前版完整镜像>`。该目标保留同版本服务端/依赖，整批替换静态资源与 SSR placeholder，并重新编译含启动页的 Rust 二进制。只在 `--frontend-only` 的后端逐文件相等检查通过时部署，不跨版本使用。正常全量构建默认仍为最后的 `final` 目标。

## 注册配置

邀请注册与marketing应用访问使用独立的数据库blueprint，不需要重建镜像或重启容器。先备份数据库，将`blueprints/*.yaml`复制到目标server容器的私有目录；通过环境变量指定该目录后运行配置脚本，再运行事务回滚式验证脚本：

```sh
docker exec -e KREEPER_REGISTRATION_DIRECTORY="$AUTHENTIK_CONFIG_DIR" -i "$AUTHENTIK_SERVER" \
  ak shell --no-imports -i python < deploy/oci-full/configure-registration.py
docker exec -i "$AUTHENTIK_SERVER" ak shell --no-imports -i python \
  < deploy/oci-full/verify-registration.py
```

脚本要求已有默认Identification Stage；marketing不存在的独立本地安装会跳过其绑定移除。marketing的`absent`条目针对已核对的单个绑定，脚本会断言最终零绑定，若有多个则事务失败，不会部分开放。将目录中的`configuration-before.json`和验证回执复制到持久受保护目录，权限0600；不要只保留在容器临时层。后续邀请通过管理员邀请页创建，不把有效token写入blueprint。

定向恢复保留新用户及业务数据，恢复入口和原应用绑定，停用两个受管理blueprint并关闭匿名注册链接：

```sh
docker exec -e KREEPER_REGISTRATION_DIRECTORY="$AUTHENTIK_CONFIG_DIR" -i "$AUTHENTIK_SERVER" \
  ak shell --no-imports -i python < deploy/oci-full/rollback-registration.py
```

容器重建后先从受保护目录恢复配置快照。恢复脚本不会覆盖其他操作随后新增的应用绑定。原生邀请消费时机、普通用户组及应用角色边界见[注册指南](../../.llm-wiki/guides/registration.md)；实际配置归档与完整数据库备份位置见[项目权威](../../agent.md)。

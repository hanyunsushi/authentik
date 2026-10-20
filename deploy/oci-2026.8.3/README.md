# OCI 前端兼容发布

此目录仅用于重建 2026.8.3 的兼容产物。主工作区与 OCI 的全量版本同步使用 [完整镜像流程](../oci-full/README.md)，不使用此兼容包。

该兼容流程的服务端目标为 2026.8.3，而主工作区基线为 2026.11.0-rc1。此目录将第一设计系统视觉修改移植到固定的 `version/2026.8.3`，保留该版本的服务端、生成客户端、服务端注入格式和 hash 路由。不能直接把主工作区 `web/dist` 覆盖到旧后端；当前有效发布见项目权威文档。

`frontend.patch` 保存旧版本已有文件的改动；`snapshot.json` 固定基线提交、补丁及共享资源 SHA256；`links.ts` 只为新侧栏提供旧版链接格式。`prepare.py` 校验资源后生成独立源码目录，目标已存在时拒绝覆盖。共享组件及字体的许可沿用原目录。

```sh
python3 deploy/oci-2026.8.3/prepare.py /tmp/authentik-oci-build
cd /tmp/authentik-oci-build
# 使用 Node >=24.20、pnpm 12.9.1；保留 frozen lockfile。
pnpm install --frozen-lockfile
pnpm --dir web install --frozen-lockfile
pnpm --dir web run build-locales
pnpm --dir web exec tsc --noEmit --composite false --incremental false
pnpm --dir web exec vitest run --project 'Unit Tests'
pnpm --dir web exec vitest run --project 'Browser Tests' --no-file-parallelism --browser.headless
# FRONTEND_BUILD_ID 取 snapshot.json 的 build_id；直接调用脚本避免旧版 Wireit 忽略环境变量变化。
cd web
GIT_BUILD_HASH="$FRONTEND_BUILD_ID" NODE_ENV=production node scripts/build-web.mjs
```

发布构建上下文只含 `dist/`、`Dockerfile` 和资源 SHA256 manifest；不包含生产配置或密钥。对资源逐文件校验后，在 OCI 用已核实镜像 ID 的本地回滚 tag 作为 `BASE_IMAGE` 构建。Dockerfile 保留旧资源和后端，用独立构建标识避免旧入口缓存。`server` 的 `GIT_BUILD_HASH` 必须与前端构建标识一致。

切换前在服务器备份原 Compose、`.env`、数据/证书/模板及 PostgreSQL dump，校验备份并保存所有容器 ID、启动时间、镜像与挂载。仅在 `docker-compose.override.yml` 指定 `server.image`，执行：

```sh
docker compose -p authentik-oci -f docker-compose.yml -f docker-compose.override.yml \
  up -d --no-deps --wait --wait-timeout 180 server
```

原 Compose 和 `.env` 保持原样；worker、PostgreSQL 与正式卷不重建。不使用 `down`、`down -v`、卷清理或版本升级。记录 active image ID、资源哈希、健康、匿名 Flow/API、OIDC discovery 和其他容器不变证据。

回滚时将 override 的 `server.image` 改为备份记录中的回滚 tag，再执行同一应用单服务更新命令。当前首次发布前没有 override，也可恢复其缺席状态后仅用原 Compose 重建 `server`。不要为前端回滚恢复数据库。

实际部署目标、镜像、备份位置及验证结果由 [项目权威文档](../../agent.md) 维护。

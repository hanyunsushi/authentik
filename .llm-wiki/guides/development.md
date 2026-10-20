---
title: 前端开发入口
updated: 2026-10-20
sources:
  - Makefile
  - web/package.json
  - web/.storybook/main.js
  - scripts/frontend-index.py
  - deploy/oci-full/Dockerfile
  - deploy/oci-full/compose.local.yml
---

# 前端开发入口

环境、执行结果、运行状态和待确认事项由[项目权威文档](../../agent.md)维护。以下为源码定义的入口。

```sh
cd /Users/hinaw/authentik
# 安装根 workspace 和前端 workspace；上游推荐 make node-install web-install。
# macOS 仅做前端时可用等价命令，避免 Makefile 加载时 uv 同步 Python 环境：
pnpm install --frozen-lockfile
pnpm run build:lint-config
pnpm --dir web install --frozen-lockfile
pnpm --dir web run build

# 开发时按需启动；watch 仅编译，完整应用还需要 backend：
pnpm --dir web run watch
pnpm --dir web run storybook --host 127.0.0.1 --ci --no-open

# 静态定位清单：
python3 scripts/frontend-index.py
```

Storybook 的默认端口为 6006，是组件预览入口；`Design system / First` 提供后台、门户和认证场景。页面使用实际共享组件与本地样本，不能据此认定真实认证已验证。完整应用使用服务端的 9000/9443 端口；Docker 开发配置参见 `website/docs/developer-docs/setup/frontend-dev-environment.mdx`。启动前核对实际 Compose 配置，使用独立项目名和数据卷。

## 完整版本同步

[`deploy/oci-full/`](../../deploy/oci-full/README.md) 提供主工作区的完整 arm64 镜像、本地独立 Compose，以及 OCI 的克隆库演练、切换、验证和数据库恢复脚本。本地与 OCI 共用一次构建导出的镜像，验证 config digest、RootFS 层和运行配置；前端与后端共用构建标识，本地身份数据独立。Docker 的存储后端可能分别显示 config ID 或 manifest ID，不能直接比较不同类型的 ID。源码清单和产物校验用于识别构建时的完整源码快照，不能只以 Git HEAD 或镜像 tag 判断一致。官方数据库备份方法及本项目部署备份的职责见[备份与恢复](backup-and-restore.md)。

同版本视觉发布另有后端逐文件相等与本地健康验证门槛，正式迁移数必须保持不变；入口见上述部署说明。完整升级需要停写后备份数据库及数据目录。跨迁移降级必须恢复数据库和旧镜像；2026.8.3 的前端兼容移植目录只用于该版本的历史产物重建。当前运行、发布证据及备份入口见[权威文档](../../agent.md)。

## CodeGraph

索引位于项目根 `.codegraph/`，已忽略提交。结构问题优先使用 CodeGraph MCP；当前会话未暴露 MCP 工具时，可以在项目根使用本机已有的 Node 22 调用 CLI：

```sh
authentik_codegraph_cli=/Users/hinaw/.npm-global/lib/node_modules/@colbymchenry/codegraph/dist/bin/codegraph.js
/usr/local/bin/node "$authentik_codegraph_cli" status --json
/usr/local/bin/node "$authentik_codegraph_cli" query FlowExecutor --kind class --limit 3 --json
/usr/local/bin/node "$authentik_codegraph_cli" context "FlowExecutor" --max-nodes 8 --max-code 2
/usr/local/bin/node "$authentik_codegraph_cli" sync
```

本机默认 Node 26 被 CodeGraph 的运行时保护拒绝；只对 CodeGraph 显式使用 `/usr/local/bin/node`，不要修改前端的 Node 版本，也不要启用 `CODEGRAPH_ALLOW_UNSAFE_NODE` 绕过保护。运行环境、覆盖统计和健康检查结果由[项目权威文档](../../agent.md)维护。

## 验证与 Locator

使用 `pnpm --dir web run lint:check`、`format:check`、`build:types` 或 `test:unit` 验证实际改动；浏览器测试依赖额外的 Playwright browser 环境。

前端文本清单生成 component、route、class、locator 和交互缺口 JSON，不是 CodeGraph/AST，也不是 DOM 或布局证明。动态模板、事件与属性表达式需要进一步核对；缺口是既有基线，不批量补改业务源码。改动控件时补稳定 `data-testid`，大视觉区域使用 `data-design-id`；按涉及组件选取现有测试与源码守门断言。

## See Also

- [前端模块](../modules/frontend.md)
- [目录结构](../architecture/directory-structure.md)

## 第一设计系统检查

```sh
pnpm --dir web run lint:check
pnpm --dir web run format:check
pnpm --dir web run build:types
NODE_ENV=production pnpm --dir web run build
pnpm --dir web run test:unit --project 'Unit Tests'
pnpm --dir web exec playwright install chromium-headless-shell
pnpm --dir web exec vitest run --project 'Browser Tests' --no-file-parallelism
pnpm --dir web run extract-locales
```

浏览器回归覆盖空状态表格裁切下的菜单top layer与Escape焦点恢复，以及inline Shadow DOM页面真实模块的入场动画/错峰/清理。浏览器 suite 采用串行文件执行；图表首次加载 Mermaid 时，并行执行下的默认等待窗口可能超时，不能把单独通过冒充全量通过。当前结果由[权威文档](../../agent.md)维护。`scripts/frontend-index.py` 忽略目录，避免测试生成的 `__screenshots__/*.test.ts/` 被误当源码文件。

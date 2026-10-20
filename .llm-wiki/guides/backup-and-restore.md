---
title: 备份与恢复边界
updated: 2026-10-20
---

# 官方方法

上游[备份与恢复指南](../../website/docs/sys-mgmt/ops/backup-restore.mdx)要求备份PostgreSQL数据库，并按实际使用情况备份持久目录。数据库保存用户、组、应用、策略、Flow及配置，使用`pg_dump`、`pg_dumpall`或PostgreSQL连续归档；恢复使用`pg_restore`或`psql`。这些是数据库工具，不是默认启用的authentik自动备份任务。

持久目录包含`/data`（上传图标、背景、文件和报告）、实际使用的`/certs`、`/custom-templates`及自定义`/blueprints`；外部S3数据需独立备份。本部署还需保存Compose、私有`.env`及其中的secret key，保留版本对应的镜像标识与GeoIP数据。Git保存源码，数据库与私有配置通过受保护备份保存。

# 本项目部署脚本

`deploy/oci-full/deploy.py`是发布脚本。通过发布校验后，它保存旧镜像标识、容器信息、Compose和`.env`，停止本项目server/worker，再运行`pg_dump -Fc`，通过`pg_restore -l`核对目录，并归档data、certs、custom-templates和geoip。回执记录数据库SHA256与身份对象数量，备份目录内保存对应的`rollback.py`。

该流程随部署执行，不是独立的定时备份命令；不能为了生成备份而无条件再次运行发布脚本。`rollback.py`恢复发布前数据库、持久文件及服务镜像，适用于其对应发布。跨迁移降级需要成套恢复；邀请注册配置的定向恢复则使用单独的`rollback-registration.py`，避免以全库恢复替代配置调整。

# 手动数据库导出

在OCI主机选择私有目录，再执行以下命令；不要将数据库导出放入Git工作区。以下只导出数据库，持久文件和私有配置按前述范围另外保存。

```sh
umask 077
AUTHENTIK_BACKUP_DIR="/home/ubuntu/authentik-oci/backups/manual-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$AUTHENTIK_BACKUP_DIR"
docker exec authentik-oci-postgresql-1 sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$AUTHENTIK_BACKUP_DIR/database.dump"
docker exec -i authentik-oci-postgresql-1 pg_restore -l \
  < "$AUTHENTIK_BACKUP_DIR/database.dump" \
  > "$AUTHENTIK_BACKUP_DIR/database-toc.txt"
```

在线`pg_dump`可产生一致的数据库快照；数据库与上传文件需要共同恢复时，应在维护窗口停止server/worker写入，完成整个备份后再启动。恢复前验证备份可读，并先保存当前状态；具体恢复命令随备份格式与目标环境确定。

# 定时与异地副本

定时运行、保留策略、加密与异地副本需要额外配置cron、systemd timer或备份工具；官方指南建议备份存到数据库主机之外。当前部署备份、调度检查结果和实际位置由[项目权威](../../agent.md)维护，不能从部署脚本存在推断已启用定时任务。Blueprint或单个Flow导出只能覆盖部分配置，不能代替包含用户和凭据数据的数据库备份。

## See Also

- [完整镜像部署与恢复](../../deploy/oci-full/README.md)
- [邀请注册与应用访问](registration.md)
- [Wiki索引](../_index.md)

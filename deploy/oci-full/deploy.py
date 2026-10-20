#!/usr/bin/env python3
"""Update only authentik server/worker after release-specific verification."""

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
from datetime import datetime, timezone
from pathlib import Path

os.umask(0o077)
root = Path('/home/ubuntu/authentik-oci')
build_id, image_id = sys.argv[1:3]
assert build_id.startswith('kreeper-') and image_id.startswith('sha256:')
image = 'authentik-custom:2026.11.0-rc1-' + build_id
release = root / 'releases' / build_id
if '--frontend-only' in sys.argv[3:]:
    # 同版本视觉发布：后端及依赖必须逐文件不变，仅允许前端占位模板变化。
    manifest = json.loads((release / 'artifact-manifest.json').read_text())
    previous = json.loads((root / 'releases' / manifest['previous_build_id'] / 'artifact-manifest.json').read_text())
    assert manifest['version'] == previous['version']
    assert manifest['migration_expectation'] == 'unchanged'
    def backend(files):
        runtime = ('authentik/', 'lifecycle/', 'packages/', 'schemas/', 'locale/', 'blueprints/', 'src/', '.cargo/', 'tests/')
        inputs = {'pyproject.toml', 'uv.lock', 'Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml', 'build.rs', 'manage.py'}
        return {p: h for p, h in files.items() if p.startswith(runtime) or p in inputs}
    old_backend, new_backend = backend(previous['files']), backend(manifest['files'])
    changes = {p for p in old_backend.keys() | new_backend.keys() if old_backend.get(p) != new_backend.get(p)}
    assert changes <= {'authentik/core/templates/base/placeholder.html'}, changes
    local = json.loads((release / 'local-verification.json').read_text())
    identity = json.loads((release / 'image-identity.json').read_text())
    assert local['build_id'] == build_id and local['health'] == 'healthy'
    assert local['image_config_digest'] == identity['config_digest']
else:
    stage = json.loads((release / 'stage-verification.json').read_text())
    assert stage['active_image'] == image_id and stage['health'] == 'healthy'
meta = json.loads(subprocess.check_output(['docker', 'image', 'inspect', image]))[0]
assert meta['Id'] == image_id
assert meta['Config']['Labels']['org.opencontainers.image.revision'] == build_id
geoip = root / 'geoip'
if not geoip.exists():
    shutil.copytree(release / 'geoip', geoip)
for name, digest in json.loads((release / 'geoip-manifest.json').read_text()).items():
    assert hashlib.sha256((geoip / name).read_bytes()).hexdigest() == digest
compose = ['docker', 'compose', '-p', 'authentik-oci', '-f', str(root / 'docker-compose.yml'), '-f', str(root / 'docker-compose.override.yml')]
containers = json.loads(subprocess.check_output(['docker', 'inspect', *subprocess.check_output(['docker', 'ps', '-aq'], text=True).split()]))
baseline = []
for c in containers:
    if c['Name'].startswith('/authentik-upgrade-check-'):
        continue
    baseline.append({'name': c['Name'].lstrip('/'), 'id': c['Id'], 'image': c['Image'], 'image_reference': c['Config']['Image'], 'started': c['State']['StartedAt'], 'mounts': c['Mounts']})
for service in ('server', 'worker'):
    old = next(c for c in baseline if c['name'] == f'authentik-oci-{service}-1')
    assert old['image'] != image_id
    subprocess.run(['docker', 'tag', old['image'], f'authentik-custom:rollback-{service}-before-{build_id}'], check=True)
backup = root / 'backups' / ('before-' + build_id + '-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
backup.mkdir()
(backup / 'containers.json').write_text(json.dumps(baseline, indent=2))
for name in ('docker-compose.yml', '.env', 'docker-compose.override.yml'):
    shutil.copy2(root / name, backup / name)
(backup / 'config-sha256.json').write_text(json.dumps({name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in ('docker-compose.yml', '.env')}))
shutil.copy2(Path(__file__).with_name('rollback.py'), backup / 'rollback.py')
complete = False
migrations_started = False
try:
    subprocess.run(compose + ['stop', '-t', '60', 'server', 'worker'], cwd=root, check=True)
    with (backup / 'database.dump').open('wb') as target:
        subprocess.run(['docker', 'exec', 'authentik-oci-postgresql-1', 'sh', '-c', 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc'], stdout=target, check=True)
    with (backup / 'database.dump').open('rb') as source, (backup / 'database-toc.txt').open('wb') as target:
        subprocess.run(['docker', 'exec', '-i', 'authentik-oci-postgresql-1', 'pg_restore', '-l'], stdin=source, stdout=target, check=True)
    with tarfile.open(backup / 'data-config.tar.gz', 'w:gz') as archive:
        for name in ('data', 'certs', 'custom-templates', 'geoip'):
            archive.add(root / name, arcname=name)
    query = 'SELECT (SELECT count(*) FROM django_migrations),(SELECT count(*) FROM authentik_core_user),(SELECT count(*) FROM authentik_core_application),(SELECT count(*) FROM authentik_core_provider),(SELECT count(*) FROM authentik_flows_flow),(SELECT count(*) FROM authentik_brands_brand);'
    counts = subprocess.check_output(['docker', 'exec', 'authentik-oci-postgresql-1', 'sh', '-c', 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c ' + "'" + query + "'"], text=True).strip()
    (backup / 'identity-counts.txt').write_text(counts + '\n')
    receipt = {'complete': True, 'backup': str(backup), 'build_id': build_id, 'target_image': image_id, 'identity_counts': counts, 'database_sha256': hashlib.sha256((backup / 'database.dump').read_bytes()).hexdigest()}
    (backup / 'receipt.json').write_text(json.dumps(receipt, indent=2))
    (release / 'backup-path.txt').write_text(str(backup) + '\n')
    complete = True
    next_override = root / 'docker-compose.override.yml.next'
    next_override.write_text('services:\n  server:\n    image: ' + image + '\n    volumes:\n      - ./geoip:/geoip:ro\n  worker:\n    image: ' + image + '\n    volumes:\n      - ./geoip:/geoip:ro\n')
    os.replace(next_override, root / 'docker-compose.override.yml')
    config = json.loads(subprocess.check_output(compose + ['config', '--format', 'json'], cwd=root))
    assert all(config['services'][s]['image'] == image for s in ('server', 'worker'))
    assert config['services']['postgresql']['image'] == 'docker.io/library/postgres:16-alpine'
    migrations_started = True
    subprocess.run(compose + ['up', '-d', '--no-deps', '--wait', '--wait-timeout', '480', 'server'], cwd=root, check=True)
    subprocess.run(compose + ['up', '-d', '--no-deps', '--wait', '--wait-timeout', '360', 'worker'], cwd=root, check=True)
    subprocess.run([sys.executable, str(Path(__file__).with_name('verify.py')), build_id, image_id], check=True)
except BaseException:
    if complete and migrations_started:
        subprocess.run([sys.executable, str(backup / 'rollback.py'), str(backup)], check=True)
    else:
        shutil.copy2(backup / 'docker-compose.override.yml', root / 'docker-compose.override.yml')
        subprocess.run(compose + ['up', '-d', '--no-deps', '--wait', '--wait-timeout', '360', 'server', 'worker'], cwd=root, check=True)
    raise
print(json.dumps({'deployed': image_id, 'backup': str(backup)}))

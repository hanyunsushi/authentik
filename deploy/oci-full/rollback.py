#!/usr/bin/env python3
"""Restore a quiesced full-upgrade backup, including its database."""

import json
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

root = Path('/home/ubuntu/authentik-oci')
backup = Path(sys.argv[1]).resolve()
assert backup.parent == root / 'backups'
receipt = json.loads((backup / 'receipt.json').read_text())
assert receipt['complete']
compose = ['docker', 'compose', '-p', 'authentik-oci', '-f', str(root / 'docker-compose.yml'), '-f', str(root / 'docker-compose.override.yml')]
subprocess.run(compose + ['stop', '-t', '60', 'server', 'worker'], cwd=root, check=True)
pg = 'authentik-oci-postgresql-1'
# Drop the database as well as old tables: a reverse migration is not a downgrade.
subprocess.run(['docker', 'exec', pg, 'sh', '-c', 'dropdb --force -U "$POSTGRES_USER" "$POSTGRES_DB"'], check=True)
subprocess.run(['docker', 'exec', pg, 'sh', '-c', 'createdb -U "$POSTGRES_USER" -O "$POSTGRES_USER" "$POSTGRES_DB"'], check=True)
with (backup / 'database.dump').open('rb') as source:
    subprocess.run(['docker', 'exec', '-i', pg, 'sh', '-c', 'pg_restore --exit-on-error --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"'], stdin=source, check=True)
for name in ('data', 'certs', 'custom-templates'):
    current = root / name
    preserved = backup / (name + '-after-failed-upgrade')
    assert not preserved.exists(), 'A previous rollback already preserved this directory'
    if current.exists():
        current.rename(preserved)
with tarfile.open(backup / 'data-config.tar.gz') as archive:
    archive.extractall(root, filter='fully_trusted')
shutil.copy2(backup / 'docker-compose.override.yml', root / 'docker-compose.override.yml')
subprocess.run(compose + ['up', '-d', '--no-deps', '--wait', '--wait-timeout', '360', 'server', 'worker'], cwd=root, check=True)
print(json.dumps({'restored_database_and_images': True, 'backup': str(backup)}))

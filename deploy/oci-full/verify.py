#!/usr/bin/env python3
"""Verify image identity, migrations, retained identities and served assets."""

import hashlib
import json
import re
import subprocess
import sys
import urllib.request
from urllib.parse import urlsplit
from pathlib import Path

root = Path('/home/ubuntu/authentik-oci')
build_id, expected_image = sys.argv[1:3]
stage = '--stage' in sys.argv[3:]
release = root / 'releases' / build_id
manifest = json.loads((release / 'artifact-manifest.json').read_text())
identity = json.loads((release / 'image-identity.json').read_text())
assert manifest['build_id'] == build_id
assert expected_image in (identity['config_digest'], identity['oci_manifest_digest'])
server_name = 'authentik-upgrade-check-server' if stage else 'authentik-oci-server-1'
pg = 'authentik-upgrade-check-db' if stage else 'authentik-oci-postgresql-1'
port = 19001 if stage else 19000
server = json.loads(subprocess.check_output(['docker', 'inspect', server_name]))[0]
assert server['Image'] == expected_image
image = json.loads(subprocess.check_output(['docker', 'image', 'inspect', expected_image]))[0]
assert image['RootFS']['Layers'] == identity['rootfs']['Layers']
for key, value in identity['config'].items():
    assert image['Config'].get(key) == value, 'Image configuration differs: ' + key
assert server['State']['Health']['Status'] == 'healthy'
labels = server['Config']['Labels']
assert labels['org.opencontainers.image.version'] == manifest['version']
assert labels['org.opencontainers.image.revision'] == build_id

backup = root / 'backups/before-first-4e249e75171e-20261019T163317Z' if stage else Path((release / 'backup-path.txt').read_text().strip())
old_counts = [int(x) for x in (backup / 'identity-counts.txt').read_text().strip().split('|')]
query = 'SELECT (SELECT count(*) FROM django_migrations),(SELECT count(*) FROM authentik_core_user),(SELECT count(*) FROM authentik_core_application),(SELECT count(*) FROM authentik_core_provider),(SELECT count(*) FROM authentik_flows_flow),(SELECT count(*) FROM authentik_brands_brand);'
def sql(statement):
    return subprocess.check_output(['docker', 'exec', pg, 'sh', '-c', 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c ' + "'" + statement.replace("'", "'\\''") + "'"], text=True).strip()

counts = [int(x) for x in sql(query).split('|')]
if manifest.get('migration_expectation') == 'unchanged':
    assert counts[0] == old_counts[0], (counts, old_counts)
else:
    assert counts[0] > old_counts[0], (counts, old_counts)
assert counts[1:] == old_counts[1:], (counts, old_counts)
base_url = sql('SELECT base_url FROM authentik_admin_systemsettings;')
assert base_url == 'https://oidc.kreeper.cc', base_url
version_history = sql('SELECT version || chr(124) || build FROM authentik_version_history ORDER BY timestamp DESC LIMIT 1;')
assert version_history == manifest['version'] + '|' + build_id, version_history
pending = subprocess.check_output(['docker', 'exec', server_name, 'ak', 'showmigrations', '--plan'], text=True, stderr=subprocess.STDOUT)
assert '[ ]' not in pending, 'Unapplied migrations remain'

files = {}
for rel, digest in manifest['artifact_files'].items():
    if not rel.endswith('Dockerfile') and rel.startswith(('web/dist/', 'web/authentik/', 'authentik/', 'lifecycle/', 'blueprints/', 'schemas/', 'locale/')):
        files['/' + rel] = digest
for name, digest in json.loads((release / 'geoip-manifest.json').read_text()).items():
    files['/geoip/' + name] = digest
asset_script = 'import json,sys,hashlib,pathlib\nm=json.load(sys.stdin)\nfor p,d in m.items():\n assert hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()==d,p\nprint(len(m))\n'
verified = int(subprocess.check_output(['docker', 'exec', '-i', server_name, 'python', '-c', asset_script], input=json.dumps(files), text=True).strip())

def fetch(path):
    request = urllib.request.Request('http://127.0.0.1:' + str(port) + path, headers={'Host': 'oidc.kreeper.cc', 'X-Forwarded-Proto': 'https'})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.status, response.read()

http = []
for path in ('/-/health/live/', '/-/health/ready/', '/if/flow/default-authentication-flow/', '/api/v3/flows/executor/default-authentication-flow/', '/if/admin/', '/if/user/', '/application/o/kreeproxy/.well-known/openid-configuration', '/application/o/sub2api/.well-known/openid-configuration'):
    status, body = fetch(path)
    assert status == 200
    entry = {'path': path, 'status': status}
    if 'openid-configuration' in path:
        issuer = json.loads(body)['issuer']
        expected_issuer = 'https://oidc.kreeper.cc' + path.split('.well-known')[0]
        assert issuer == expected_issuer, issuer
        entry['issuer'] = issuer
        _, jwks = fetch(urlsplit(json.loads(body)['jwks_uri']).path)
        entry['signing_keys'] = len(json.loads(jwks)['keys'])
        assert entry['signing_keys'] > 0
        entry['jwks_sha256'] = hashlib.sha256(json.dumps(json.loads(jwks), sort_keys=True).encode()).hexdigest()
        baseline_oidc = json.loads((release / 'oidc-baseline.json').read_text())[path]
        assert issuer == baseline_oidc['issuer'] and entry['jwks_sha256'] == baseline_oidc['jwks_sha256'], 'OIDC issuer or signing keys changed'
    if path.startswith('/api/v3/flows/executor/'):
        entry['component'] = json.loads(body)['component']
        assert entry['component'], 'No authentication challenge was returned'
    if path.startswith('/if/flow/'):
        references = re.findall(r'(?:src|href)="(/static/[^\"]+)"', body.decode())
        entries = [x for x in references if build_id in x]
        assert entries, 'The HTML references an older frontend'
        entry['entry_resources'] = entries
    http.append(entry)
for kind, filename in (('admin', 'AdminInterface'), ('user', 'UserInterface'), ('flow', 'FlowInterface'), ('styles', 'interface')):
    extension = 'css' if kind == 'styles' else 'js'
    rel = f'web/dist/{kind}/{filename}-{manifest["version"]}+{build_id}.{extension}'
    _, served = fetch('/static/dist/' + rel.removeprefix('web/dist/'))
    assert hashlib.sha256(served).hexdigest() == manifest['artifact_files'][rel]

other_unchanged = None
if not stage:
    worker = json.loads(subprocess.check_output(['docker', 'inspect', 'authentik-oci-worker-1']))[0]
    assert worker['Image'] == expected_image and worker['State']['Health']['Status'] == 'healthy'
    baseline = json.loads((backup / 'containers.json').read_text())
    now = json.loads(subprocess.check_output(['docker', 'inspect', *[c['name'] for c in baseline]]))
    by_name = {c['Name'].lstrip('/'): c for c in now}
    for old in baseline:
        current = by_name[old['name']]
        mounts = current['Mounts']
        if old['name'] in ('authentik-oci-server-1', 'authentik-oci-worker-1'):
            geoip_mount = next(m for m in mounts if m['Destination'] == '/geoip')
            assert geoip_mount['Source'] == str(root / 'geoip') and not geoip_mount['RW']
            mounts = [m for m in mounts if m['Destination'] != '/geoip']
        old_mounts = old['mounts']
        if old['name'] in ('authentik-oci-server-1', 'authentik-oci-worker-1'):
            old_mounts = [m for m in old_mounts if m['Destination'] != '/geoip']
        assert sorted(mounts, key=lambda m: m['Destination']) == sorted(old_mounts, key=lambda m: m['Destination']), old['name'] + ' mounts'
        if old['name'] not in ('authentik-oci-server-1', 'authentik-oci-worker-1'):
            assert current['Id'] == old['id'] and current['Image'] == old['image'] and current['State']['StartedAt'] == old['started'], old['name']
    other_unchanged = len(baseline) - 2
    for name, digest in json.loads((backup / 'config-sha256.json').read_text()).items():
        assert hashlib.sha256((root / name).read_bytes()).hexdigest() == digest, name
result = {'version': manifest['version'], 'build_id': build_id, 'source_sha256': manifest['source_sha256'], 'active_image': server['Image'], 'image_config_digest': identity['config_digest'], 'oci_manifest_digest': identity['oci_manifest_digest'], 'health': 'healthy', 'pending_migrations': 0, 'identity_counts': counts, 'base_url': base_url, 'files_verified': verified, 'http': http, 'other_containers_unchanged': other_unchanged, 'backup': str(backup)}
filename = 'stage-verification.json' if stage else 'verification.json'
(release / filename).write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))

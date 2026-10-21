"""Run with `ak shell` after backing up the database; reconciles only the Console client."""

from hashlib import sha256
from pathlib import Path

from django.core import serializers
from django.db import transaction

from authentik.blueprints.v1.importer import Importer
from authentik.core.models import Application
from authentik.providers.oauth2.models import OAuth2Provider

# 认证接入：既有Provider与应用必须保持逐字段不变，不修改用户、组或权限。
client_id = "kreeper-console-authentik"
slug = "console-authentik"
provider_name = "Kreeper Console authentik"


def existing_digest():
    providers = OAuth2Provider.objects.exclude(client_id=client_id).order_by("pk")
    applications = Application.objects.exclude(slug=slug).order_by("pk")
    return sha256(
        (serializers.serialize("json", providers) + serializers.serialize("json", applications)).encode()
    ).hexdigest()


source = Path("/tmp/console-microfrontend.yaml").read_text()
context = globals().get("console_blueprint_context", {})
with transaction.atomic():
    assert not OAuth2Provider.objects.filter(name=provider_name).exclude(client_id=client_id).exists()
    assert not OAuth2Provider.objects.filter(client_id=client_id).exclude(name=provider_name).exists()
    existing = Application.objects.filter(slug=slug).first()
    assert not existing or OAuth2Provider.objects.filter(
        pk=existing.provider_id, client_id=client_id
    ).exists()
    before = existing_digest()
    importer = Importer.from_string(source, context=context)
    valid, logs = importer.validate()
    assert valid, str(logs)
    assert importer.apply()
    provider = OAuth2Provider.objects.get(client_id=client_id)
    assert provider.client_type == "public" and not provider.client_secret
    assert Application.objects.get(slug=slug).provider_id == provider.pk
    assert "goauthentik.io/api" in provider.property_mappings.select_subclasses().values_list(
        "scopemapping__scope_name", flat=True
    )
    assert existing_digest() == before
print("CONSOLE_PROVIDER_READY_EXISTING_CONFIGURATION_UNCHANGED")

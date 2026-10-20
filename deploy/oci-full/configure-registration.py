"""Apply registration blueprints through `ak shell`, without replacing service images."""

import hashlib
import json
import os
from pathlib import Path

from django.core import serializers
from django.db import transaction

from authentik.blueprints.models import BlueprintInstance, BlueprintInstanceStatus
from authentik.blueprints.v1.hash import blueprint_hash
from authentik.blueprints.v1.importer import Importer
from authentik.core.models import Application, Group, Provider, User
from authentik.flows.models import Flow, FlowStageBinding
from authentik.policies.models import PolicyBinding
from authentik.stages.identification.models import IdentificationStage
from authentik.stages.invitation.models import InvitationStage
from authentik.stages.user_write.models import UserWriteStage

os.umask(0o077)
directory = Path(os.environ["KREEPER_REGISTRATION_DIRECTORY"])
stage = IdentificationStage.objects.get(name="default-authentication-identification")
assert set(stage.user_fields) == {"email", "username"}
marketing = Application.objects.filter(slug="marketing").first()


def provider_digest():
    raw = serializers.serialize("json", Provider.objects.select_subclasses().order_by("pk"))
    return hashlib.sha256(raw.encode()).hexdigest()


before = {
    "identification_pk": str(stage.pk),
    "enrollment_flow_id": str(stage.enrollment_flow_id) if stage.enrollment_flow_id else None,
    "user_ids": list(User.objects.order_by("pk").values_list("pk", flat=True)),
    "provider_sha256": provider_digest(),
    "marketing_bindings": json.loads(
        serializers.serialize("json", PolicyBinding.objects.filter(target=marketing))
    ) if marketing else [],
}
snapshot = directory / "configuration-before.json"
if not snapshot.exists():
    snapshot.write_text(json.dumps(before, indent=2) + "\n")
sources = [directory / "invitation-enrollment.yaml"]
if marketing:
    sources.append(directory / "marketing-unrestricted-access.yaml")

# 注册流程 / 应用访问：先完整验证，再在同一事务中应用两个独立的声明式配置。
for path in sources:
    valid, logs = Importer.from_string(path.read_text()).validate()
    if not valid:
        raise RuntimeError(f"Blueprint validation failed for {path.name}: {logs}")

with transaction.atomic():
    for path in sources:
        source = path.read_text()
        importer = Importer.from_string(source)
        assert importer.apply(), path.name
        BlueprintInstance.objects.update_or_create(
            name=importer.blueprint.metadata.name,
            defaults={
                "path": "",
                "content": source,
                "enabled": True,
                "last_applied_hash": blueprint_hash(source),
                "status": BlueprintInstanceStatus.SUCCESSFUL,
            },
        )
    flow = Flow.objects.get(slug="kreeper-invitation-enrollment")
    stage.refresh_from_db()
    assert stage.enrollment_flow_id == flow.pk
    assert not InvitationStage.objects.get(name="kreeper-enrollment-invitation").continue_flow_without_invitation
    write = UserWriteStage.objects.get(name="kreeper-enrollment-user-write")
    assert write.user_type == "external" and not write.create_users_as_inactive
    assert write.create_users_group == Group.objects.get(name="kreeper-registered-users")
    assert not write.create_users_group.is_superuser
    assert provider_digest() == before["provider_sha256"]
    assert list(User.objects.order_by("pk").values_list("pk", flat=True)) == before["user_ids"]
    if marketing:
        assert not PolicyBinding.objects.filter(target=marketing).exists()

result = {
    "registration_flow": flow.slug,
    "registration_entry_linked": True,
    "invitation_required": True,
    "user_group": write.create_users_group.name,
    "user_type": write.user_type,
    "stage_order": list(FlowStageBinding.objects.filter(target=flow).order_by("order").values_list("stage__name", flat=True)),
    "marketing_bindings": 0 if marketing else "application-not-present-in-local-install",
    "providers_unchanged": True,
    "existing_users_unchanged": True,
}
(directory / "configuration-verification.json").write_text(json.dumps(result, indent=2) + "\n")
print("REGISTRATION_CONFIGURED=" + json.dumps(result))

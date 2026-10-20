"""Restore enrollment entry and marketing bindings using the configuration snapshot."""

import json
import os
from pathlib import Path

from django.core import serializers
from django.db import transaction

from authentik.blueprints.models import BlueprintInstance
from authentik.core.models import Application
from authentik.flows.models import Flow, FlowAuthenticationRequirement
from authentik.policies.models import PolicyBinding
from authentik.stages.identification.models import IdentificationStage

directory = Path(os.environ["KREEPER_REGISTRATION_DIRECTORY"])
before = json.loads((directory / "configuration-before.json").read_text())

# 配置恢复：保留已注册用户、邀请和流程对象，不回滚用户产生的业务数据。
with transaction.atomic():
    stage = IdentificationStage.objects.get(pk=before["identification_pk"])
    owned_flow = Flow.objects.get(slug="kreeper-invitation-enrollment")
    previous = before["enrollment_flow_id"]
    assert str(stage.enrollment_flow_id) in {str(owned_flow.pk), str(previous)}
    marketing = Application.objects.filter(slug="marketing").first()
    if marketing:
        current = json.loads(serializers.serialize("json", PolicyBinding.objects.filter(target=marketing)))
        assert not current or current == before["marketing_bindings"], "Application bindings changed after deployment"
        if not current:
            for binding in serializers.deserialize("json", json.dumps(before["marketing_bindings"])):
                binding.save()
    BlueprintInstance.objects.filter(
        name__in=["Kreeper invitation enrollment", "Kreeper marketing unrestricted application access"]
    ).update(enabled=False)
    owned_flow.authentication = FlowAuthenticationRequirement.REQUIRE_SUPERUSER
    owned_flow.save(update_fields=["authentication"])
    stage.enrollment_flow_id = previous
    stage.save(update_fields=["enrollment_flow"])

print("REGISTRATION_CONFIGURATION_RESTORED")

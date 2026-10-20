"""Exercise the installed enrollment flow; roll back all test users and invitations."""

import json
import secrets
import uuid
from datetime import timedelta
from urllib.parse import urlparse

from django.db import transaction
from django.urls import reverse
from django.utils.timezone import now
from rest_framework.test import APIClient

from authentik.core.models import Application, User
from authentik.flows.models import Flow
from authentik.policies.engine import PolicyEngine
from authentik.stages.invitation.models import Invitation

url = reverse("authentik_api:flow-executor", kwargs={"flow_slug": "kreeper-invitation-enrollment"})
owner = User.objects.get(username="akadmin")
flow = Flow.objects.get(slug="kreeper-invitation-enrollment")
report = {}
before = User.objects.count()


def resolve(client, response):
    # 流程验证：连续阶段会跳转同一地址，逐阶段跟随，避免 Django 误判重定向循环。
    for _ in range(12):
        if response.status_code != 302:
            break
        location = response["Location"]
        assert urlparse(location).path == url, location
        response = client.get(location)
    else:
        raise AssertionError("Enrollment exceeded 12 stage redirects")
    assert response.status_code == 200, response.status_code
    return response.json()


def start(client, token=None):
    return resolve(client, client.get(url, {"query": f"itoken={token}"} if token else {}))


def submit(client, **data):
    return resolve(client, client.post(url, {"component": "ak-stage-prompt", **data}, format="json"))


with transaction.atomic():
    client = APIClient(HTTP_HOST="localhost")
    assert start(client)["component"] == "ak-stage-prompt"
    assert submit(client, token="").get("response_errors")
    report["missing_token_rejected"] = True

    client = APIClient(HTTP_HOST="localhost")
    start(client)
    assert submit(client, token=str(uuid.uuid4()))["component"] == "ak-stage-access-denied"
    report["invalid_token_rejected"] = True

    expired = Invitation.objects.create(
        name="enrollment-check-expired", created_by=owner, flow=flow,
        expires=now() - timedelta(hours=1), single_use=True,
    )
    client = APIClient(HTTP_HOST="localhost")
    start(client)
    assert submit(client, token=str(expired.pk))["component"] == "ak-stage-access-denied"
    report["expired_token_rejected"] = True

    invite = Invitation.objects.create(
        name="enrollment-check-valid", created_by=owner, flow=flow,
        expires=now() + timedelta(hours=1), single_use=True,
    )
    client = APIClient(HTTP_HOST="localhost")
    assert str(invite.pk) in json.dumps(start(client, invite.pk))
    report["invitation_link_prefills_token"] = True
    assert submit(client, token=str(invite.pk))["component"] == "ak-stage-prompt"
    assert not Invitation.objects.filter(pk=invite.pk).exists()

    name = "enrollment-check-" + uuid.uuid4().hex[:12]
    password = secrets.token_urlsafe(24)
    details = {"username": name, "email": name + "@example.invalid", "name": "Enrollment verification"}
    assert submit(client, **details, password="short", password_repeat="short").get("response_errors")
    report["weak_password_rejected"] = True
    assert submit(client, **details, password=password, password_repeat=password + "x").get("response_errors")
    report["password_mismatch_rejected"] = True
    result = submit(client, **details, password=password, password_repeat=password)
    user = User.objects.get(username=name)
    assert user.is_active and user.type == "external" and not user.is_superuser
    assert user.groups.filter(name="kreeper-registered-users").exists()
    assert user.check_password(password)
    assert result["component"] == "xak-flow-redirect"
    report["valid_invitation_creates_ordinary_user"] = True

    client = APIClient(HTTP_HOST="localhost")
    start(client)
    assert submit(client, token=str(invite.pk))["component"] == "ak-stage-access-denied"
    report["single_use_replay_rejected"] = True
    marketing = Application.objects.filter(slug="marketing").first()
    if marketing:
        assert PolicyEngine(marketing, user).build().passing
        report["marketing_allows_new_user"] = True
    transaction.set_rollback(True)

assert User.objects.count() == before
report["temporary_test_data_rolled_back"] = True
print("REGISTRATION_FLOW_VERIFIED=" + json.dumps(report))
